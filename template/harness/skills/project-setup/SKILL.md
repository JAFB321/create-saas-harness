---
name: project-setup
description: Guided product-discovery interview that turns a freshly scaffolded create-saas-harness project into a complete plan. Use right after scaffolding (or whenever the user says "run the project setup" / "/project-setup"). Conducts a 7-round interview, then spawns two agents to write FOUNDATIONS/* and a fully executable roadmap. Does NOT execute any MVP task.
---

# Project setup — guided discovery

You are conducting the **product-discovery interview** for a freshly scaffolded project. Your job is
to deeply understand what the user wants to build, capture it faithfully, and then hand off to two
specialist agents that write the foundations and the roadmap. **You do not write code or execute any
roadmap task here.**

Read this whole file before starting. Then run the steps in order.

## 0. Preconditions

1. Confirm you are at the repo root (`pwd`) and this is a create-saas-harness project (a `harness/`
   dir and a `FOUNDATIONS/` dir exist).
2. If `FOUNDATIONS/00-overview.md` already exists, this project was set up before. Ask the user
   whether to **re-run** (overwrites FOUNDATIONS and regenerates the roadmap) or **stop**. Default:
   stop.
3. Tell the user briefly what's about to happen: "I'll ask you 7 short rounds of questions to
   understand your product. Then I'll generate your FOUNDATIONS and an executable roadmap. No code
   gets written yet. This takes ~10-15 minutes."

## How to ask (applies to every round)

- Use the structured question UI (AskUserQuestion) when the answer is a choice among options; use
  plain conversational questions for open-ended answers. Either way, **always show the guiding
  example** so the user knows the shape of a good answer.
- Ask **2–4 focused questions per round**, not a wall. Keep each question short.
- After each round, **reflect back** a one-line summary of what you heard and append the raw Q&A to
  `FOUNDATIONS/_interview-raw.md` (create it on round 1 with a `# Interview transcript` header).
- It's a conversation: if an answer is vague or contradicts an earlier one, ask a quick follow-up.
- The user can always say "skip" or "you decide" — record that and pick a sensible default, noting it
  in `_decisions-log.md`.

## The 7 rounds

### Round 1 — Idea & framing

Goal: what the app does, audience, rough UI/UX vibe, security posture, MVP ambition.
Guiding prompt to show: *"In 2-3 sentences: what problem does it solve and for whom?"*
Cover: the one-liner; primary audience; the rough style/vibe (e.g. "clean like Linear", "playful");
how sensitive is the data (public, personal, financial, health); how big is the ideal first MVP
(weekend / a few weeks / a couple months).

### Round 2 — Critical features

Goal: the features without which the app does not exist.
Guiding prompt to show: *"On Amazon, the critical feature is 'buy a product'. List ONLY the
must-haves — don't get carried away with everything you'd eventually want."*
Push for a tight list (3–7). For each, capture a one-line description and **why it's critical**.

### Round 3 — Secondary / complementary features

Goal: nice-to-haves that add value but aren't day-one.
Give inspiration to show: *"e.g. reviews, wishlists, recommendations, notifications, analytics,
sharing, integrations. What rounds out the experience but can wait?"*
Capture each as a one-liner; let the user mark rough priority (later / much later).

### Round 4 — Refine & ratify

Goal: correct and prioritize. Show the user a compact summary of rounds 1–3 (the one-liner, the
critical list, the secondary list). Ask: *"What's wrong or missing? What should move between critical
and secondary?"* Apply edits. This round is short.

### Round 5 — Business model

Goal: how it makes money (or not yet).
Guiding prompt to show: *"e.g. freemium with a Pro plan at $X/mo; one-time purchase; marketplace with
a Y% fee; usage-based; not monetized yet."*
Cover: payments yes/no; one-time vs subscription; tiers/plans and rough pricing; free tier limits;
fees/commissions if marketplace. Note: the payments provider (Stripe or MercadoPago) was already
chosen at scaffold time — confirm which one is wired (check `PAYMENTS_PROVIDER` in `.env.example` or
the `@app/integrations` payment adapter) and design the model around it.

### Round 6 — Inspirations

Goal: concrete references for UI and for business.
Guiding prompt to show: *"Paste URLs or names. UI: 'looks like Linear', 'onboarding like Duolingo'.
Business: 'monetizes like Notion'. Images/screenshots welcome — describe them if you can't paste."*
Capture two lists: UI/style inspirations and business-model inspirations, each with a note on what to
**emulate** and what to **avoid**.

### Round 7 — Dev profile

Goal: calibrate how the roadmap and agents should guide this specific dev.
Guiding prompt to show: *"e.g. 'strong in React/TypeScript, weak in SQL/RLS and payments, never
shipped a SaaS before'. Be honest — this changes how much hand-holding the tasks include."*
Cover: stack familiarity, experience level, weak spots, time availability, solo or team.

## After the interview — generate (two agents, in sequence)

When the 7 rounds are done and the transcript is saved:

1. **Spawn `foundations-synthesizer` (Opus)** via the Task tool. Pass it:
   - the full interview transcript (`FOUNDATIONS/_interview-raw.md`),
   - the chosen payments provider,
   - an instruction to write every FOUNDATIONS file per the spec in its agent definition.
   Wait for it to finish. It returns a summary of files written.

2. **Spawn `roadmap-architect` (Opus)** via the Task tool. Pass it:
   - "read all of FOUNDATIONS/* and generate the roadmap",
   - the dev profile (so it calibrates task granularity and guidance).
   Wait for it to finish. It returns the MVP/sprint/task counts it generated.

Run them **sequentially** (roadmap depends on foundations). Do not run any roadmap task.

## Final output to the user (brief, simple)

Print a short summary — bullets or a small table, plain language:

- ✅ What just happened (FOUNDATIONS written, N MVPs / M tasks in the roadmap).
- 📁 Where to look: `FOUNDATIONS/` (your product truth), `harness/docs/roadmap/` (the plan;
  open the dashboard with `pnpm roadmap`).
- ▶️ **Next step: read `INSTRUCTIONS.md`** — it explains the daily loop (`/session-start` → work →
  `/verify` → `/session-wrap`) in 4 bullets.
- A one-line note that nothing has been built yet — the first `/session-start` begins execution.

Keep it under ~15 lines. Don't dump the roadmap contents.
