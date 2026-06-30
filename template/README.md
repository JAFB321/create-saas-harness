# {{PROJECT_NAME}}

A Next.js 15 + Supabase SaaS, scaffolded with
[create-saas-harness](https://github.com/) — a monorepo with a built-in, agents-powered dev harness.

## Quick start

```bash
pnpm install
cp .env.example .env.local      # fill in your Supabase keys (local stack or a project)
pnpm dev                        # http://localhost:3000
```

Payments, email, and storage run **mock-first** (no keys needed). Supabase (auth + Postgres) is the
backend, so you do need a Supabase URL + keys — use a hosted project or the local stack
(`supabase start`).

## Next steps

1. Run **`/project-setup`** in your agent (Claude Code) to define your product. It writes
   `FOUNDATIONS/*` and a full roadmap under `harness/docs/roadmap/`.
2. Read **`INSTRUCTIONS.md`** for the daily build loop.

## Scripts

| Command       | What                                          |
| ------------- | --------------------------------------------- |
| `pnpm dev`    | Run the app (mock-first)                      |
| `pnpm verify` | check-types + lint + unit tests               |
| `pnpm e2e`    | Playwright end-to-end tests                   |
| `pnpm seed`   | Seed demo data (demo@example.com / demo1234)  |
| `pnpm roadmap`| Open the roadmap dashboard on :8080           |

## Layout

- `apps/web` — Next.js app (auth, dashboard, items, billing, settings).
- `packages/{core,db,integrations,config}` — domain, Supabase, providers, shared config.
- `supabase/` — schema + migrations.
- `harness/` — the agent harness (workflow, subagents, commands, roadmap, docs).
- `FOUNDATIONS/` — your product's source of truth (after `/project-setup`).
