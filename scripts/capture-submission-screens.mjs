// Read-only screenshots of the live site for the DEV post (T-021).
// Usage: node scripts/capture-submission-screens.mjs [baseUrl]
import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const baseUrl = (process.argv[2] ?? "https://museum-of-unfinished-futures.netlify.app").replace(/\/+$/, "");
const outDir = "evidence/T-021/screens";
const desktop = { width: 1280, height: 900 };
const phone = { width: 390, height: 844 };

const shots = [
  { file: "01-home-desktop.png", path: "/", viewport: desktop, heading: "Museum of Unfinished Futures" },
  {
    file: "03-switchboard-before-choice-desktop.png",
    path: "/exhibits/unfinished-conversations-switchboard",
    viewport: desktop,
    heading: "The Switchboard for Conversations That Ended Too Soon",
  },
  {
    file: "04-switchboard-after-choice-desktop.png",
    path: "/exhibits/unfinished-conversations-switchboard",
    viewport: desktop,
    click: "Answer the line that is still lit",
    heading: "A sentence resumes mid-word",
  },
  {
    file: "05-wing-desktop.png",
    path: "/eras/counterfactual-communications-boom",
    viewport: desktop,
  },
  {
    file: "06-ticket-desktop.png",
    path: "/your-future?trace=outcome-note-in-your-handwriting,outcome-afternoon-comes-indoors",
    viewport: desktop,
    heading: "Your Unfinished Future",
  },
  { file: "07-home-mobile.png", path: "/", viewport: phone, heading: "Museum of Unfinished Futures" },
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

try {
  for (const shot of shots) {
    const page = await browser.newPage({ viewport: shot.viewport });
    const response = await page.goto(`${baseUrl}${shot.path}`, { waitUntil: "networkidle" });
    if (!response || response.status() !== 200) {
      throw new Error(`${shot.path} answered ${response?.status()}`);
    }
    if (shot.click) {
      await page.getByRole("link", { name: shot.click, exact: true }).click();
      await page.waitForLoadState("networkidle");
    }
    if (shot.heading) {
      await page.getByRole("heading", { name: shot.heading }).first().waitFor();
    }
    await page.screenshot({ path: `${outDir}/${shot.file}`, fullPage: true });
    console.log(`✓ ${shot.file}  ${page.url()}`);
    await page.close();
  }
} finally {
  await browser.close();
}
