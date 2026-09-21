import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  isAllowedPlateUrl,
  loadPlateMarkup,
  sanitizePlateMarkup,
} from "./plate-markup";

const fixtureDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "__fixtures__",
  "plates",
);

const fixturePath = (name: string) => path.join(fixtureDir, name);

const validSvg = (inner = "") => `<svg viewBox="0 0 800 600" role="img" aria-labelledby="plate-title plate-desc" fill="none" stroke="currentColor">
  <title id="plate-title">Fixture Plate</title>
  <desc id="plate-desc">A safe fixture plate.</desc>
  ${inner}
</svg>`;

const response = (ok: boolean, body: string, status = ok ? 200 : 503) => ({
  ok,
  status,
  text: async () => body,
});

describe("sanitizePlateMarkup", () => {
  it("strips XML declarations, comments, doctype, and a BOM", () => {
    const result = sanitizePlateMarkup(
      `\uFEFF<?xml version="1.0"?><!DOCTYPE svg><!-- lead -->${validSvg()}`,
    );

    expect(result).toEqual({
      ok: true,
      markup: validSvg(),
    });
  });

  it("accepts a minimal valid fixture", async () => {
    const raw = await readFile(fixturePath("valid-plate.svg"), "utf8");
    const result = sanitizePlateMarkup(raw);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.markup).toContain('viewBox="0 0 800 600"');
      expect(result.markup).toContain('stroke="currentColor"');
      expect(result.markup).not.toContain("<?xml");
      expect(result.markup).not.toContain("<!--");
    }
  });

  it.each([
    ["script element", "<script>alert(1)</script>"],
    ["uppercase script element", "<SCRIPT>alert(1)</SCRIPT>"],
    ["foreignObject element", "<foreignObject></foreignObject>"],
    ["iframe element", "<iframe></iframe>"],
    ["embed element", "<embed></embed>"],
    ["object element", "<object></object>"],
    ["image element", "<image href=\"#asset\"/>"],
    ["external use href", "<use href=\"https://example.com/icon.svg#x\"/>"],
    ["javascript URL", "<a href=\"javascript:alert(1)\"></a>"],
    ["data URL in paint", "<path fill=\"url(data:image/svg+xml,bad)\"/>"],
    ["data URL in href", "<a href=\"data:image/svg+xml,bad\"></a>"],
    [
      "data URL in style attribute",
      "<rect style=\"fill:url(data:image/png;base64,AAAA)\"/>",
    ],
    ["event handler", "<svg onload=\"alert(1)\"></svg>"],
    ["style import", "<style>@import url('/bad.css');</style>"],
    ["style URL", "<style>path{fill:url(#paint)}</style>"],
    [
      "style block external URL",
      "<style>.a{fill:url(https://evil.com/p.png)}</style>",
    ],
    ["external href", "<a href=\"https://example.com\"></a>"],
    ["external xlink href", "<a xlink:href=\"https://example.com\"></a>"],
    ["hex colour", "<path stroke=\"#abc\"/>"],
    ["hex colour in style attribute", "<rect style=\"fill:#ff0000\"/>"],
    ["hex colour in unquoted style attribute", "<rect style=fill:#fff />"],
    ["hex colour in style block", "<style>.a{fill:#ffffff}</style>"],
    [
      "external URL in style attribute",
      "<rect style=\"fill:url(https://evil.com/p.png)\"/>",
    ],
    ["CSS expression in style attribute", "<rect style=\"width:expression(alert(1))\"/>"],
    ["CSS behavior in style attribute", "<rect style=\"behavior:url(#bad)\"/>"],
    ["CSS moz binding in style attribute", "<rect style=\"-moz-binding:url(#bad)\"/>"],
    ["rgb paint", "<path stroke=\"rgb(1 2 3)\"/>"],
    ["hsl paint", "<path fill=\"hsl(1 2% 3%)\"/>"],
    ["animate element", "<animate attributeName=\"opacity\"/>"],
    ["set element", "<set attributeName=\"opacity\"/>"],
    ["animateTransform element", "<animateTransform attributeName=\"transform\"/>"],
    ["animateMotion element", "<animateMotion path=\"M0 0\"/>"],
  ])("rejects forbidden markup: %s", (_name, forbidden) => {
    const raw =
      forbidden === '<svg onload="alert(1)"></svg>'
        ? validSvg().replace("<svg ", '<svg onload="alert(1)" ')
        : validSvg(forbidden);

    expect(sanitizePlateMarkup(raw)).toMatchObject({ ok: false });
  });

  it.each([
    ["script fixture", "invalid-script.svg"],
    ["hex fixture", "invalid-hex.svg"],
    ["external href fixture", "invalid-external-href.svg"],
  ])("rejects %s", async (_name, fileName) => {
    const raw = await readFile(fixturePath(fileName), "utf8");

    expect(sanitizePlateMarkup(raw)).toMatchObject({ ok: false });
  });

  it("rejects markup over 61,440 bytes", () => {
    const hugePath = `<path d="${"M0 0 ".repeat(13000)}" stroke="currentColor"/>`;

    expect(sanitizePlateMarkup(validSvg(hugePath))).toMatchObject({ ok: false });
  });

  it("rejects markup with more than 400 angle-bracket openings", () => {
    const manyLines = Array.from(
      { length: 401 },
      (_, index) => `<path d="M${index} 0" stroke="currentColor"/>`,
    ).join("");

    expect(sanitizePlateMarkup(validSvg(manyLines))).toMatchObject({ ok: false });
  });

  it.each([
    ["missing viewBox", validSvg().replace('viewBox="0 0 800 600" ', "")],
    ["missing role", validSvg().replace('role="img" ', "")],
    ["missing title", validSvg().replace(/<title[\s\S]*?<\/title>\n  /, "")],
    ["not SVG", "<div></div>"],
  ])("rejects %s", (_name, raw) => {
    expect(sanitizePlateMarkup(raw)).toMatchObject({ ok: false });
  });

  it("accepts label text containing DATA:", () => {
    expect(sanitizePlateMarkup(validSvg("<text>DATA: NONE</text>"))).toEqual({
      ok: true,
      markup: validSvg("<text>DATA: NONE</text>"),
    });
  });

  it("currently accepts nested SVG markup", () => {
    expect(
      sanitizePlateMarkup(
        validSvg('<svg viewBox="0 0 10 10"><title>Nested</title></svg>'),
      ),
    ).toMatchObject({ ok: true });
  });
});

