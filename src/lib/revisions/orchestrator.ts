import { prisma } from "@/lib/db";
import { generatePatch } from "@/lib/codex/adapter";
import {
  applyPatchToSource,
  createPatchFromSources,
  validatePatchText,
} from "@/lib/revisions/patcher";
import { runRevisionTests } from "@/lib/revisions/tests";
import type {
  GenerateSurgeryRequest,
  RevisionExecutionResult,
  RevisionReplayResponse,
  RevisionRunStage,
  RevisionSnapshot,
  RestoreRequest,
  RestoreResponse,
} from "@/lib/revisions/types";
import {
  validateGeneratedEdit,
  validateRequestedScope,
} from "@/lib/revisions/validator";

const REQUEST_SCOPE_BLOCK_SUMMARY = [
  "Blocked a request that reached beyond the approved product-page demo surface.",
];
const PATCH_MISMATCH_REASON = "Patched result did not match generated source.";

function sanitizeSummary(summary: unknown): string[] {
  return Array.isArray(summary)
    ? summary.filter((item): item is string => typeof item === "string")
    : [];
}

async function blockRevision({
  revisionId,
  runStage,
  reason,
  summary = [],
  patchText = "",
  sourceAfter,
}: {
  revisionId: string;
  runStage: RevisionRunStage;
  reason: string;
  summary?: string[];
  patchText?: string;
  sourceAfter?: string;
}): Promise<RevisionExecutionResult> {
  await prisma.revision.update({
    where: { id: revisionId },
    data: {
      status: "blocked",
      runStage,
      summary,
      patchText,
      sourceAfter,
      blockedReason: reason,
    },
  });

  return {
    revisionId,
    status: "blocked",
    runStage,
    summary,
    patchText,
    blockedReason: reason,
  };
}

export async function createPendingRevision({
  projectId,
  currentSource,
  request,
}: {
  projectId: string;
  currentSource: string;
  request: GenerateSurgeryRequest;
}) {
  return prisma.revision.create({
    data: {
      projectId,
      prompt: request.prompt,
      presetKey: request.presetKey,
      summary: [],
      patchText: "",
      sourceBefore: currentSource,
      status: "pending",
      runStage: "generating",
      testStatus: "not_run",
    },
  });
}

export async function getRevisionSnapshot(revisionId: string): Promise<RevisionSnapshot | null> {
  const revision = await prisma.revision.findUnique({
    where: { id: revisionId },
  });

  if (!revision) {
    return null;
  }

  return {
    revisionId: revision.id,
    status: revision.status as RevisionSnapshot["status"],
    runStage: revision.runStage as RevisionRunStage,
    prompt: revision.prompt,
    summary: sanitizeSummary(revision.summary),
    patchText: revision.patchText,
    blockedReason: revision.blockedReason ?? undefined,
    testStatus: revision.testStatus,
    testOutput: revision.testOutput,
    sourceAfter: revision.sourceAfter ?? undefined,
    createdAt: revision.createdAt.toISOString(),
  };
}

async function failRevision({
  revisionId,
  runStage,
  reason,
  summary = [],
  patchText = "",
  sourceAfter,
}: {
  revisionId: string;
  runStage: RevisionRunStage;
  reason: string;
  summary?: string[];
  patchText?: string;
  sourceAfter?: string;
}): Promise<RevisionExecutionResult> {
  await prisma.revision.update({
    where: { id: revisionId },
    data: {
      status: "failed",
      runStage,
      summary,
      patchText,
      sourceAfter,
      testStatus: "failed",
      testOutput: reason,
    },
  });

  return {
    revisionId,
    status: "failed",
    runStage,
    summary,
    patchText,
    testStatus: "failed",
    testOutput: reason,
    sourceAfter,
  };
}

async function failRestoreRevision({
  projectId,
  prompt,
  summary,
  patchText,
  sourceBefore,
  sourceAfter,
  runStage,
  blockedReason,
  testOutput,
}: {
  projectId: string;
  prompt: string;
  summary: string[];
  patchText: string;
  sourceBefore: string;
  sourceAfter: string;
  runStage: RevisionRunStage;
  blockedReason?: string;
  testOutput: string;
}): Promise<RestoreResponse> {
  const revision = await createRestoreRevision({
    projectId,
    prompt,
    summary,
    patchText,
    sourceBefore,
    sourceAfter,
    status: "failed",
    runStage,
    blockedReason,
    testStatus: "failed",
    testOutput,
  });

  return {
    revisionId: revision.id,
    status: "failed",
    summary,
    patchText,
    blockedReason,
    testStatus: "failed",
    testOutput,
  };
}

