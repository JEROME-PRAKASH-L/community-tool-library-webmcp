import { clampText, formatCurrency } from "./utils.js";

const TOOL_RESULT_LIMIT = 1400;

function toolResult(payload) {
  const text = String(payload);
  if (text.length <= TOOL_RESULT_LIMIT) return text;

  try {
    const parsed = JSON.parse(text);
    const collectionKey = ["tools", "reservations"].find((key) => Array.isArray(parsed[key]));
    if (collectionKey) {
      const originalCount = parsed[collectionKey].length;
      const compact = {
        ...parsed,
        [collectionKey]: [...parsed[collectionKey]],
        truncated: true,
      };
      while (compact[collectionKey].length > 0) {
        compact.omitted = originalCount - compact[collectionKey].length;
        const candidate = JSON.stringify(compact);
        if (candidate.length <= TOOL_RESULT_LIMIT) return candidate;
        compact[collectionKey].pop();
      }
    }
  } catch {
    // Fall through to a compact, valid JSON envelope for non-JSON payloads.
  }

  return JSON.stringify({
    truncated: true,
    summary: clampText(text, TOOL_RESULT_LIMIT - 200),
  });
}

function summarizeTool(tool) {
  return {
    id: tool.id,
    name: tool.name,
    category: tool.category,
    neighborhood: tool.neighborhood,
    distanceKm: tool.distanceKm,
    pricePerDay: tool.pricePerDay,
    deposit: tool.deposit,
    rating: tool.rating,
    available: tool.available,
  };
}

