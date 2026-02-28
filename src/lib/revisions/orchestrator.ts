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

function sanitizeSummary(summary: unknown): string[] {
  return Array.isArray(summary)
    ? summary.filter((item): item is string => typeof item === "string")
    : [];
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

      await prisma.revision.update({
        where: { id: revisionId },
        data: {
          status: "blocked",
          runStage: currentStage,
          summary: [
            "Blocked a request that reached beyond the approved product-page demo surface.",
          ],
          blockedReason: requestValidation.reason,
        },
      });

      return {
        revisionId,
        status: "blocked",
        runStage: currentStage,
        summary: [
          "Blocked a request that reached beyond the approved product-page demo surface.",
        ],
        patchText: "",
        blockedReason: requestValidation.reason,
      };
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
      await prisma.revision.update({
        where: { id: revisionId },
        data: {
          status: "blocked",
          runStage: currentStage,
          summary,
          patchText,
          sourceAfter: patchResponse.sourceAfter,
          blockedReason: sourceValidation.reason,
        },
      });

      return {
        revisionId,
        status: "blocked",
        runStage: currentStage,
        summary,
        patchText,
        blockedReason: sourceValidation.reason,
      };
    }

    const patchValidation = validatePatchText(patchText);

    if (!patchValidation.ok) {
      await prisma.revision.update({
        where: { id: revisionId },
        data: {
          status: "blocked",
          runStage: currentStage,
          summary,
          patchText,
          sourceAfter: patchResponse.sourceAfter,
          blockedReason: patchValidation.reason,
        },
      });

      return {
        revisionId,
        status: "blocked",
        runStage: currentStage,
        summary,
        patchText,
        blockedReason: patchValidation.reason,
      };
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
        reason: "Patched result did not match generated source.",
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
    const revision = await createRestoreRevision({
      projectId,
      prompt,
      summary,
      patchText,
      sourceBefore: project.activeSource,
      sourceAfter: targetSource,
      status: "failed",
      runStage: "validating",
      blockedReason: patchValidation.reason,
      testStatus: "failed",
      testOutput: patchValidation.reason,
    });

    return {
      revisionId: revision.id,
      status: "failed",
      summary,
      patchText,
      blockedReason: patchValidation.reason,
      testStatus: "failed",
      testOutput: patchValidation.reason,
    };
  }

  const applyResult = applyPatchToSource(project.activeSource, patchText);

  if (!applyResult.ok) {
    const revision = await createRestoreRevision({
      projectId,
      prompt,
      summary,
      patchText,
      sourceBefore: project.activeSource,
      sourceAfter: targetSource,
      status: "failed",
      runStage: "validating",
      blockedReason: applyResult.reason,
      testStatus: "failed",
      testOutput: applyResult.reason,
    });

    return {
      revisionId: revision.id,
      status: "failed",
      summary,
      patchText,
      blockedReason: applyResult.reason,
      testStatus: "failed",
      testOutput: applyResult.reason,
    };
  }

  if (applyResult.sourceAfter !== targetSource) {
    const reason = "Patched result did not match generated source.";
    const revision = await createRestoreRevision({
      projectId,
      prompt,
      summary,
      patchText,
      sourceBefore: project.activeSource,
      sourceAfter: targetSource,
      status: "failed",
      runStage: "validating",
      blockedReason: reason,
      testStatus: "failed",
      testOutput: reason,
    });

    return {
      revisionId: revision.id,
      status: "failed",
      summary,
      patchText,
      blockedReason: reason,
      testStatus: "failed",
      testOutput: reason,
    };
  }

  const testResult = runRevisionTests(applyResult.sourceAfter);

  if (testResult.status === "failed") {
    const revision = await createRestoreRevision({
      projectId,
      prompt,
      summary,
      patchText,
      sourceBefore: project.activeSource,
      sourceAfter: applyResult.sourceAfter,
      status: "failed",
      runStage: "testing",
      testStatus: "failed",
      testOutput: testResult.output,
    });

    return {
      revisionId: revision.id,
      status: "failed",
      summary,
      patchText,
      testStatus: "failed",
      testOutput: testResult.output,
    };
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