function buildRestoreRevisionCopy({
  target,
  createdAtLabel,
}: {
  target: RestoreRequest;
  createdAtLabel?: string;
}) {
  if (target.target === "baseline") {
    return {
      prompt: "Restore the original product page version.",
      summary: [
        "Restored the original seeded product page.",
        "Created a new revision entry for the restore action.",
      ],
    };
  }

  return {
    prompt: `Restore the saved version from ${createdAtLabel}.`,
    summary: [
      "Restored a previously approved product page version.",
      "Created a new revision entry for the restore action.",
    ],
  };
}

function createRestoreRevision({
  projectId,
  prompt,
  summary,
  patchText,
  sourceBefore,
  sourceAfter,
  status,
  runStage,
  testStatus,
  testOutput,
  blockedReason,
}: {
  projectId: string;
  prompt: string;
  summary: string[];
  patchText: string;
  sourceBefore: string;
  sourceAfter: string;
  status: "applied" | "failed";
  runStage: RevisionRunStage;
  testStatus: "passed" | "failed";
  testOutput: string;
  blockedReason?: string;
}) {
  return prisma.revision.create({
    data: {
      projectId,
      prompt,
      summary,
      patchText,
      sourceBefore,
      sourceAfter,
      status,
      runStage,
      blockedReason,
      testStatus,
      testOutput,
    },
  });
}

export async function executeRevision({
  revisionId,
  projectId,
  currentSource,
  request,
}: {
  revisionId: string;
  projectId: string;
  currentSource: string;
  request: GenerateSurgeryRequest;
}): Promise<RevisionExecutionResult> {
  let currentStage: RevisionRunStage = "generating";

  try {
    const requestValidation = validateRequestedScope(request.prompt);

    if (!requestValidation.ok) {
      currentStage = "validating";

      return blockRevision({
        revisionId,
        runStage: currentStage,
        reason: requestValidation.reason,
        summary: REQUEST_SCOPE_BLOCK_SUMMARY,
      });
    }

    let patchResponse;

    try {
      patchResponse = await generatePatch({ currentSource, request });
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Patch generation failed.";

      return failRevision({
        revisionId,
        runStage: currentStage,
        reason,
      });
    }

    const summary = sanitizeSummary(patchResponse.summary);
    const patchText = createPatchFromSources(currentSource, patchResponse.sourceAfter);

    currentStage = "validating";
    const sourceValidation = validateGeneratedEdit({
      currentSource,
      patchResponse,
    });

    if (!sourceValidation.ok) {
      return blockRevision({
        revisionId,
        runStage: currentStage,
        reason: sourceValidation.reason,
        summary,
        patchText,
        sourceAfter: patchResponse.sourceAfter,
      });
    }

    const patchValidation = validatePatchText(patchText);

    if (!patchValidation.ok) {
      return blockRevision({
        revisionId,
        runStage: currentStage,
        reason: patchValidation.reason,
        summary,
        patchText,
        sourceAfter: patchResponse.sourceAfter,
      });
    }

    const applyResult = applyPatchToSource(currentSource, patchText);

    if (!applyResult.ok) {
      return failRevision({
        revisionId,
        runStage: currentStage,
        reason: applyResult.reason,
        summary,
        patchText,
        sourceAfter: patchResponse.sourceAfter,
      });
    }

    if (applyResult.sourceAfter !== patchResponse.sourceAfter) {
      return failRevision({
        revisionId,
        runStage: currentStage,
        reason: PATCH_MISMATCH_REASON,
        summary,
        patchText,
        sourceAfter: patchResponse.sourceAfter,
      });
    }

    currentStage = "testing";
    await prisma.revision.update({
      where: { id: revisionId },
      data: {
        runStage: currentStage,
        summary,
        patchText,
        sourceAfter: applyResult.sourceAfter,
      },
    });

    const testResult = runRevisionTests(applyResult.sourceAfter);

    if (testResult.status === "failed") {
      await prisma.revision.update({
        where: { id: revisionId },
        data: {
          status: "failed",
          runStage: currentStage,
          testStatus: "failed",
          testOutput: testResult.output,
        },
      });

      return {
        revisionId,
        status: "failed",
        runStage: currentStage,
        summary,
        patchText,
        testStatus: "failed",
        testOutput: testResult.output,
        sourceAfter: applyResult.sourceAfter,
      };
    }

    currentStage = "applying";
    await prisma.revision.update({
      where: { id: revisionId },
      data: {
        runStage: currentStage,
        testStatus: "passed",
        testOutput: testResult.output,
      },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        activeSource: applyResult.sourceAfter,
      },
    });

    await prisma.revision.update({
      where: { id: revisionId },
      data: {
        status: "applied",
        runStage: "complete",
      },
    });

    return {
      revisionId,
      status: "applied",
      runStage: "complete",
      summary,
      patchText,
      testStatus: "passed",
      testOutput: testResult.output,
      sourceAfter: applyResult.sourceAfter,
    };
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Revision execution failed.";

    return failRevision({
      revisionId,
      runStage: currentStage,
      reason,
    });
  }
}

