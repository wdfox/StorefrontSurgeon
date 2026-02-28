export type SurgeryPresetKey = "sticky-buy-bar";
export type RevisionStatus = "pending" | "applied" | "blocked" | "failed";
export type RevisionRunStage =
  | "generating"
  | "validating"
  | "testing"
  | "applying"
  | "complete";

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

export type PatchApplyResult =
  | { ok: true; sourceAfter: string }
  | { ok: false; reason: string };

export type TestRunResult = {
  status: "passed" | "failed";
  output: string;
};

export type RevisionSnapshot = {
  revisionId: string;
  status: RevisionStatus;
  runStage: RevisionRunStage;
  prompt: string;
  summary: string[];
  patchText: string;
  blockedReason?: string;
  testStatus?: string | null;
  testOutput?: string | null;
  sourceAfter?: string;
  createdAt: string;
};

export type RevisionExecutionResult = {
  revisionId: string;
  status: Exclude<RevisionStatus, "pending">;
  runStage: RevisionRunStage;
  summary: string[];
  patchText: string;
  blockedReason?: string;
  testStatus?: "passed" | "failed";
  testOutput?: string;
  sourceAfter?: string;
};

export type RestoreRequest =
  | { target: "baseline" }
  | { target: "revision"; revisionId: string };

export type RestoreResponse = {
  revisionId: string;
  status: "applied" | "failed";
  summary: string[];
  patchText: string;
  testStatus?: "passed" | "failed";
  testOutput?: string;
  blockedReason?: string;
};

export type RevisionReplayResponse =
  | { ok: true; patchText: string; sourceAfter: string }
  | { ok: false; error: string };
