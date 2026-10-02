import { expect, test } from "@playwright/test";

/**
 * Covers the three exhibits proposed in docs/content/new-exhibits.json,
 * live in Sanity since Sep 23 (T-011). Titles, slugs, choice labels,
 * outcome titles, leadsTo targets, and newTagPhrases below are taken
 * directly from that file.
 */

const newExhibits = [
  {
    title: "The Toaster That Prints Notes From Your Future Self",
    path: "/exhibits/future-self-toaster",
    choices: [
      {
        label: "Read the note while it is warm",
        outcome: "The note is in your handwriting",
        continues: "The Kettle That Brews the Weather of Past Visits",
      },
      {
        label: "Butter it without reading",
        outcome: "The message goes under the butter",
        continues: "The Switchboard for Conversations That Ended Too Soon",
      },
    ],
  },
  {
    title: "The Switchboard for Conversations That Ended Too Soon",
    path: "/exhibits/unfinished-conversations-switchboard",
    choices: [
      {
        label: "Answer the line that is still lit",
        outcome: "A sentence resumes mid-word",
        continues: "The Umbrella That Remembers Every Storm",
      },
      {
        label: "Pull every cord at once",
        outcome: "The exchange goes quiet",
        continues: "The Vending Machine That Sells Extra Mondays",
      },
      {
        label: "Plug a cord into the blank jack",
        outcome: "The blank jack rings back",
        continues: "The Toaster That Prints Notes From Your Future Self",
      },
    ],
  },
  {
    title: "The Kettle That Brews the Weather of Past Visits",
    path: "/exhibits/weather-of-visits-kettle",
    choices: [
      {
        label: "Put the kettle on",
        outcome: "An afternoon comes back indoors",
        continues: "The Switchboard for Conversations That Ended Too Soon",
      },
      {
        label: "Leave it on the trivet",
        outcome: "The kettle stays cold",
        continues: "The Telephone for Calling Roads Not Taken",
      },
    ],
  },
] as const;

const wings = [
  {
    title: "The Civic Time Expansion Era",
    slug: "civic-time-expansion-era",
    exhibitA: "The Toaster That Prints Notes From Your Future Self",
    exhibitB: "The Vending Machine That Sells Extra Mondays",
  },
  {
    title: "The Counterfactual Communications Boom",
    slug: "counterfactual-communications-boom",
    exhibitA: "The Switchboard for Conversations That Ended Too Soon",
    exhibitB: "The Telephone for Calling Roads Not Taken",
  },
  {
    title: "The Domestic Weather Memory Era",
    slug: "domestic-weather-memory-era",
    exhibitA: "The Kettle That Brews the Weather of Past Visits",
    exhibitB: "The Umbrella That Remembers Every Storm",
  },
] as const;

// The three doors rewired (T-011a) to lead into the new exhibits instead of
// their previous destinations.
const rewiredDoors = [
  {
    exhibitTitle: "The Telephone for Calling Roads Not Taken",
    path: "/exhibits/roads-not-taken-telephone",
    choiceLabel: "Hang up before it rings",
    outcomeTitle: "A missed call arrives from you",
    continues: "The Toaster That Prints Notes From Your Future Self",
  },
  {
    exhibitTitle: "The Vending Machine That Sells Extra Mondays",
    path: "/exhibits/extra-mondays-vending-machine",
    choiceLabel: "Keep the weekend intact",
    outcomeTitle: "The machine keeps humming",
    continues: "The Kettle That Brews the Weather of Past Visits",
  },
  {
    exhibitTitle: "The Umbrella That Remembers Every Storm",
    path: "/exhibits/memory-umbrella",
    choiceLabel: "Open it indoors",
    outcomeTitle: "The room rains back",
    continues: "The Switchboard for Conversations That Ended Too Soon",
  },
] as const;

// The Acquisitions Clerk (T-018) adds reviewed exhibits, so counts are floors.
test("home lists the six curated exhibits; each wing shows at least its two", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Museum of Unfinished Futures" }),
  ).toBeVisible();
  expect(await page.locator('a[href^="/exhibits/"]').count()).toBeGreaterThanOrEqual(6);

  for (const wing of wings) {
    const heading = page.getByRole("heading", { name: wing.title, level: 2 });
    const section = page.locator("section", { has: heading });

    await expect(
      section.getByRole("heading", { name: wing.exhibitA }),
    ).toBeVisible();
    await expect(
      section.getByRole("heading", { name: wing.exhibitB }),
    ).toBeVisible();
    expect(await section.locator('a[href^="/exhibits/"]').count()).toBeGreaterThanOrEqual(2);
  }
});

for (const exhibit of newExhibits) {
  test(`${exhibit.title} renders its title, a Sanity plate, and exactly ${exhibit.choices.length} choices`, async ({
    page,
  }) => {
    await page.goto(exhibit.path);

    await expect(
      page.getByRole("heading", { name: exhibit.title, level: 1 }),
    ).toBeVisible();
    await expect(
      page.locator('[data-plate-source="sanity"]').first(),
    ).toBeVisible();

    const choiceLinks = page.locator('a[href*="?choice="]');
    await expect(choiceLinks).toHaveCount(exhibit.choices.length);

    for (const choice of exhibit.choices) {
      await expect(
        page.getByRole("link", { name: choice.label, exact: true }),
      ).toBeVisible();
    }
  });
}

