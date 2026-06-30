# create-saas-harness

Scaffold a Next.js 15 + Supabase SaaS monorepo with a built-in, **agents-powered** dev harness
(orchestrator + subagents + roadmap + docs).

```bash
npx create-saas-harness@latest
```

It asks for a project name, target directory, payments provider (**Stripe** or **MercadoPago**), and
package manager; copies the template; wires the harness; prunes the unchosen payment adapter; installs
deps; and makes the **first commit**.

Then, in your agent: run `/project-setup` to define your product (it writes `FOUNDATIONS/*` +
`PRODUCT.md`, commits a concrete design system, and an executable roadmap), and read `INSTRUCTIONS.md`
for the daily loop.

See the [main repo](https://github.com/) for the full story. MIT licensed.
