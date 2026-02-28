import { inspectEditablePreview, loadEditablePreviewComponent } from "@/lib/revisions/source";
import type { TestRunResult } from "@/lib/revisions/types";

export function runRevisionTests(sourceAfter: string): TestRunResult {
  try {
    loadEditablePreviewComponent(sourceAfter);
    const signals = inspectEditablePreview(sourceAfter);
    const normalizedTexts = [
      ...signals.texts,
      ...signals.buttonTexts,
      ...signals.ariaLabels,
    ].join(" ");
    const normalizedClasses = signals.classNames.join(" ");
    const failures: string[] = [];

    if (signals.buttonCount < 2) {
      failures.push("Editable preview should include at least two buttons after the surgery.");
    }

    if (!/(return|shipping|secure checkout|secure)/i.test(normalizedTexts)) {
      failures.push(
        "Surgery should add trust badge or supporting copy related to returns, shipping, or secure checkout.",
      );
    }

    if (!/(low stock|order soon|limited|hurry)/i.test(normalizedTexts)) {
      failures.push("Surgery should add urgency-oriented copy.");
    }

    const hasMobileCtaRegion =
      /(sticky|mobile)/i.test(normalizedTexts) ||
      /(fixed)/i.test(normalizedClasses) ||
      signals.ariaLabels.some((label) => /mobile/i.test(label));

    const hasPurchaseAction = signals.buttonTexts.some((label) =>
      /(buy|add)/i.test(label),
    );

    if (!hasMobileCtaRegion || !hasPurchaseAction) {
      failures.push(
        "Surgery should add a mobile-oriented purchase treatment with a clear CTA.",
      );
    }

    if (failures.length > 0) {
      return {
        status: "failed",
        output: failures.join("\n"),
      };
    }

    return {
      status: "passed",
      output:
        "4 checks passed: component compiled, CTA controls present, trust/support copy present, urgency/mobile purchase treatment present.",
    };
  } catch (error) {
    return {
      status: "failed",
      output:
        error instanceof Error
          ? error.message
          : "Updated preview source could not be evaluated.",
    };
  }
}
