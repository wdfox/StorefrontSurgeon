import { getUserFacingBlockedReason } from "@/lib/revisions/userFacing";

type RevisionTimelineProps = {
  revisions: Array<{
    id: string;
    prompt: string;
    status: string;
    testStatus: string | null;
    blockedReason: string | null;
    summary: string[];
    createdAtLabel: string;
  }>;
};

function getStatusLabel(status: string) {
  if (status === "applied") {
    return "Ready";
  }

  if (status === "blocked") {
    return "Couldn’t apply";
  }

  if (status === "failed") {
    return "Needs review";
  }

  if (status === "pending") {
    return "In progress";
  }

  return status;
}

function getCheckLabel(status: string) {
  if (status === "passed") {
    return "Passed";
  }

  if (status === "failed") {
    return "Needs review";
  }

  return status;
}

export function RevisionTimeline({ revisions }: RevisionTimelineProps) {
  return (
    <section className="panel rounded-[2rem] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Previous versions</div>
          <h2 className="display mt-2 text-3xl leading-tight">Update history</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            Review earlier requests, compare outcomes, and return to past ideas when you want to
            try a new direction.
          </p>
        </div>
        <div className="pill">{revisions.length} saved versions</div>
      </div>
      <div className="mt-5 space-y-4">
        {revisions.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[rgba(108,89,73,0.18)] bg-[rgba(255,251,246,0.72)] px-4 py-5 text-sm text-[var(--muted)]">
            No saved versions yet.
          </div>
        ) : (
          revisions.map((revision, index) => {
            const blockedReasonCopy = getUserFacingBlockedReason(revision.blockedReason);

            return (
              <div
                key={revision.id}
                className="rounded-[1.5rem] border border-[rgba(108,89,73,0.14)] bg-[rgba(255,252,247,0.88)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {index === 0 ? <div className="pill">Latest</div> : null}
                    <div className="pill">{getStatusLabel(revision.status)}</div>
                  </div>
                  <div className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                    {revision.createdAtLabel}
                  </div>
                </div>
                <div className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Requested change
                </div>
                <p className="mt-2 text-sm leading-7">{revision.prompt}</p>
                {revision.summary.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {revision.summary.map((item) => (
                      <div key={`${revision.id}-${item}`} className="pill">
                        {item}
                      </div>
                    ))}
                  </div>
                ) : null}
                {blockedReasonCopy ? (
                  <div className="mt-3 rounded-[1.2rem] border border-[rgba(162,60,50,0.18)] bg-[rgba(162,60,50,0.08)] px-3 py-3 text-sm leading-7 text-[var(--danger)]">
                    <p>{blockedReasonCopy.summary}</p>
                    {blockedReasonCopy.guidance ? (
                      <p className="mt-2 text-[var(--danger)] opacity-80">
                        {blockedReasonCopy.guidance}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                {revision.testStatus ? (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Check results: {getCheckLabel(revision.testStatus)}
                  </p>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
