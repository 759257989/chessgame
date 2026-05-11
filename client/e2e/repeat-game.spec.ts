import { expect, test } from "@playwright/test";

function isCreateGameResponse(url: string) {
  return url.endsWith("/api/games");
}

test("repeat game starts a fresh game with the same setup during play and after game over", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "black" }).click();
  await expect(page.getByLabel("Bot")).toBeEnabled();
  await page.getByLabel("Bot").selectOption("attacker");
  await page.getByRole("button", { name: "15:00 strict" }).click();

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
  expect(repeatDuringGameBody.timer).toEqual({ initial_seconds: 900, increment_seconds: 0 });
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
