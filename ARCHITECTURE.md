# Architecture

Storefront Surgeon is deliberately narrow. The app is designed around a single trustworthy editing loop instead of open-ended repository mutation.

## System Overview

The product flow is:

1. A logged-in user opens a saved storefront project.
2. The project loads `baselineSource`, `activeSource`, and revision history from SQLite.
3. The user submits a presentational product-page request.
4. The backend creates a pending revision and calls the Codex adapter.
5. The adapter returns structured `sourceAfter` output for the bounded editable file.
6. The revision layer validates the generated source, creates a unified diff, replays that diff locally, and runs deterministic checks.
7. The project promotes the new `activeSource` only if validation and checks succeed.
8. The UI polls the persisted revision state and updates the workspace as the run moves forward.

## Core Constraint

Codex is intentionally limited to one editable file:

- `src/demo/EditableProductPreview.tsx`

This keeps the demo legible and makes the safety story concrete:

- generated output must stay inside one self-contained TSX component
- imports, hooks, side effects, and broader commerce behavior are rejected
- patch replay must reproduce the generated `sourceAfter`
- the active project source changes only after validation and checks pass

## Architectural Boundaries

- `src/app/*`
  - App Router pages and API routes
- `src/components/projects/*`
  - workspace UI, revision history, diff view, and project list
- `src/lib/revisions/*`
  - orchestration, validation, patch replay, restore/replay flows, and deterministic checks
- `src/lib/codex/*`
  - live and fallback generation adapters
- `src/demo/*`
  - editable demo artifact and preset prompts
- `prisma/*`
  - schema, SQL migrations, and seed logic

## Revision Lifecycle

### Generation

- `POST /api/projects/[projectId]/surgeries` creates a pending revision
- the request is checked against the allowed demo scope before generation proceeds
- the Codex adapter returns structured `sourceAfter` output and a short summary

### Validation

- generated source is validated against the bounded preview contract
- a unified diff is generated locally from `currentSource` to `sourceAfter`
- the diff is validated for size and shape before use

### Replay And Testing

- the diff is reapplied to the current source to confirm deterministic patch behavior
- the replayed result must exactly match the generated `sourceAfter`
- deterministic checks run on the replayed result

### Promotion

- only a passing revision updates `project.activeSource`
- every attempt is persisted as a revision with status, run stage, summary, patch text, and optional failure reason

## Restore And Replay

The workspace supports two post-generation flows:

- restore
  - applies either the seeded baseline or a previously approved revision as a new revision entry
- replay
  - reapplies a saved patch against the current source to demonstrate how stale diffs can fail safely

Both flows reuse the same validation and deterministic patch application model as generation.

## Data Model

### User

- login identity for the demo

### Project

- user-scoped workspace
- stores `baselineSource` and current `activeSource`

### Revision

- immutable record of one generation or restore attempt
- stores prompt, summary, patch text, result status, run stage, and optional blocked or failure details

See [prisma/schema.prisma](prisma/schema.prisma) for the concrete schema.

## Live And Fallback Modes

### Fallback mode

Used when no live Codex credentials are available.

- deterministic `sourceAfter` output
- deterministic blocked responses for forbidden prompts
- stable local behavior for demos and tests

### Live mode

Used when either `OPENAI_API_KEY` is set or `npx codex login` has been completed locally.

The live path still goes through the same validator, diff generation, patch replay, and check gates as fallback mode.

## Key Design Decisions

- Structured `sourceAfter` is more reliable than model-authored patch text.
- Patch replay is required before promotion so the system does not trust generated output blindly.
- Safety failures are translated into plain-English UI copy, while the raw technical reason remains available.
- The workspace is preview-first so the demo feels like a product workflow, not a tooling console.
