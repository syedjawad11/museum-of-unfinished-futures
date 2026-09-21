type ValidationMarkerLike = {
  level: "error" | "warning" | "info";
};

type PublishValidationStatus = {
  draftRevision: string | undefined;
  isValidating: boolean;
  validatedRevision: string | undefined;
  markers: ValidationMarkerLike[];
};

export function getValidationDisabledReason({
  draftRevision,
  isValidating,
  validatedRevision,
  markers,
}: PublishValidationStatus): string | undefined {
  if (!draftRevision) {
    return "Draft revision is missing.";
  }

  if (isValidating) {
    return "Validation is in progress.";
  }

  if (validatedRevision !== draftRevision) {
    return "Waiting for current draft validation.";
  }

  if (markers.some((marker) => marker.level === "error")) {
    return "Fix validation errors before publishing.";
  }

  return undefined;
}
