# create-saas-harness

Scaffold a Next.js 15 + Supabase SaaS monorepo with a built-in, **agents-powered** dev harness
(orchestrator + subagents + roadmap + docs).

```bash
npx create-saas-harness@latest
```

It asks for a project name, target directory, and your stack — payments (**Stripe** or
**MercadoPago**), storage (**Supabase Storage** or **S3-compatible**: R2/S3/MinIO), email
(**Resend** or none for now), package manager — then copies the template, wires the chosen
adapters, prunes everything you didn't pick (code, SDK deps, env vars), installs deps, and makes
the **first commit**.

Every prompt is also a flag, so it runs unattended:

```bash
npx create-saas-harness@latest my-saas \
  --payments stripe --storage supabase --email resend --pm pnpm -y
```

| Flag                       | Values                          | Default        |
| -------------------------- | ------------------------------- | -------------- |
| `--payments`               | `stripe` \| `mercadopago`       | `stripe`       |
| `--storage`                | `supabase` \| `s3`              | `supabase`     |
| `--email`                  | `resend` \| `none`              | `resend`       |
| `--pm`                     | `pnpm` \| `npm` \| `yarn` \| `bun` | `pnpm`      |
| `--name`                   | project name                    | directory name |
| `--install` / `--no-install` | install dependencies          | install        |
| `--git` / `--no-git`       | git init + first commit         | git            |
| `-y`, `--yes`              | accept defaults, skip prompts   | —              |

Then, in your agent: run `/project-setup` to define your product (it writes `FOUNDATIONS/*` +
`PRODUCT.md`, commits a concrete design system, and an executable roadmap), and read `INSTRUCTIONS.md`
for the daily loop.

See the [main repo](https://github.com/JAFB321/create-saas-harness) for the full story. MIT licensed.