export async function restoreProjectRevision({
  projectId,
  restoreRequest,
}: {
  projectId: string;
  restoreRequest: RestoreRequest;
}): Promise<RestoreResponse> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      revisions: true,
    },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  let targetSource: string;
  let prompt: string;
  let summary: string[];

  if (restoreRequest.target === "baseline") {
    targetSource = project.baselineSource;
    ({ prompt, summary } = buildRestoreRevisionCopy({ target: restoreRequest }));
  } else {
    const targetRevision = project.revisions.find(
      (revision) => revision.id === restoreRequest.revisionId,
    );

    if (!targetRevision) {
      throw new Error("Revision not found.");
    }

    if (targetRevision.status !== "applied" || !targetRevision.sourceAfter) {
      throw new Error("Only saved ready versions can be restored.");
    }

    targetSource = targetRevision.sourceAfter;
    ({ prompt, summary } = buildRestoreRevisionCopy({
      target: restoreRequest,
      createdAtLabel: targetRevision.createdAt.toLocaleString(),
    }));
  }

  if (project.activeSource.trim() === targetSource.trim()) {
    throw new Error("This version is already active.");
  }

  const patchText = createPatchFromSources(project.activeSource, targetSource);
  const patchValidation = validatePatchText(patchText);

  if (!patchValidation.ok) {
    return failRestoreRevision({
      projectId,
      prompt,
      summary,
      patchText,
      sourceBefore: project.activeSource,
      sourceAfter: targetSource,
      runStage: "validating",
      blockedReason: patchValidation.reason,
      testOutput: patchValidation.reason,
    });
  }

  const applyResult = applyPatchToSource(project.activeSource, patchText);

  if (!applyResult.ok) {
    return failRestoreRevision({
      projectId,
      prompt,
      summary,
      patchText,
      sourceBefore: project.activeSource,
      sourceAfter: targetSource,
      runStage: "validating",
      blockedReason: applyResult.reason,
      testOutput: applyResult.reason,
    });
  }

  if (applyResult.sourceAfter !== targetSource) {
    return failRestoreRevision({
      projectId,
      prompt,
      summary,
      patchText,
      sourceBefore: project.activeSource,
      sourceAfter: targetSource,
      runStage: "validating",
      blockedReason: PATCH_MISMATCH_REASON,
      testOutput: PATCH_MISMATCH_REASON,
    });
  }

  const testResult = runRevisionTests(applyResult.sourceAfter);

  if (testResult.status === "failed") {
    return failRestoreRevision({
      projectId,
      prompt,
      summary,
      patchText,
      sourceBefore: project.activeSource,
      sourceAfter: applyResult.sourceAfter,
      runStage: "testing",
      testOutput: testResult.output,
    });
  }

  const [revision] = await prisma.$transaction([
    createRestoreRevision({
      projectId,
      prompt,
      summary,
      patchText,
      sourceBefore: project.activeSource,
      sourceAfter: applyResult.sourceAfter,
      status: "applied",
      runStage: "complete",
      testStatus: "passed",
      testOutput: testResult.output,
    }),
    prisma.project.update({
      where: { id: projectId },
      data: {
        activeSource: applyResult.sourceAfter,
      },
    }),
  ]);

  return {
    revisionId: revision.id,
    status: "applied",
    summary,
    patchText,
    testStatus: "passed",
    testOutput: testResult.output,
  };
}

export async function replayRevisionPatch({
  projectId,
  revisionId,
}: {
  projectId: string;
  revisionId: string;
}): Promise<RevisionReplayResponse> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new Error("Project not found.");
  }

  const revision = await prisma.revision.findFirst({
    where: {
      id: revisionId,
      projectId,
    },
  });

  if (!revision) {
    throw new Error("Revision not found.");
  }

  if (revision.status !== "applied" || !revision.patchText) {
    throw new Error("Only saved ready versions can replay their original diff.");
  }

  const patchValidation = validatePatchText(revision.patchText);

  if (!patchValidation.ok) {
    return {
      ok: false,
      error: patchValidation.reason,
    };
  }

  const applyResult = applyPatchToSource(project.activeSource, revision.patchText);

  if (!applyResult.ok) {
    return {
      ok: false,
      error: applyResult.reason,
    };
  }

  return {
    ok: true,
    patchText: revision.patchText,
    sourceAfter: applyResult.sourceAfter,
  };
}
