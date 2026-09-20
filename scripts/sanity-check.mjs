const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "wa27n68e";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production_1";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-09-20";

const query = `{
  "documentCount": count(*),
  "artifactCount": count(*[_type == "artifact"])
}`;

const url = new URL(
  `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`,
);
url.searchParams.set("query", query);

let response;

try {
  response = await fetch(url);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Sanity read check failed before HTTP response: ${message}`);
  process.exit(1);
}

if (!response.ok) {
  console.error(
    `Sanity read check failed: HTTP ${response.status} ${response.statusText}`,
  );
  process.exit(1);
}

const payload = await response.json();

if (!payload || typeof payload.result !== "object" || payload.result === null) {
  console.error("Sanity read check failed: response did not include a result.");
  process.exit(1);
}

const result = payload.result;

if (
  !Number.isInteger(result.documentCount) ||
  result.documentCount < 0 ||
  !Number.isInteger(result.artifactCount) ||
  result.artifactCount < 0
) {
  console.error("Sanity read check failed: count fields were not valid integers.");
  process.exit(1);
}

console.log(`projectId: ${projectId}`);
console.log(`dataset: ${dataset}`);
console.log(`apiVersion: ${apiVersion}`);
console.log(`documentCount: ${result.documentCount}`);
console.log(`artifactCount: ${result.artifactCount}`);
