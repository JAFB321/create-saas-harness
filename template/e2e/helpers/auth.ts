import type { Page } from "@playwright/test";

/** Signs up a fresh user via the UI and lands on the dashboard. Requires a configured Supabase. */
export async function signUpFreshUser(page: Page): Promise<string> {
  const email = `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  await page.goto("/signup");
  await page.getByLabel(/full name/i).fill("E2E User");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill("password123");
  await page.getByRole("button", { name: /sign up/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
  return email;
}
