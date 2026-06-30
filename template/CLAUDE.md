# {{PROJECT_NAME}}

A SaaS built on **create-saas-harness**: a Next.js 15 + Supabase monorepo with a built-in agent
harness. Mock-first (runs with no third-party keys). Payments via {{PAYMENTS_PROVIDER}}.

> New here? See `INSTRUCTIONS.md` for the daily loop and `FOUNDATIONS/*` for what this product is.

## Stack & conventions

- Next.js 15 (App Router, React 19) + strict TypeScript + Tailwind v4/shadcn.
- Supabase: Auth, Postgres with RLS, private Storage.
- Imports via `@app/*`: `core` (pure domain), `db` (Supabase clients/types), `integrations`
  (mock-first providers + settlement), `config` (presets).
- `zod` validation at every boundary (route handlers, server actions, webhooks).
- **Code and names in English.** UI strings are i18n-keyed (English default); localize from there.
- **Mock-first:** the app runs 100% without third-party keys; each integration sits behind its
  interface (`PaymentProvider`/`EmailProvider`/`StorageProvider`) and the factory falls back to a
  mock with a warning, never crashing.
- Privileged data access goes through the server (route handlers / server actions) after validating
  session/ownership; the browser never talks to the DB with elevated rights. Private files are
  delivered via signed URLs.
- Payment settlement happens in a single idempotent place (idempotency key + payment events).
  Webhooks validate signature + idempotency before moving any state machine. Real RLS on every table.

## Commands

```
pnpm dev          # web :3000, mock-first
pnpm verify       # check-types + lint + test
pnpm e2e          # playwright (critical flows)
pnpm seed         # demo data
pnpm roadmap      # roadmap dashboard on :8080
pnpm up           # deterministic bring-up (install + db:types + seed)
```

## Harness

The harness lives in `harness/` (`agents/`, `commands/`, `skills/`, `scripts/`, `docs/`).
`.claude/agents`, `.claude/commands`, and `.claude/skills` symlink into it.

- `/project-setup` runs the discovery interview and generates `FOUNDATIONS/*` + `PRODUCT.md`, a
  committed design system (`.impeccable/design.json` + `DESIGN.md` + real tokens in `globals.css`),
  and the roadmap (run once).
- `/session-start` opens a session: a **decision gate** (asks the MVP's `openQuestions` up front),
  then context + env + baseline. After the gate, execution runs autonomously. `/session-wrap` closes
  it (review + docs + stage, no commit). `/verify` delegates to the `verifier` subagent.
- Subagents: `foundations-synthesizer`/`design-architect`/`roadmap-architect` (setup-time, Opus);
  `dev-agent` (implements, Sonnet), `dev-agent-pro` (complex/critical tasks, Opus), `verifier` (runs
  tests, Haiku), `reviewer` (fresh-context correctness review, Opus), `doc-keeper` (state/docs,
  Haiku). A task is `done` only with verifier PASS **and** reviewer approval.
- Non-eludible guards (`.claude/settings.json`): Stop hook runs `pnpm check-types`; PreToolUse
  `harness/scripts/harness-guard.mjs` blocks force push / dangerous `rm -rf` and protects `.env*` and
  applied migrations.
- Design system (source of truth for UI): `.impeccable/design.json` + `DESIGN.md`. Generated via the
  `impeccable` skill (`harness/skills/impeccable/`); UI tasks read it before styling — never the
  placeholder palette.
- Current code state: `harness/docs/state/*.md` (committed). Progress/roadmap:
  `harness/docs/roadmap/mvp-*.json` (local, gitignored; template is `mvp-example.json`). Full flow:
  `harness/docs/workflow.md`.
- Hard rules: don't delete/disable tests to make them pass; no task `done` without its `verify` green;
  never commit without the human's explicit request; ask all decisions up front at the gate, then run
  autonomous (never block mid-run — mark `blocked` + add an `openQuestion` instead).
