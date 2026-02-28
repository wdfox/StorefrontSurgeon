# Storefront Surgeon

## Goal

Build a small but fully working demo app that shows Codex acting as a constrained storefront engineer inside a realistic eCommerce workflow.

The app should demonstrate:

- user login
- persisted projects and revisions
- programmatic Codex usage inside the app
- test-backed code changes
- a visibly impressive before/after transformation

## Why This Is The Right Project

This concept is the best fit for the assignment because it balances scope, signal, and demo quality.

- It is visually impressive in under 30 seconds.
- It naturally showcases Codex as part of an engineering system, not just a chat UI.
- It creates clear places to demonstrate Senior/Staff judgment: constraints, validation, failure handling, testing, and auditability.
- It can be completed in a tight scope without feeling like a toy.

The core story is:

> Turn a plain-English conversion request into a constrained, test-verified patch with revision history.

## Product Summary

Storefront Surgeon is a web app where a logged-in user selects a demo storefront, requests a conversion-focused change, and watches Codex generate a patch, apply it safely, run tests, and save the result as a revision.

Example request:

> Add a sticky mobile buy bar, trust badges, and urgency copy without changing cart logic.

## Success Criteria

The project succeeds if the demo clearly shows:

1. A user can log in and create a project.
2. The app stores a baseline storefront and multiple revisions.
3. A request triggers Codex programmatically and returns a structured patch response.
4. The app validates and applies the patch only within allowed boundaries.
5. The updated storefront renders visibly differently from the baseline.
6. Tests run and report pass/fail.
7. A blocked or invalid change demonstrates safety thinking.

## MVP Scope

Keep the surface area narrow. One excellent loop is better than a wide but brittle app.

### In Scope

- Authenticated web app
- One storefront page template
- One editable source file for the main visual changes
- Project creation and revision history
- Request form with clear constraints
- Programmatic Codex call from the server
- Patch validation
- Patch application
- Before/after preview
- Test run UI
- Revert to previous revision

### Out of Scope

- Real ecommerce backend integration
- Real checkout flow
- Multi-user collaboration
- Arbitrary file editing across the whole repo
- Production-grade sandboxing
- Complex asynchronous job system

## User Experience

### Primary Flow

1. User logs in.
2. User opens a project with a baseline product page.
3. User enters a request or selects a preset surgery.
4. The app sends the request, current file content, and constraints to Codex.
5. Codex returns a patch and short rationale.
6. The app validates the patch.
7. If valid, the app applies it to the stored source.
8. The app runs tests against the updated code.
9. The app shows:
   - patch diff
   - rationale
   - test status
   - side-by-side before/after preview
10. The app saves the change as a revision.

### Safety Flow

1. User requests a prohibited change, such as editing cart logic.
2. Codex attempts a patch that touches a forbidden file or forbidden region.
3. The validator rejects the patch.
4. The UI explains why the patch was blocked.

This is an important part of the demo because it shows bounded autonomy.

## Demo Surgeries

Use 3 or 4 preset changes that are visually obvious and likely to produce compelling diffs.

### Recommended Presets

1. Sticky mobile buy bar
2. Trust badges under the CTA
3. Urgency or reassurance copy variant
4. Seasonal campaign mode

Example requests:

- Add a sticky mobile buy bar with price and buy button.
- Add trust badges for free shipping, easy returns, and secure checkout.
- Add urgency copy that says "Only 8 left" near the CTA.
- Create a spring sale treatment with a promotional banner and softer palette accents.

## Architecture

### Stack

- Next.js App Router
- TypeScript
- Auth.js
- Prisma
- SQLite
- Tailwind CSS
- Vitest

This stack is fast to scaffold, easy to reason about, and good for demo polish.

### System Components

#### Frontend

- login page
- project list page
- project detail page
- diff viewer
- before/after preview
- revision timeline
- test status panel

#### Backend

- auth/session handling
- project and revision persistence
- Codex orchestration route
- patch validation
- patch application
- test execution

#### Codex Integration

Codex should be called server-side with:

- current editable source file
- allowed files
- allowed behavior constraints
- user request
- expected output schema

Codex should return structured output, not freeform prose.

## Codex Contract

The app should treat Codex as a patch generator inside a deterministic workflow.

### Input

- project context
- current source for allowed file(s)
- selected request
- hard constraints
- output format instructions

### Output

