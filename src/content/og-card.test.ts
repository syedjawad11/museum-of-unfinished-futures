import { describe, expect, it } from "vitest";
import { SITE_TITLE, buildFullTitle, trimDescription } from "./og-card";

describe("trimDescription", () => {
  it("returns short text unchanged", () => {
    expect(trimDescription("A short summary.")).toBe("A short summary.");
  });

  it("trims surrounding whitespace even when under the limit", () => {
    expect(trimDescription("  padded  ")).toBe("padded");
  });

  it("never exceeds the max length", () => {
    const long = "word ".repeat(60).trim();
    const result = trimDescription(long);

    expect(result.length).toBeLessThanOrEqual(160);
  });

  it("cuts on a word boundary rather than mid-word", () => {
    const long =
      "An operator's switchboard once routed calls to conversations that had ended mid-sentence, reconnecting both parties at the exact word where they stopped. Operators wore two headsets and were trained never to finish anyone's sentence for them.";
    const result = trimDescription(long);

    expect(result.length).toBeLessThanOrEqual(160);
    expect(result.endsWith("…")).toBe(true);
    // The character right before the ellipsis should not be mid-word: the
    // text up to the ellipsis, with the ellipsis removed, must match a
    // clean prefix of the original string ending exactly at a space or the
    // original string's own boundary.
    const withoutEllipsis = result.slice(0, -1);
    expect(long.startsWith(withoutEllipsis)).toBe(true);
    const nextChar = long[withoutEllipsis.length];
    expect(nextChar === " " || nextChar === undefined).toBe(true);
  });

  it("respects a custom max length", () => {
    const result = trimDescription("one two three four five", 10);

    expect(result.length).toBeLessThanOrEqual(10);
    expect(result.endsWith("…")).toBe(true);
  });
});

describe("buildFullTitle", () => {
  it("appends the site title with an em dash", () => {
    expect(buildFullTitle("Your Unfinished Future")).toBe(
      `Your Unfinished Future — ${SITE_TITLE}`,
    );
  });
});
