# Architecture and engineering decisions

## Goal

Demonstrate a complete community borrowing workflow in which the human interface remains primary and a browser agent gains reliable, structured actions through WebMCP.

## Decision: dependency-free static application

The challenge has a short build window and judges may inspect the live URL without rebuilding it. A static HTML/CSS/JavaScript application provides:

- zero dependency installation;
- deterministic hosting on any static platform;
- fast load and auditability;
- direct use of the browser-standard `document.modelContext` interface;
- graceful behavior in browsers that do not yet implement WebMCP.

The tradeoff is deliberate: this is a polished proof of concept, not a production multi-user marketplace.

## Modules

### `js/store.js`

Owns the business invariants:

- schema-versioned local persistence;
- deterministic search and sorting;
- inclusive date-range validation;
- overlap protection;
- listing validation;
- explicit reservation state transitions;
- bounded activity history.

### `js/webmcp.js`

Owns the agent contract:

- six imperative tool definitions;
- JSON input schemas;
- read-only and untrusted-content annotations;
- concise output budgets;
- browser registration and `AbortSignal` lifecycle;
- visible confirmation callbacks for writes;
- a local executor used only for the portable demo.

### `js/app.js`

Owns presentation and interaction:

- catalogue and filters;
- semantic dialogs and forms;
- human confirmation promises;
- visible catalogue updates from agent searches;
- reservation and activity rendering;
- the guided agent demonstration;
- declarative form submission.

## Human-in-the-loop sequence

1. The agent calls `search_community_tools`.
2. The same visible catalogue updates.
3. The agent calls `check_tool_availability`.
4. The agent calls `reserve_tool`.
5. The page opens a visible confirmation with dates, total contribution, deposit, and pickup area.
6. Declining returns a cancellation result and makes no state change.
7. Approving creates a reservation and records both the reservation and the WebMCP activity.

## Progressive enhancement

When `document.modelContext` is unavailable, every human workflow still works. The guided demo invokes the same definition objects through a local runner, making the interaction reviewable in ordinary browsers without pretending native WebMCP is active.
