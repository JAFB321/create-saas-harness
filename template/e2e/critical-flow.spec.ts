import { expect, test } from "@playwright/test";
import { signUpFreshUser } from "./helpers/auth";

// The critical path: sign up → create an item → upgrade via checkout → simulate paid → plan applied.
// Requires a configured Supabase (local stack or a project). Providers run in mock mode.
test("critical flow: signup, create item, upgrade, settle", async ({ page }) => {
  await signUpFreshUser(page);

  // Create an item.
  await page.goto("/items");
  await page.getByPlaceholder(/new item title/i).fill("My first item");
  await page.getByRole("button", { name: /^add$/i }).click();
  await expect(page.getByText("My first item")).toBeVisible();

  // Start an upgrade → mock checkout page.
  await page.goto("/billing");
  await page
    .locator("form", { has: page.locator('input[value="pro"]') })
    .getByRole("button", { name: /upgrade/i })
    .click();
  await expect(page).toHaveURL(/\/checkout\//);

  // Simulate a successful payment via the mock webhook.
  await page.getByRole("button", { name: /simulate paid/i }).click();
  await expect(page.getByText(/status:\s*paid/i)).toBeVisible({ timeout: 15_000 });

  // Plan applied on the dashboard.
  await page.goto("/dashboard");
  await expect(page.getByText(/^Pro$/)).toBeVisible();
});
