import type { ArtifactReview } from "../../../src/domain/artifact-review";
import { useQuery } from "@sanity/sdk-react";
import { Badge, Box, Card, Flex, Grid, Heading, Stack, Text } from "@sanity/ui";
import { Suspense, useState } from "react";
import { buildDeskRows, type DeskRow, type RawArtifact, type RawInstance } from "./desk";
import { WorkflowPanel } from "./WorkflowPanel";

const SITE_URL = "https://museum-of-unfinished-futures.netlify.app";

// Drafts and published documents together (raw perspective), so the desk can
// show exhibits nobody has published yet, such as the Clerk's proposals.
const DESK_QUERY = `{
  "artifacts": *[_type == "artifact"]{
    _id, _rev, title, "slug": slug.current, "wing": era->title,
    "hasImage": defined(image.asset), "hasAlt": defined(image.alt) && image.alt != "",
    "choices": choices[]{label, "outcomeId": outcome._ref}
  },
  "reviews": *[_type == "artifactReview"],
  "outcomeIds": *[_type == "outcome"]._id,
  "instances": *[_type == "sanity.workflow.instance" && tag == "production" && definition == "exhibit-review"]{
    _id, _createdAt, currentStage, completedAt, fields[]{name, value}
  }
}`;

type DeskData = {
  artifacts: RawArtifact[];
  reviews: ArtifactReview[];
  outcomeIds: string[];
  instances: RawInstance[];
};

export function CuratorsDesk() {
  const { data, isPending } = useQuery<DeskData>({ query: DESK_QUERY, perspective: "raw" });
  const rows = buildDeskRows(data);
  const [selectedId, setSelectedId] = useState<string | undefined>(rows[0]?.id);
  const selected = rows.find((row) => row.id === selectedId);

  return (
    <Box padding={[3, 4, 5]}>
      <Stack gap={5}>
        <Stack gap={3}>
          <Heading as="h1" size={3}>
            Curator&apos;s Desk
          </Heading>
          <Text muted size={1}>
            Museum of Unfinished Futures · every exhibit, its endings, its plate and where it is in
            Exhibit review. {isPending ? "Refreshing…" : `${rows.length} exhibits.`}
          </Text>
        </Stack>

        <Grid gridTemplateColumns={[1, 1, 2]} gap={4}>
          <Stack gap={2}>
            {rows.map((row) => (
              <ExhibitRow
                key={row.id}
                row={row}
                selected={row.id === selectedId}
                onSelect={() => setSelectedId(row.id)}
              />
            ))}
          </Stack>

          <Card padding={4} radius={3} border tone="transparent">
            {selected ? (
              <Suspense fallback={<Text muted>Loading the workflow…</Text>}>
                <ExhibitDetail row={selected} />
              </Suspense>
            ) : (
              <Text muted>Choose an exhibit.</Text>
            )}
          </Card>
        </Grid>
      </Stack>
    </Box>
  );
}

function ExhibitRow({
  row,
  selected,
  onSelect,
}: {
  row: DeskRow;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      as="button"
      padding={3}
      radius={2}
      border
      selected={selected}
      onClick={onSelect}
      tone={row.problems.length > 0 ? "caution" : "default"}
      style={{ textAlign: "left" }}
    >
      <Stack gap={3}>
        <Flex gap={2} align="center" wrap="wrap">
          <Text weight="semibold" size={2}>
            {row.title}
          </Text>
          <StatusBadge row={row} />
        </Flex>
        <Text size={1} muted>
          {row.wing ?? "No wing"} · {row.choices} choices · endings {row.endingsLive} live
          {row.endingsDraftOnly > 0 ? `, ${row.endingsDraftOnly} draft` : ""} · review{" "}
          {row.stage ?? "not started"}
        </Text>
        {row.problems.length > 0 ? (
          <Text size={1}>⚠ {row.problems.join(" · ")}</Text>
        ) : null}
      </Stack>
    </Card>
  );
}

function StatusBadge({ row }: { row: DeskRow }) {
  if (row.status === "draft-only") return <Badge tone="caution">Draft only</Badge>;
  if (row.status === "live-with-draft") return <Badge tone="primary">Live · edits pending</Badge>;
  return <Badge tone="positive">Live</Badge>;
}

function ExhibitDetail({ row }: { row: DeskRow }) {
  return (
    <Stack gap={4}>
      <Heading as="h2" size={2}>
        {row.title}
      </Heading>
      <Stack gap={2}>
        <Fact label="Exhibit id" value={row.id} />
        <Fact label="Plate" value={{ ok: "Attached, with alt text", missing: "Pending", "missing-alt": "Attached, alt text missing" }[row.plate]} />
        <Fact label="Review gate" value={`${row.gate}${row.publishReady ? " · ready to publish" : ""}`} />
        {row.status !== "draft-only" && row.slug ? (
          <Text size={1}>
            <a href={`${SITE_URL}/exhibits/${row.slug}`} target="_blank" rel="noreferrer">
              Open on the site ↗
            </a>
          </Text>
        ) : null}
      </Stack>
      {row.instanceId ? (
        <WorkflowPanel key={row.instanceId} instanceId={row.instanceId} artifactId={row.id} />
      ) : (
        <Text muted size={1}>
          No Exhibit review run yet. Start one from Studio, or let the Acquisitions Clerk propose
          an exhibit.
        </Text>
      )}
    </Stack>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <Flex gap={3}>
      <Box style={{ minWidth: 110 }}>
        <Text size={1} muted>
          {label}
        </Text>
      </Box>
      <Text size={1}>{value}</Text>
    </Flex>
  );
}
