import { expect, test } from "@playwright/test";

const exhibits = [
  {
    title: "The Telephone for Calling Roads Not Taken",
    path: "/exhibits/roads-not-taken-telephone",
    choices: [
      ["Call the life you declined", "A familiar stranger answers"],
      ["Hang up before it rings", "A missed call arrives from you"],
    ],
  },
  {
    title: "The Umbrella That Remembers Every Storm",
    path: "/exhibits/memory-umbrella",
    choices: [
      ["Open it indoors", "The room rains back"],
      ["Leave it furled", "The forecast forgets your name"],
    ],
  },
  {
    title: "The Vending Machine That Sells Extra Mondays",
    path: "/exhibits/extra-mondays-vending-machine",
    choices: [
      ["Spend a plan", "A paper Monday drops"],
      ["Keep the weekend intact", "The machine keeps humming"],
    ],
  },
] as const;

for (const exhibit of exhibits) {
  test(`${exhibit.title} exposes both published outcomes`, async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Museum of Unfinished Futures" }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: new RegExp(exhibit.title) })
      .click();

    await expect(page).toHaveURL(new RegExp(`${exhibit.path}$`));
    await expect(
      page.getByRole("heading", { name: exhibit.title }),
    ).toBeVisible();

    for (const [choice, outcome] of exhibit.choices) {
      await page.getByRole("link", { name: choice, exact: true }).click();
      await expect(page.getByText("Linked outcome")).toBeVisible();
      await expect(page.getByRole("heading", { name: outcome })).toBeVisible();
      await page.goto(exhibit.path);
    }

    await page.getByRole("link", { name: "Back to the hall" }).click();
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: exhibit.title }),
    ).toBeVisible();
  });
}

const vendingMachine = exhibits[2];

test("invalid choice shows a safe unavailable state", async ({ page }) => {
  await page.goto(`${vendingMachine.path}?choice=not-a-published-choice`);

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

  const umbrella = exhibits[1];
  await expect(
    page.getByRole("heading", { name: umbrella.title }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: new RegExp(umbrella.title) })
    .click();
  await page.getByRole("link", { name: "Leave it furled" }).click();

  await expect(
    page.getByRole("heading", { name: "The forecast forgets your name" }),
  ).toBeVisible();
});
