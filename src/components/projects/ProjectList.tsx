import Link from "next/link";

type ProjectListProps = {
  projects: Array<{
    id: string;
    name: string;
    description: string | null;
    revisionCount: number;
    updatedAt: Date;
  }>;
};

export function ProjectList({ projects }: ProjectListProps) {
  return (
    <div className="grid gap-4">
      {projects.map((project) => (
        <Link
          key={project.id}
          href={`/projects/${project.id}`}
          className="panel rounded-[1.8rem] p-6 transition-transform duration-200 hover:-translate-y-0.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="eyebrow">Sample storefront</div>
              <h2 className="mt-2 text-2xl font-bold">{project.name}</h2>
            </div>
            <div className="pill">{project.revisionCount} saved versions</div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            {project.description}
          </p>
          <div className="mt-5 text-sm font-semibold text-[var(--accent-strong)]">
            Open page
          </div>
        </Link>
      ))}
    </div>
  );
}
