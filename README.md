# Storefront Surgeon

Storefront Surgeon is a constrained storefront-editing demo built for the OpenAI Codex take-home. A user opens a saved storefront, requests a visual product-page change, and watches the app generate, validate, test, and save that update as a revision.

## What It Shows

- Codex used programmatically inside an application, not just as a chat surface
- a bounded editing model with explicit safety constraints
- deterministic validation, patch replay, and test gating before promotion
- a polished product workflow with saved revision history

## Quick Start

### Requirements

- Node.js
- npm
- `sqlite3` CLI

### Setup

```bash
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If you do not need live Codex access, the default values in `.env.example` are enough for local fallback mode.

### Demo Credentials

- email: `demo@storefrontsurgeon.dev`
- password: `demo1234`

## First-Time Walkthrough

1. Log in with the demo credentials.
2. Open the seeded `Spring Conversion Refresh` project.
3. Use one of the example prompts or type a new visual request.
4. Watch the progress drawer move through generation, validation, testing, and apply.
5. Review the updated preview, check results, and revision history.
6. Try an intentionally out-of-scope prompt mentioning `cart` or `checkout` to see the safety path.

## Core Constraint

Codex is intentionally limited to one editable file: `src/demo/EditableProductPreview.tsx`.

That constraint is the center of the demo:

- generated output must stay inside a self-contained presentational TSX component
- imports, hooks, side effects, checkout/cart behavior, and oversized patches are blocked
- the project promotes a new active version only after deterministic replay and passing checks

## Live And Fallback Modes

### Fallback mode

Fallback mode is used when neither `OPENAI_API_KEY` nor a Codex CLI login session is available.

- deterministic `sourceAfter` output
- deterministic blocked responses for forbidden prompts
- stable local behavior for demos and tests

### Live mode

Live mode is used when either:

- `OPENAI_API_KEY` is set, or
- you have authenticated locally with `npx codex login`

The live path still goes through the same validator, diff generator, patch replay, and test gate as fallback mode.

If the SDK cannot find the native Codex binary, set:

```bash
CODEX_PATH="/absolute/path/to/codex"
```

If you prefer API-key auth, set:

```bash
OPENAI_API_KEY="your_api_key"
OPENAI_CODEX_MODEL="gpt-5-mini"
```

When using a ChatGPT-backed `codex login` session, leave `OPENAI_CODEX_MODEL` blank unless you know the selected model is supported by that auth mode.

## Testing

Run the full verification suite with:

```bash
npm run lint
npm test
npm run test:e2e
npm run build
```

Coverage includes unit tests for the revision pipeline, renderer, validation, and user-facing error copy, plus an end-to-end browser smoke test for the main demo flow.

## Local Development Notes

- The seeded baseline lives in SQLite, not on disk at runtime.
  - If you change `src/demo/EditableProductPreview.tsx`, run `npm run db:seed` so the seeded project picks up the new baseline.
- Keep `src/demo/EditableProductPreview.tsx` and `src/lib/codex/fallback.ts` visually aligned.
  - The fallback path is part of the demo story and should not drift too far from the seeded baseline.
- For live demos, prefer the in-app `Restore original` action.
  - `npm run demo:reset` is the operator fallback when you want a fresh seeded state before starting over.

## Additional Context

- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- Product spec: [SPEC.md](SPEC.md)
