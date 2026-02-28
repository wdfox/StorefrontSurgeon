import { createTwoFilesPatch } from "diff";

import { EDITABLE_PREVIEW_PATH } from "@/lib/revisions/constants";

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
