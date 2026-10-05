# SpicyAPI safety and cleanup

## Credentials and privacy

- Load `SPICY_API_KEY`, webhook secrets, and local MCP tokens from environment variables or a secret
  manager.
- Never accept an API key through a CLI flag. Do not serialize secrets into JSON output, shell
  history, MCP prompts, screenshots, telemetry, test snapshots, or error reports.
- Treat generation prompts, uploaded media, outputs, callbacks, and task metadata as private
  customer content. Log identifiers and correlation metadata, not payload bodies or presigned URLs.
- A presigned upload or download URL is a temporary credential. Redact it and do not send the Spicy
  API key to its storage host.
- A webhook callback URL must be public HTTPS. `http://`, loopback and private hosts, ports other
  than 443 and 80, and URLs carrying credentials are all rejected, and the rejection is deliberate:
  the delivery body carries the prompt and signed links to the result. Recommend a tunnel with a
  real certificate for a local receiver; never suggest a way around the HTTPS requirement.

## Billable operations

Task creation and retry can reserve funds. Before execution:

1. Use the selected model's live schema; reuse a complete record already read in this workflow.
   Check balance only when requested or diagnosing funds. The server enforces funds at acceptance.
2. Explain the exact request's model ID, USD estimate, maximum charge and expiry. CLI and MCP create
   obtain the quote internally; do not quote separately first. SDK code obtains one quote and passes
   it unchanged into creation after confirmation.
3. Obtain explicit user confirmation, unless the user's current request already explicitly
   authorizes that exact billable test.
4. Mint or preserve one idempotency key and surface it to the user.

Decline, cancellation of confirmation, schema mismatch, or missing confirmation must result in zero
billable create calls; a read-only quote may already have been fetched.

Four things make a stated price differ from a naive estimate, and each must be said out loud rather
than discovered on the invoice:

- **A workflow can be more than one charge.** A `subject-swap` video endpoint whose schema requires
  `analysis_task_id` needs an analysis task and then a swap task, billed separately. Authorization
  for "the swap" is not authorization for two charges unless the user was told there are two, and
  each one gets its own quote and confirmation.
- **Some video endpoints bill in whole blocks.** Where a model declares a block, the source clip's
  duration is rounded up to the next block boundary before pricing, so a 5.04-second clip on a
  1-second block is billed as 6 seconds and a 10.04-second clip on a 10-second block as 20. Quote
  the exact request instead of extrapolating a per-second rate, and do not describe such an endpoint
  as simply per-second.
- **Some models bill a refusal.** Failed tasks normally release their hold, but where a model's page
  states that refused requests are billed, a `content_rejected` task settles at the accepted
  estimate. Say so before the first call on such a model, and never resend a refused request
  unchanged there: it is refused again and charged again.
- **A chat request with media can hold far more than it will cost.** Video, audio, or an image given
  as a public URL makes the hold cover the model's whole input limit. The settled charge is the real
  token usage, but the balance must cover the hold first.

Business code `50302` is the one failure that has already been refunded: a synchronous generation
failed upstream and the charge was reversed. Resend it with a **new** `Idempotency-Key` — the
original key only replays the recorded failure, so a retry that keeps it can never succeed. Do not
present it to the user as money at risk, and do not treat `40004` (no deployment serves that
parameter combination) as transient — it needs a changed parameter, and resending it unchanged only
spends time. `40310` means the account's email address is not verified yet; only the user can fix
that, in the Console.

## Model capabilities

Select the model that supports the intended use. SpicyAPI does not require a content-mode flag or
perform per-request content review. A model can still fail according to its own implementation;
report the observed normalized failure.

## Real integration tests

- Use a dedicated test account/key and a unique marker in permissible metadata or prompt text when
  the live model schema supports it.
- Record start time, model ID, idempotency key, request IDs, task IDs, uploaded file IDs/keys, and
  output keys immediately.
- Bound cost and count before starting. Stop after the first representative success for each
  distinct route unless more cases are explicitly required. Count a two-step workflow as the number
  of tasks it really creates, and take the bound from the quote rather than from a duration
  multiplied by a rate, since a block-billed endpoint rounds the duration up first.
- Verify boundaries with real server responses: unauthorized, invalid schema, insufficient balance,
  idempotent replay, terminal polling, ownership-safe 404, and webhook tampering where the
  environment safely permits them.
- Never manufacture a success when provider credentials, model availability, funds, or policy
  prevent the route from completing. Preserve the observed error and request ID.

## Cleanup

Build an exact artifact ledger during testing. Delete or revoke only entries from that ledger and
verify each deletion through the same supported control plane.

The public SpicyAPI developer contract does not expose task cancellation, task-record deletion,
uploaded-object deletion, or webhook redelivery. It does expose content destruction: `tasks purge` /
`spicyapi_task_purge` / `client.purgeTask` removes one terminal task's generated media, result
payload, prompt and other input text, irreversibly, while the task record and its billing evidence
(ledger entry, charged amount, model, state, timestamps, request ID) remain. A queued or running
task cannot be canceled; wait for it to finish before purging. Therefore:

- Purge a task's content only when the user agreed and has saved any result they still want, and
  verify `contentState: purged` on the task record afterwards.
- Do not claim public-API cleanup for task records, uploaded objects, or anything else purge does
  not remove.
- Do not delete adjacent account data or reach into production databases as a workaround.
- If an authorized isolated local environment exposes direct cleanup, match exact unique IDs,
  confirm the environment, remove only those rows/objects, and verify zero remaining matches.
- Otherwise report retained task/file IDs and their documented retention behavior to the user.

## MCP boundaries

- Prefer stdio for local clients.
- The packaged HTTP server binds only to loopback and requires a separate `SPICY_MCP_HTTP_TOKEN` of
  at least 32 bytes. It must not equal `SPICY_API_KEY`.
- Never expose the local static-token HTTP mode to a remote interface. Internet-facing MCP requires
  a standards-compliant OAuth resource server with audience-bound tokens and is intentionally not
  provided here.
- MCP tool annotations are hints, not authorization. Billable execution remains gated by protocol
  elicitation and signed request state.

## Account and payment boundaries

Registration, login, password recovery, team membership, checkout, saved payment methods, automatic
recharge, privacy export/deletion, account closure, support, and admin operations use
browser-session Console contracts. Keep those flows in the product UI unless a first-class
non-browser authorization contract is explicitly added.
