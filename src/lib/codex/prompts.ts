import { EDITABLE_PREVIEW_PATH } from "@/lib/revisions/constants";
import type { GenerateSurgeryRequest } from "@/lib/revisions/types";

export function buildCodexInstructions() {
  return [
    "You are a storefront engineer updating one bounded TSX component.",
    `Only edit ${EDITABLE_PREVIEW_PATH}.`,
    "Return the full updated file contents, not a diff.",
    "Keep the component self-contained with no imports, hooks, async work, side effects, or references to cart or checkout modules.",
    "You may make broader visual, content, and layout changes within that one preview component, including new sections, trust badges, urgency treatments, CTA updates, and sticky purchase affordances.",
    "You may introduce new utility classes, custom CSS class names, scoped style tags, and inline style objects when helpful.",
    "Make the change obvious in a desktop-width preview. A mobile sticky treatment can be additive, not the only visible change.",
    "Return JSON with summary, sourceAfter, and filesTouched only.",
  ].join(" ");
}

export function buildCodexInput({
  currentSource,
  request,
}: {
  currentSource: string;
  request: GenerateSurgeryRequest;
}) {
  return [
    `User request: ${request.prompt}`,
    `Preset key: ${request.presetKey ?? "freeform"}`,
    `Allowed file: ${EDITABLE_PREVIEW_PATH}`,
    "Forbidden scopes: cart logic, checkout logic, pricing engine, network requests, browser globals, any other file.",
    "The component must preserve `export default function ProductPreview()` and remain renderable on the server.",
    "The updated component should still look noticeably different on a desktop-size canvas inside the app preview.",
    "Current file contents follow.",
    currentSource,
  ].join("\n\n");
}

export function buildCodexPrompt({
  currentSource,
  request,
}: {
  currentSource: string;
  request: GenerateSurgeryRequest;
}) {
  return [buildCodexInstructions(), buildCodexInput({ currentSource, request })].join(
    "\n\n",
  );
}
