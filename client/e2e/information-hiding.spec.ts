import { expect, test } from "@playwright/test";

test("opponent pieces only appear inside the active sense result and hide afterward", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "white" }).click();
  await page.getByRole("button", { name: /start/i }).click();

  await expect(page.locator(".phase-message")).toHaveText("Your turn to sense");
  await expect(page.locator(".piece-black")).toHaveCount(0);

  await page.getByRole("button", { name: /^e7,/ }).click();
  await expect(page.locator(".phase-message")).toHaveText("Choose your move");

  const visibleOpponentCount = await page.locator(".piece-black").count();
  const highlightedOpponentCount = await page.locator(".board-square-highlighted .piece-black").count();
  expect(visibleOpponentCount).toBeGreaterThan(0);
  expect(visibleOpponentCount).toBe(highlightedOpponentCount);

  await page.getByRole("button", { name: "Pass" }).click();
  await expect(page.locator(".phase-message")).toHaveText("Your turn to sense");
  await expect(page.locator(".piece-black")).toHaveCount(0);
});
