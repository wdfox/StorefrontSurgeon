import type { RevisionRunStage, RevisionStatus } from "@/lib/revisions/types";

export type LatestRun = {
  id: string;
  prompt: string;
  status: RevisionStatus;
  runStage: RevisionRunStage;
  summary: string[];
  patchText: string | null;
  testStatus: string | null;
  testOutput: string | null;
  blockedReason: string | null;
  createdAtLabel: string;
};

export type RevisionTimelineItem = {
  id: string;
  prompt: string;
  status: string;
  testStatus: string | null;
  testOutput: string | null;
  blockedReason: string | null;
  summary: string[];
  verificationNote: string | null;
  createdAtLabel: string;
  isCurrent: boolean;
  isLatest: boolean;
  isOriginal: boolean;
  canRestore: boolean;
};

export type DrawerState = {
  requestPrompt: string;
  error: string | null;
};

export type ActionNotice = {
  tone: "success" | "error";
  text: string;
};
