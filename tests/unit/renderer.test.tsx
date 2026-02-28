import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  inspectEditablePreview,
  loadEditablePreviewComponent,
} from "@/lib/revisions/source";

const baselineSource = `export default function ProductPreview() {
  return (
    <section aria-label="Product preview">
      <button>Add to cart</button>
      <button>See size guide</button>
      <p>Free shipping over $75.</p>
    </section>
  );
}
`;

const updatedSource = `export default function ProductPreview() {
  return (
    <section aria-label="Product preview">
      <div aria-label="Sticky mobile buy bar">Buy now</div>
      <div>Free returns</div>
      <div>Low stock - order soon</div>
      <button>Add to cart</button>
      <button>Buy now</button>
    </section>
  );
}
`;

describe("editable preview source", () => {
  it("loads and renders the baseline preview component", () => {
    const PreviewComponent = loadEditablePreviewComponent(baselineSource);
    render(<PreviewComponent />);

    expect(screen.getByRole("button", { name: "Add to cart" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Sticky mobile buy bar")).not.toBeInTheDocument();
  });

  it("surfaces sticky-buy-bar signals from an updated preview", () => {
    const signals = inspectEditablePreview(updatedSource);

    expect(signals.ariaLabels).toContain("Sticky mobile buy bar");
    expect(signals.buttonTexts).toContain("Buy now");
    expect(signals.texts.join(" ")).toMatch(/Free returns/);
  });
});
