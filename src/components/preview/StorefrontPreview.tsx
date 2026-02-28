import { createEditablePreviewElement } from "@/lib/revisions/source";

type StorefrontPreviewProps = {
  title: string;
  source: string;
};

export function StorefrontPreview({ title, source }: StorefrontPreviewProps) {
  const previewElement = createEditablePreviewElement(source);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="eyebrow">{title}</div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            This is the page area that can be updated safely.
          </p>
        </div>
        <div className="pill">Live preview</div>
      </div>
      <div className="rounded-[2rem] border border-[rgba(108,89,73,0.1)] bg-[rgba(255,252,247,0.9)] p-3 shadow-[0_18px_40px_rgba(67,45,20,0.08)] sm:p-4">
        {previewElement}
      </div>
    </section>
  );
}
