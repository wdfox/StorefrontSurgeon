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
  const statusClass =
    status === "passed"
      ? "status-success"
      : status === "failed"
        ? "status-danger"
        : "status-muted";

  return (
    <section className="panel rounded-[1.8rem] p-6">
      <div className="eyebrow">Verification</div>
      <h2 className="mt-2 text-2xl font-bold">Test status</h2>
      <div className={`mt-5 text-lg font-bold ${statusClass}`}>
        {status ? status : "Waiting for the first run"}
      </div>
      {blockedReason ? (
        <p className="status-danger mt-3 text-sm leading-7">{blockedReason}</p>
      ) : null}
      {note ? (
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{note}</p>
      ) : null}
      <pre className="mt-5 overflow-x-auto rounded-[1.4rem] border border-[rgba(108,89,73,0.14)] bg-[rgba(255,252,247,0.9)] p-4 text-sm leading-7 text-[#453a31]">
        {output ?? "A successful surgery will show the deterministic test output here."}
      </pre>
    </section>
  );
}