for (const exhibit of newExhibits) {
  for (const choice of exhibit.choices) {
    test(`${exhibit.title} → "${choice.label}" shows its outcome and a continue link`, async ({
      page,
    }) => {
      await page.goto(exhibit.path);
      await page
        .getByRole("link", { name: choice.label, exact: true })
        .click();

      await expect(
        page.getByRole("heading", { name: choice.outcome }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: `Continue to ${choice.continues}` }),
      ).toBeVisible();
    });
  }
}

for (const door of rewiredDoors) {
  test(`the rewired door "${door.choiceLabel}" on ${door.exhibitTitle} now leads to ${door.continues}`, async ({
    page,
  }) => {
    await page.goto(door.path);
    await page
      .getByRole("link", { name: door.choiceLabel, exact: true })
      .click();

    await expect(
      page.getByRole("heading", { name: door.outcomeTitle }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: `Continue to ${door.continues}` }),
    ).toBeVisible();
  });
}

test("walking a new exhibit then printing a ticket surfaces a new tag phrase, with no undefined or doubled words", async ({
  page,
}) => {
  await page.goto("/exhibits/future-self-toaster");
  await page
    .getByRole("link", { name: "Read the note while it is warm", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "The note is in your handwriting" }),
  ).toBeVisible();

  await page
    .getByRole("link", { name: "Print your ticket for this trace" })
    .click();

  await expect(page).toHaveURL(
    /\/your-future\?trace=outcome-note-in-your-handwriting$/,
  );
  await expect(
    page.getByRole("heading", { name: "Your Unfinished Future" }),
  ).toBeVisible();

  const ticket = page.getByRole("region", { name: "Your printed ticket" });
  const ticketText = await ticket.innerText();

  // newTagPhrases for outcome-note-in-your-handwriting
  // (docs/content/new-exhibits.json).
  expect(ticketText).toMatch(
    /advised in advance by someone who writes like you|with one Thursday already rearranged/,
  );
  expect(ticketText.toLowerCase()).not.toContain("undefined");
  expect(ticketText).not.toMatch(/\b(\w+)\s+\1\b/i);
});

for (const wing of wings) {
  test(`the ${wing.title} wing page lists at least its two exhibits`, async ({
    page,
  }) => {
    await page.goto(`/eras/${wing.slug}`);

    await expect(
      page.getByRole("heading", { name: wing.title, level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: wing.exhibitA, level: 2 }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: wing.exhibitB, level: 2 }),
    ).toBeVisible();
    expect(await page.locator('a[href^="/exhibits/"]').count()).toBeGreaterThanOrEqual(2);
  });
}

// --- Screenshots (evidence/T-011/screens/) ------------------------------
// Desktop 1280x900 full page, plus one mobile 390x844.

test.describe("screenshots", () => {
  test("desktop: home", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Museum of Unfinished Futures" }),
    ).toBeVisible();
    await page.screenshot({
      path: "evidence/T-011/screens/01-home-desktop-1280x900.png",
      fullPage: true,
    });
  });

  test("desktop: toaster after choosing an option", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/exhibits/future-self-toaster");
    await page
      .getByRole("link", { name: "Read the note while it is warm", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "The note is in your handwriting" }),
    ).toBeVisible();
    await page.screenshot({
      path: "evidence/T-011/screens/02-toaster-after-choice-desktop-1280x900.png",
      fullPage: true,
    });
  });

  test("desktop: switchboard before choosing", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/exhibits/unfinished-conversations-switchboard");
    await expect(
      page.getByRole("heading", {
        name: "The Switchboard for Conversations That Ended Too Soon",
      }),
    ).toBeVisible();
    await page.screenshot({
      path: "evidence/T-011/screens/03-switchboard-before-choice-desktop-1280x900.png",
      fullPage: true,
    });
  });

  test("desktop: switchboard after choosing an option", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/exhibits/unfinished-conversations-switchboard");
    await page
      .getByRole("link", { name: "Answer the line that is still lit", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "A sentence resumes mid-word" }),
    ).toBeVisible();
    await page.screenshot({
      path: "evidence/T-011/screens/04-switchboard-after-choice-desktop-1280x900.png",
      fullPage: true,
    });
  });

  test("desktop: kettle after choosing an option", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/exhibits/weather-of-visits-kettle");
    await page
      .getByRole("link", { name: "Put the kettle on", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "An afternoon comes back indoors" }),
    ).toBeVisible();
    await page.screenshot({
      path: "evidence/T-011/screens/05-kettle-after-choice-desktop-1280x900.png",
      fullPage: true,
    });
  });

  test("desktop: a ticket page", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(
      "/your-future?trace=outcome-note-in-your-handwriting,outcome-afternoon-comes-indoors",
    );
    await expect(
      page.getByRole("heading", { name: "Your Unfinished Future" }),
    ).toBeVisible();
    await page.screenshot({
      path: "evidence/T-011/screens/06-ticket-desktop-1280x900.png",
      fullPage: true,
    });
  });

  test("mobile: home", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Museum of Unfinished Futures" }),
    ).toBeVisible();
    await page.screenshot({
      path: "evidence/T-011/screens/07-home-mobile-390x844.png",
      fullPage: true,
    });
  });
});
