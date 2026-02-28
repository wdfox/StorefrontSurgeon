import { describe, expect, it } from "vitest";

import { EDITABLE_PREVIEW_PATH } from "@/lib/revisions/constants";
import { validateGeneratedEdit } from "@/lib/revisions/validator";

const baselineSource = `export default function ProductPreview() {
  return (
    <section>
      <button>Add to cart</button>
      <button>See size guide</button>
      <p>Free shipping over $75.</p>
    </section>
  );
}
`;

const updatedSource = `export default function ProductPreview() {
  return (
    <section aria-label="Sticky mobile buy bar">
      <div>Low stock - order soon</div>
      <div>Free returns</div>
      <button>Add to cart</button>
      <button>Buy now</button>
    </section>
  );
}
`;

describe("validateGeneratedEdit", () => {
  it("accepts a bounded update to the editable preview file", () => {
    expect(
      validateGeneratedEdit({
        currentSource: baselineSource,
        patchResponse: {
          summary: ["Updated preview"],
          filesTouched: [EDITABLE_PREVIEW_PATH],
          sourceAfter: updatedSource,
        },
      }),
    ).toEqual({ ok: true });
  });

  it("rejects edits to other files", () => {
    expect(
      validateGeneratedEdit({
        currentSource: baselineSource,
        patchResponse: {
          summary: ["Updated preview"],
          filesTouched: ["src/lib/cart.ts"],
          sourceAfter: updatedSource,
        },
      }),
    ).toEqual({
      ok: false,
      reason: "Patch attempted to edit a forbidden file.",
    });
  });

  it("rejects imports of forbidden commerce logic", () => {
    expect(
      validateGeneratedEdit({
        currentSource: baselineSource,
        patchResponse: {
          summary: ["Updated preview"],
          filesTouched: [EDITABLE_PREVIEW_PATH],
          sourceAfter: `import { updateCart } from "@/lib/cart";

export default function ProductPreview() {
  return <div />;
}
`,
        },
      }),
    ).toEqual({
      ok: false,
      reason: "Editable preview must stay self-contained and may not add imports.",
    });
  });

  it("rejects unsupported utility classes outside the approved preview allowlist", () => {
    expect(
      validateGeneratedEdit({
        currentSource: baselineSource,
        patchResponse: {
          summary: ["Updated preview"],
          filesTouched: [EDITABLE_PREVIEW_PATH],
          sourceAfter: `export default function ProductPreview() {
  return (
    <section className="rounded-2xl bg-[#123456] text-white">
      <button className="rounded-full">Buy now</button>
      <button>See size guide</button>
      <p>Free returns and low stock.</p>
    </section>
  );
}
`,
        },
      }),
    ).toEqual({
      ok: false,
      reason:
        "Editable preview used unsupported utility classes: bg-[#123456]. Reuse only the approved preview class tokens.",
    });
  });
});
