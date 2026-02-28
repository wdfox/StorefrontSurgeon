import { inspectEditablePreview, loadEditablePreviewComponent } from "@/lib/revisions/source";
import type { TestRunResult } from "@/lib/revisions/types";

export function runRevisionTests(sourceAfter: string): TestRunResult {
  try {
    loadEditablePreviewComponent(sourceAfter);
    const signals = inspectEditablePreview(sourceAfter);
    const normalizedClasses = signals.classNames.join(" ");
    const failures: string[] = [];

    if (!signals.ariaLabels.some((label) => /product preview/i.test(label))) {
      failures.push(
        'Editable preview should preserve an accessible "Product preview" aria label.',
      );
    }

    if (signals.buttonCount < 1) {
      failures.push(
        "Editable preview should keep at least one visible action button.",
      );
    }

    if (!/(rounded-\[|rounded-|shadow-\[|shadow|border|bg-\[|bg-)/.test(normalizedClasses)) {
      failures.push(
        "Editable preview should preserve styled UI structure rather than collapsing to unstyled markup.",
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
        "4 checks passed: component compiled, preview landmark preserved, action controls present, styled structure preserved.",
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
