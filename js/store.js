import { SEED_TOOLS } from "./data.js";
import { createId } from "./utils.js";

export const STORAGE_KEY = "community-tool-library:v1";
const SCHEMA_VERSION = 1;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function rangesOverlap(startA, endA, startB, endB) {
  return startA <= endB && endA >= startB;
}

export function isValidDateRange(startDate, endDate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || "")) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate || "")) return false;
  return startDate <= endDate;
}

export function isToolAvailable(tool, startDate, endDate, reservations = []) {
  if (!tool?.available || !isValidDateRange(startDate, endDate)) return false;

  const blockedRanges = [
    ...(tool.bookedRanges || []),
    ...reservations
      .filter((reservation) => reservation.toolId === tool.id && reservation.status === "confirmed")
      .map((reservation) => ({ startDate: reservation.startDate, endDate: reservation.endDate })),
  ];

  return !blockedRanges.some((range) =>
    rangesOverlap(startDate, endDate, range.startDate, range.endDate),
  );
}

export function searchTools(tools, filters = {}, reservations = []) {
  const query = String(filters.query || "").trim().toLowerCase();
  const category = String(filters.category || "All tools");
  const maxDistanceKm = Number(filters.maxDistanceKm || 0);
  const maxDeposit = Number(filters.maxDeposit || 0);
  const startDate = filters.startDate || "";
  const endDate = filters.endDate || startDate;

  return tools
    .filter((tool) => {
      const searchable = [tool.name, tool.category, tool.description, tool.neighborhood, ...(tool.tags || [])]
        .join(" ")
        .toLowerCase();
      if (query && !searchable.includes(query)) return false;
      if (category && category !== "All tools" && tool.category !== category) return false;
      if (maxDistanceKm > 0 && tool.distanceKm > maxDistanceKm) return false;
      if (maxDeposit > 0 && tool.deposit > maxDeposit) return false;
      if (filters.availableOnly && !tool.available) return false;
      if (startDate && !isToolAvailable(tool, startDate, endDate, reservations)) return false;
      return true;
    })
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating || a.distanceKm - b.distanceKm);
}

function initialState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    tools: clone(SEED_TOOLS),
    reservations: [],
    activity: [],
  };
}

function parseState(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.schemaVersion !== SCHEMA_VERSION) return null;
    if (!Array.isArray(parsed.tools) || !Array.isArray(parsed.reservations)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createStore(storage = globalThis.localStorage) {
  let state = parseState(storage?.getItem?.(STORAGE_KEY)) || initialState();
  const listeners = new Set();

  function persist() {
    storage?.setItem?.(STORAGE_KEY, JSON.stringify(state));
  }

  function emit(reason) {
    persist();
    listeners.forEach((listener) => listener(clone(state), reason));
  }

  function getState() {
    return clone(state);
  }

  function getTools() {
    return clone(state.tools);
  }

  function getTool(toolId) {
    const tool = state.tools.find((item) => item.id === toolId);
    return tool ? clone(tool) : null;
  }

  function findTools(filters = {}) {
    return clone(searchTools(state.tools, filters, state.reservations));
  }

  function checkAvailability(toolId, startDate, endDate) {
    const tool = state.tools.find((item) => item.id === toolId);
    if (!tool) return { available: false, reason: "Tool not found" };
    if (!isValidDateRange(startDate, endDate)) {
      return { available: false, reason: "Use a valid start and end date" };
    }
    const available = isToolAvailable(tool, startDate, endDate, state.reservations);
    return {
      available,
      reason: available ? "Available for the selected dates" : "Unavailable for the selected dates",
      tool: clone(tool),
    };
  }

  function reserveTool({ toolId, startDate, endDate, note = "", source = "human" }) {
    const availability = checkAvailability(toolId, startDate, endDate);
    if (!availability.available) throw new Error(availability.reason);

    const reservation = {
      id: createId("reservation"),
      toolId,
      startDate,
      endDate,
      note: String(note).trim().slice(0, 240),
      status: "confirmed",
      source,
      createdAt: new Date().toISOString(),
    };
    state.reservations.unshift(reservation);
    addActivity({
      type: "reservation",
      title: `Reserved ${availability.tool.name}`,
      detail: `${startDate} to ${endDate}`,
      source,
    }, false);
    emit("reservation-created");
    return clone(reservation);
  }

  function cancelReservation(reservationId, source = "human") {
    const reservation = state.reservations.find((item) => item.id === reservationId);
    if (!reservation || reservation.status !== "confirmed") {
      throw new Error("Active reservation not found");
    }
    reservation.status = "cancelled";
    reservation.cancelledAt = new Date().toISOString();
    const tool = state.tools.find((item) => item.id === reservation.toolId);
    addActivity({
      type: "cancellation",
      title: `Cancelled ${tool?.name || "reservation"}`,
      detail: `Reservation ${reservation.id}`,
      source,
    }, false);
    emit("reservation-cancelled");
    return clone(reservation);
  }

  function addTool(input) {
    const allowedCategories = ["Power tools", "Home & repair", "Creative", "Electronics", "Garden", "Mobility"];
    const name = String(input.name || "").trim().slice(0, 80);
    const category = allowedCategories.includes(input.category) ? input.category : "Home & repair";
    const description = String(input.description || "").trim().slice(0, 360);
    if (name.length < 3) throw new Error("Tool name must contain at least 3 characters");
    if (description.length < 10) throw new Error("Please add a useful description");

    const tool = {
      id: createId("tool"),
      name,
      category,
      description,
      owner: "You",
      neighborhood: String(input.neighborhood || "Your neighbourhood").trim().slice(0, 60),
      distanceKm: 0.3,
      pricePerDay: Math.max(0, Math.min(5000, Number(input.pricePerDay) || 0)),
      deposit: Math.max(0, Math.min(20000, Number(input.deposit) || 0)),
      rating: 5,
      reviews: 0,
      condition: String(input.condition || "Good").slice(0, 30),
      available: true,
      featured: false,
      art: "toolkit",
      tags: [category.toLowerCase()],
      rules: String(input.rules || "Handle with care and return on time.").trim().slice(0, 180),
      bookedRanges: [],
    };
    state.tools.unshift(tool);
    addActivity({ type: "listing", title: `Listed ${tool.name}`, detail: tool.category, source: "human" }, false);
    emit("tool-added");
    return clone(tool);
  }

  function addActivity(entry, shouldEmit = true) {
    state.activity.unshift({
      id: createId("activity"),
      timestamp: new Date().toISOString(),
      source: "system",
      ...entry,
    });
    state.activity = state.activity.slice(0, 30);
    if (shouldEmit) emit("activity-added");
  }

  function reset() {
    state = initialState();
    emit("demo-reset");
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    getState,
    getTools,
    getTool,
    findTools,
    checkAvailability,
    reserveTool,
    cancelReservation,
    addTool,
    addActivity,
    reset,
    subscribe,
  };
}
