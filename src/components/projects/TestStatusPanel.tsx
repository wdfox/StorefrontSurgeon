import { getUserFacingBlockedReason } from "@/lib/revisions/userFacing";

type TestStatusPanelProps = {
  status: string | null;
  output: string | null;
  blockedReason: string | null;
  note?: string | null;
};

export function TestStatusPanel({
  status,
  output,
  blockedReason,
  note,
}: TestStatusPanelProps) {
  const blockedReasonCopy = getUserFacingBlockedReason(blockedReason);
  const hasDetails = Boolean(output);
  const statusLabel =
    status === "passed"
      ? "Passed"
      : status === "failed"
        ? "Needs review"
        : "Not run";
  const statusClass =
    status === "passed"
      ? "status-success"
      : status === "failed"
        ? "status-danger"
        : "status-muted";

  return (
    <section className="panel rounded-[2rem] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Safety checks</div>
          <h2 className="display mt-2 text-3xl leading-tight">Check results</h2>
        </div>
        <div className={`pill ${statusClass}`}>{statusLabel}</div>
      </div>
      <div className={`mt-5 text-lg font-bold ${statusClass}`}>
        {status === "passed"
          ? "This version passed the safety checks."
          : status === "failed"
            ? "This version needs review before it can be used."
            : "No checks have run yet."}
      </div>
      {blockedReasonCopy ? (
        <div className="mt-3 rounded-[1.4rem] border border-[rgba(162,60,50,0.18)] bg-[rgba(162,60,50,0.08)] px-4 py-3">
          <p className="status-danger text-sm leading-7">{blockedReasonCopy.summary}</p>
          {blockedReasonCopy.guidance ? (
            <p className="mt-2 text-sm leading-7 text-[var(--danger)] opacity-80">
              {blockedReasonCopy.guidance}
            </p>
          ) : null}
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.16em] text-[var(--danger)]">
              View technical reason
            </summary>
            <p className="mt-3 text-sm leading-7 text-[var(--danger)]">
              {blockedReasonCopy.technical}
            </p>
          </details>
        </div>
      ) : null}
      {note ? (
        <p className="mt-3 rounded-[1.4rem] border border-[rgba(108,89,73,0.12)] bg-[rgba(255,251,246,0.84)] px-4 py-3 text-sm leading-7 text-[var(--muted)]">
          {note}
        </p>
      ) : null}

      {hasDetails ? (
        <details className="mt-5 rounded-[1.6rem] border border-[rgba(108,89,73,0.14)] bg-[rgba(255,251,246,0.82)]">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-[var(--foreground)]">
            View check details
          </summary>
          <div className="border-t border-[rgba(108,89,73,0.12)] px-5 py-4">
            <pre className="max-h-[34rem] overflow-auto whitespace-pre-wrap text-sm leading-7 text-[#453a31]">
              {output}
            </pre>
          </div>
        </details>
      ) : (
        <div className="mt-5 rounded-[1.6rem] border border-dashed border-[rgba(108,89,73,0.18)] bg-[rgba(255,251,246,0.72)] px-5 py-4 text-sm leading-7 text-[var(--muted)]">
          We’ll show the safety-check details for each update here.
        </div>
      )}
    </section>
  );
}
