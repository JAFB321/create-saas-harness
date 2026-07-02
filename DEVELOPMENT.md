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
1. `npx create-saas-harness` → asks essentials (name, dir, **payments Stripe|MercadoPago**,
   **storage Supabase|S3-compatible**, **email Resend|none**, package manager), copies the template,
   assembles the chosen modules (repoints `<kind>/real.ts`, prunes unchosen adapters + SDK deps +
   env blocks), installs, makes the **first commit**. Every prompt is also a flag
   (`--payments/--storage/--email/--pm/-y/--no-install/--no-git`) for unattended runs — the landing
   page generates these commands.
2. In the user's agent: `/project-setup` runs a 7-round product-discovery interview, then spawns
   `foundations-synthesizer` (writes `FOUNDATIONS/*` + `PRODUCT.md`), `design-architect` (commits a
   concrete design system via the `impeccable` skill — `.impeccable/design.json` + `DESIGN.md` + real
   tokens in `globals.css`), and `roadmap-architect` (writes an executable
   `harness/docs/roadmap/mvp-*.json` + plans, each MVP carrying `openQuestions`). No MVP task is
   executed during setup.
3. Daily build loop via the harness: `/session-start` (opens with a front-loaded decision gate that
   asks the MVP's `openQuestions`, then runs autonomously) → work the roadmap → `/verify` →
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
| Modularity | Every integration is a scaffold-time choice behind a `<kind>/real.ts` re-export + **prune** | One repo, no flavor drift. Prune is safe because the factory/status only import `real.ts` (class + `REAL_*_PROVIDER` + `isReal*Configured`); the CLI repoints it and removes unchosen adapter files, SDK deps, and `.env.example` blocks (`## >>> kind:choice` markers). |
| Payments | Stripe **or** MercadoPago | Single `PaymentProvider` interface. |
| Storage | Supabase Storage (default — reuses project keys + a private-bucket migration) **or** S3-compatible (S3/R2/MinIO) | Both mock-first. The S3 choice prunes the bucket migration; the Supabase choice prunes the AWS SDK. |
| Email | Resend **or** none-for-now | "None" pins `email/real.ts` to the mock and prunes the Resend adapter + dep. |
| Non-interactive CLI | Every prompt has a flag (`--payments/--storage/--email/--pm/-y/…`) | The landing configurator emits a copy-paste one-liner; CI/agents can scaffold unattended. |
| Language | English everywhere; UI is i18n-ready (keyed strings, English default) | Open-source/international. |
| License | MIT | Max adoption. |
| Example domain | Neutral SaaS shell: auth + dashboard + settings + billing/tiers + one CRUD resource (`items`) with RLS | Shows the full pattern without biasing the domain; MVP-1 of the generated roadmap specializes it. |
| Roadmap generation | MVPs → **executable tasks** + plans | A dev-agent can pick up tasks 0→100. |
| Setup scope | `FOUNDATIONS/` + `PRODUCT.md` + design system + roadmap + plans (design-architect applies real tokens to `globals.css`/base components; no feature code) | The look is committed day one; feature code waits for the first `/session-start`. |
| Design system | A committed `.impeccable/design.json` + `DESIGN.md` (via the vendored `impeccable` skill); UI tasks read it as a contract | Kills the generic placeholder look; the #1 reason generated UIs felt off. |
| Decision handling | Unresolved fine/blocking calls become each MVP's `openQuestions`, asked **up front** at `/session-start`, then autonomous | "Ask everything at the start, then leave it working" — no mid-run interruptions. |
| Persistence | `FOUNDATIONS/_interview-raw.md` (transcript) + `_decisions-log.md` | Traceability of why the roadmap is shaped that way. |
| CI/CD | GitHub Actions (verify / e2e / migrations) + Vercel + Supabase | Ship-ready. |

## Repo map

```
packages/cli/         index.mjs (scaffolder: prompts + flags, module assembly) · lib/fs-utils.mjs · lib/sync-template.mjs (prepack bundles template/)
landing/              Astro landing page — visual configurator that emits the npx command (deploy: Vercel, root dir = landing/)
template/
  apps/web/           Next.js 15 app: (auth) login/signup, (app) dashboard/items/billing/settings, checkout, api/webhooks/payments, api/health, middleware
  packages/core/      pure domain: payment state-machine, plans/entitlements, zod schemas, money, email templates (unit-tested)
  packages/db/        Supabase clients (browser/server/service/middleware), env, database.types.ts, seed
  packages/integrations/ mock-first Payment/Email/Storage + Stripe/MercadoPago/Resend/S3 adapters + factory + settleOrder (idempotent)
  packages/config/    shared tsconfig/eslint/prettier/tailwind
  supabase/           migrations (schema + RLS) + config.toml
  harness/            workflow.md · agents/ (dev-agent, dev-agent-pro, verifier, reviewer, doc-keeper, foundations-synthesizer, design-architect, roadmap-architect) · commands/ · skills/{project-setup, impeccable} · scripts/ · docs/{state,roadmap}
  FOUNDATIONS/        README + spec (populated by /project-setup; also writes root PRODUCT.md + DESIGN.md + .impeccable/)
  CLAUDE.md · INSTRUCTIONS.md · README.md
```

Tokens replaced by the CLI at scaffold time: `{{PROJECT_NAME}}`, `{{PROJECT_SLUG}}`,
`{{PAYMENTS_PROVIDER}}`, `{{STORAGE_PROVIDER}}`, `{{EMAIL_PROVIDER}}` (email renders as `mock`
when "none" was chosen).

## Status (last session)

**Modular scaffold shipped** (v1.1.0): storage (Supabase Storage | S3-compatible) and email
(Resend | none) joined payments as scaffold-time choices, all behind the `<kind>/real.ts` pattern;
the CLI grew non-interactive flags; the Astro landing/configurator landed in `landing/`; a template
review pass fixed security findings (profiles RLS column privileges, OAuth callback open redirect,
webhook error handling + replay gating, checkout auth, prod-gated mock webhook, MP webhook
signature, escaped email HTML).

**Verified green**: `pnpm verify` (types + lint + unit tests, 15/15 turbo tasks) on freshly
scaffolded copies of BOTH extreme combos (stripe/supabase/resend/pnpm and mercadopago/s3/none/npm);
`pnpm build` for the landing.

**Not done yet:**
- The npm publish of 1.1.0 (`cd packages/cli && npm publish` — prepack bundles `template/`).
- Vercel project for `landing/` (import repo, Root Directory = `landing/`).
- e2e (`template/e2e/critical-flow.spec.ts`) still needs a live Supabase to run.

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
