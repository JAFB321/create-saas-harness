import { expect, test } from "@playwright/test";

test("landing page renders with auth CTAs", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /log in/i })).toBeVisible();
});

test("unauthenticated user is redirected from the app area to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
