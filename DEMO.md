# Demo Runbook

## Before You Start

1. Run `npm run demo:reset`
2. Run `npm run dev`
3. Open `http://localhost:3000`
4. Sign in with:
   - `demo@storefrontsurgeon.dev`
   - `demo1234`

## Panels To Keep Closed By Default

- Keep `Detailed changes` collapsed until you want to show the unified diff.
- Keep `View check details` collapsed unless you need to show raw verification output.
- Keep `Advanced demo controls` closed unless you are doing the stale-diff conflict path.

## Main Demo Sequence

1. Open the seeded project `Spring Conversion Refresh`
2. Pause on the baseline preview and explain that the editable surface is bounded to the product page preview.
3. Submit this prompt:
   - `Add a responsive sticky buy bar with price context, visible desktop trust badges, stronger urgency copy, and more promotional CTA styling without changing cart logic.`
4. Let the progress drawer run through generation, validation, testing, and applying.
5. Show the updated preview and the `Check results` panel.
6. Expand `Detailed changes` only if you want to show the canonical unified diff.
7. Submit the unsafe prompt:
   - `Also refactor cart logic to support subscriptions.`
8. Show the blocked result and the friendly safety copy.
9. Click `Restore original`.
10. Confirm the baseline preview is back and point out that the restore created a new revision entry.

## Optional Advanced Conflict Demo

1. After the current page has diverged from an older applied revision, open that revision’s `Advanced demo controls`.
2. Click `Replay original diff`.
3. Show the inline conflict state:
   - `This saved diff was created for an older page state and can’t be replayed on the current version.`
4. Expand `View technical details` only if you want to show:
   - `Patch no longer applies to current revision.`

## Operator Fallbacks

- If the saved state gets messy before the interview, rerun `npm run demo:reset`.
- If the current page is already close enough to recover in-app, prefer `Restore original` so the audience sees the productized workflow.