describe("isAllowedPlateUrl", () => {
  it.each([
    [
      "https://cdn.sanity.io/images/wa27n68e/production_1/plate.svg",
      true,
    ],
    [
      "https://cdn.sanity.io/images/wa27n68e/production_1/nested/plate.svg",
      true,
    ],
    [
      "https://assets.sanity.io/images/wa27n68e/production_1/plate.svg",
      false,
    ],
    [
      "http://cdn.sanity.io/images/wa27n68e/production_1/plate.svg",
      false,
    ],
    [
      "https://cdn.sanity.io/images/wrong/production_1/plate.svg",
      false,
    ],
    [
      "https://cdn.sanity.io/images/wa27n68e/production_1/plate.png",
      false,
    ],
  ])("returns %s for %s", (url, allowed) => {
    expect(isAllowedPlateUrl(url)).toBe(allowed);
  });
});

describe("loadPlateMarkup", () => {
  it("prefers Sanity markup when fetch succeeds and sanitizes", async () => {
    const fetchText = vi.fn().mockResolvedValue(response(true, validSvg()));
    const readLocalFile = vi.fn();

    await expect(
      loadPlateMarkup(
        {
          slug: "local-plate",
          imageUrl:
            "https://cdn.sanity.io/images/wa27n68e/production_1/remote.svg",
        },
        { fetchText, readLocalFile },
      ),
    ).resolves.toEqual({
      markup: validSvg(),
      source: "sanity",
      bytes: Buffer.byteLength(validSvg(), "utf8"),
    });
    expect(readLocalFile).not.toHaveBeenCalled();
  });

  it("falls back to local markup when Sanity fetch is not ok", async () => {
    const fetchText = vi.fn().mockResolvedValue(response(false, "nope", 500));
    const readLocalFile = vi.fn().mockResolvedValue(validSvg("<path/>"));

    await expect(
      loadPlateMarkup(
        {
          slug: "local-plate",
          imageUrl:
            "https://cdn.sanity.io/images/wa27n68e/production_1/remote.svg",
        },
        { fetchText, readLocalFile, localDir: "/plates" },
      ),
    ).resolves.toMatchObject({ source: "local", markup: validSvg("<path/>") });
    expect(readLocalFile).toHaveBeenCalledWith("/plates/local-plate.svg");
  });

  it("falls back to local markup when Sanity URL is disallowed", async () => {
    const fetchText = vi.fn();
    const readLocalFile = vi.fn().mockResolvedValue(validSvg());

    await expect(
      loadPlateMarkup(
        { slug: "local-plate", imageUrl: "https://example.com/plate.svg" },
        { fetchText, readLocalFile, localDir: "/plates" },
      ),
    ).resolves.toMatchObject({ source: "local" });
    expect(fetchText).not.toHaveBeenCalled();
    expect(readLocalFile).toHaveBeenCalledWith("/plates/local-plate.svg");
  });

  it("falls back to local markup when fetched markup is rejected", async () => {
    const fetchText = vi.fn().mockResolvedValue(response(true, validSvg("<script/>")));
    const readLocalFile = vi.fn().mockResolvedValue(validSvg());

    await expect(
      loadPlateMarkup(
        {
          slug: "local-plate",
          imageUrl:
            "https://cdn.sanity.io/images/wa27n68e/production_1/remote.svg",
        },
        { fetchText, readLocalFile, localDir: "/plates" },
      ),
    ).resolves.toMatchObject({ source: "local" });
  });

  it("returns null when the local plate is missing", async () => {
    const readError = new Error("missing") as NodeJS.ErrnoException;
    readError.code = "ENOENT";
    const readLocalFile = vi.fn().mockRejectedValue(readError);

    await expect(
      loadPlateMarkup(
        { slug: "missing-plate" },
        { readLocalFile, localDir: "/plates" },
      ),
    ).resolves.toBeNull();
  });

  it("rejects traversal slugs without touching the filesystem", async () => {
    const readLocalFile = vi.fn();

    await expect(
      loadPlateMarkup({ slug: "../secret" }, { readLocalFile }),
    ).resolves.toBeNull();
    expect(readLocalFile).not.toHaveBeenCalled();
  });

  it("rethrows non-ENOENT local read errors", async () => {
    const readError = new Error("permission denied") as NodeJS.ErrnoException;
    readError.code = "EACCES";
    const readLocalFile = vi.fn().mockRejectedValue(readError);

    await expect(
      loadPlateMarkup(
        { slug: "locked-plate" },
        { readLocalFile, localDir: "/plates" },
      ),
    ).rejects.toThrow("permission denied");
  });
});
