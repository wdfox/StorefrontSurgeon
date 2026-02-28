# Storefront Surgeon

Storefront Surgeon is a demo app for the Codex take-home. It shows Codex acting as a constrained storefront engineer inside a realistic eCommerce workflow:

- authenticate a user
- load a persisted storefront project
- generate a bounded TSX update
- validate generated source and compute a diff locally
- run deterministic checks
- save the revision and render the before/after result

The current implementation is the foundation slice of that product.

## Current State

The repo currently includes:

- demo credentials auth with Auth.js credentials provider
- Prisma + SQLite persistence
- one seeded project and revision history model
- a deterministic storefront preview renderer
- a server-side Codex adapter with live/fallback modes
- generated-source validation, local diff generation, and test gating
- a preview-first product-page workspace with an inline request bar
- backend-driven run stages and a live progress drawer
- deterministic patch validation/application before promotion
- in-app restore to baseline or a prior saved version
- advanced stale-diff replay for conflict demos
- plain-English blocked-error messaging with optional technical detail
- a full happy-path UI for `/login`, `/projects`, and `/projects/[projectId]`
- a blocked unsafe-change path for forbidden prompts like `cart` or `checkout`

The project planning/spec document is in [SPEC.md](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/SPEC.md). Progress tracking and next steps are in [STATUS.md](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/STATUS.md).

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Auth.js
- Prisma
- SQLite
- Codex SDK
- Vitest + Testing Library

## Architecture

### High-level flow

1. A logged-in user opens a seeded storefront project.
2. The project page loads `baselineSource`, `activeSource`, and past revisions from SQLite.
3. The user submits a surgery request.
4. `POST /api/projects/[projectId]/surgeries` calls the revision orchestrator.
5. The orchestrator:
   - creates a `pending` revision
   - calls the Codex adapter
   - validates the returned `sourceAfter`
   - computes a unified diff locally
   - validates and reapplies that diff deterministically
   - runs deterministic tests
   - promotes `activeSource` only if tests pass
   - persists the final revision status
6. The UI opens on the current storefront preview, lets the user describe a change inline, then:
   - polls backend-driven run stages
   - updates the preview when an approved revision is applied
   - shows safety-check output
   - keeps diff details secondary
   - persists the update history for review

### Main boundaries

- `src/lib/codex/*`
  - model-facing layer
  - chooses live OpenAI or deterministic fallback

- `src/lib/revisions/*`
  - application core
  - owns validation, diff generation, test execution, and orchestration

- `src/demo/*`
  - demo storefront artifact
  - foundation scope is intentionally limited to editing `src/demo/EditableProductPreview.tsx`

- `src/components/*`
  - UI shell for login, projects, diffs, previews, and status

- `prisma/*`
  - schema, migration SQL, and seed script

### Foundation constraint

The current implementation gives Codex one bounded TSX file to edit: `src/demo/EditableProductPreview.tsx`. The app validates the generated source, computes the diff locally, and blocks changes to any other file or protected logic.

The validator also enforces an approved preview-class allowlist. That constraint is intentional: preview source is stored in SQLite and evaluated at runtime, so arbitrary Tailwind classes would not exist in the compiled CSS bundle.

## Routes

- `/`
  - redirects to `/login` or `/projects` depending on session

- `/login`
  - credentials login page

- `/projects`
  - authenticated project list

- `/projects/[projectId]`
  - authenticated project workspace

- `/api/auth/[...nextauth]`
  - Auth.js route

- `/api/projects/[projectId]/surgeries`
  - revision generation endpoint

- `/api/projects/[projectId]/revisions/[revisionId]`
  - revision polling endpoint for backend-driven run status

- `/api/projects/[projectId]/restore`
  - restores the baseline or a previously approved version

- `/api/projects/[projectId]/revisions/[revisionId]/replay`
  - advanced demo endpoint for replaying a saved diff against the current source

## Data Model

### `User`

- login identity
- currently seeded with one demo user

### `Project`

- user-scoped workspace
- stores `baselineSource` and current `activeSource`

### `Revision`

- immutable record of one surgery attempt
- stores prompt, patch, status, test result, and optional blocked reason

Schema source: [prisma/schema.prisma](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/prisma/schema.prisma)

## Running The App

### Requirements

- Node.js
- npm
- `sqlite3` CLI available on the machine

### Environment

Copy `.env.example` to `.env` if needed. The current local defaults are:

```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="replace-me-with-a-long-random-secret"
OPENAI_API_KEY=""
OPENAI_CODEX_MODEL=""
CODEX_PATH=""
```

### Install and bootstrap

```bash
npm install
npm run db:setup
```

This does three things:

1. generates the Prisma client
2. applies the checked-in SQLite migration SQL
3. seeds the demo user and project

### Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo credentials

- email: `demo@storefrontsurgeon.dev`
- password: `demo1234`

## Useful Commands

```bash
npm run dev
npm run lint
npm test
npm run build
npm run demo:reset
npm run prisma:generate
npm run db:migrate
npm run db:seed
npm run db:setup
```

## OpenAI / Codex Integration

The app supports two modes:

### Fallback mode

Used when neither `OPENAI_API_KEY` nor a Codex CLI login session is available.

- deterministic `sourceAfter` output
- deterministic blocked response for forbidden prompts
- stable local demo behavior

### Live mode

Used when either:

- `OPENAI_API_KEY` is present, or
- Codex CLI auth exists from `npx codex login`

