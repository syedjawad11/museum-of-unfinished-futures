# Agentic workflow

How the work in this repository is split between models. Set up on 2 Oct 2026 at the founder's request.

## Roles

| Who | How it is reached | Used for |
|---|---|---|
| **Claude Opus 5.5** (main session) | — | Orchestrator, planner and reviewer. Writes task packets, decides, reviews every diff, runs the gates, commits. Owns the result. |
| **Codex `gpt-6-sol`** | `codex-task code …` | Coding tasks: a feature, a fix or tests, given as a self-contained packet. |
| **Codex `gpt-6.1-sol`** | `codex-task think …` | Second opinion while planning or reviewing, especially for heavy reasoning or maths. Read-only. |
| **Claude Sonnet 5** subagents | `Agent` tool with `model: "sonnet"` | Broad searches, mechanical multi-file edits, doc updates, test runs and summaries. ("Sonnet 5.5" does not exist; Sonnet 5 is the current Sonnet.) |

Codex runs on the founder's ChatGPT subscription, not on an API key, so it costs nothing extra (see the zero-spend rule).

## Calling Codex

`~/.claude/bin/codex-task <code|think> <working-dir> <prompt-file> <answer-file>`

- `code` runs `gpt-6-sol` with a `workspace-write` sandbox: it can edit files inside `<working-dir>` only.
- `think` runs `gpt-6.1-sol` with a `read-only` sandbox.
- `CODEX_MODEL=…` overrides the model. Codex's final message goes to `<answer-file>`, and the full log goes to `<answer-file>.log`.
- Write prompts and answers in the session scratchpad, never in the repository.
- The script uses the Codex CLI that ships inside the ChatGPT app. Codex 0.159/0.160 has no `mcp-server` command, so there is no MCP server; the CLI is called directly through Bash.

## Rules

1. **Coding tasks run in a git worktree, not in the main checkout.** Create it with `git worktree add <scratchpad>/wt-<task> -b codex/<task>`. A worktree has no `.env.local` because git ignores that file, so Codex never sees a token. Remove the worktree when the task is done.
2. **A packet is self-contained.** It gives the goal, the files involved, the constraints (read `AGENTS.md` and the Next.js docs in `node_modules/next/dist/docs/`; no paid AI; no secrets) and the acceptance checks: which tests must pass and which must be written first.
3. **Codex never commits, pushes, deploys, writes to a live Sanity dataset or touches `.env*`.** Claude reviews the diff, brings it into `main`, runs the gates (unit, typecheck, lint, `sanity schemas validate`, e2e) and commits.
4. **Never put secrets or `.env.local` content in a prompt.** Prompts leave this machine.
5. **Second opinions are input, not verdicts.** When Claude and `gpt-6.1-sol` disagree, Claude says so to the founder and recommends one option.
6. **Do not delegate** small edits, anything gated on founder approval (live writes, deploys, `git push`), or work that needs this session's context more than it needs extra hands.
7. The founder's approval rules in `docs/build-log.md` and the task packets still apply, whoever does the work.
