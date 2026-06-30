# How to work in this project

This project ships with an **agent harness**: an orchestrator + specialist subagents that plan,
build, verify, and review your code in a tight loop. You drive; the agents do the work.

## First time?

1. Run **`/project-setup`** in your agent. It interviews you (~10-15 min) and writes:
   - `FOUNDATIONS/*` + `PRODUCT.md` — your product's source of truth.
   - A committed design system — `.impeccable/design.json` + `DESIGN.md` + real tokens in
     `apps/web/app/globals.css` (the UI contract; no generic placeholder look).
   - `harness/docs/roadmap/mvp-*.json` — your executable roadmap (see it: `pnpm roadmap`).
2. That's it for planning. Nothing is built yet.

## The daily loop

Each work session is four steps:

1. **`/session-start`** — opens with a **decision gate**: it asks you the active MVP's open questions
   (production wiring, pricing, design choices) up front, all at once. Answer them, and from there it
   runs autonomously. Then it loads context, brings the env up, and runs a baseline check. Don't start
   coding until you confirm.
2. **Work the roadmap** — say "go" and the orchestrator picks the next task, delegates it to an
   implementer agent, then a `verifier` runs the tests and a `reviewer` checks correctness.
3. **`/verify`** — re-run verification any time you want proof something works.
4. **`/session-wrap`** — reviews the diff, updates docs + roadmap status, formats, and stages your
   changes. It proposes a commit message but **does not commit** — you do that.

## Running the app

```bash
pnpm install     # once
pnpm dev         # http://localhost:3000 — runs mock-first, no third-party keys needed
pnpm verify      # types + lint + unit tests
pnpm e2e         # end-to-end tests
```

Payments, email, and storage run **mock-first** (no keys needed). Supabase (auth + Postgres) is the
backend — set your Supabase URL + keys in `.env.local` (a hosted project or `supabase start`). Add
real payment/email/storage keys later when you want them. See `.env.example`.

## Where things live

| You want…                 | Look in                                |
| ------------------------- | -------------------------------------- |
| Why/what of the product   | `FOUNDATIONS/` + `PRODUCT.md`          |
| The design system (UI)    | `.impeccable/design.json` + `DESIGN.md` |
| The plan / progress       | `harness/docs/roadmap/` (`pnpm roadmap`) |
| How the harness works     | `harness/docs/workflow.md`             |
| What the code is today    | `harness/docs/state/`                  |
| Project conventions       | `CLAUDE.md`                            |

## Two hard rules

- A task is **done** only when its test is green (or you confirm a manual one). No "it should work".
- The agent never commits for you. Commits are yours.

That's the whole thing. Run `/session-start` to begin.
