// What the Clerk may do next in an exhibit-review run. The Clerk only ever
// fires `submit`; deciding and displaying belong to a human curator. The
// workflow definition says the same with `roles`, but those checks are
// advisory, so the Clerk refuses in its own code as well.

export const CLERK_ACTIONS = ["submit"] as const;
export const HUMAN_ONLY_ACTIONS = [
  "request-changes",
  "approve",
  "put-on-display",
] as const;

export class ClerkRefusalError extends Error {
  constructor(readonly action: string) {
    super(
      `The Acquisitions Clerk does not fire "${action}". Only a human curator may ${
        action === "submit" ? "do that" : "request changes, approve or put an exhibit on display"
      }.`,
    );
    this.name = "ClerkRefusalError";
  }
}

export function assertClerkMayFire(action: string): asserts action is "submit" {
  if (!(CLERK_ACTIONS as readonly string[]).includes(action)) {
    throw new ClerkRefusalError(action);
  }
}

export type WorkflowView = {
  stage: string | undefined;
  reviewDecision: string | null | undefined;
  changeRequestReason: string | null | undefined;
};

export type ClerkMove =
  | { kind: "start-and-submit" }
  | { kind: "submit" }
  | { kind: "revise"; reason: string }
  | { kind: "wait"; why: string };

export function decideNextMove(view: WorkflowView): ClerkMove {
  switch (view.stage) {
    case undefined:
      return { kind: "start-and-submit" };
    case "drafting": {
      if (view.reviewDecision === "request-changes") {
        const reason = view.changeRequestReason?.trim();
        return reason
          ? { kind: "revise", reason }
          : { kind: "wait", why: "Changes were requested without a reason." };
      }
      return { kind: "submit" };
    }
    case "curatorial-review":
      return { kind: "wait", why: "Waiting for a curator to review the draft." };
    case "approved":
      return {
        kind: "wait",
        why: "Approved. A curator publishes the endings and the exhibit.",
      };
    case "on-display":
      return { kind: "wait", why: "Already on display. Nothing left for the Clerk." };
    default:
      return { kind: "wait", why: `Unknown stage "${view.stage}".` };
  }
}