export function createToolDefinitions({
  store,
  requestConfirmation = async () => false,
  onSearchResults = () => {},
  onToolActivity = () => {},
}) {
  const record = (name, detail, status = "success") => {
    store.addActivity({ type: "webmcp", title: name, detail, source: "agent", status });
    onToolActivity({ name, detail, status });
  };

  return [
    {
      name: "search_community_tools",
      title: "Search community tools",
      description: "Search nearby community-owned tools by keywords, category, distance, and dates. Updates the visible catalogue and returns concise matches.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Tool name, task, or keyword." },
          category: {
            type: "string",
            description: "Optional tool category.",
            enum: ["All tools", "Power tools", "Home & repair", "Creative", "Electronics", "Garden", "Mobility"],
          },
          maxDistanceKm: { type: "number", minimum: 1, maximum: 25, description: "Maximum pickup distance in kilometres." },
          maxDeposit: { type: "number", minimum: 0, maximum: 20000, description: "Maximum refundable deposit in Indian rupees." },
          startDate: { type: "string", description: "Optional start date in YYYY-MM-DD format." },
          endDate: { type: "string", description: "Optional end date in YYYY-MM-DD format." },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async (input = {}) => {
        const results = store.findTools({
          query: input.query,
          category: input.category || "All tools",
          maxDistanceKm: input.maxDistanceKm,
          maxDeposit: input.maxDeposit,
          startDate: input.startDate,
          endDate: input.endDate,
          availableOnly: Boolean(input.startDate),
        });
        onSearchResults(results, input);
        record("search_community_tools", `${results.length} matching tools`);
        return toolResult(JSON.stringify({ count: results.length, tools: results.slice(0, 8).map(summarizeTool) }));
      },
    },
    {
      name: "get_tool_details",
      title: "Get tool details",
      description: "Get the description, owner, pickup area, condition, price, deposit, rating, rules, and current availability for one tool.",
      inputSchema: {
        type: "object",
        properties: {
          toolId: { type: "string", description: "Exact tool identifier returned by search." },
        },
        required: ["toolId"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async ({ toolId }) => {
        const tool = store.getTool(toolId);
        if (!tool) return toolResult(JSON.stringify({ error: "Tool not found" }));
        record("get_tool_details", tool.name);
        return toolResult(JSON.stringify({
          ...summarizeTool(tool),
          description: tool.description,
          owner: tool.owner,
          condition: tool.condition,
          rules: tool.rules,
        }));
      },
    },
    {
      name: "check_tool_availability",
      title: "Check tool availability",
      description: "Check whether a specific tool is available for an inclusive date range before attempting a reservation.",
      inputSchema: {
        type: "object",
        properties: {
          toolId: { type: "string", description: "Exact tool identifier." },
          startDate: { type: "string", description: "Start date in YYYY-MM-DD format." },
          endDate: { type: "string", description: "End date in YYYY-MM-DD format." },
        },
        required: ["toolId", "startDate", "endDate"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async ({ toolId, startDate, endDate }) => {
        const result = store.checkAvailability(toolId, startDate, endDate);
        record("check_tool_availability", `${toolId}: ${result.reason}`);
        return toolResult(JSON.stringify({
          toolId,
          startDate,
          endDate,
          available: result.available,
          reason: result.reason,
        }));
      },
    },
    {
      name: "reserve_tool",
      title: "Reserve a tool",
      description: "Prepare a tool reservation for selected dates. Always pauses for visible human confirmation before changing reservation state.",
      inputSchema: {
        type: "object",
        properties: {
          toolId: { type: "string", description: "Exact tool identifier." },
          startDate: { type: "string", description: "Start date in YYYY-MM-DD format." },
          endDate: { type: "string", description: "End date in YYYY-MM-DD format." },
          note: { type: "string", maxLength: 240, description: "Optional short note for the lender." },
        },
        required: ["toolId", "startDate", "endDate"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: async ({ toolId, startDate, endDate, note = "" }) => {
        const availability = store.checkAvailability(toolId, startDate, endDate);
        if (!availability.available) {
          record("reserve_tool", availability.reason, "blocked");
          return toolResult(JSON.stringify({ reserved: false, reason: availability.reason }));
        }

        const approved = await requestConfirmation({
          type: "reserve",
          tool: availability.tool,
          startDate,
          endDate,
          note,
          source: "agent",
        });
        if (!approved) {
          record("reserve_tool", "User declined the reservation", "cancelled");
          return toolResult(JSON.stringify({ reserved: false, reason: "User declined confirmation" }));
        }

        const reservation = store.reserveTool({ toolId, startDate, endDate, note, source: "agent" });
        record("reserve_tool", `Confirmed ${availability.tool.name}`);
        return toolResult(JSON.stringify({
          reserved: true,
          reservationId: reservation.id,
          tool: availability.tool.name,
          dates: `${startDate} to ${endDate}`,
          estimatedCost: formatCurrency(availability.tool.pricePerDay),
        }));
      },
    },
    {
      name: "list_my_reservations",
      title: "List my reservations",
      description: "List the user's current and past tool reservations with tool names, dates, and status.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: true },
      execute: async () => {
        const state = store.getState();
        const reservations = state.reservations.map((reservation) => ({
          ...reservation,
          toolName: state.tools.find((tool) => tool.id === reservation.toolId)?.name || "Unknown tool",
        }));
        record("list_my_reservations", `${reservations.length} reservations`);
        return toolResult(JSON.stringify({ count: reservations.length, reservations: reservations.slice(0, 10) }));
      },
    },
    {
      name: "cancel_reservation",
      title: "Cancel a reservation",
      description: "Cancel an active tool reservation. Always pauses for visible human confirmation before changing reservation state.",
      inputSchema: {
        type: "object",
        properties: {
          reservationId: { type: "string", description: "Exact reservation identifier." },
        },
        required: ["reservationId"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: true },
      execute: async ({ reservationId }) => {
        const state = store.getState();
        const reservation = state.reservations.find((item) => item.id === reservationId && item.status === "confirmed");
        if (!reservation) {
          record("cancel_reservation", "Active reservation not found", "blocked");
          return toolResult(JSON.stringify({ cancelled: false, reason: "Active reservation not found" }));
        }
        const tool = state.tools.find((item) => item.id === reservation.toolId);
        const approved = await requestConfirmation({ type: "cancel", tool, reservation, source: "agent" });
        if (!approved) {
          record("cancel_reservation", "User kept the reservation", "cancelled");
          return toolResult(JSON.stringify({ cancelled: false, reason: "User declined confirmation" }));
        }
        store.cancelReservation(reservationId, "agent");
        record("cancel_reservation", `Cancelled ${tool?.name || reservationId}`);
        return toolResult(JSON.stringify({ cancelled: true, reservationId }));
      },
    },
  ];
}

export async function registerWebMCP({ documentRef = globalThis.document, ...options }) {
  const definitions = createToolDefinitions(options);
  const modelContext = documentRef?.modelContext;
  if (!modelContext?.registerTool) {
    return {
      supported: false,
      definitions,
      reason: "WebMCP is not enabled in this browser. The built-in demonstration remains available.",
      dispose: () => {},
    };
  }

  const controller = new AbortController();
  const registered = [];
  try {
    for (const definition of definitions) {
      await modelContext.registerTool(definition, { signal: controller.signal });
      registered.push(definition.name);
    }
    return {
      supported: true,
      definitions,
      registered,
      dispose: () => controller.abort(),
    };
  } catch (error) {
    controller.abort();
    return {
      supported: false,
      definitions,
      registered,
      reason: error instanceof Error ? error.message : "Tool registration failed",
      dispose: () => {},
    };
  }
}

export async function executeLocalTool(definitions, name, input = {}) {
  const tool = definitions.find((item) => item.name === name);
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  return tool.execute(input, { signal: new AbortController().signal });
}
