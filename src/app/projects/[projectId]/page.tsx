import { notFound } from "next/navigation";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { StorefrontPreview } from "@/components/preview/StorefrontPreview";
import { WorkspaceExperience } from "@/components/projects/WorkspaceExperience";
import { prisma } from "@/lib/db";
import { runRevisionTests } from "@/lib/revisions/tests";
import type { RevisionRunStage, RevisionStatus } from "@/lib/revisions/types";
import { requireSession } from "@/lib/session";

type ProjectDetailPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const session = await requireSession();
  const { projectId } = await params;
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
    include: {
      revisions: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const latestRevision = project.revisions[0] ?? null;
  const latestSummary = Array.isArray(latestRevision?.summary)
    ? latestRevision.summary.filter((item): item is string => typeof item === "string")
    : [];
  const hasAppliedChanges = project.activeSource.trim() !== project.baselineSource.trim();
  const currentPreviewLabel = hasAppliedChanges ? "Current page" : "Original page";
  const canReplayVerification =
    latestRevision?.status !== "pending" && Boolean(latestRevision?.sourceAfter);
  const replayedVerification = canReplayVerification && latestRevision?.sourceAfter
    ? runRevisionTests(latestRevision.sourceAfter)
    : null;
  const displayTestStatus =
    latestRevision?.status === "pending"
      ? latestRevision.testStatus ?? null
      : latestRevision?.blockedReason
    ? latestRevision.testStatus
    : replayedVerification?.status ?? latestRevision?.testStatus ?? null;
  const displayTestOutput =
    latestRevision?.status === "pending"
      ? latestRevision.testOutput ?? null
      : latestRevision?.blockedReason
    ? latestRevision.testOutput
    : replayedVerification?.output ?? latestRevision?.testOutput ?? null;
  const verificationNote =
    latestRevision?.status === "failed" &&
    latestRevision.testStatus === "failed" &&
    replayedVerification?.status === "passed"
      ? "This version was previously marked as needing review under an older check set. The current checks now pass, but the page will stay unchanged until you generate the update again."
      : null;

  return (
    <WorkspaceExperience
      projectId={project.id}
      projectName={project.name}
      projectDescription={project.description}
      currentPreviewLabel={currentPreviewLabel}
      hasAppliedChanges={hasAppliedChanges}
      revisionCount={project.revisions.length}
      latestRun={
        latestRevision
          ? {
              id: latestRevision.id,
              prompt: latestRevision.prompt,
              status: latestRevision.status as RevisionStatus,
              runStage: latestRevision.runStage as RevisionRunStage,
              summary: latestSummary,
              patchText: latestRevision.patchText,
              testStatus: displayTestStatus,
              testOutput: displayTestOutput,
              blockedReason: latestRevision.blockedReason,
              createdAtLabel: latestRevision.createdAt.toLocaleString(),
            }
          : null
      }
      displayTestStatus={displayTestStatus}
      displayTestOutput={displayTestOutput}
      verificationNote={verificationNote}
      revisions={project.revisions.map((revision) => ({
        id: revision.id,
        prompt: revision.prompt,
        status: revision.status,
        testStatus: revision.testStatus,
        blockedReason: revision.blockedReason,
        createdAtLabel: revision.createdAt.toLocaleString(),
      }))}
      preview={<StorefrontPreview title={currentPreviewLabel} source={project.activeSource} />}
      actionSlot={<SignOutButton />}
    />
  );
}
