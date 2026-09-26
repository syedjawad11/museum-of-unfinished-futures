import { ActionParamsInvalidError, type WorkflowInstance } from "@sanity/workflow-engine";
import {
  createBench,
  GuardDeniedError,
  subjectField,
} from "@sanity/workflow-engine-test";
import { describe, expect, it } from "vitest";
import { exhibitReview } from "./exhibit-review";

const T0 = "2026-09-26T10:00:00.000Z";
const artifact = {
  _id: "artifact.extra-mondays",
  _type: "artifact",
  title: "Extra Mondays Vending Machine",
};

async function startExhibitReview() {
  const bench = createBench({
    now: T0,
    documents: [artifact, { ...artifact, _id: `drafts.${artifact._id}` }],
  });

  await bench.deployDefinitions({
    expectedMinReaderModel: 10,
    definitions: [exhibitReview],
  });

  const { instance } = await bench.startInstance({
    definition: "exhibit-review",
    initialFields: [subjectField(artifact._id, { type: "artifact" })],
  });

  return { bench, instance };
}

function fieldValue(instance: WorkflowInstance, name: string) {
  return instance.fields.find((field) => field.name === name)?.value;
}

describe("exhibit review workflow", () => {
  it("drives the happy path from drafting to on-display", async () => {
    const { bench, instance } = await startExhibitReview();

    await bench.fireAction({
      instanceId: instance._id,
      activity: "draft",
      action: "submit",
    });
    expect(await bench.currentStage(instance._id)).toBe("curatorial-review");

    await bench.fireAction({
      instanceId: instance._id,
      activity: "review",
      action: "approve",
    });
    expect(await bench.currentStage(instance._id)).toBe("approved");

    const { instance: afterDisplay } = await bench.fireAction({
      instanceId: instance._id,
      activity: "display",
      action: "put-on-display",
    });
    expect(afterDisplay.currentStage).toBe("on-display");
    expect(afterDisplay.completedAt).toBeDefined();
  });

  it("requests changes with a reason, stores it, then allows resubmit and approval", async () => {
    const { bench, instance } = await startExhibitReview();

    await bench.fireAction({
      instanceId: instance._id,
      activity: "draft",
      action: "submit",
    });

    const { instance: sentBack } = await bench.fireAction({
      instanceId: instance._id,
      activity: "review",
      action: "request-changes",
      params: { reason: "Add accession context." },
    });

    expect(sentBack.currentStage).toBe("drafting");
    expect(fieldValue(sentBack, "changeRequestReason")).toBe(
      "Add accession context.",
    );
    expect(await bench.activityStatus(instance._id, "draft")).toBe("active");

    await bench.fireAction({
      instanceId: instance._id,
      activity: "draft",
      action: "submit",
    });
    const { instance: approved } = await bench.fireAction({
      instanceId: instance._id,
      activity: "review",
      action: "approve",
    });

    expect(approved.currentStage).toBe("approved");
  });

  it("refuses request-changes without a non-empty reason and stays in review", async () => {
    const { bench, instance } = await startExhibitReview();

    await bench.fireAction({
      instanceId: instance._id,
      activity: "draft",
      action: "submit",
    });

    await expect(
      bench.fireAction({
        instanceId: instance._id,
        activity: "review",
        action: "request-changes",
      }),
    ).rejects.toBeInstanceOf(ActionParamsInvalidError);
    expect(await bench.currentStage(instance._id)).toBe("curatorial-review");

    await expect(
      bench.fireAction({
        instanceId: instance._id,
        activity: "review",
        action: "request-changes",
        params: { reason: "" },
      }),
    ).rejects.toBeInstanceOf(ActionParamsInvalidError);
    expect(await bench.currentStage(instance._id)).toBe("curatorial-review");
  });

  it("does not allow approve or put-on-display from drafting", async () => {
    const { bench, instance } = await startExhibitReview();

    await expect(
      bench.fireAction({
        instanceId: instance._id,
        activity: "review",
        action: "approve",
      }),
    ).rejects.toThrow(/Activity "review" not found in current stage "drafting"/);

    await expect(
      bench.fireAction({
        instanceId: instance._id,
        activity: "display",
        action: "put-on-display",
      }),
    ).rejects.toThrow(/Activity "display" not found in current stage "drafting"/);

    expect(await bench.currentStage(instance._id)).toBe("drafting");
  });

  it("denies publishing in drafting and review, then allows publishing in approved", async () => {
    const { bench, instance } = await startExhibitReview();

    expect(
      (await bench.activeGuardsForDocument(artifact._id)).map(
        (guard) => guard.name,
      ),
    ).toEqual(["hold-publish-drafting"]);
    await expect(
      bench.editDocument({ documentId: artifact._id, action: "publish" }),
    ).rejects.toBeInstanceOf(GuardDeniedError);

    await bench.fireAction({
      instanceId: instance._id,
      activity: "draft",
      action: "submit",
    });
    expect(
      (await bench.activeGuardsForDocument(artifact._id)).map(
        (guard) => guard.name,
      ),
    ).toEqual(["hold-publish-review"]);
    await expect(
      bench.editDocument({ documentId: artifact._id, action: "publish" }),
    ).rejects.toBeInstanceOf(GuardDeniedError);

    await bench.fireAction({
      instanceId: instance._id,
      activity: "review",
      action: "approve",
    });
    expect(await bench.currentStage(instance._id)).toBe("approved");
    expect(await bench.activeGuardsForDocument(artifact._id)).toEqual([]);

    await expect(
      bench.editDocument({ documentId: artifact._id, action: "publish" }),
    ).resolves.toMatchObject({ _id: artifact._id, _type: "artifact" });
  });

  it("does not hold publishing forever after the terminal on-display stage", async () => {
    const { bench, instance } = await startExhibitReview();

    await bench.fireAction({
      instanceId: instance._id,
      activity: "draft",
      action: "submit",
    });
    await bench.fireAction({
      instanceId: instance._id,
      activity: "review",
      action: "approve",
    });
    await bench.fireAction({
      instanceId: instance._id,
      activity: "display",
      action: "put-on-display",
    });

    expect(await bench.currentStage(instance._id)).toBe("on-display");
    expect(await bench.activeGuardsForDocument(artifact._id)).toEqual([]);
  });
});
