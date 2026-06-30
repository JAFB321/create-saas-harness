# create-saas-harness

A **ready-for-dev, agents-powered SaaS template**: a Next.js 15 + Supabase monorepo that ships
with a built-in agent **harness** (orchestrator + subagents + commands + roadmap + docs) so an AI
coding agent (Claude Code) can take your idea from **0 → 100**.

You don't just get a boilerplate. You get a boilerplate **plus the machinery to plan and build your
specific product on top of it** — guided by a structured interview that writes your foundations and
a fully populated, executable roadmap.

```bash
npx create-saas-harness@latest
```

## What you get

- **Monorepo** — Turborepo + pnpm, TypeScript strict, `@app/*` workspace packages
  (`core`, `db`, `integrations`, `config`).
- **Next.js 15** App Router + React 19 + Tailwind v4/shadcn, i18n-ready, a neutral SaaS shell
  (auth, dashboard, settings, billing/tiers, one generic CRUD resource with RLS).
- **Supabase** — Auth, Postgres with RLS, private Storage. Mock-first: the app runs 100% without
  third-party keys.
- **Payments** — choose **Stripe** or **MercadoPago** at scaffold time; a single `PaymentProvider`
  interface, the chosen adapter wired, the other pruned.
- **Tests** — Playwright (E2E) + Vitest (unit) with a critical-flow baseline.
- **CI/CD** — GitHub Actions (verify, e2e, migrations) + Vercel + Supabase config.
- **The harness** — `harness/` with an orchestrator workflow, specialized subagents
  (`dev-agent`, `dev-agent-pro`, `verifier`, `reviewer`, `doc-keeper`), slash commands
  (`/session-start`, `/session-wrap`, `/verify`, `/project-setup`), deterministic guards (hooks),
  and machine-readable state + roadmap.

## The experience

1. **Scaffold.** `npx create-saas-harness@latest` asks the essentials (project name, slug, payments
   provider, package manager), copies the template, installs deps, and makes the **first commit**.
2. **Define your product.** Open your agent and run `/project-setup`. It interviews you across
   7 rounds (idea, critical features, secondary features, business model, inspirations, dev
   profile), then spawns two agents:
   - `foundations-synthesizer` → writes `FOUNDATIONS/*` (your product's source of truth).
   - `roadmap-architect` → fills `harness/docs/roadmap/mvp-*.json` + `plans/*.md` with an
     executable roadmap.
3. **Build.** Read `INSTRUCTIONS.md` and run the daily loop: `/session-start` → work the roadmap →
   `/verify` → `/session-wrap`.

No MVP task is executed during setup — you end with a clean first commit, complete foundations, and
a roadmap ready for agents to execute.

## Requirements

- Node.js >= 20, pnpm (recommended), and an agent that supports custom commands/subagents
  (Claude Code today).
- A Supabase project (or the local stack via the Supabase CLI). The app runs mock-first without
  any third-party keys.

## Repo layout (this repo)

```
create-saas-harness/
├─ packages/cli/   # the npx scaffolder (prompts, copy, prune, git init + first commit)
└─ template/       # the project that gets copied into your new folder
```

## License

MIT — see [LICENSE](./LICENSE).
