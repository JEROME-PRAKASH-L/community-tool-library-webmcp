import test from "node:test";
import assert from "node:assert/strict";

import { createStore } from "../js/store.js";
import { createToolDefinitions, executeLocalTool, registerWebMCP } from "../js/webmcp.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  };
}

test("tool definitions expose concise schemas and security annotations", () => {
  const definitions = createToolDefinitions({ store: createStore(memoryStorage()) });
  assert.deepEqual(
    definitions.map((tool) => tool.name),
    [
      "search_community_tools",
      "get_tool_details",
      "check_tool_availability",
      "reserve_tool",
      "list_my_reservations",
      "cancel_reservation",
      "list_community_tool",
    ],
  );
  definitions.forEach((tool) => {
    assert.ok(tool.name.length <= 30);
    assert.ok(tool.description.length <= 500);
    assert.equal(typeof tool.annotations.readOnlyHint, "boolean");
    assert.equal(tool.annotations.untrustedContentHint, true);
  });
});

test("listing tool prepares the visible form without creating a listing", async () => {
  const store = createStore(memoryStorage());
  const before = store.getState().tools.length;
  let preparedInput;
  const definitions = createToolDefinitions({
    store,
    onPrepareListing: (input) => { preparedInput = input; },
  });
  const output = await executeLocalTool(definitions, "list_community_tool", {
    name: "Soldering iron",
    neighborhood: "Anna Nagar",
    pricePerDay: 40,
    deposit: 300,
  });
  assert.equal(JSON.parse(output).requiresUserAction, true);
  assert.equal(preparedInput.name, "Soldering iron");
  assert.equal(store.getState().tools.length, before);
});

test("read-only search returns structured results and updates the visible-results seam", async () => {
  const store = createStore(memoryStorage());
  let visibleResults = [];
  const definitions = createToolDefinitions({
    store,
    onSearchResults: (results) => { visibleResults = results; },
  });
  const output = await executeLocalTool(definitions, "search_community_tools", {
    query: "drill",
    maxDistanceKm: 5,
    maxDeposit: 600,
  });
  const parsed = JSON.parse(output);
  assert.equal(parsed.count, 1);
  assert.equal(parsed.tools[0].id, "tool-drill");
  assert.equal(visibleResults[0].id, "tool-drill");
});

test("broad searches stay within the response budget and remain valid JSON", async () => {
  const store = createStore(memoryStorage());
  const definitions = createToolDefinitions({ store });
  const output = await executeLocalTool(definitions, "search_community_tools", {});
  const parsed = JSON.parse(output);
  assert.ok(output.length <= 1400);
  assert.equal(parsed.count, store.getState().tools.length);
  assert.equal(parsed.truncated, true);
  assert.ok(parsed.tools.length > 0);
  assert.ok(parsed.omitted > 0);
});

test("reserve_tool cannot mutate state when the user declines", async () => {
  const store = createStore(memoryStorage());
  let confirmationCalls = 0;
  const definitions = createToolDefinitions({
    store,
    requestConfirmation: async () => {
      confirmationCalls += 1;
      return false;
    },
  });
  const output = await executeLocalTool(definitions, "reserve_tool", {
    toolId: "tool-drill",
    startDate: "2032-01-10",
    endDate: "2032-01-11",
  });
  assert.equal(JSON.parse(output).reserved, false);
  assert.equal(confirmationCalls, 1);
  assert.equal(store.getState().reservations.length, 0);
});

test("reserve_tool mutates state only after explicit user approval", async () => {
  const store = createStore(memoryStorage());
  const definitions = createToolDefinitions({
    store,
    requestConfirmation: async () => true,
  });
  const output = await executeLocalTool(definitions, "reserve_tool", {
    toolId: "tool-drill",
    startDate: "2032-03-10",
    endDate: "2032-03-11",
    note: "Approved test",
  });
  assert.equal(JSON.parse(output).reserved, true);
  assert.equal(store.getState().reservations.length, 1);
  assert.equal(store.getState().reservations[0].source, "agent");
});

test("registration degrades cleanly when the browser does not implement WebMCP", async () => {
  const result = await registerWebMCP({
    documentRef: {},
    store: createStore(memoryStorage()),
  });
  assert.equal(result.supported, false);
  assert.equal(result.definitions.length, 7);
  assert.match(result.reason, /not enabled/i);
});

test("registration uses document.modelContext.registerTool for every imperative tool", async () => {
  const calls = [];
  const documentRef = {
    modelContext: {
      registerTool: async (definition, options) => calls.push({ definition, options }),
    },
  };
  const result = await registerWebMCP({ documentRef, store: createStore(memoryStorage()) });
  assert.equal(result.supported, true);
  assert.equal(calls.length, 7);
  assert.equal(calls[0].definition.name, "search_community_tools");
  assert.ok(calls.every((call) => call.options.signal instanceof AbortSignal));
  result.dispose();
});
