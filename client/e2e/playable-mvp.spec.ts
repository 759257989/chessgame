import { expect, test } from "@playwright/test";

test("human can start, sense, see move targets, move, and resign", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "white" }).click();
  await page.getByRole("button", { name: /start/i }).click();

  await expect(page.locator(".phase-message")).toHaveText("Your turn to sense");
  await expect(page.getByLabel("Chess board")).toBeVisible();
  const humanClock = page.locator(".clock-line").filter({ hasText: "You have" }).locator("strong");
  const firstClockText = await humanClock.textContent();
  await page.waitForTimeout(1100);
  await expect(humanClock).not.toHaveText(firstClockText ?? "");

  await page.getByRole("button", { name: /^e2,/ }).hover();
  await expect(page.getByRole("button", { name: /^d1,.*highlighted sense area/ })).toBeVisible();

  await page.getByRole("button", { name: /^e2,/ }).click();
  await expect(page.locator(".phase-message")).toHaveText("Choose your move");
  await page.getByRole("button", { name: /^a8,/ }).hover();
  await page.getByRole("button", { name: /^e2,.*white pawn/ }).hover();
  await expect(page.getByRole("button", { name: /^e4,.*available move target/ })).toBeVisible();
  await page.getByRole("button", { name: /^e2,.*white pawn/ }).click();
  await page.getByRole("button", { name: /^e4,.*available move target/ }).click();
  await expect(page.locator(".phase-message")).toHaveText("Your turn to sense");

  await page.getByRole("button", { name: /resign/i }).click();
  await expect(page.locator(".phase-message")).toHaveText("You resigned.");
});
