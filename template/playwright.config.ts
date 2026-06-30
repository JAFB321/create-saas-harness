import { defineConfig, devices } from "@playwright/test";

// Port/baseURL are parameterizable to support several worktrees at once (each runs its app on
// 3000 + MVP number via `source .harness-env`). Without env it keeps the default :3000.
const PORT =
  process.env.PORT ||
  (process.env.E2E_BASE_URL ? new URL(process.env.E2E_BASE_URL).port : "") ||
  "3000";
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? undefined : 1,
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // e2e runs against the production BUILD (`next start`), not `next dev` — precompiled routes are
  // far more stable under load. `pnpm e2e:server` in another terminal is reused via
  // reuseExistingServer. Providers are forced to mock so the suite never hits real services.
  webServer: {
    command: "pnpm e2e:server",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    env: {
      PORT,
      DEV_TOOLS_ENABLED: "true",
      PAYMENTS_PROVIDER: "mock",
      EMAIL_PROVIDER: "mock",
      STORAGE_PROVIDER: "mock",
    },
    timeout: 180_000,
  },
});
