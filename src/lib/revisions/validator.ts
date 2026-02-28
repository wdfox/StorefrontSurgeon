import { diffLines } from "diff";

import { EDITABLE_PREVIEW_PATH } from "@/lib/revisions/constants";
import { APPROVED_PREVIEW_CLASS_SET } from "@/lib/revisions/previewClasses";
import type {
  CodexPatchResponse,
  PatchValidationResult,
} from "@/lib/revisions/types";

const FORBIDDEN_IMPORT_PATTERN =
  /(from\s+["'][^"']*(cart|checkout|pricing)[^"']*["'])|(require\([^)]*(cart|checkout|pricing)[^)]*\))/i;
const ANY_IMPORT_PATTERN = /^\s*import\s+/m;
const FORBIDDEN_GLOBAL_PATTERN = /\b(fetch|process\.|window\.|document\.)/;
const CLASS_NAME_PATTERN = /className\s*=\s*"([^"]+)"/g;
const BRACED_CLASS_NAME_PATTERN = /className\s*=\s*{/;

function collectClassTokens(source: string) {
  const tokens = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = CLASS_NAME_PATTERN.exec(source))) {
    match[1]
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .forEach((token) => tokens.add(token));
  }

  return [...tokens];
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

  if (BRACED_CLASS_NAME_PATTERN.test(patchResponse.sourceAfter)) {
    return {
      ok: false,
      reason:
        "Editable preview must use literal className strings from the approved preview allowlist.",
    };
  }

  if (/\buse(State|Effect|Reducer|LayoutEffect|Memo|Callback)\b/.test(patchResponse.sourceAfter)) {
    return {
      ok: false,
      reason: "Editable preview must stay a pure component without hooks.",
    };
  }

  const unsupportedClassTokens = collectClassTokens(patchResponse.sourceAfter).filter(
    (token) => !APPROVED_PREVIEW_CLASS_SET.has(token),
  );

  if (unsupportedClassTokens.length > 0) {
    return {
      ok: false,
      reason: `Editable preview used unsupported utility classes: ${unsupportedClassTokens
        .slice(0, 8)
        .join(", ")}. Reuse only the approved preview class tokens.`,
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

  if (changedLines > 220) {
    return { ok: false, reason: "Patch exceeded the maximum allowed size." };
  }

  return { ok: true };
}
