import { expect, test } from "@playwright/test";

function isCreateGameResponse(url: string) {
  return url.endsWith("/api/games");
}

test("repeat game starts a fresh game with the same setup during play and after game over", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "black" }).click();
  await page.getByLabel("Bot").selectOption("attacker");

  const firstCreate = page.waitForResponse(
    (response) => isCreateGameResponse(response.url()) && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: /start/i }).click();
  const firstRequestBody = JSON.parse((await firstCreate).request().postData() ?? "{}");
  await expect(page.locator(".phase-message")).toHaveText("Your turn to sense");

  const repeatDuringGame = page.waitForResponse(
    (response) => isCreateGameResponse(response.url()) && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Repeat game" }).click();
  const repeatDuringGameBody = JSON.parse((await repeatDuringGame).request().postData() ?? "{}");

  expect(repeatDuringGameBody).toEqual(firstRequestBody);
  await expect(page.locator(".phase-message")).toHaveText("Your turn to sense");

  await page.getByRole("button", { name: "Resign" }).click();
  await expect(page.locator(".phase-message")).toHaveText("You resigned.");

  const repeatAfterGameOver = page.waitForResponse(
    (response) => isCreateGameResponse(response.url()) && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Repeat game" }).click();
  const repeatAfterGameOverBody = JSON.parse((await repeatAfterGameOver).request().postData() ?? "{}");

  expect(repeatAfterGameOverBody).toEqual(firstRequestBody);
  await expect(page.locator(".phase-message")).toHaveText("Your turn to sense");
});
