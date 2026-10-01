// The Clerk's writing hand. Nothing here costs money by itself: Sanity Agent
// Actions spend the organization's free monthly AI credits (1 credit per
// prompt), Ollama runs on this machine, and tests use the fake.

export type Generator = {
  name: string;
  generate(instruction: string): Promise<unknown>;
};

export class GeneratorUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeneratorUnavailableError";
  }
}

type PromptClient = {
  agent: {
    action: {
      prompt(request: {
        instruction: string;
        format: "json";
        temperature?: number;
      }): Promise<unknown>;
    };
  };
};

export function createSanityGenerator(client: PromptClient): Generator {
  return {
    name: "sanity-agent-actions",
    async generate(instruction) {
      try {
        return await client.agent.action.prompt({
          instruction,
          format: "json",
          temperature: 0.7,
        });
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        const hint =
          status === 402 || status === 429
            ? " The organization's AI credits or spending limit may be used up for this month; try CLERK_GENERATOR=ollama."
            : status === 403
              ? " AI features may be switched off for the organization, or the token lacks access."
              : "";
        throw new GeneratorUnavailableError(
          `Sanity Agent Actions prompt failed${status ? ` (HTTP ${status})` : ""}: ${errorMessage(error)}.${hint}`,
        );
      }
    },
  };
}

type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string },
) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

export const DEFAULT_OLLAMA_URL = "http://localhost:11434";
export const DEFAULT_OLLAMA_MODEL = "qwen2.5:7b";

export function createOllamaGenerator(options: {
  fetch: FetchLike;
  baseUrl?: string;
  model?: string;
  jsonSchema?: Record<string, unknown>;
}): Generator {
  const baseUrl = (options.baseUrl ?? DEFAULT_OLLAMA_URL).replace(/\/+$/, "");
  const model = options.model ?? DEFAULT_OLLAMA_MODEL;

  return {
    name: `ollama:${model}`,
    async generate(instruction) {
      let response: Awaited<ReturnType<FetchLike>>;
      try {
        response = await options.fetch(`${baseUrl}/api/chat`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: instruction }],
            format: options.jsonSchema ?? "json",
            stream: false,
            options: { temperature: 0.7 },
          }),
        });
      } catch (error) {
        throw new GeneratorUnavailableError(
          `Ollama is not reachable at ${baseUrl} (${errorMessage(error)}). Start the Ollama app or run \`ollama serve\`, then \`ollama pull ${model}\`.`,
        );
      }

      const text = await response.text();
      if (!response.ok) {
        const hint =
          response.status === 404
            ? ` Pull the model first: \`ollama pull ${model}\`.`
            : "";
        throw new GeneratorUnavailableError(
          `Ollama answered HTTP ${response.status}: ${text.slice(0, 300)}.${hint}`,
        );
      }

      let content: unknown;
      try {
        content = (JSON.parse(text) as { message?: { content?: unknown } })
          .message?.content;
      } catch {
        throw new GeneratorUnavailableError(
          `Ollama returned something that is not JSON: ${text.slice(0, 300)}`,
        );
      }

      if (typeof content !== "string") {
        throw new GeneratorUnavailableError(
          "Ollama's reply had no message content.",
        );
      }

      try {
        return JSON.parse(content);
      } catch {
        // Let validation report it; the Clerk retries once with the reasons.
        return content;
      }
    },
  };
}

/** Returns the given answers in order. For tests and dry runs only. */
export function createFakeGenerator(answers: readonly unknown[]): Generator & {
  instructions: string[];
} {
  const instructions: string[] = [];
  let next = 0;

  return {
    name: "fake",
    instructions,
    async generate(instruction) {
      instructions.push(instruction);
      if (next >= answers.length) {
        throw new GeneratorUnavailableError("The fake generator ran out of answers.");
      }
      return answers[next++];
    },
  };
}

export type GeneratorChoice = "sanity" | "ollama" | "file";

/** "file" replays a saved answer and is for dry-run rehearsals only. */
export function readGeneratorChoice(value: string | undefined): GeneratorChoice {
  if (value === "sanity" || value === "ollama" || value === "file") {
    return value;
  }

  throw new GeneratorUnavailableError(
    value
      ? `CLERK_GENERATOR="${value}" is not supported. Use "sanity" (free monthly Sanity AI credits) or "ollama" (local, free).`
      : 'Set CLERK_GENERATOR to "sanity" (free monthly Sanity AI credits) or "ollama" (local, free).',
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
