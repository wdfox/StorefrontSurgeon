import { SignOutButton } from "@/components/auth/SignOutButton";
import { ProjectList } from "@/components/projects/ProjectList";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/session";

export default async function ProjectsPage() {
  const session = await requireSession();
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: {
          revisions: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Projects</div>
          <h1 className="display mt-3 text-5xl leading-tight">
            Storefront Surgeon foundation
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--muted)]">
            One seeded workspace, one bounded surgery, one visible diff, and one
            deterministic test gate.
          </p>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-10">
        <ProjectList
          projects={projects.map((project) => ({
            id: project.id,
            name: project.name,
            description: project.description,
            revisionCount: project._count.revisions,
            updatedAt: project.updatedAt,
          }))}
        />
      </div>
    </main>
  );
}
