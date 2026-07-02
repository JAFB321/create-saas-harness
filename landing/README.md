# Landing / configurator

The Astro landing page for `create-saas-harness`: a visual configurator where you compose your
stack (payments, storage, email, package manager), preview the generated file tree + `.env`, and
copy the exact `npx create-saas-harness` command.

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # static output in dist/
```

## Deploy (Vercel)

Import the repo in Vercel and set **Root Directory = `landing/`** — the Astro preset is
auto-detected, no extra config needed.

## Keep it honest

The configurator mirrors the CLI's real flags and module matrix (`packages/cli/index.mjs` →
`CHOICES` / `REAL_ADAPTERS`). If you add a provider to the CLI, update the option cards, the file
tree, and the env preview in `src/components/Configurator.astro`.
