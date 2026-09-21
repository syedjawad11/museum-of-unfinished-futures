import { describe, expect, it } from "vitest";
import { getValidationDisabledReason } from "./publish-validation";

describe("publish validation guard", () => {
  it("blocks while validation is running or stale for the current draft", () => {
    expect(
      getValidationDisabledReason({
        draftRevision: "draft-rev-2",
        isValidating: true,
        validatedRevision: "draft-rev-1",
        markers: [],
      }),
    ).toBe("Validation is in progress.");

    expect(
      getValidationDisabledReason({
        draftRevision: "draft-rev-2",
        isValidating: false,
        validatedRevision: "draft-rev-1",
        markers: [],
      }),
    ).toBe("Waiting for current draft validation.");
  });

  it("blocks validation errors but permits warnings on the current draft", () => {
    expect(
      getValidationDisabledReason({
        draftRevision: "draft-rev-2",
        isValidating: false,
        validatedRevision: "draft-rev-2",
        markers: [{ level: "error" }],
      }),
    ).toBe("Fix validation errors before publishing.");

    expect(
      getValidationDisabledReason({
        draftRevision: "draft-rev-2",
        isValidating: false,
        validatedRevision: "draft-rev-2",
        markers: [{ level: "warning" }],
      }),
    ).toBeUndefined();
  });
});
