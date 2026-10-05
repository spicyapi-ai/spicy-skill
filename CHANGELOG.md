# @spicyapi/skill

## 0.3.4

### Patch Changes

- Install from the public repository: `npx skills add spicyapi-ai/spicy-skill`. The previous address,
  `https://spicyapi.ai/skill`, stopped installing for everyone. The shared installer resolves a URL
  that carries a path against a well-known index *at that path*, finds none, and exits instead of
  falling back to a direct download, so it now reports
  `No skills found for the scoped path '/skill'`. The README and the troubleshooting table follow
  the repository route, and note that this installs the current `main` rather than the published
  release — use `npx @spicyapi/skill install` for the npm release. The Skill's own instructions are
  unchanged.

## 0.3.0

### Minor Changes

- Fix `spicyapi_models_list` and `spicyapi_model_get` failing outright on 16 of the 121 published
  endpoints. The MCP output schema pinned `policyTier` to three values while the service already
  returns five; `softened` and `filtered` made the MCP SDK reject the structured content, so any
  unfiltered catalogue listing raised `Output validation error` rather than returning models. The
  field is now an open set, because a descriptive classification should never be able to fail a
  call.

  Catch the bundled contract up with the service. New: the anonymous evaluation catalogue
  `GET /console/v1/catalog/models`, which answers "which models are there and what do they cost"
  without an API key; business codes `40003` (uploaded bytes do not match their ticket), `40004` (no
  deployment serves that parameter combination), `503` (dependency briefly unavailable) and `50302`
  (a synchronous generation failed upstream and was already refunded); `toolkit`, marking the models
  that replace a person in an image or a video; per-tier `variants` alongside each price.
  `callBackUrl` now rejects `http://`, task `errorMessage` carries the model service's own reason in
  English when there is one, and `jobs/purge` reads no `Idempotency-Key` — `taskId` is the key.

  Document the subject-swap two-step video workflow, block-rounded duration billing, and where text
  models live: the SDK, CLI and MCP server cover asynchronous media tasks, while chat runs through
  the OpenAI, Anthropic and Gemini compatible layers with an existing client.

## 0.2.3

### Patch Changes

- The installer refuses to replace an existing directory that is not a SpicyAPI Skill, even with
  `--force`. Pointing `--target` at a parent skills folder used to replace every other skill in it;
  it now stops and suggests `<target>/spicyapi`.
- The workflow reference uses the `MODEL_ID_FROM_CATALOG` placeholder and `--input-json`, and the
  purge guidance matches the contract: wait for the task to finish, there is no cancellation API,
  and purge removes generated media, the result payload, the prompt and other input text.

## 0.2.2

### Patch Changes

- 4c586b6: Correct three things the package documentation had wrong. Public model IDs read
  `<publisher>/<model>/<task>` — `bytedance/seedream-5.0-pro/text-to-image` — not the internal
  `<family>/<version>/<task>` slug; the Skill's own workflow reference used the internal shape as
  its placeholder, so an agent reading it would assemble identifiers that do not resolve. There are
  no audio models: the catalog is video, image and chat, and every README opened by claiming
  otherwise. And the quickstarts could not be run as written, because both the model ID and the API
  key were placeholders with no command next to them for obtaining a real one.

  Every README now starts from getting a key (`spicyapi.ai/register`, then the console; keys begin
  `sk-spicy-`) and lists a model before using one. `npx @spicyapi/cli` and `npx @spicyapi/skill` are
  documented without `--yes --package=`, which only `@spicyapi/mcp` needs — it ships two binaries,
  so the short form fails with `could not determine executable to run`. The Skill installs with
  `npx skills add https://spicyapi.ai/skill` through the installer most coding agents share, with
  the packaged installer kept as the second option. The MCP client examples no longer pin `@0.1.0`.

- a096fff: Add `spicyapi_upload_file` so an MCP client can upload a file from the user's machine and
  get back the `spicy://` URI to put in model input. The previous `spicyapi_upload_prepare` handed a
  presigned PUT ticket to the model and nothing ever sent that PUT — MCP tool results are content
  for the model to read, not requests the host executes — so local media was unreachable from MCP
  alone. It also placed the storage URL, which carries account and tenant identifiers, into the
  model context; that tool is removed. File reads are confined to the user's home directory by
  default, configurable with `SPICY_MCP_UPLOAD_ROOTS`.

  The CLI now accepts MP4/WebM video and MP3/WAV audio for `--content-type`; its whitelist had only
  the four image types while the server and SDK already took audio and video.

- 983dd22: Add customer-controlled retention and on-demand content destruction across all four
  surfaces.

  `createTask` (and `run`) accept `retentionSeconds`, sent as `X-Spicy-Retention`, to shorten how
  long one task's outputs and prompt are kept; `0` removes the outputs as soon as the task reaches a
  terminal state. It can only shorten — the account settings and the platform maximum still apply,
  and the deadlines that actually took effect come back in the task record's new `retention` object.
  An oversized value is clamped by the server rather than rejected, so a request asking to be more
  conservative never fails the generation.

  `purgeTask` destroys one terminal task's generated media, result payload, prompt and input text,
  and is idempotent. It destroys content, not the record of what it cost: the ledger entry, charged
  amount, model, state, timestamps and request ID all remain queryable, so it is never a refund.
  Task records now carry `contentState`, which distinguishes `expired` (the retention rules ran)
  from `purged` (the account destroyed it deliberately) — reporting the second as the first makes it
  look like the platform lost the customer's work.

  The CLI adds `tasks purge`, gated behind the same interactive confirmation or `--yes` as a
  billable command, and `tasks create --retention` accepting `30m`, `1h`, `7d` or plain seconds.
  `tasks get` now spells out the content state and retention deadlines in its human-readable output.

  The MCP server adds `spicyapi_task_purge` with `destructiveHint: true` and a confirmation round.
  Its result is projected onto a fixed whitelist — task ID, content state, removal metadata — so no
  link, ticket or output key can travel in the same message that reports the content's destruction.

## 0.2.1

### Patch Changes

- Document current-key task history recovery without redundant preflight or billable resubmission.

- Simplify the default agent generation workflow by reusing model schemas, relying on creation's
  built-in quote confirmation, and consuming ready result URLs directly. Keep diagnostics, separate
  price comparisons, link renewal, and all billable confirmation safeguards available.

  Add a read-only MCP usage tool for the configured API key, with UTC date filters and exact settled
  USD totals by day and model.

  Let MCP waiting inherit SDK polling backoff unless the caller explicitly selects a fixed interval.

## 0.2.0

### Minor Changes

- Add request-bound task quotes and expected-cost checks, document the public compatibility
  endpoints, and unify the development workflow across the SDK, CLI, MCP, and Agent Skill.

  The SDK now enforces an end-to-end timeout and a size limit when reading response bodies, and
  fills in the OpenAI-compatible examples and regression tests. The CLI and MCP add read-only
  quoting while keeping explicit confirmation and idempotency controls for billable writes. The
  content-mode field sent by older clients is now ignored for task admission.
