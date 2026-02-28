type DiffPanelProps = {
  patchText: string | null;
  summary: string[];
};

export function DiffPanel({ patchText, summary }: DiffPanelProps) {
  const hasDetails = Boolean(patchText);

  return (
    <section className="panel rounded-[2rem] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Changes made</div>
          <h2 className="display mt-2 text-3xl leading-tight">Detailed changes</h2>
        </div>
        <div className="pill">
          {summary.length > 0 ? "Latest update details" : "No details yet"}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {summary.length > 0 ? (
          summary.map((item) => (
            <div key={item} className="pill">
              {item}
            </div>
          ))
        ) : (
          <div className="text-sm text-[var(--muted)]">
            No detailed changes yet.
          </div>
        )}
      </div>

      {hasDetails ? (
        <details className="mt-5 rounded-[1.6rem] border border-[rgba(108,89,73,0.14)] bg-[rgba(255,251,246,0.82)]">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-[var(--foreground)]">
            View technical details
          </summary>
          <div className="border-t border-[rgba(108,89,73,0.12)] px-3 pb-3 pt-3">
            <pre className="max-h-[34rem] overflow-auto rounded-[1.4rem] bg-[#1e1915] p-5 text-xs leading-6 text-[#f8efe5] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              {patchText}
            </pre>
          </div>
        </details>
      ) : (
        <div className="mt-5 rounded-[1.6rem] border border-dashed border-[rgba(108,89,73,0.18)] bg-[rgba(255,251,246,0.72)] px-5 py-4 text-sm leading-7 text-[var(--muted)]">
          Generate an update to unlock the technical change log.
        </div>
      )}
    </section>
  );
}
