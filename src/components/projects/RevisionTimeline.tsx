import { getUserFacingBlockedReason } from "@/lib/revisions/userFacing";

type RevisionTimelineProps = {
  currentVersionKey: "baseline" | string;
  restorePendingKey: string | null;
  replayPendingRevisionId: string | null;
  revisionNotices: Record<
    string,
    {
      tone: "success" | "warning" | "error";
      text: string;
      technical?: string;
    }
  >;
  revisions: Array<{
    id: string;
    prompt: string;
    status: string;
    testStatus: string | null;
    blockedReason: string | null;
    summary: string[];
    createdAtLabel: string;
    isCurrent: boolean;
    isLatest: boolean;
    isOriginal: boolean;
    canRestore: boolean;
    canReplay: boolean;
  }>;
  onRestoreRevision: (revisionId: string) => void;
  onReplayRevision: (revisionId: string) => void;
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

export function RevisionTimeline({
  currentVersionKey,
  restorePendingKey,
  replayPendingRevisionId,
  revisionNotices,
  revisions,
  onRestoreRevision,
  onReplayRevision,
}: RevisionTimelineProps) {
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
          revisions.map((revision) => {
            const blockedReasonCopy = getUserFacingBlockedReason(revision.blockedReason);
            const revisionNotice = revisionNotices[revision.id];

            return (
              <div
                key={revision.id}
                className="rounded-[1.5rem] border border-[rgba(108,89,73,0.14)] bg-[rgba(255,252,247,0.88)] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {revision.isLatest ? <div className="pill">Latest</div> : null}
                    {revision.isCurrent ? <div className="pill">Current</div> : null}
                    {revision.isOriginal ? <div className="pill">Original</div> : null}
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
                {revisionNotice ? (
                  <div
                    className={`mt-3 rounded-[1.2rem] border px-3 py-3 text-sm leading-7 ${
                      revisionNotice.tone === "success"
                        ? "border-[rgba(31,122,82,0.18)] bg-[rgba(31,122,82,0.08)] text-[var(--success)]"
                        : revisionNotice.tone === "warning"
                          ? "border-[rgba(191,90,44,0.18)] bg-[rgba(191,90,44,0.08)] text-[var(--accent-strong)]"
                          : "border-[rgba(162,60,50,0.18)] bg-[rgba(162,60,50,0.08)] text-[var(--danger)]"
                    }`}
                  >
                    <p>{revisionNotice.text}</p>
                    {revisionNotice.technical ? (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.16em]">
                          View technical details
                        </summary>
                        <p className="mt-3 break-words text-sm leading-7">
                          {revisionNotice.technical}
                        </p>
                      </details>
                    ) : null}
                  </div>
                ) : null}
                {revision.testStatus ? (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Check results: {getCheckLabel(revision.testStatus)}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  {revision.canRestore ? (
                    <button
                      className="button-secondary px-4 py-2 text-sm"
                      type="button"
                      disabled={Boolean(restorePendingKey) || currentVersionKey === revision.id}
                      onClick={() => onRestoreRevision(revision.id)}
                    >
                      {restorePendingKey === revision.id
                        ? "Restoring..."
                        : "Restore this version"}
                    </button>
                  ) : null}
                  {revision.canReplay ? (
                    <details className="min-w-[15rem] rounded-[1.2rem] border border-[rgba(108,89,73,0.12)] bg-[rgba(255,251,246,0.78)] px-3 py-2">
                      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Advanced demo controls
                      </summary>
                      <div className="mt-3">
                        <button
                          className="button-secondary px-4 py-2 text-sm"
                          type="button"
                          disabled={Boolean(replayPendingRevisionId)}
                          onClick={() => onReplayRevision(revision.id)}
                        >
                          {replayPendingRevisionId === revision.id
                            ? "Replaying..."
                            : "Replay original diff"}
                        </button>
                      </div>
                    </details>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
