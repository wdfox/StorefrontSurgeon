import { applyPatch, createTwoFilesPatch, parsePatch } from "diff";

import { EDITABLE_PREVIEW_PATH } from "@/lib/revisions/constants";
import type {
  PatchApplyResult,
  PatchValidationResult,
} from "@/lib/revisions/types";

export const MAX_PATCH_CHANGED_LINES = 320;

export function createPatchFromSources(
  currentSource: string,
  sourceAfter: string,
) {
  return createTwoFilesPatch(
    EDITABLE_PREVIEW_PATH,
    EDITABLE_PREVIEW_PATH,
    currentSource,
    sourceAfter,
    "before",
    "after",
  );
}

export function validatePatchText(patchText: string): PatchValidationResult {
  if (!patchText.trim()) {
    return { ok: false, reason: "Patch did not include any diff content." };
  }

  if (/GIT binary patch|Binary files/i.test(patchText)) {
    return { ok: false, reason: "Patch may not contain binary changes." };
  }

  let parsedPatch;

  try {
    parsedPatch = parsePatch(patchText);
  } catch {
    return { ok: false, reason: "Patch did not use a valid unified diff format." };
  }

  if (parsedPatch.length !== 1) {
    return { ok: false, reason: "Patch attempted to edit a forbidden file." };
  }

  const [filePatch] = parsedPatch;
  const touchesAllowedFile =
    filePatch.oldFileName === EDITABLE_PREVIEW_PATH &&
    filePatch.newFileName === EDITABLE_PREVIEW_PATH;

  if (!touchesAllowedFile) {
    return { ok: false, reason: "Patch attempted to edit a forbidden file." };
  }

  if (
    filePatch.oldFileName === "/dev/null" ||
    filePatch.newFileName === "/dev/null"
  ) {
    return { ok: false, reason: "Patch may not create or delete files." };
  }

  if (!filePatch.hunks.length) {
    return { ok: false, reason: "Patch did not include any diff hunks." };
  }

  const changedLines = filePatch.hunks.reduce((count, hunk) => {
    return (
      count +
      hunk.lines.filter((line) => line.startsWith("+") || line.startsWith("-")).length
    );
  }, 0);

  if (changedLines > MAX_PATCH_CHANGED_LINES) {
    return { ok: false, reason: "Patch exceeded the maximum allowed size." };
  }

  return { ok: true };
}

export function applyPatchToSource(
  currentSource: string,
  patchText: string,
): PatchApplyResult {
  try {
    const sourceAfter = applyPatch(currentSource, patchText);

    if (sourceAfter === false) {
      return { ok: false, reason: "Patch no longer applies to current revision." };
    }

    return { ok: true, sourceAfter };
  } catch {
    return { ok: false, reason: "Patch no longer applies to current revision." };
  }
}
