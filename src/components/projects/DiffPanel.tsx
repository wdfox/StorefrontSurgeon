type DiffPanelProps = {
  patchText: string | null;
  summary: string[];
};

export function DiffPanel({ patchText, summary }: DiffPanelProps) {
  return (
    <section className="panel rounded-[1.8rem] p-6">
      <div className="eyebrow">What changed</div>
      <h2 className="mt-2 text-2xl font-bold">Patch diff</h2>

      <div className="mt-5 flex flex-wrap gap-2">
        {summary.length > 0 ? (
          summary.map((item) => (
            <div key={item} className="pill">
              {item}
            </div>
          ))
        ) : (
          <div className="text-sm text-[var(--muted)]">
            No patch generated yet.
          </div>
        )}
      </div>

      <pre className="mt-5 overflow-x-auto rounded-[1.4rem] border border-[rgba(108,89,73,0.14)] bg-[#1e1915] p-4 text-xs leading-6 text-[#f8efe5]">
        {patchText ?? "Run the first surgery to see a unified diff."}
      </pre>
    </section>
  );
}
