import { describe, expect, it } from "vitest";

import {
  applyPatchToSource,
  createPatchFromSources,
  validatePatchText,
} from "@/lib/revisions/patcher";

describe("createPatchFromSources", () => {
  it("creates a unified diff for the editable preview file", () => {
    const currentSource = "export default function ProductPreview() {\n  return <div>Before</div>;\n}\n";
    const nextSource = "export default function ProductPreview() {\n  return <div>After</div>;\n}\n";
    const patch = createPatchFromSources(currentSource, nextSource);

    expect(patch).toContain("--- src/demo/EditableProductPreview.tsx");
    expect(patch).toContain("+++ src/demo/EditableProductPreview.tsx");
    expect(patch).toContain("+  return <div>After</div>;");
  });

  it("accepts a canonical patch for the editable preview file", () => {
    const currentSource = "export default function ProductPreview() {\n  return <div>Before</div>;\n}\n";
    const nextSource = "export default function ProductPreview() {\n  return <div>After</div>;\n}\n";
    const patch = createPatchFromSources(currentSource, nextSource);

    expect(validatePatchText(patch)).toEqual({ ok: true });
  });

  it("rejects patch text for forbidden file headers", () => {
    const patch = `Index: src/lib/cart.ts
===================================================================
--- src/lib/cart.ts\tbefore
+++ src/lib/cart.ts\tafter
@@ -1 +1 @@
-old
+new
`;

    expect(validatePatchText(patch)).toEqual({
      ok: false,
      reason: "Patch attempted to edit a forbidden file.",
    });
  });

  it("rejects oversized patches", () => {
    const currentLines = Array.from({ length: 240 }, (_, index) => `line-${index}`).join("\n");
    const nextLines = Array.from({ length: 240 }, (_, index) => `updated-${index}`).join("\n");
    const patch = createPatchFromSources(`${currentLines}\n`, `${nextLines}\n`);

    expect(validatePatchText(patch)).toEqual({
      ok: false,
      reason: "Patch exceeded the maximum allowed size.",
    });
  });

  it("applies a validated patch back onto the matching source", () => {
    const currentSource = "export default function ProductPreview() {\n  return <div>Before</div>;\n}\n";
    const nextSource = "export default function ProductPreview() {\n  return <div>After</div>;\n}\n";
    const patch = createPatchFromSources(currentSource, nextSource);

    expect(applyPatchToSource(currentSource, patch)).toEqual({
      ok: true,
      sourceAfter: nextSource,
    });
  });

  it("fails cleanly when a saved patch is replayed against a stale source", () => {
    const originalSource = "export default function ProductPreview() {\n  return <div>Before</div>;\n}\n";
    const patchedSource = "export default function ProductPreview() {\n  return <div>After</div>;\n}\n";
    const staleSource = "export default function ProductPreview() {\n  return <div>Changed elsewhere</div>;\n}\n";
    const patch = createPatchFromSources(originalSource, patchedSource);

    expect(applyPatchToSource(staleSource, patch)).toEqual({
      ok: false,
      reason: "Patch no longer applies to current revision.",
    });
  });
});
