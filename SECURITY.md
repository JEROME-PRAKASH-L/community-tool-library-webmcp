# Security policy and prototype threat model

## Supported version

The latest commit on `main` is the supported hackathon prototype.

## Report a vulnerability

Please open a private GitHub security advisory for this repository. Do not include sensitive information in a public issue.

## Trust boundaries

Community Tool Library is a static demonstration. Listings and reservations are stored in the current browser’s `localStorage`; they are not synchronized with another user or a server.

WebMCP introduces an agent-to-page execution boundary. The application treats browser-agent calls as untrusted requests:

- Read-only tools are labelled with `readOnlyHint: true`.
- Community-content responses are labelled with `untrustedContentHint: true`.
- Reservation and cancellation tools never mutate state until the visible confirmation dialog resolves positively.
- Tools are not exposed to cross-origin documents.
- Inputs are schema constrained and validated again in the store.
- User text has length limits and is HTML-escaped at every rendered boundary.
- Tool output is capped to stay concise and reduce untrusted-context propagation.

## Not production-ready

A production service requires server-side authentication and authorization, rate limits, audit logs, data retention controls, content moderation, verified lender identity, abuse reporting, payment controls, and protection against conflicting multi-user reservations. None of those capabilities are claimed by this prototype.
