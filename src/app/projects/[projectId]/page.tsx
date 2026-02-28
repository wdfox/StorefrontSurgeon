import { notFound } from "next/navigation";

import { SurgeryComposer } from "@/components/projects/SurgeryComposer";
import { DiffPanel } from "@/components/projects/DiffPanel";
import { RevisionTimeline } from "@/components/projects/RevisionTimeline";
import { TestStatusPanel } from "@/components/projects/TestStatusPanel";
import { StorefrontPreview } from "@/components/preview/StorefrontPreview";
import { prisma } from "@/lib/db";
import { runRevisionTests } from "@/lib/revisions/tests";
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
  const previewSource = latestRevision?.sourceAfter ?? project.activeSource;
  const previewTitle =
    latestRevision?.status === "applied"
      ? "After"
      : latestRevision?.sourceAfter
        ? "Latest candidate"
        : "After";
  const replayedVerification = latestRevision?.sourceAfter
    ? runRevisionTests(latestRevision.sourceAfter)
    : null;
  const displayTestStatus = latestRevision?.blockedReason
    ? latestRevision.testStatus
    : replayedVerification?.status ?? latestRevision?.testStatus ?? null;
  const displayTestOutput = latestRevision?.blockedReason
    ? latestRevision.testOutput
    : replayedVerification?.output ?? latestRevision?.testOutput ?? null;
  const verificationNote =
    latestRevision?.status === "failed" &&
    latestRevision.testStatus === "failed" &&
    replayedVerification?.status === "passed"
      ? "This revision failed under an older verification rule set. The current checks pass on the saved candidate source, but the revision was not promoted to active until you rerun it."
      : null;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-10">
      <header className="mb-8">
        <div className="eyebrow">Project workspace</div>
        <h1 className="display mt-3 text-5xl leading-tight">{project.name}</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-[var(--muted)]">
          {project.description}
        </p>
      </header>

      <div className="space-y-6">
        <SurgeryComposer projectId={project.id} />

        <section className="panel rounded-[1.8rem] p-6">
          <div className="eyebrow">Latest run</div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="pill">
              Status: {latestRevision ? latestRevision.status : "ready"}
            </div>
            <div className="pill">
              Tests: {displayTestStatus ?? "not_run"}
            </div>
            <div className="pill">
              Revisions: {project.revisions.length}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <StorefrontPreview title="Before" source={project.baselineSource} />
          <StorefrontPreview title={previewTitle} source={previewSource} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <DiffPanel
            patchText={latestRevision?.patchText ?? null}
            summary={latestSummary}
          />
          <TestStatusPanel
            status={displayTestStatus}
            output={displayTestOutput}
            blockedReason={latestRevision?.blockedReason ?? null}
            note={verificationNote}
          />
        </section>

        <RevisionTimeline
          revisions={project.revisions.map((revision) => ({
            id: revision.id,
            prompt: revision.prompt,
            status: revision.status,
            testStatus: revision.testStatus,
            blockedReason: revision.blockedReason,
            createdAt: revision.createdAt,
          }))}
        />
      </div>
    </main>
  );
}
