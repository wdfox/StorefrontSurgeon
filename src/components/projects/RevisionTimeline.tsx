type RevisionTimelineProps = {
  revisions: Array<{
    id: string;
    prompt: string;
    status: string;
    testStatus: string | null;
    blockedReason: string | null;
    createdAt: Date;
  }>;
};

export function RevisionTimeline({ revisions }: RevisionTimelineProps) {
  return (
    <section className="panel rounded-[1.8rem] p-6">
      <div className="eyebrow">Revision history</div>
      <h2 className="mt-2 text-2xl font-bold">Timeline</h2>
      <div className="mt-5 space-y-4">
        {revisions.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">No revisions yet.</div>
        ) : (
          revisions.map((revision) => (
            <div
              key={revision.id}
              className="rounded-[1.3rem] border border-[rgba(108,89,73,0.14)] bg-[rgba(255,252,247,0.88)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="pill">{revision.status}</div>
                <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                  {revision.createdAt.toLocaleString()}
                </div>
              </div>
              <p className="mt-3 text-sm leading-7">{revision.prompt}</p>
              {revision.blockedReason ? (
                <p className="status-danger mt-2 text-sm">{revision.blockedReason}</p>
              ) : null}
              {revision.testStatus ? (
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Test status: {revision.testStatus}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
