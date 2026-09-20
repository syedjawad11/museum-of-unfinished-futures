import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GalleryEmptyState } from "./gallery-empty-state";

describe("GalleryEmptyState", () => {
  it("honestly explains that the public Sanity dataset has no published artifacts yet", () => {
    const markup = renderToStaticMarkup(GalleryEmptyState());

    expect(markup).toContain(
      "The approved Sanity dataset is connected, but it has no published artifacts yet.",
    );
  });
});
