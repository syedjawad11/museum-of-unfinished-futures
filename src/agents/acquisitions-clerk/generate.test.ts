import { describe, expect, it } from "vitest";
import {
  createFakeGenerator,
  createOllamaGenerator,
  createSanityGenerator,
  GeneratorUnavailableError,
  readGeneratorChoice,
} from "./generate";

describe("Sanity Agent Actions generator", () => {
  it("sends a JSON-format prompt and returns the answer", async () => {
    const calls: unknown[] = [];
    const generator = createSanityGenerator({
      agent: {
        action: {
          prompt: async (request) => {
            calls.push(request);
            return { title: "ok" };
          },
        },
      },
    });

    await expect(generator.generate("Write JSON.")).resolves.toEqual({ title: "ok" });
    expect(calls).toEqual([
      { instruction: "Write JSON.", format: "json", temperature: 0.7 },
    ]);
  });

  it("explains a spent credit budget instead of failing silently", async () => {
    const generator = createSanityGenerator({
      agent: {
        action: {
          prompt: async () => {
            throw Object.assign(new Error("Usage limit reached"), { statusCode: 429 });
          },
        },
      },
    });

    await expect(generator.generate("x")).rejects.toThrow(
      /HTTP 429.*AI credits.*CLERK_GENERATOR=ollama/,
    );
  });
});

describe("Ollama generator", () => {
  it("posts to the local chat API with a JSON schema and parses the reply", async () => {
    const requests: Array<{ url: string; body: Record<string, unknown> }> = [];
    const generator = createOllamaGenerator({
      model: "qwen2.5:7b",
      jsonSchema: { type: "object" },
      fetch: async (url, init) => {
        requests.push({ url, body: JSON.parse(init.body) });
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({ message: { content: '{"title":"From Ollama"}' } }),
        };
      },
    });

    await expect(generator.generate("Write JSON.")).resolves.toEqual({
      title: "From Ollama",
    });
    expect(requests).toEqual([
      {
        url: "http://localhost:11434/api/chat",
        body: {
          model: "qwen2.5:7b",
          messages: [{ role: "user", content: "Write JSON." }],
          format: { type: "object" },
          stream: false,
          options: { temperature: 0.7 },
        },
      },
    ]);
  });

  it("tells the curator how to start Ollama when it is not running", async () => {
    const generator = createOllamaGenerator({
      fetch: async () => {
        throw new TypeError("fetch failed");
      },
    });

    await expect(generator.generate("x")).rejects.toThrow(
      /not reachable.*ollama serve.*ollama pull qwen2\.5:7b/,
    );
  });

  it("tells the curator to pull a missing model", async () => {
    const generator = createOllamaGenerator({
      model: "llama3.1:8b",
      fetch: async () => ({
        ok: false,
        status: 404,
        text: async () => '{"error":"model not found"}',
      }),
    });

    await expect(generator.generate("x")).rejects.toThrow(
      /HTTP 404.*ollama pull llama3\.1:8b/,
    );
  });

  it("hands non-JSON model text to validation rather than throwing", async () => {
    const generator = createOllamaGenerator({
      fetch: async () => ({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ message: { content: "Sure! Here it is" } }),
      }),
    });

    await expect(generator.generate("x")).resolves.toBe("Sure! Here it is");
  });
});

describe("fake generator and generator choice", () => {
  it("replays answers in order and records the instructions", async () => {
    const generator = createFakeGenerator([1, 2]);

    expect(await generator.generate("a")).toBe(1);
    expect(await generator.generate("b")).toBe(2);
    await expect(generator.generate("c")).rejects.toBeInstanceOf(
      GeneratorUnavailableError,
    );
    expect(generator.instructions).toEqual(["a", "b", "c"]);
  });

  it("accepts only the free generators and the rehearsal file", () => {
    expect(readGeneratorChoice("sanity")).toBe("sanity");
    expect(readGeneratorChoice("ollama")).toBe("ollama");
    expect(readGeneratorChoice("file")).toBe("file");
    expect(() => readGeneratorChoice(undefined)).toThrow(/Set CLERK_GENERATOR/);
    expect(() => readGeneratorChoice("anthropic")).toThrow(/not supported/);
  });
});
