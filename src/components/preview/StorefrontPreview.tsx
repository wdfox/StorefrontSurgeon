import { createEditablePreviewElement } from "@/lib/revisions/source";

type StorefrontPreviewProps = {
  title: string;
  source: string;
};

export function StorefrontPreview({ title, source }: StorefrontPreviewProps) {
  const previewElement = createEditablePreviewElement(source);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="eyebrow">{title}</div>
        <div className="pill">Product preview</div>
      </div>
      {previewElement}
    </section>
  );
}
