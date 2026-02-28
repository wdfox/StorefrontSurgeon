export type UserFacingBlockedReason = {
  summary: string;
  guidance?: string;
  technical: string;
};

export function getUserFacingBlockedReason(
  technicalReason: string | null | undefined,
): UserFacingBlockedReason | null {
  if (!technicalReason) {
    return null;
  }

  if (technicalReason.includes("unsupported utility classes")) {
    return {
      summary:
        "This update used styling patterns that aren’t approved for this demo yet.",
      guidance:
        "Try reusing the existing visual styles instead of introducing new styling tokens or layout utilities.",
      technical: technicalReason,
    };
  }

  if (
    technicalReason.includes("literal className strings") ||
    technicalReason.includes("approved preview allowlist")
  ) {
    return {
      summary:
        "This update changed the page styling in a way this demo can’t safely apply yet.",
      guidance:
        "Try a simpler visual request that builds on the styles already used in the page.",
      technical: technicalReason,
    };
  }

  if (
    technicalReason.includes("forbidden file") ||
    technicalReason.includes("forbidden commerce logic") ||
    technicalReason.includes("cart, checkout, pricing, or subscription behavior outside")
  ) {
    return {
      summary:
        "This request reached outside the part of the product page this demo is allowed to edit.",
      guidance:
        "Keep the request focused on the product page preview rather than checkout, cart, or other site logic.",
      technical: technicalReason,
    };
  }

  if (technicalReason.includes("subscription or recurring purchase behavior")) {
    return {
      summary:
        "This update introduced subscription or recurring-purchase behavior outside the approved demo surface.",
      guidance:
        "Keep the request focused on product-page merchandising, copy, layout, and visual treatments.",
      technical: technicalReason,
    };
  }

  if (technicalReason.includes("Patch no longer applies to current revision.")) {
    return {
      summary: "This saved diff no longer matches the current page version.",
      guidance:
        "Restore a saved version directly instead of replaying an older technical diff.",
      technical: technicalReason,
    };
  }

  if (technicalReason.includes("Patched result did not match generated source.")) {
    return {
      summary: "This update couldn’t be applied reliably.",
      guidance:
        "Try a narrower request so the generated change stays stable.",
      technical: technicalReason,
    };
  }

  if (
    technicalReason.includes("may not add imports") ||
    technicalReason.includes("avoid runtime side effects") ||
    technicalReason.includes("without hooks")
  ) {
    return {
      summary:
        "This update relied on page logic that the editable preview is not allowed to add.",
      guidance:
        "Keep the request presentational so the change stays inside the approved page surface.",
      technical: technicalReason,
    };
  }

  if (technicalReason.includes("maximum allowed size")) {
    return {
      summary: "This update tried to change too much at once.",
      guidance:
        "Try a smaller, more specific request so the new version stays easy to review.",
      technical: technicalReason,
    };
  }

  if (technicalReason.includes("did not produce a meaningful file change")) {
    return {
      summary: "This request didn’t produce a usable page update.",
      guidance:
        "Try being more specific about what you want to change in the product page.",
      technical: technicalReason,
    };
  }

  if (
    technicalReason.includes("default ProductPreview export") ||
    technicalReason.includes("default React component function")
  ) {
    return {
      summary:
        "This update changed the product page structure in a way the demo can’t use.",
      guidance:
        "Try a request that adjusts the existing product page instead of replacing its structure.",
      technical: technicalReason,
    };
  }

  return {
    summary: "This update couldn’t be applied safely.",
    guidance:
      "Try a narrower request or stick closer to the page’s existing content and styles.",
    technical: technicalReason,
  };
}
