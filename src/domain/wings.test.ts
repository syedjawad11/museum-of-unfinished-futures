import { describe, expect, it } from "vitest";
import {
  caseCountLabel,
  isWingCurrent,
  romanNumeralForPosition,
  wingSubtitle,
  wrapWingLabel,
} from "./wings";

describe("romanNumeralForPosition", () => {
  it("returns I, II, III for the first three wings", () => {
    expect(romanNumeralForPosition(1)).toBe("I");
    expect(romanNumeralForPosition(2)).toBe("II");
    expect(romanNumeralForPosition(3)).toBe("III");
  });

  it("keeps converting correctly past ten", () => {
    expect(romanNumeralForPosition(4)).toBe("IV");
    expect(romanNumeralForPosition(9)).toBe("IX");
    expect(romanNumeralForPosition(12)).toBe("XII");
  });

  it("throws for a non-positive or non-integer position", () => {
    expect(() => romanNumeralForPosition(0)).toThrow();
    expect(() => romanNumeralForPosition(-1)).toThrow();
    expect(() => romanNumeralForPosition(1.5)).toThrow();
  });
});

describe("caseCountLabel", () => {
  it("singularises exactly one case", () => {
    expect(caseCountLabel(1)).toBe("1 CASE");
  });

  it("pluralises every other count, including zero", () => {
    expect(caseCountLabel(0)).toBe("0 CASES");
    expect(caseCountLabel(3)).toBe("3 CASES");
  });
});

describe("wingSubtitle", () => {
  it("combines the roman numeral and the case count wording", () => {
    expect(wingSubtitle(1, 1)).toBe("WING I · 1 CASE");
    expect(wingSubtitle(2, 3)).toBe("WING II · 3 CASES");
    expect(wingSubtitle(3, 0)).toBe("WING III · 0 CASES");
  });
});

describe("isWingCurrent", () => {
  it("is true only when the slugs match and a current slug is given", () => {
    expect(
      isWingCurrent("civic-time-expansion-era", "civic-time-expansion-era"),
    ).toBe(true);
    expect(
      isWingCurrent(
        "civic-time-expansion-era",
        "domestic-weather-memory-era",
      ),
    ).toBe(false);
    expect(isWingCurrent("civic-time-expansion-era", undefined)).toBe(false);
    expect(isWingCurrent("civic-time-expansion-era", null)).toBe(false);
  });
});

describe("wrapWingLabel", () => {
  it("wraps a title that fits across two lines with no words lost", () => {
    expect(wrapWingLabel("The Civic Time Expansion Era")).toEqual([
      "The Civic Time",
      "Expansion Era",
    ]);
  });

  it("wraps a title that exactly fills all three lines with no words lost", () => {
    expect(wrapWingLabel("The Domestic Weather Memory Era")).toEqual([
      "The Domestic",
      "Weather Memory",
      "Era",
    ]);
  });

  it("marks the last line with an ellipsis instead of silently dropping words that overflow maxLines", () => {
    expect(wrapWingLabel("The Counterfactual Communications Boom")).toEqual([
      "The",
      "Counterfactual",
      "Communications…",
    ]);
  });

  it("returns no lines for an empty title", () => {
    expect(wrapWingLabel("")).toEqual([]);
  });

  it("returns no lines for a whitespace-only title", () => {
    expect(wrapWingLabel("   \n\t  ")).toEqual([]);
  });

  it("returns a single line for a one-word title that fits", () => {
    expect(wrapWingLabel("Toaster")).toEqual(["Toaster"]);
  });

  it("normalises internal whitespace before wrapping", () => {
    expect(wrapWingLabel("The   Civic    Time   Expansion   Era")).toEqual([
      "The Civic Time",
      "Expansion Era",
    ]);
  });

  it("hard-truncates a single word longer than the line limit instead of overflowing it", () => {
    const lines = wrapWingLabel("Supercalifragilisticexpialidocious");

    expect(lines).toHaveLength(1);
    expect(lines[0].endsWith("…")).toBe(true);
    expect(lines[0].length).toBeLessThanOrEqual(15);
  });
});
