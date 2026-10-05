# @spicyapi/skill

The official Agent Skill for [SpicyAPI](https://spicyapi.ai). It teaches a coding agent the correct
order of operations, the spending boundaries and the safety rules for this API — so it stops
guessing model IDs, inventing input fields or creating a second billable task on a retry.

**New to Skills?** A Skill is a folder of plain-text instructions written for an AI coding assistant
rather than for people. Install it once, and when you ask your assistant something like "add
SpicyAPI image generation to my app", it reads these instructions first and follows them instead of
guessing. The full, beginner-friendly guide is at
[docs.spicyapi.ai/docs/skill](https://docs.spicyapi.ai/docs/skill).

## What this package is, and is not

- **It is text.** The Skill is Markdown and YAML in the portable
  [Agent Skills](https://agentskills.io) directory format. Nothing in it runs when you install it.
- **It holds no API key and makes no network calls.** On its own it cannot reach your account or
  spend money.
- **It ships with an installer.** The package contains the Skill assets plus an atomic installer
  (`spicyapi-skill`). It does **not** contain the SDK, CLI or MCP server.
- **It is not tied to one client.** Codex is one supported client, not the package's scope. Any
  assistant that reads Agent Skills folders can use it.

### How it relates to the other SpicyAPI packages

| Package                                                        | Role                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `@spicyapi/skill` (this one)                                   | The playbook: tells the assistant how to do things correctly                                  |
| [`@spicyapi/mcp`](https://www.npmjs.com/package/@spicyapi/mcp) | Gives the assistant SpicyAPI actions on your account: models, quotes, tasks, uploads, results |
| [`@spicyapi/sdk`](https://www.npmjs.com/package/@spicyapi/sdk) | TypeScript library your application code imports                                              |
| [`@spicyapi/cli`](https://www.npmjs.com/package/@spicyapi/cli) | The `spicyapi` terminal command                                                               |

The Skill tells the agent to use the `spicyapi_*` MCP tools when they are connected, the CLI for
operations, and `SpicyClient` from the SDK for application code. With the Skill alone, the agent
writes correct integration code but cannot act on your account. With MCP alone, the agent can act
but works out the order of steps by itself. Installing both is the usual setup when you want the
agent to run real tasks; they do not conflict.

## Requirements

- An AI coding assistant that supports Agent Skills (Claude Code, Codex, Cursor, Gemini CLI, GitHub
  Copilot, OpenCode, Windsurf and many others).
- Node.js 22.13 or later for this package's installer. The `skills` installer below currently
  declares Node.js 22.20 or later. Check with `node --version`.
- A SpicyAPI API key only once the agent calls the API — installing needs none. Get one at
  [spicyapi.ai/register](https://spicyapi.ai/register), then create a key in the
  [console](https://spicyapi.ai/console). Keys begin `sk-spicy-` and are shown once. Provide it as
  the `SPICY_API_KEY` environment variable, never as text in a chat.

## Install

### Option 1: `npx skills add` (recommended)

```bash
npx skills add spicyapi-ai/spicy-skill
```

That is [`skills`](https://github.com/vercel-labs/skills), the installer most coding agents share,
reading this public repository. It asks which assistants to install into — Claude Code, Codex,
Cursor, OpenCode, Gemini CLI and many others — whether the install is for the current project or
global, and whether to symlink or copy. Add `--agent claude-code` to skip the first question, `-g`
to install for every project instead of only the current one, and `-y` to accept the defaults:

```bash
npx skills add spicyapi-ai/spicy-skill --agent claude-code
npx skills add spicyapi-ai/spicy-skill --agent codex -g
```

Things worth knowing:

- **This installs the current `main`, not the latest npm release.** The two are usually the same
  thing, and `main` is kept releasable for exactly this reason. If you need the published release
  instead, use Option 2 below, which reads npm.
- **Write the owner exactly as `spicyapi-ai`.** The repository moved there in October 2026; the old
  `Spicy-API` address no longer resolves, so `skills` will fail to clone it.
- **`Cloning repository…` then `Found 1 skill` is the whole of it.** The Skill lives at
  `skills/spicyapi/` in this repository; nothing else here is installed.
- **It prints where it installed.** A project install keeps the files in `.agents/skills/spicyapi`
  and gives each chosen assistant its own copy or link — `.claude/skills/spicyapi` for Claude Code,
  for instance. A global install goes to `~/.agents/skills/spicyapi` with a link in
  `~/.claude/skills/spicyapi`.

### Option 2: this package's installer

It needs no other tooling and copies the Skill into exactly one directory:

```bash
# Shared Agent Skills directory (default)
npx @spicyapi/skill install

# Or a specific client's directory
npx @spicyapi/skill install --target ~/.claude/skills/spicyapi
npx @spicyapi/skill install --target ~/.codex/skills/spicyapi
```

| Destination                 | When                                                      |
| --------------------------- | --------------------------------------------------------- |
| `~/.agents/skills/spicyapi` | Default; shared by clients that read the common directory |
| `$AGENTS_SKILLS_DIR`        | Set the environment variable to relocate the default      |
| `--target <absolute-dir>`   | A client that uses its own skills directory               |

Not every client reads the shared default directory — Claude Code reads `~/.claude/skills` and a
project's `.claude/skills`. If you are unsure which directory your client reads, use option 1.

On success it prints the destination and whether an existing directory was replaced:

```json
{
  "destination": "/Users/you/.claude/skills/spicyapi",
  "replaced": false
}
```

| Command or option | Effect                                                                    |
| ----------------- | ------------------------------------------------------------------------- |
| `install`         | Copy the Skill (the default command; may be omitted)                      |
| `--target <dir>`  | Install into exactly this directory instead of the default                |
| `--force`         | Replace an existing directory that is empty or already holds this Skill   |
| `--json`          | Print the result as one line of JSON                                      |
| `path`            | Print the packaged Skill directory, so you can read it without installing |
| `--help`          | Show usage                                                                |

The installer never overwrites an existing directory unless you pass `--force`; without it, it stops
with `skill already exists at …; pass --force to replace that exact directory` and changes nothing.
With `--force` it swaps the whole directory atomically, so any file you added inside it is removed.

`--force` only replaces a directory that is empty or already holds this Skill — a `SKILL.md` whose
frontmatter says `name: spicyapi`. Anything else is refused, even with `--force`, and nothing is
changed.

> **`--target` is the Skill's own directory, not its parent.** Always end it with `/spicyapi`. If
> you point it at the parent, for example `--target ~/.claude/skills --force`, the installer refuses
> and names the path to use instead:
>
> ```text
> refusing to replace /Users/you/.claude/skills: it is not a SpicyAPI Skill directory (no SKILL.md with name: spicyapi), even with --force. --target must be the Skill's own directory, for example /Users/you/.claude/skills/spicyapi
> ```
>
> Run it again with that path. The other Skills in the parent directory are left alone. (A parent
> directory that does not exist yet is not refused — the files would land loose in it — so keep the
> `/spicyapi` suffix.)

Inspect the packaged source without installing:

```bash
npx @spicyapi/skill path
```

## Check that it works

1. Confirm the files are there: `npx skills list` (current project) or `npx skills list -g` (global)
   should show `spicyapi`.
2. Start a **new** session — clients load Skills when a session starts.
3. Ask: _"Do you have a SpicyAPI skill available? Summarize what it tells you to do before creating
   a paid SpicyAPI task."_ A loaded Skill shows in the answer: an exact quote with estimated cost
   and maximum charge, your confirmation, one idempotency key, the model's live schema, and
   `SPICY_API_KEY` kept in the environment.

The agent picks the Skill up by itself when a request mentions SpicyAPI. To name it explicitly, say
"use the spicyapi skill"; in Codex, `$spicyapi`.

## What the Skill actually changes

Without it, an agent connected over MCP still works — it just takes detours. With it, the agent
follows a documented workflow:

1. **Read the selected model's live schema once**, then pass its model-specific `input` through
   unchanged. Never invent a model ID, price, capability or input field.
2. **Treat creation and retry as billable.** CLI and MCP creation obtain and confirm the exact quote
   internally; in SDK code, quote the request once, show its USD estimate and maximum charge,
   confirm, then pass that quote into creation.
3. **Keep one idempotency key for the whole logical attempt**, including recovery from an uncertain
   response.
4. **Use ready `output.assets[].url` directly.** A complete verified v2 webhook needs no extra task
   lookup and no download ticket. Save a durable copy in storage you control; a result URL is
   temporary.
5. **Keep keys in environment variables** — never in arguments, source, prompts, logs, support
   messages or committed configuration.
6. **Preserve `request_id`, task IDs, upload keys and idempotency keys** in results, because
   reconciliation and support need them.
7. **Upload local files first** and pass the returned `spicy://` URI; never inline file bytes or
   base64 into task input.
8. **Verify webhooks over the exact raw body** before parsing, and deduplicate deliveries by
   `request_id`.
9. **Recover instead of resubmitting.** After a timeout, reuse the same idempotency key; on `40901`,
   get a fresh quote; on insufficient funds, go to the Console instead of resending; respect
   `Retry-After`. There is no batch API, so batches bound their concurrency and give every item its
   own key.
10. **Only ever shorten retention, and confirm before destroying content.** Destroying a task's
    content is not a refund; the billing record stays.
11. **Know which workflows cost twice.** The subject-swap video models need an analysis task first,
    then a swap task that points back at it — two separate charges, with the user choosing which
    person to replace in between. The Skill makes the agent say that before the first charge instead
    of after the second.
12. **Answer the right way for text.** These packages cover asynchronous media tasks; the chat
    models in the same catalogue are reached with the caller's existing OpenAI, Anthropic or Gemini
    client pointed at SpicyAPI. The Skill sends the agent there rather than letting it report that
    SpicyAPI has no text models.

It also states what _not_ to do: health and balance checks are optional diagnostics rather than a
per-task checklist; task history listing exists to recover after a restart or a missed callback, not
as a way to poll status; and task cancellation, task-record deletion and webhook redelivery simply
do not exist in the public developer contract.

## Example requests

Mention SpicyAPI in the request so the agent applies the Skill. Where a model is named, use an exact
ID from the live catalog — the model page's API tab or `spicyapi models list`.

- _"Add a server-side route to my Next.js app that generates an image with SpicyAPI from a prompt,
  waits for the result and returns the link. Read the key from `SPICY_API_KEY`."_
- _"Add an Express webhook endpoint that verifies SpicyAPI signatures with `SPICY_WEBHOOK_SECRET`
  and stores each task result."_
- _"When a SpicyAPI video task succeeds, copy the file into my S3 bucket and store my own link."_
- _"Let users upload a photo and turn it into a short video with SpicyAPI."_
- _"Make my SpicyAPI calls retry timeouts without paying twice and show a clear message when the
  balance is too low."_

## What's inside

```text
spicyapi/
├── SKILL.md                    # name, trigger description and required behaviour
├── references/
│   ├── api-workflows.md        # surfaces, generation sequence, prices and tiers, the two-step
│   │                           # subject-swap workflow, uploads, retention and purge, retries, webhooks
│   └── safety.md               # credentials, billable-call checklist, real tests, cleanup, boundaries
└── agents/
    └── openai.yaml             # display metadata for clients such as Codex; implicit invocation on
```

The agent reads `SKILL.md` when a request matches its description and opens the two reference files
only when a task needs them. Command examples in the references use the placeholder
`MODEL_ID_FROM_CATALOG` and `--input-json`, so the agent copies the shape, not a model ID. Both
references describe content destruction the same way: it removes one terminal task's generated
media, result payload, prompt and other input text, keeps the billing record, and there is no
cancellation API — a queued or running task has to finish before it can be purged.

## Updating and removing

Installed copies do not update themselves, and the installed directory carries no version number.

- **Installed with `skills`:** run the same `npx skills add spicyapi-ai/spicy-skill …` command
  again; it replaces the files with whatever `main` holds at that moment. Remove with
  `npx skills remove spicyapi` (add `-g` for a global install).
- **Installed with this package:** reinstall over the same target, and delete the directory to
  remove it.

  ```bash
  npx @spicyapi/skill@latest install --target ~/.claude/skills/spicyapi --force
  rm -rf ~/.claude/skills/spicyapi
  ```

Removing the Skill does not affect your SpicyAPI account, keys or code the agent already wrote.

## Troubleshooting

| Symptom                                                              | Fix                                                                                   |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `Repository not found` or an authentication prompt while cloning     | Check the owner spelling: it is `spicyapi-ai` (the old `Spicy-API` owner is gone)     |
| `No skills found for the scoped path '/skill'`                       | That is the retired address; install from the repository instead                      |
| `The SpicyAPI Skill download is temporarily unavailable`             | Retry later, or use `npx @spicyapi/skill install`                                     |
| `skill already exists at …`                                          | A directory is already there; if it is this Skill, reinstall with `--force` to update |
| `refusing to replace …: it is not a SpicyAPI Skill directory`        | `--target` names a parent or unrelated directory; use the `…/spicyapi` path it prints |
| `--target requires a value`                                          | Pass a directory ending in `/spicyapi`                                                |
| The agent doesn't use the Skill                                      | Start a new session, check the directory is one your client reads, mention SpicyAPI   |
| The agent created a paid task without asking                         | Your request may have authorized it; say "show me the price and wait for my OK" first |

## Boundaries

Account identity, payments, privacy, account closure and admin operations stay in the SpicyAPI
Console; this is a server-side skill and does not emulate Console routes. When you ask for a real
test, the Skill requires a real request against the selected environment — a passing mock is never
reported as verified — and it reports retained artifacts honestly instead of claiming a deletion the
API does not offer.

## More

- [Agent Skill guide](https://docs.spicyapi.ai/docs/skill) — the full walkthrough, written for
  non-developers too
- [Client setup on the developer hub](https://spicyapi.ai/developers#agents)
- [Agents and automation guide](https://docs.spicyapi.ai/docs/agents)
- The Skill assumes one of [`@spicyapi/mcp`](https://www.npmjs.com/package/@spicyapi/mcp),
  [`@spicyapi/cli`](https://www.npmjs.com/package/@spicyapi/cli) or
  [`@spicyapi/sdk`](https://www.npmjs.com/package/@spicyapi/sdk) is available to the agent.
