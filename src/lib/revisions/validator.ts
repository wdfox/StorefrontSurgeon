import { diffLines } from "diff";

import { EDITABLE_PREVIEW_PATH } from "@/lib/revisions/constants";
import { MAX_PATCH_CHANGED_LINES } from "@/lib/revisions/patcher";
import type {
  CodexPatchResponse,
  PatchValidationResult,
} from "@/lib/revisions/types";

const FORBIDDEN_IMPORT_PATTERN =
  /(from\s+["'][^"']*(cart|checkout|pricing)[^"']*["'])|(require\([^)]*(cart|checkout|pricing)[^)]*\))/i;
const ANY_IMPORT_PATTERN = /^\s*import\s+/m;
const FORBIDDEN_GLOBAL_PATTERN = /\b(fetch|process\.|window\.|document\.)/;
const FORBIDDEN_REQUEST_PATTERN =
  /\b(refactor|rewrite|modify|change|update|implement|wire|connect|integrate|extend|support|alter)\b[\s\S]{0,48}\b(cart|checkout|pricing(?:\s+(?:engine|logic))?|cart logic|checkout flow)\b/i;
const FORBIDDEN_REQUEST_REVERSE_PATTERN =
  /\b(cart|checkout|pricing(?:\s+(?:engine|logic))?|cart logic|checkout flow)\b[\s\S]{0,24}\b(logic|flow|behavior|integration|state|engine|backend)\b/i;
const FORBIDDEN_SUBSCRIPTION_REQUEST_PATTERN =
  /\b(subscriptions?|subscribe(?:\s*&\s*save)?|recurring(?:\s+purchase)?|membership)\b/i;
const FORBIDDEN_SUBSCRIPTION_OUTPUT_PATTERN =
  /\b(subscribe(?:\s*&\s*save)?|subscription|recurring|one-time purchase|one-time delivery)\b/i;

export function validateRequestedScope(prompt: string): PatchValidationResult {
  if (
    FORBIDDEN_SUBSCRIPTION_REQUEST_PATTERN.test(prompt) ||
    FORBIDDEN_REQUEST_PATTERN.test(prompt) ||
    FORBIDDEN_REQUEST_REVERSE_PATTERN.test(prompt)
  ) {
    return {
      ok: false,
      reason:
        "Request attempted to change cart, checkout, pricing, or subscription behavior outside the approved product-page surface.",
    };
  }

  return { ok: true };
}

export function validateGeneratedEdit({
  currentSource,
  patchResponse,
}: {
  currentSource: string;
  patchResponse: CodexPatchResponse;
}): PatchValidationResult {
  if (
    patchResponse.filesTouched.length !== 1 ||
    patchResponse.filesTouched[0] !== EDITABLE_PREVIEW_PATH
  ) {
    return { ok: false, reason: "Patch attempted to edit a forbidden file." };
  }

  if (patchResponse.sourceAfter.trim() === currentSource.trim()) {
    return { ok: false, reason: "Codex did not produce a meaningful file change." };
  }

  if (!patchResponse.sourceAfter.includes("export default function ProductPreview")) {
    return {
      ok: false,
      reason: "Editable preview must keep the default ProductPreview export.",
    };
  }

  if (ANY_IMPORT_PATTERN.test(patchResponse.sourceAfter)) {
    return {
      ok: false,
      reason: "Editable preview must stay self-contained and may not add imports.",
    };
  }

  if (FORBIDDEN_IMPORT_PATTERN.test(patchResponse.sourceAfter)) {
    return {
      ok: false,
      reason: "Patch attempted to import or reference forbidden commerce logic.",
    };
  }

  if (FORBIDDEN_GLOBAL_PATTERN.test(patchResponse.sourceAfter)) {
    return {
      ok: false,
      reason: "Editable preview must stay presentational and avoid runtime side effects.",
    };
  }

  if (FORBIDDEN_SUBSCRIPTION_OUTPUT_PATTERN.test(patchResponse.sourceAfter)) {
    return {
      ok: false,
      reason:
        "Editable preview may not introduce subscription or recurring purchase behavior.",
    };
  }

  if (/\buse(State|Effect|Reducer|LayoutEffect|Memo|Callback)\b/.test(patchResponse.sourceAfter)) {
    return {
      ok: false,
      reason: "Editable preview must stay a pure component without hooks.",
    };
  }

  const changedLines = diffLines(currentSource, patchResponse.sourceAfter).reduce(
    (count, part) => {
      if (!part.added && !part.removed) {
        return count;
      }

      return count + part.count;
    },
    0,
  );

  if (changedLines > MAX_PATCH_CHANGED_LINES) {
    return { ok: false, reason: "Patch exceeded the maximum allowed size." };
  }

  return { ok: true };
}
