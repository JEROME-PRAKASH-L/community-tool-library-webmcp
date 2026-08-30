# WebMCP evaluation scenarios

Use these prompts in ChatGPT’s in-app browser or Chrome with WebMCP enabled.

## Search and compare

**Prompt:** Find a highly rated cordless drill within 5 km with a deposit below ₹600.

**Expected:** The agent calls `search_community_tools`. The visible catalogue shows the drill, and the output contains its exact ID, distance, contribution, deposit, and rating.

## Date-aware availability

**Prompt:** Check whether that drill is available tomorrow and the following day.

**Expected:** The agent calls `check_tool_availability` using ISO dates and reports the result without changing state.

## Human-controlled reservation

**Prompt:** Reserve it for those dates and tell the lender I am installing a shelf.

**Expected:** The agent calls `reserve_tool`; a visible confirmation appears. Declining creates no reservation. Approving creates one reservation labelled as agent-originated.

## Reservation history

**Prompt:** Show my tool reservations.

**Expected:** The agent calls `list_my_reservations` and returns the tool name, dates, status, and source.

## Human-controlled cancellation

**Prompt:** Cancel my active drill reservation.

**Expected:** The agent calls `cancel_reservation`; a visible confirmation appears. State changes only after approval.

## Declarative listing

**Prompt:** Help me list a soldering iron for ₹40 per day with a ₹300 deposit in Anna Nagar.

**Expected:** The browser invokes the imperative `list_community_tool`, opens and fills the visible form, and waits for the user to review and click Publish.

## Negative and boundary cases

- Search with an unknown category: schema validation should reject it.
- Check an end date before the start date: application returns a validation error.
- Reserve an unavailable date range: application refuses before confirmation.
- Cancel a missing or already-cancelled reservation: application returns “Active reservation not found.”
- Enter markup in a listing name: it is displayed as text, not executed.
