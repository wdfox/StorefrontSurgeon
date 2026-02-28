import { describe, expect, it } from "vitest";

import { createPatchFromSources } from "@/lib/revisions/patcher";

describe("createPatchFromSources", () => {
  it("creates a unified diff for the editable preview file", () => {
    const currentSource = "export default function ProductPreview() {\n  return <div>Before</div>;\n}\n";
    const nextSource = "export default function ProductPreview() {\n  return <div>After</div>;\n}\n";
    const patch = createPatchFromSources(currentSource, nextSource);

    expect(patch).toContain("--- src/demo/EditableProductPreview.tsx");
    expect(patch).toContain("+++ src/demo/EditableProductPreview.tsx");
    expect(patch).toContain("+  return <div>After</div>;");
  });
});
