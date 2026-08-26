import test from "node:test";
import assert from "node:assert/strict";

import {
  STORAGE_KEY,
  createStore,
  isToolAvailable,
  isValidDateRange,
  rangesOverlap,
  searchTools,
} from "../js/store.js";
import { SEED_TOOLS } from "../js/data.js";
import { escapeHTML, formatCurrency } from "../js/utils.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    values,
  };
}

test("date ranges overlap at inclusive boundaries", () => {
  assert.equal(rangesOverlap("2030-04-01", "2030-04-03", "2030-04-03", "2030-04-05"), true);
  assert.equal(rangesOverlap("2030-04-01", "2030-04-02", "2030-04-03", "2030-04-05"), false);
  assert.equal(isValidDateRange("2030-04-05", "2030-04-01"), false);
  assert.equal(isValidDateRange("04/01/2030", "2030-04-05"), false);
});

test("search combines task text, category, distance, and deposit filters", () => {
  const results = searchTools(SEED_TOOLS, {
    query: "drill",
    category: "Power tools",
    maxDistanceKm: 5,
    maxDeposit: 600,
  });
  assert.equal(results.length, 1);
  assert.equal(results[0].id, "tool-drill");
});

test("a confirmed reservation blocks overlapping dates but not later dates", () => {
  const tool = SEED_TOOLS.find((item) => item.id === "tool-drill");
  const reservations = [{
    id: "reservation-1",
    toolId: tool.id,
    startDate: "2030-04-10",
    endDate: "2030-04-12",
    status: "confirmed",
  }];
  assert.equal(isToolAvailable(tool, "2030-04-11", "2030-04-13", reservations), false);
  assert.equal(isToolAvailable(tool, "2030-04-13", "2030-04-15", reservations), true);
});

test("store persists reservations and makes cancellation explicit", () => {
  const storage = memoryStorage();
  const store = createStore(storage);
  const reservation = store.reserveTool({
    toolId: "tool-drill",
    startDate: "2031-06-01",
    endDate: "2031-06-02",
    note: "Shelf installation",
    source: "agent",
  });

  assert.equal(reservation.status, "confirmed");
  assert.ok(storage.values.has(STORAGE_KEY));
  assert.equal(store.checkAvailability("tool-drill", "2031-06-01", "2031-06-02").available, false);

  const cancelled = store.cancelReservation(reservation.id, "human");
  assert.equal(cancelled.status, "cancelled");
  assert.equal(store.checkAvailability("tool-drill", "2031-06-01", "2031-06-02").available, true);
});

test("new listings are validated and sanitized at the display boundary", () => {
  const store = createStore(memoryStorage());
  const tool = store.addTool({
    name: "Community soldering iron",
    category: "Electronics",
    description: "Temperature-controlled iron with a stand and safety mat.",
    neighborhood: "Anna Nagar",
    pricePerDay: 40,
    deposit: 300,
  });
  assert.equal(tool.owner, "You");
  assert.equal(store.getTools()[0].name, "Community soldering iron");
  assert.equal(escapeHTML('<img src=x onerror="alert(1)">'), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  assert.match(formatCurrency(500), /500/);
});

test("invalid reservation attempts do not mutate state", () => {
  const store = createStore(memoryStorage());
  assert.throws(
    () => store.reserveTool({ toolId: "missing", startDate: "2030-01-01", endDate: "2030-01-02" }),
    /Tool not found/,
  );
  assert.equal(store.getState().reservations.length, 0);
});
