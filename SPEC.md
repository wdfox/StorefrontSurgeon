# Product Spec

## Summary

Storefront Surgeon is a small web app that demonstrates Codex acting as a constrained storefront engineer inside a realistic eCommerce workflow. A user opens a saved storefront, requests a visual merchandising change, and watches the app generate, validate, test, and save that update as a revision.

## Product Goal

Show an end-to-end product experience where model output is useful, bounded, and auditable.

The project should clearly communicate:

- Codex is integrated into an application workflow, not exposed as unrestricted repo access
- changes are constrained to a narrow, approved editing surface
- generated output is verified before it becomes the active project version
- the user can inspect results through preview, history, and safety feedback

## User Story

As a user, I want to request a product-page improvement in plain English and see the app generate a safe, reviewable update without risking the rest of the storefront.

## Primary Experience

1. The user logs in with demo credentials.
2. The user opens a storefront project.
3. The user enters a presentational product-page request or chooses an example prompt.
4. The app creates a pending revision and calls the Codex adapter.
5. The revision pipeline validates the generated update, replays the diff locally, runs deterministic checks, and promotes the new version only on success.
6. The workspace shows progress, updated preview state, revision history, and check results.

## Core Product Constraints

- Codex may edit only `src/demo/EditableProductPreview.tsx`
- requests must stay inside presentational product-page merchandising scope
- imports, hooks, side effects, and broader commerce behavior are blocked
- the promoted project source must come from deterministic patch replay, not blind trust in generated output
- every attempt is persisted as a revision with result metadata

## Success Criteria

The product is successful if it demonstrates:

1. User authentication and persisted projects
2. A visible before/after storefront update
3. Programmatic Codex usage inside the app
4. Clear safety boundaries around the editable surface
5. Deterministic validation and checks before promotion
6. Revision history and restore behavior
7. A blocked-path story that shows judgment, not just happy-path generation

## Current Scope

### Included

- demo credentials auth
- Prisma + SQLite persistence
- project creation
- one bounded editable storefront component
- live and fallback Codex adapter paths
- revision generation, validation, replay, and deterministic checks
- restore and stale-diff replay flows
- revision timeline, diff view, and progress UI

### Intentionally Excluded

- unrestricted multi-file editing
- real checkout or cart integration
- multi-user collaboration
- production-grade sandboxing
- asynchronous background job infrastructure
- automatic self-repair loops after failed checks

## Product Surfaces

### Routes

- `/login`
  - demo auth entry point
- `/projects`
  - project list and creation
- `/projects/[projectId]`
  - main workspace
- `/api/projects/[projectId]/surgeries`
  - revision generation
- `/api/projects/[projectId]/revisions/[revisionId]`
  - revision polling
- `/api/projects/[projectId]/restore`
  - restore baseline or approved revision
- `/api/projects/[projectId]/revisions/[revisionId]/replay`
  - stale-diff replay

### Core Domain Objects

- `User`
  - demo identity
- `Project`
  - user-scoped workspace with `baselineSource` and `activeSource`
- `Revision`
  - immutable record of generation or restore outcome

## Non-Goals

- simulate a full commerce platform
- allow Codex to roam across the repo
- optimize for maximum automation over trust and clarity

## Supporting Docs

- implementation overview: [ARCHITECTURE.md](ARCHITECTURE.md)
- local setup and usage: [README.md](README.md)
