#!/usr/bin/env bash
# Deterministic dev environment bring-up.
# Goal: `/session-start` leaves the project ready to work with NO manual steps.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "==> Installing dependencies (pnpm)…"
pnpm install

echo "==> Generating Supabase types…"
pnpm db:types || echo "   (skipped: configure Supabase + db:types to enable)"

echo "==> Seeding demo data…"
pnpm seed || echo "   (skipped: configure Supabase + seed to enable)"

echo "==> Environment ready. Start with: pnpm dev"