A JSON object such as:

```json
{
  "summary": [
    "Added sticky mobile CTA bar",
    "Added trust badges below primary button"
  ],
  "patch": "*** Begin Patch ...",
  "filesTouched": ["ProductPage.tsx"]
}
```

### Constraints

- Only edit `ProductPage.tsx`
- Preserve accessibility semantics
- Do not modify cart logic
- Keep patch under a fixed line-count threshold
- Return a patch only, no extra code fences

## Safety Model

This is the part that makes the app feel Senior-level rather than gimmicky.

### Guardrails

- allowlist editable files
- reject malformed patches
- reject forbidden files
- reject oversized patches
- apply patches deterministically
- run tests before accepting the revision

### Failure Handling

- If patch validation fails, show a blocked state with explanation.
- If patch application fails, keep the current revision unchanged.
- If tests fail, mark the revision as failed and optionally retry once.

### Optional Retry Loop

If tests fail:

1. send failure output and current patch context back to Codex
2. request a fix patch
3. retry once only

This is a good stretch goal, not required for MVP.

## Data Model

Three core models are enough.

### User

- id
- email
- name
- createdAt

### Project

- id
- userId
- name
- baselineSource
- createdAt
- updatedAt

### Revision

- id
- projectId
- prompt
- summary
- patch
- sourceAfter
- status (`pending`, `applied`, `blocked`, `failed`)
- testOutput
- createdAt

## Suggested File Boundaries

To keep the implementation tight, limit code edits to a small, controlled mini-workspace.

Example editable demo files:

- `src/demo/ProductPage.tsx`
- `src/demo/productPage.test.tsx`

Non-editable support files:

- auth
- database models
- UI shell
- patch validator
- preview wrapper

## Meaningful Tests

Keep the suite small but relevant.

### Minimum Test Set

1. Patch validator rejects forbidden file edits.
2. Patch application succeeds for a valid patch.
3. Product page renders expected surgery output after a known valid revision.

### Good Stretch Test

4. Retry loop repairs one failing patch and then passes.

## UI Requirements

### Project Detail Screen

Must include:

- baseline and updated previews
- request input or preset chips
- generate button
- diff display
- rationale summary
- test results
- revision history
- revert button

### UX Details That Matter

- loading states for generation and test execution
- clear blocked/error states
- obvious visual delta between before and after
- revision labels that read like a productized tool

## Demo Script

### Part 1: Product Demo

1. Show a plain baseline product page.
2. Explain the request: increase conversion with a sticky buy bar and trust signals.
3. Click generate.
4. Show the structured patch and short rationale.
5. Show the before/after preview.
6. Run tests and show passing status.
7. Show revision history and revert.
8. Attempt an unsafe change and show the validator blocking it.

### Part 2: How It Was Built

1. Show the architecture at a high level.
2. Explain Codex as a bounded patch generator, not a freeform code writer.
3. Show the validator and test loop.
4. Point out persistence and revision history.
5. Close with production extensions: sandboxing, AST validation, observability.

## 4-Hour Build Plan

### Hour 1

- scaffold Next.js app
- set up auth
- set up Prisma + SQLite
- create baseline project and revision schema

### Hour 2

- build project detail page
- render baseline product page
- add Codex route with mocked fallback if needed
- add diff/rationale/test panels

### Hour 3

- implement patch validation and application
- persist revisions
- add test runner flow
- write core tests

### Hour 4

- polish UI
- add blocked-patch scenario
- tighten copy and loading states
- rehearse and record demo

## Implementation Priorities

If time runs short, preserve these in order:

1. before/after preview
2. persisted revisions
3. patch validation
4. passing tests
5. blocked unsafe patch demo

If something must be cut, cut retry logic first.

## What Makes This Stand Out

The differentiator is not that Codex writes code. The differentiator is that the app treats Codex like a constrained engineering subsystem.

That means the demo should emphasize:

- bounded file scope
- deterministic validation
- visible patch artifacts
- testing before acceptance
- audit trail of revisions

This is the strongest way to signal Senior/Staff-level judgment in a short take-home.

## Recommended Build Decision

Build Storefront Surgeon as the main app.

If there is extra time, add a "Campaign Mode" preset that applies a more dramatic seasonal storefront treatment using the same patch workflow. That gives some of the visual energy of the "AI Store Designer" idea without losing the stronger engineering narrative.
