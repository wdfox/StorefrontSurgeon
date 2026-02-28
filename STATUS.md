# Status

## Snapshot

Project: Storefront Surgeon  
Phase: Foundation implemented  
State: runnable, seeded, lint-clean, test-clean, build-clean

Last verified locally:

- `npm run lint`
- `npm test`
- `npm run build`

## What Is Done

### Foundation slice

- created the Next.js app shell
- added the route structure for login, projects, and project detail
- implemented Auth.js credentials login
- added SQLite persistence with Prisma models for `User`, `Project`, and `Revision`
- seeded a demo user and one project
- implemented the bounded editable TSX preview strategy
- built the preview renderer and before/after layout
- added the surgery request UI
- added the Codex adapter boundary
- switched the live generation path from the generic OpenAI client to the Codex SDK
- implemented deterministic fallback behavior
- implemented patch validation
- implemented local diff generation from `currentSource` to `sourceAfter`
- implemented deterministic post-patch verification
- persisted revision state transitions
- surfaced patch/test/timeline information in the UI

### Safety behavior

- forbidden prompts can be blocked
- forbidden file edits are rejected
- oversized patches are rejected
- unsupported preview class tokens are rejected
- imports, hooks, and runtime side effects are rejected
- failed verification does not promote `activeSource`

## What We Learned In This Session

- Returning structured `sourceAfter` is more robust than letting the model author patch syntax.
- Failed revisions still need a visible candidate preview in the UI.
- Verification can drift as heuristics improve, so replaying checks against the latest candidate prevents stale failure messaging.
- Runtime-generated Tailwind classes are unsafe unless they are pre-approved and compiled into the CSS bundle.
- The generation contract needs to force desktop-visible changes, not only mobile-only treatments.

## What Is Not Done Yet

### Product features

- revert to an older revision
- retry-on-failure repair loop
- multiple surgeries beyond the initial sticky buy bar flow
- richer revision summaries or explanations
- better diff visualization
- better loading and progress telemetry

### Engineering hardening

- AST-aware validation
- more realistic policy checks
- richer integration tests
- sandboxed or isolated execution model
- production-ready auth/provider setup
- observability around generation latency, failure modes, and patch sizes

## Known Constraints

### Intentional constraints

- Codex is limited to `src/demo/EditableProductPreview.tsx` in the current foundation.
- The renderer is non-editable and deterministic.
- Freeform requests exist, but only the sticky-buy-bar path is guaranteed to produce the full polished result.

### Environment constraints

- local database setup depends on the `sqlite3` CLI
- `OPENAI_API_KEY` is optional because fallback mode exists
- a valid `codex login` session is also enough to enable live mode

### Tooling caveat

- Prisma Client generation works
- Prisma schema validation works
- Prisma schema engine migrations were failing in this environment
- current workaround: checked-in SQL migration + `sqlite3` CLI in `npm run db:migrate`
- when using Codex CLI login, forcing `OPENAI_CODEX_MODEL=gpt-5-mini` can fail because ChatGPT-authenticated Codex sessions support a different model set

## Recommended Next Steps

### Highest-impact next work

1. Add `revert` so the revision timeline becomes interactive instead of read-only.
2. Add one more dramatic preset, such as a campaign mode or hero refresh.
3. Add a retry loop that resubmits failing test output to Codex once.
4. Upgrade the diff panel into a more readable before/after code comparison.

### Best Senior/Staff signal upgrades

1. Add risk metadata to each revision: patch size, validation reason, test duration.
2. Add structured event logging around each orchestration stage.
3. Tighten validation from text checks to config-shape or AST-level checks.
4. Add one integration test for login -> surgery -> persisted revision.

### Demo polish upgrades

1. Add visible progress states for `generating`, `validating`, `testing`, and `applied`.
2. Add one-click “unsafe request” example for the safety demo.
3. Add clearer UI messaging when a revision is blocked by the preview-class allowlist.

## Quick Runbook

### Fresh setup

```bash
npm install
npm run db:setup
npm run dev
```

### Verify

```bash
npm run lint
npm test
npm run build
```

### Demo credentials

- `demo@storefrontsurgeon.dev`
- `demo1234`

## Useful Files

- planning spec: [SPEC.md](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/SPEC.md)
- runbook and architecture: [README.md](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/README.md)
- app entry: [src/app](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/src/app)
- orchestration core: [src/lib/revisions/orchestrator.ts](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/src/lib/revisions/orchestrator.ts)
- adapter boundary: [src/lib/codex](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/src/lib/codex)
- persistence: [prisma](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/prisma)
