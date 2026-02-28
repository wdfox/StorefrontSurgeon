import { expect, test } from "@playwright/test";

test("demo user can generate and review a storefront update", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("button", { name: "Open workspace" }).click();
  await expect(page).toHaveURL(/\/projects$/);

  await page.getByRole("link", { name: /Spring Conversion Refresh/i }).click();
  await expect(page).toHaveURL(/\/projects\/seed-project-storefront-surgeon$/);

  await page
    .getByRole("button", { name: "Example: Add a stronger sticky buy bar" })
    .click();
  await page.getByRole("button", { name: "Generate" }).click();

  await expect(page.getByRole("heading", { name: "Your update is ready" })).toBeVisible();
  await expect(page.getByLabel("Sticky mobile buy bar")).toContainText("Buy now for $118");
  await expect(page.getByText("Checks passed", { exact: true })).toBeVisible();
});
