import { describe, expect, it } from "vitest";
import {
  assertClerkMayFire,
  ClerkRefusalError,
  decideNextMove,
  HUMAN_ONLY_ACTIONS,
} from "./decide";

describe("assertClerkMayFire", () => {
  it("allows submit", () => {
    expect(() => assertClerkMayFire("submit")).not.toThrow();
  });

  it.each(HUMAN_ONLY_ACTIONS)("refuses %s", (action) => {
    expect(() => assertClerkMayFire(action)).toThrow(ClerkRefusalError);
  });

  it("refuses anything it does not know", () => {
    expect(() => assertClerkMayFire("publish")).toThrow(ClerkRefusalError);
  });
});

describe("decideNextMove", () => {
  const view = (
    stage: string | undefined,
    reviewDecision: string | null = null,
    changeRequestReason: string | null = null,
  ) => ({ stage, reviewDecision, changeRequestReason });

  it("starts a run when there is none", () => {
    expect(decideNextMove(view(undefined))).toEqual({ kind: "start-and-submit" });
  });

  it("submits a fresh draft", () => {
    expect(decideNextMove(view("drafting"))).toEqual({ kind: "submit" });
  });

  it("revises after a curator requests changes, carrying the reason", () => {
    expect(
      decideNextMove(view("drafting", "request-changes", "  Make it quieter. ")),
    ).toEqual({ kind: "revise", reason: "Make it quieter." });
  });

  it("waits rather than guessing when a change request has no reason", () => {
    expect(decideNextMove(view("drafting", "request-changes", " "))).toMatchObject({
      kind: "wait",
    });
  });

  it.each(["curatorial-review", "approved", "on-display", "something-new"])(
    "never acts in %s",
    (stage) => {
      expect(decideNextMove(view(stage, "approve"))).toMatchObject({ kind: "wait" });
    },
  );
});