- calls the real Codex SDK through [src/lib/codex/live.ts](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/src/lib/codex/live.ts)
- runs Codex in a read-only sandbox with `approvalMode: "never"`
- passes a structured JSON schema via the SDK `outputSchema`
- still passes through the same validator, local diff generator, and test gate

## Testing

Current automated tests cover:

- validator accepts and rejects the right patch shapes
- local diff generation
- renderer behavior for baseline vs bounded TSX revisions
- deterministic preview checks for rendered storefront structure

Run them with:

```bash
npm test
```

## Implementation Notes

### Session learnings

The main implementation lessons from this session were:

1. Structured `sourceAfter` is more reliable than model-authored patch text.
2. The workspace works better as a preview-first experience than a tool-first console.
3. Backend-driven run stages are worth the plumbing because fake client timers break the credibility of the demo.
4. Verification output can become stale when test rules evolve, so replaying checks against the latest candidate improves clarity.
5. Runtime-generated Tailwind utilities need an allowlist because SQLite-backed preview source is invisible to Tailwind's build-time scanner.
6. Validator failures should be translated into plain-English guidance for non-technical users, with the raw reason still available on demand.

### Demo workspace notes

These are the repo-specific details that matter most when changing the demo:

1. The seeded product-page baseline is stored in SQLite, not read live from disk.
   If you change `src/demo/EditableProductPreview.tsx`, run `npm run db:seed` so the workspace opens on the updated baseline again.
2. Keep `src/demo/EditableProductPreview.tsx` and `src/lib/codex/fallback.ts` visually aligned.
   The fallback path is part of the demo story and should not drift from the seeded baseline product too far.
3. Generated preview changes still go through the preview class allowlist in `src/lib/revisions/previewClasses.ts`.
   If the baseline introduces new reusable preview classes, update the allowlist intentionally.
4. The simplified workspace flow is:
   preview -> describe change -> watch progress -> review checks/history -> open technical diff only if needed.
5. Re-seeding the DB is the quickest way to get back to a clean first-visit demo state because it clears saved revisions for the seeded project.
6. For live demos, the preferred recovery flow is the in-app `Restore original` action, with `npm run demo:reset` as the operator fallback before you start the session.

## Demo Runbook

The interview/demo sequence is documented in [DEMO.md](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/DEMO.md).

### Prisma migration note

`prisma migrate dev` was failing in this local environment due to a Prisma schema engine issue, even though schema validation and Prisma Client generation worked. To keep progress unblocked, the repo uses a checked-in SQLite migration at [prisma/migrations/0001_init/migration.sql](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/prisma/migrations/0001_init/migration.sql), and `npm run db:migrate` applies it through the `sqlite3` CLI.

That workaround is intentional and currently part of the project setup.

### Seeded database file

The SQLite file currently lives at `prisma/dev.db`. Re-running `npm run db:seed` is safe for the seeded user/project because the seed uses upserts.

### Live Codex setup

There are two supported ways to enable live generation:

#### Option 1: Codex login

Use your existing OpenAI/ChatGPT account with the Codex CLI login flow:

```bash
npx codex login
```

If that succeeds, Codex stores auth under `~/.codex/auth.json`, and the app will use the Codex SDK live path automatically.
When using Codex CLI login, leave `OPENAI_CODEX_MODEL` empty unless you know the chosen model is supported by that login method. If it is blank, the app defers to your Codex CLI config.

If the local npm package cannot locate the native Codex binary, point the app at a working CLI install:

```bash
CODEX_PATH="/absolute/path/to/codex"
```

You can find that path with:

```bash
which codex
```

#### Option 2: API key

Set:

```bash
OPENAI_API_KEY="your_api_key"
OPENAI_CODEX_MODEL="gpt-5-mini"
```

Either setup path activates the Codex SDK integration.

When using `codex login` with a ChatGPT-backed session, leave `OPENAI_CODEX_MODEL` blank unless you know the chosen model is supported by that auth mode.

## Suggested Demo Flow

1. Log in with the demo user.
2. Open `Spring Conversion Refresh`.
3. Start from the product preview and describe a visual change.
4. Show the backend-driven progress drawer while the revision runs.
5. Review the updated page, safety checks, and saved history.
6. Try a freeform prompt mentioning `cart` or `checkout`.
7. Show the blocked revision and unchanged active preview, then open the technical reason only if needed.

## Where To Look First

- app shell: [src/app](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/src/app)
- main workspace UI: [src/components/projects/WorkspaceExperience.tsx](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/src/components/projects/WorkspaceExperience.tsx)
- core orchestration: [src/lib/revisions/orchestrator.ts](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/src/lib/revisions/orchestrator.ts)
- Codex adapter: [src/lib/codex/adapter.ts](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/src/lib/codex/adapter.ts)
- editable demo source: [src/demo/EditableProductPreview.tsx](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/src/demo/EditableProductPreview.tsx)
- preview compiler and evaluator: [src/lib/revisions/source.ts](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/src/lib/revisions/source.ts)
- user-facing error translation: [src/lib/revisions/userFacing.ts](/Users/wdfox/Documents/Documents%20-%20Will%E2%80%99s%20Mac%20mini/Jobs/JobSearch2026/openAICodexRole/StorefrontSurgeon/src/lib/revisions/userFacing.ts)

## Next Work

The next likely improvements are:

1. Revert to any previous revision.
2. Add one retry-on-failure repair loop.
3. Improve the diff presentation beyond raw patch text.
4. Add more preset surgeries and a more dramatic campaign mode.
5. Tighten patch validation with AST-aware or schema-aware checks.
6. Add a more production-like auth path if needed.
