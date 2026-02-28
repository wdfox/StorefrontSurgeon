import { prisma } from "@/lib/db";
import { generatePatch } from "@/lib/codex/adapter";
import { createPatchFromSources } from "@/lib/revisions/patcher";
import { runRevisionTests } from "@/lib/revisions/tests";
import type {
  GenerateSurgeryRequest,
  RevisionExecutionResult,
  RevisionRunStage,
  RevisionSnapshot,
} from "@/lib/revisions/types";
import { validateGeneratedEdit } from "@/lib/revisions/validator";

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
}: {
  revisionId: string;
  runStage: RevisionRunStage;
  reason: string;
}): Promise<RevisionExecutionResult> {
  await prisma.revision.update({
    where: { id: revisionId },
    data: {
      status: "failed",
      runStage,
      testStatus: "failed",
      testOutput: reason,
    },
  });

  return {
    revisionId,
    status: "failed",
    runStage,
    summary: [],
    patchText: "",
    testStatus: "failed",
    testOutput: reason,
  };
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

    const patchText = createPatchFromSources(currentSource, patchResponse.sourceAfter);

    currentStage = "validating";
    const validation = validateGeneratedEdit({
      currentSource,
      patchResponse,
    });

    if (!validation.ok) {
      await prisma.revision.update({
        where: { id: revisionId },
        data: {
          status: "blocked",
          runStage: currentStage,
          summary: patchResponse.summary,
          patchText,
          blockedReason: validation.reason,
        },
      });

      return {
        revisionId,
        status: "blocked",
        runStage: currentStage,
        summary: patchResponse.summary,
        patchText,
        blockedReason: validation.reason,
      };
    }

    currentStage = "testing";
    await prisma.revision.update({
      where: { id: revisionId },
      data: {
        runStage: currentStage,
        summary: patchResponse.summary,
        patchText,
        sourceAfter: patchResponse.sourceAfter,
      },
    });

    const testResult = runRevisionTests(patchResponse.sourceAfter);

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
        summary: patchResponse.summary,
        patchText,
        testStatus: "failed",
        testOutput: testResult.output,
        sourceAfter: patchResponse.sourceAfter,
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
        activeSource: patchResponse.sourceAfter,
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
      summary: patchResponse.summary,
      patchText,
      testStatus: "passed",
      testOutput: testResult.output,
      sourceAfter: patchResponse.sourceAfter,
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
