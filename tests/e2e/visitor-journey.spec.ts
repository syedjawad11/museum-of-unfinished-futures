import { expect, test } from "@playwright/test";

const exhibitTitle = "The Vending Machine That Sells Extra Mondays";
const exhibitPath = "/exhibits/extra-mondays-vending-machine";

test("visitor can enter an exhibit, reveal an outcome, and return", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Museum of Unfinished Futures" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Enter exhibit" }).click();

  await expect(page).toHaveURL(new RegExp(`${exhibitPath}$`));
  await expect(page.getByRole("heading", { name: exhibitTitle })).toBeVisible();

  await page.getByRole("link", { name: "Spend a plan" }).click();

  await expect(page.getByText("Linked outcome")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A paper Monday drops" }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Back to gallery" }).click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: exhibitTitle })).toBeVisible();
});

test("invalid choice shows a safe unavailable state", async ({ page }) => {
  await page.goto(`${exhibitPath}?choice=not-a-published-choice`);

  await expect(page.getByText("Choice unavailable")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "No linked outcome exists." }),
  ).toBeVisible();
});

test("missing exhibit returns a noindex 404", async ({ page }) => {
  const response = await page.goto("/exhibits/does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  );
});

test("visitor journey remains usable at a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(page.getByRole("heading", { name: exhibitTitle })).toBeVisible();
  await page.getByRole("link", { name: "Enter exhibit" }).click();
  await page.getByRole("link", { name: "Keep the weekend intact" }).click();

  await expect(
    page.getByRole("heading", { name: "The machine keeps humming" }),
  ).toBeVisible();
});
