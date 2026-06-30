# FOUNDATIONS

This folder is your product's **source of truth** — the why and what behind everything the agents
build. It is written **for you, once**, by the `/project-setup` interview and rarely changes after.

> Empty right now? Run `/project-setup` in your agent. It interviews you across 7 rounds, then a
> `foundations-synthesizer` agent fills this folder (+ a root `PRODUCT.md`), a `design-architect`
> agent commits a concrete design system (`.impeccable/design.json` + `DESIGN.md` + real tokens), and
> a `roadmap-architect` agent turns it all into an executable roadmap
> (`harness/docs/roadmap/mvp-*.json` + `plans/*.md`, incl. `plans/mvp-1-design.md`).

## The files (standardized)

Every file has a YAML header (`title`, `status`, `last_updated`, `source`) and stays concise.

| File                       | Intent                                                                 | Length    |
| -------------------------- | ---------------------------------------------------------------------- | --------- |
| `00-overview.md`           | Elevator pitch, the problem, the one-liner.                            | ½–1 page  |
| `01-vision-scope.md`       | Vision, goals, **non-goals**, MVP boundary, success criteria.          | 1 page    |
| `02-users-personas.md`     | Audience, personas, jobs-to-be-done.                                   | 1 page    |
| `03-critical-features.md`  | Must-have features; each: description + **why critical** + acceptance. | 1–2 pages |
| `04-secondary-features.md` | Complementary / prioritized backlog.                                   | 1 page    |
| `05-business-model.md`     | Monetization, chosen payments provider, tiers, pricing, fees.          | 1–2 pages |
| `06-ux-style.md`           | Visual language, tone, key components, i18n, accessibility.            | 1 page    |
| `07-security-compliance.md`| Auth model, data sensitivity, RLS posture, privacy, risks.             | 1 page    |
| `08-tech-architecture.md`  | Stack, providers (payments/storage/email), integrations, constraints. | 1–2 pages |
| `09-inspirations.md`       | Reference apps/links/images: **emulate** vs **avoid**.                 | 1 page    |
| `10-dev-team.md`           | Dev stack, experience, strengths/weaknesses → how agents should guide. | ½–1 page  |
| `11-roadmap-outline.md`    | Derived MVP sequence (the bridge to `roadmap/*.json`).                 | 1 page    |
| `_interview-raw.md`        | Raw Q&A transcript (traceability).                                     | no limit  |
| `_decisions-log.md`        | Decisions with rationale (append-only).                                | append    |

## How agents use it

- `dev-agent` / `dev-agent-pro` read it when unsure about intended behavior, scope, or domain language.
- `foundations-synthesizer` also distills `06`/`09`/`02`/`00`/`01`/`05` into the root `PRODUCT.md`
  (the `impeccable` design skill's context bridge).
- `design-architect` reads `06-ux-style.md` + `09-inspirations.md` (via `PRODUCT.md`) to commit the
  design system.
- `roadmap-architect` reads ALL of it (+ `DESIGN.md`) to generate the roadmap.
- `reviewer` checks implementations against `03-critical-features.md` acceptance criteria.

Keep it true. If the product direction changes, update the relevant file and add an entry to
`_decisions-log.md`.
