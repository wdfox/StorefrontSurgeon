import { createEditablePreviewElement } from "@/lib/revisions/source";

type StorefrontPreviewProps = {
  source: string;
};

export function StorefrontPreview({ source }: StorefrontPreviewProps) {
  const previewElement = createEditablePreviewElement(source);

  return (
    <section className="rounded-[2rem] border border-[rgba(108,89,73,0.1)] bg-[rgba(255,252,247,0.9)] p-3 shadow-[0_18px_40px_rgba(67,45,20,0.08)] sm:p-4">
      <div className="mb-4">
        <div className="eyebrow">Product Page Preview</div>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Review the current page below before you request a change.
        </p>
      </div>
      <div>
        {previewElement}
      </div>
    </section>
  );
}
