import { describe, expect, it } from "vitest";

import { getUserFacingBlockedReason } from "@/lib/revisions/userFacing";

describe("getUserFacingBlockedReason", () => {
  it("translates out-of-scope commerce requests into demo-friendly copy", () => {
    expect(
      getUserFacingBlockedReason(
        "Request attempted to change cart, checkout, pricing, or subscription behavior outside the approved product-page surface.",
      ),
    ).toEqual({
      summary:
        "This request reached outside the part of the product page this demo is allowed to edit.",
      guidance:
        "Keep the request focused on the product page preview rather than checkout, cart, or other site logic.",
      technical:
        "Request attempted to change cart, checkout, pricing, or subscription behavior outside the approved product-page surface.",
    });
  });

  it("translates stale diff replay conflicts into demo-friendly copy", () => {
    expect(
      getUserFacingBlockedReason("Patch no longer applies to current revision."),
    ).toEqual({
      summary: "This saved diff no longer matches the current page version.",
      guidance:
        "Restore a saved version directly instead of replaying an older technical diff.",
      technical: "Patch no longer applies to current revision.",
    });
  });

  it("translates source mismatch failures into narrower-request guidance", () => {
    expect(
      getUserFacingBlockedReason("Patched result did not match generated source."),
    ).toEqual({
      summary: "This update couldn’t be applied reliably.",
      guidance: "Try a narrower request so the generated change stays stable.",
      technical: "Patched result did not match generated source.",
    });
  });
});
