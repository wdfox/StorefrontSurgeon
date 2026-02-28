import { prisma } from "@/lib/db";
import { generatePatch } from "@/lib/codex/adapter";
import { createPatchFromSources } from "@/lib/revisions/patcher";
import { runRevisionTests } from "@/lib/revisions/tests";
import type {
  GenerateSurgeryRequest,
  RevisionExecutionResult,
} from "@/lib/revisions/types";
import { validateGeneratedEdit } from "@/lib/revisions/validator";

export async function executeRevision({
  projectId,
  currentSource,
  request,
}: {
  projectId: string;
  currentSource: string;
  request: GenerateSurgeryRequest;
}): Promise<RevisionExecutionResult> {
  const revision = await prisma.revision.create({
    data: {
      projectId,
      prompt: request.prompt,
      presetKey: request.presetKey,
      summary: [],
      patchText: "",
      sourceBefore: currentSource,
      status: "pending",
      testStatus: "not_run",
    },
  });

  let patchResponse;

  try {
    patchResponse = await generatePatch({ currentSource, request });
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "Patch generation failed.";

    await prisma.revision.update({
      where: { id: revision.id },
      data: {
        status: "failed",
        patchText: "",
        testStatus: "failed",
        testOutput: reason,
      },
    });

    return {
      revisionId: revision.id,
      status: "failed",
      summary: [],
      patchText: "",
      testStatus: "failed",
      testOutput: reason,
    };
  }

  const patchText = createPatchFromSources(currentSource, patchResponse.sourceAfter);
  const validation = validateGeneratedEdit({
    currentSource,
    patchResponse,
  });

  if (!validation.ok) {
    await prisma.revision.update({
      where: { id: revision.id },
      data: {
        status: "blocked",
        summary: patchResponse.summary,
        patchText,
        blockedReason: validation.reason,
      },
    });

    return {
      revisionId: revision.id,
      status: "blocked",
      summary: patchResponse.summary,
      patchText,
      blockedReason: validation.reason,
    };
  }

  const testResult = runRevisionTests(patchResponse.sourceAfter);

  if (testResult.status === "failed") {
    await prisma.revision.update({
      where: { id: revision.id },
      data: {
        status: "failed",
        summary: patchResponse.summary,
        patchText,
        sourceAfter: patchResponse.sourceAfter,
        testStatus: "failed",
        testOutput: testResult.output,
      },
    });

    return {
      revisionId: revision.id,
      status: "failed",
      summary: patchResponse.summary,
      patchText,
      testStatus: "failed",
      testOutput: testResult.output,
      sourceAfter: patchResponse.sourceAfter,
    };
  }

  await prisma.project.update({
    where: { id: projectId },
    data: {
      activeSource: patchResponse.sourceAfter,
    },
  });

  await prisma.revision.update({
      where: { id: revision.id },
      data: {
        status: "applied",
        summary: patchResponse.summary,
        patchText,
        sourceAfter: patchResponse.sourceAfter,
        testStatus: "passed",
        testOutput: testResult.output,
      },
    });

  return {
    revisionId: revision.id,
    status: "applied",
    summary: patchResponse.summary,
    patchText,
    testStatus: "passed",
    testOutput: testResult.output,
    sourceAfter: patchResponse.sourceAfter,
  };
}
