# Tathabbat platform implementation and release gates

This branch implements the Arabic core and the operational scaffolding from the attached refactoring plan. It is a release candidate, **not a claim that every phase has been delivered or that million-user capacity has been demonstrated**. No production deployment, source crawl, source-license agreement, paid service setup, or user-account rollout was performed.

## Implemented scope

| Backlog | Implementation |
|---|---|
| T01 contracts | Additive `/api/v1` DTOs, runtime frontend validation, generated OpenAPI/TypeScript schema, public error codes/request IDs; legacy search response remains available. |
| T02 adapter | Atomic operation/format/tab cache entries; Redis in production; canonical filter keys; explicit valid-empty/parser-error separation; synthetic fixtures. |
| T03 identity | `dorar-<providerId>` resolves from a clean browser/server; full SHA-256 provisional fingerprint includes every assessment field; temporary IDs never advertised as permanent. |
| T04 assessments | Source-record dedup retains scholars and grading. Match labels remain separate. No substring grade classification or authenticity percentages. |
| T05 saves | Guest v2 storage, non-destructive legacy read migration, local fallback, import/export; original `saved-hadiths` remains untouched. |
| T06 retrieval | Direct search bypasses AI. Assisted uses a maximum of one AI call, 7-second planning deadline, cached plans, daily shared call budget, up to three anchors, explicit direct fallback. Suspicious plans do not run. |
| T07 controls | URL-backed matching/scope/exclusion/specialist/degree/scholar/book/narrator controls; catalog lookup pages of 40; direct source pagination. Assisted returns a bounded candidate set with no invented corpus total. |
| T08 containment | Authenticated private adapter, Redis global upstream allowance, process concurrency cap, coalesced concurrent operations, total body deadline, cancellation, process circuit breaker; explicit trusted-proxy configuration. |
| T09 interface | Warm Arabic RTL design, responsive cards/detail/filter UI, real loading state, partial/no-match/offline/error states, accessible labels and skip navigation. |
| T10 research | All 17 adapter routes exercised in synthetic contract tests. Public relations, explanation discovery/detail/first-match, books and scholars; sections load independently. |
| T11 citations | One citation formatter for copy/share/image, full text and exact attribution; long image exports become complete text downloads. Public record HTML, canonical and OG metadata from backend-resolved identity. |
| T12 operations | CI in each repository, readiness/liveness, private shared caches/budgets, optional PostgreSQL revision storage, correction queue/audit schema, deployment example, backup/isolated restore drill, mocked load harness. |

PWA shell caching supports offline guest saves; APIs are not cached by the service worker. Arabic scholarly content stays Arabic.

## Intentional external gates / not completed

- Source access, allowed cache duration, retention, throughput and reuse terms have not been obtained. PostgreSQL source retention stays **off**. This implementation does not crawl or mirror a corpus. Transient caching settings also need operator review against source terms.
- Production deployment SHAs/settings and live parser compatibility are not verified. Fixtures are explicitly synthetic, not captured evidence of current Dorar markup. A qualified reviewer must approve real Arabic retrieval cases (the plan calls for 100–200) and grading fidelity before launch.
- Optional accounts, authenticated collection synchronization, a complete English UI and licensed/reviewed translations remain later product decisions in phase 5. No fake login, translation corpus, or cross-device sync is presented.
- Metrics collection/alert routing, budget alerts, provider pricing, real token-cost reporting, regional latency and real-user Web Vitals need infrastructure configuration. Request IDs, status/latency logs and private adapter counters are available; an external telemetry backend is not provisioned.
- No staging canary, live load/soak test, database migration on user infrastructure, backup restoration on user data, human accessibility audit, or 99.9% availability/capacity certification was performed.
- Rate budgets are conservative defaults, not granted source allowance. Public traffic must pass the edge controls and the explicitly configured trusted proxies. Do not expose the adapter or Redis publicly.
- Correction reports require a configured PostgreSQL database and migration. Otherwise the API returns a failure; it never acknowledges a report it did not persist. Human moderation is an operator workflow, not an automatic change to scholarly text.

## Validation evidence

Backend builds and executable regression checks cover separate assessments, exact grading, direct-without-AI, AI outage, filters, cache request IDs, clean-state detail, legacy recovery, no-match versus failure. Adapter tests cover 17 routes and parser/cache/timeout/auth regressions. Frontend unit/hosting and desktop/mobile browser tests cover migration, citations, filters, single submit, full detail, clean-context links, and independent relation failure. See repository CI commands for reproducibility.

These tests establish behavior against controlled sources, not real upstream reliability or religious-content acceptance.
