# Demo video script — under three minutes

## 0:00–0:15 — Lead with the outcome

Show the live homepage already loaded.

“Community Tool Library helps people borrow useful things nearby. It becomes meaningfully better with WebMCP because an agent can reliably search, compare, check dates, and prepare a reservation—without guessing through the interface.”

## 0:15–0:45 — Human product experience

- Search for “projector” and show the filtered catalogue.
- Open a listing.
- Point out owner, condition, pickup area, contribution, deposit, and care note.
- Briefly show the responsive mobile navigation if time permits.

## 0:45–1:45 — WebMCP workflow

- Return home and show the WebMCP status.
- Say the example request: “Find a highly rated cordless drill within 5 km, available tomorrow, with a deposit below ₹600.”
- Run the guided agent demo or issue the request through a supported browser agent.
- Show `search_community_tools` update the visible catalogue.
- Show availability verification.
- Pause on the visible approval dialog.

“The reservation tool is intentionally non-read-only. The page never changes borrowing state until the user approves these exact details.”

- Approve and show the resulting entry under My borrowing.
- Point out “booked by your agent” and the activity trail.

## 1:45–2:20 — Implementation proof

- Open `js/webmcp.js` in GitHub.
- Show `document.modelContext.registerTool`, the JSON schema, annotations, and confirmation callback.
- Briefly show the imperative `list_community_tool` definition filling the reviewable form.

## 2:20–2:45 — Safety and graceful fallback

“Read-only tools carry the proper hint, community output is marked untrusted, tool results are bounded, and cross-origin access is not exposed. In an ordinary browser, the complete human experience and local demo still work.”

## 2:45–2:58 — Close

“This is a small but credible picture of an open web where people keep control and agents make complex interfaces easier to use.”
