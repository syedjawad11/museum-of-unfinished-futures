import { useClient } from "@sanity/sdk-react";
import { Badge, Box, Button, Card, Flex, Stack, Text, TextArea } from "@sanity/ui";
import {
  actionRendering,
  type ActionEvaluation,
  type WorkflowInstance,
} from "@sanity/workflow-engine";
import { useWorkflowEngine, useWorkflowSession } from "@sanity/workflow-sdk";
import { useState } from "react";
import {
  reviewWrite,
  syncReviewFromWorkflow,
} from "../../../src/agents/acquisitions-clerk/sync";
import {
  getArtifactReviewId,
  type ArtifactReview,
} from "../../../src/domain/artifact-review";
import { DATASET, PROJECT_ID } from "./App";

const API_VERSION = "2026-09-20";
const workflowResource = { type: "dataset", id: `${PROJECT_ID}.${DATASET}` } as const;

/**
 * The live Exhibit review run for one exhibit. Buttons come from the engine's
 * own evaluation for the signed-in curator, so an action the curator may not
 * take is not offered. After every move the custom review gate is brought in
 * line, the same way the Acquisitions Clerk's `sync` does.
 */
export function WorkflowPanel({
  instanceId,
  artifactId,
}: {
  instanceId: string;
  artifactId: string;
}) {
  const engine = useWorkflowEngine({ workflowResource, tag: "production" });
  const session = useWorkflowSession({ engine, instanceId });
  const client = useClient({ apiVersion: API_VERSION });
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "positive" | "critical"; text: string }>();

  if (session.invalid) return <Text>This run can&apos;t be read: {session.invalid.reason}</Text>;
  if (session.error) return <Text>Could not load the run: {errorText(session.error)}</Text>;
  if (session.evaluationError) {
    return <Text>Could not evaluate the run: {errorText(session.evaluationError)}</Text>;
  }
  if (!session.ready || !session.evaluation) return <Text muted>Loading the run…</Text>;

  const { instance, currentStage } = session.evaluation;
  const submittedBy = fieldValue(instance, "submittedBy") as { id?: string } | undefined;
  const changeReason = fieldValue(instance, "changeRequestReason");

  async function syncGate(after: WorkflowInstance) {
    const draft = await client.getDocument<{ _rev: string }>(`drafts.${artifactId}`);
    const review =
      (await client.getDocument<ArtifactReview & { _rev: string }>(
        getArtifactReviewId(artifactId),
      )) ?? null;
    const result = syncReviewFromWorkflow({
      artifactId,
      workflow: {
        stage: after.currentStage,
        reviewDecision: asText(fieldValue(after, "reviewDecision")),
        changeRequestReason: asText(fieldValue(after, "changeRequestReason")),
      },
      review,
      draftRevision: draft?._rev,
      now: new Date().toISOString(),
    });

    if (!result.ok) throw new Error(`the review gate refused: ${result.code}`);
    if (result.status === "noop" || !result.review) return;

    const write = reviewWrite(result.review, review);
    if (write.kind === "create") await client.create(write.document);
    else
      await client
        .patch(write.id)
        .ifRevisionId(write.ifRevisionId)
        .set(write.set)
        .unset(write.unset)
        .commit();
  }

  async function fire(activity: string, action: ActionEvaluation) {
    setBusy(true);
    setMessage(undefined);
    try {
      const needsReason = action.action.params?.some((param) => param.name === "reason");
      const result = await session.fireAction({
        activity,
        action: action.action.name,
        ...(needsReason ? { params: { reason: reason.trim() } } : {}),
      });
      await syncGate(result.instance);
      setReason("");
      setMessage({
        tone: "positive",
        text: `${action.action.title ?? action.action.name} done. Now: ${result.instance.currentStage}.`,
      });
    } catch (error) {
      setMessage({ tone: "critical", text: errorText(error) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack gap={4}>
      <Flex gap={2} align="center">
        <Text size={1} muted>
          Exhibit review
        </Text>
        <Badge tone="primary">{currentStage.stage.title ?? currentStage.stage.name}</Badge>
      </Flex>

      {submittedBy?.id ? (
        <Text size={1} muted>
          Last submitted by {submittedBy.id.startsWith("p") ? "a robot token" : "a person"} ({submittedBy.id})
        </Text>
      ) : null}
      {typeof changeReason === "string" && changeReason ? (
        <Card padding={3} radius={2} tone="caution">
          <Text size={1}>Last change request: “{changeReason}”</Text>
        </Card>
      ) : null}

      {currentStage.activities.map((activity) => {
        const buttons = activity.actions.filter(
          (action) => actionRendering(action) === "button",
        );
        if (buttons.length === 0) return null;
        const takesReason = buttons.some((action) =>
          action.action.params?.some((param) => param.name === "reason"),
        );

        return (
          <Stack key={activity.activity.name} gap={3}>
            <Text size={1} weight="semibold">
              {activity.activity.title ?? activity.activity.name}
            </Text>
            {takesReason ? (
              <TextArea
                rows={3}
                placeholder="What should change? (needed for Request changes)"
                value={reason}
                onChange={(event) => setReason(event.currentTarget.value)}
              />
            ) : null}
            <Flex gap={2} wrap="wrap">
              {buttons.map((action) => {
                const needsReason = action.action.params?.some((param) => param.name === "reason");
                return (
                  <Button
                    key={action.action.name}
                    text={action.action.title ?? action.action.name}
                    tone={action.action.name === "request-changes" ? "critical" : "primary"}
                    mode={action.action.name === "request-changes" ? "ghost" : "default"}
                    disabled={busy || !action.allowed || (needsReason && !reason.trim())}
                    title={action.disabledReason?.kind}
                    onClick={() => fire(activity.activity.name, action)}
                  />
                );
              })}
            </Flex>
          </Stack>
        );
      })}

      {message ? (
        <Card padding={3} radius={2} tone={message.tone}>
          <Text size={1}>{message.text}</Text>
        </Card>
      ) : null}

      <Box>
        <Text size={0} muted>
          Publishing stays in Studio or the curator&apos;s publish command, behind the
          revision-pinned review gate.
        </Text>
      </Box>
    </Stack>
  );
}

function fieldValue(instance: WorkflowInstance, name: string): unknown {
  return instance.fields.find((field) => field.name === name)?.value;
}

function asText(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
