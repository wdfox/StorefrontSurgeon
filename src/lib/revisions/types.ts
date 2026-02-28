export type SurgeryPresetKey = "sticky-buy-bar";

export type GenerateSurgeryRequest = {
  projectId: string;
  prompt: string;
  presetKey?: SurgeryPresetKey;
};

export type CodexPatchResponse = {
  summary: string[];
  sourceAfter: string;
  filesTouched: string[];
};

export type PatchValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

export type TestRunResult = {
  status: "passed" | "failed";
  output: string;
};

export type RevisionExecutionResult = {
  revisionId: string;
  status: "applied" | "blocked" | "failed";
  summary: string[];
  patchText: string;
  blockedReason?: string;
  testStatus?: "passed" | "failed";
  testOutput?: string;
  sourceAfter?: string;
};
