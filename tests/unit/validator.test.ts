import { describe, expect, it } from "vitest";

import { EDITABLE_PREVIEW_PATH } from "@/lib/revisions/constants";
import {
  validateGeneratedEdit,
  validateRequestedScope,
} from "@/lib/revisions/validator";

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
  it("rejects requests that ask to modify cart, checkout, pricing, or subscription behavior", () => {
    expect(
      validateRequestedScope(
        "Also refactor the cart logic to add subscriptions and update the checkout flow.",
      ),
    ).toEqual({
      ok: false,
      reason:
        "Request attempted to change cart, checkout, pricing, or subscription behavior outside the approved product-page surface.",
    });
  });

  it("allows product-page requests that mention checkout only as reassurance copy", () => {
    expect(
      validateRequestedScope(
        "Add trust badges under the CTA with shipping, returns, and secure checkout reassurance.",
      ),
    ).toEqual({ ok: true });
  });

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

  it("rejects subscription purchase UI even if it stays self-contained", () => {
    expect(
      validateGeneratedEdit({
        currentSource: baselineSource,
        patchResponse: {
          summary: ["Updated preview"],
          filesTouched: [EDITABLE_PREVIEW_PATH],
          sourceAfter: `export default function ProductPreview() {
  return (
    <section>
      <div>One-time purchase</div>
      <div>Subscribe & Save 10%</div>
      <button>Buy now</button>
    </section>
  );
}
`,
        },
      }),
    ).toEqual({
      ok: false,
      reason:
        "Editable preview may not introduce subscription or recurring purchase behavior.",
    });
  });

  it("accepts broader styling changes when the edit stays bounded to the preview component", () => {
    expect(
      validateGeneratedEdit({
        currentSource: baselineSource,
        patchResponse: {
          summary: ["Updated preview"],
          filesTouched: [EDITABLE_PREVIEW_PATH],
          sourceAfter: `export default function ProductPreview() {
  return (
    <section className="rounded-2xl bg-[#123456] text-white transition-all duration-200">
      <div className="gallery-frame gallery-label">Spring campaign</div>
      <button className={"rounded-full bg-[#201812] text-white"}>Buy now</button>
      <button>See size guide</button>
      <p>Free returns and low stock.</p>
    </section>
  );
}
`,
        },
      }),
    ).toEqual({ ok: true });
  });
});
