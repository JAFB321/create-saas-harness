# Development & handoff notes

> This file is for anyone (human or agent) **working ON create-saas-harness itself** — not for end
> users of a scaffolded project (that's `template/INSTRUCTIONS.md`). Read this first to pick up where
> the last session left off.

## What this project is

`create-saas-harness` is an **open-source, agents-powered SaaS template**. Two parts:

- `packages/cli/` — the `npx create-saas-harness` scaffolder.
- `template/` — the project it copies into a user's new folder (a full Next.js 15 + Supabase monorepo
  with a built-in agent harness).

The end-to-end experience it delivers:
1. `npx create-saas-harness` → asks essentials (name, dir, **Stripe|MercadoPago**, package manager),
   copies the template, prunes the unchosen payment adapter, installs, makes the **first commit**.
2. In the user's agent: `/project-setup` runs a 7-round product-discovery interview, then spawns
   `foundations-synthesizer` (writes `FOUNDATIONS/*`) and `roadmap-architect` (writes an executable
   `harness/docs/roadmap/mvp-*.json` + plans). No MVP task is executed during setup.
3. Daily build loop via the harness: `/session-start` → work the roadmap → `/verify` →
   `/session-wrap`.

It was **derived from the `photo.sh` project** (a real Next.js+Supabase SaaS with this harness),
generalized to a neutral domain and English.

## Design decisions (the "why", locked with the owner)

| Decision | Choice | Why |
|---|---|---|
| Distribution | Real npm CLI (`npx create-saas-harness`) | Matches the intended one-command UX; the CLI does copy + prune + git init + first commit. |
| Interview driver | The **agent** via a `/project-setup` skill | More conversational than terminal prompts; the npx step only scaffolds. |
| Agent target | **Claude Code only** | The harness is built on subagents/commands/skills/hooks; multi-agent would dilute it. |
| Baseline app | **Batteries-included, mock-first** | Runs 100% without third-party keys; a working SaaS shell from commit 1. |
| Payments | Choose Stripe **or** MercadoPago at scaffold; single `PaymentProvider` interface + **prune** | One repo, no flavor drift. Prune is safe because the factory imports `payment/real.ts`, a re-export the CLI repoints to the chosen adapter (the other adapter file + its SDK dep are removed). |
| Storage/Email | S3-compatible (S3/R2/MinIO) + Resend, both mock-first | Mirrors photo.sh; runs on mocks by default. |
| Language | English everywhere; UI is i18n-ready (keyed strings, English default) | Open-source/international. |
| License | MIT | Max adoption. |
| Example domain | Neutral SaaS shell: auth + dashboard + settings + billing/tiers + one CRUD resource (`items`) with RLS | Shows the full pattern without biasing the domain; MVP-1 of the generated roadmap specializes it. |
| Roadmap generation | MVPs → **executable tasks** + plans | A dev-agent can pick up tasks 0→100. |
| Setup scope | Only `FOUNDATIONS/` + roadmap + plans (no app code touched) | Clean first commit; nothing built until the first `/session-start`. |
| Persistence | `FOUNDATIONS/_interview-raw.md` (transcript) + `_decisions-log.md` | Traceability of why the roadmap is shaped that way. |
| CI/CD | GitHub Actions (verify / e2e / migrations) + Vercel + Supabase | Ship-ready. |

## Repo map

```
packages/cli/         index.mjs (scaffolder) · lib/fs-utils.mjs · lib/sync-template.mjs (prepack bundles template/)
template/
  apps/web/           Next.js 15 app: (auth) login/signup, (app) dashboard/items/billing/settings, checkout, api/webhooks/payments, api/health, middleware
  packages/core/      pure domain: payment state-machine, plans/entitlements, zod schemas, money, email templates (unit-tested)
  packages/db/        Supabase clients (browser/server/service/middleware), env, database.types.ts, seed
  packages/integrations/ mock-first Payment/Email/Storage + Stripe/MercadoPago/Resend/S3 adapters + factory + settleOrder (idempotent)
  packages/config/    shared tsconfig/eslint/prettier/tailwind
  supabase/           migrations (schema + RLS) + config.toml
  harness/            workflow.md · agents/ (dev-agent, dev-agent-pro, verifier, reviewer, doc-keeper, foundations-synthesizer, roadmap-architect) · commands/ · skills/project-setup · scripts/ · docs/{state,roadmap}
  FOUNDATIONS/        README + spec (populated by /project-setup)
  CLAUDE.md · INSTRUCTIONS.md · README.md
```

Tokens replaced by the CLI at scaffold time: `{{PROJECT_NAME}}`, `{{PROJECT_SLUG}}`,
`{{PAYMENTS_PROVIDER}}`.

## Status (last session)

**Verified green** against a freshly-scaffolded copy: `pnpm install`, `pnpm check-types` (5/5
packages), `pnpm lint`, `pnpm test` (12 unit tests), `pnpm build` (13 routes). Both payment variants
(Stripe and MercadoPago) type-check.

**Not done yet:**
- No git commit in this repo, and the CLI is **not published** to npm.
- e2e (`template/e2e/critical-flow.spec.ts`) is written but **not run** — it needs a live Supabase
  (local stack or a project). Only `landing.spec.ts` runs without Supabase.
- The interactive CLI was validated by exercising its copy/prune/token/symlink mechanics directly;
  the full prompt UX (`@clack/prompts`) wasn't run end-to-end.

## How to verify (quickest path)

```bash
# 1) test the scaffolder against template/ (from this repo root)
pnpm install
node packages/cli/index.mjs          # answer the prompts, point it at a temp dir

# 2) in the generated app
pnpm install && pnpm verify && pnpm build
# for e2e: set Supabase env (or `supabase start`), then `pnpm seed && pnpm e2e`
```

## Likely next steps

1. First commit + push to GitHub; fill the real repo URL in `README.md` / `packages/cli/README.md`.
2. Smoke the whole loop once with a local Supabase to green the e2e.
3. Polish the CLI prompt UX; then `cd packages/cli && npm publish` (prepack bundles `template/`).
4. Optional: a `vercel.json`, a richer landing, more e2e coverage.
