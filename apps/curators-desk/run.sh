#!/bin/sh
# Runs the Sanity CLI for the Curator's Desk (dev | build | deploy).
#
# The Sanity CLI picks the nearest Studio config (sanity.config.ts) above the
# working directory before it looks for an app, so inside this repository it
# would build the Studio instead. This script mirrors the app, and the shared
# code it imports, into a staging folder outside the repository and runs the
# CLI there, against the repository's own node_modules.
set -eu

command="${1:-dev}"
shift || true
repo="$(cd "$(dirname "$0")/../.." && pwd)"
stage="${CURATORS_DESK_STAGE:-${TMPDIR:-/tmp}/curators-desk-stage}"

mkdir -p "$stage/apps" "$stage/src"
rsync -a --delete --exclude dist --exclude node_modules "$repo/apps/curators-desk/" "$stage/apps/curators-desk/"
rsync -a --delete "$repo/src/domain/" "$stage/src/domain/"
rsync -a --delete "$repo/src/agents/" "$stage/src/agents/"
ln -sfn "$repo/node_modules" "$stage/node_modules"

cd "$stage/apps/curators-desk"
"$repo/node_modules/.bin/sanity" "$command" "$@"

if [ "$command" = "build" ] && [ -d dist ]; then
  rm -rf "$repo/apps/curators-desk/dist"
  cp -R dist "$repo/apps/curators-desk/dist"
  echo "Copied the build to apps/curators-desk/dist"
fi
