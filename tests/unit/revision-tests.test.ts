import { describe, expect, it } from "vitest";

import { runRevisionTests } from "@/lib/revisions/tests";

const validSource = `export default function ProductPreview() {
  return (
    <section aria-label="Product preview" className="rounded-[2rem] bg-[#fffaf2] p-6">
      <div className="rounded-2xl border border-[#decab3] bg-white/80 p-5">
        <button className="rounded-full bg-[#201812] px-5 py-4 text-sm font-bold text-[#fef7ef]">
          Add to cart
        </button>
      </div>
    </section>
  );
}
`;

const missingLabelSource = `export default function ProductPreview() {
  return (
    <section className="rounded-[2rem] bg-[#fffaf2] p-6">
      <button className="rounded-full bg-[#201812] px-5 py-4 text-sm font-bold text-[#fef7ef]">
        Add to cart
      </button>
    </section>
  );
}
`;

describe("runRevisionTests", () => {
  it("passes for a renderable preview with an accessible landmark and button", () => {
    expect(runRevisionTests(validSource)).toEqual({
      status: "passed",
      output:
        "4 checks passed: component compiled, preview landmark preserved, action controls present, styled structure preserved.",
    });
  });

  it("fails when the preview landmark is removed", () => {
    expect(runRevisionTests(missingLabelSource)).toEqual({
      status: "failed",
      output:
        'Editable preview should preserve an accessible "Product preview" aria label.',
    });
  });
});
