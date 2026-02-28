import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RevisionTimeline } from "@/components/projects/RevisionTimeline";

describe("RevisionTimeline", () => {
  it("shows current/latest/original badges and only offers restore on restorable revisions", () => {
    render(
      <RevisionTimeline
        currentVersionKey="baseline"
        restorePendingKey={null}
        revisions={[
          {
            id: "revision-1",
            prompt: "Add trust badges",
            status: "applied",
            testStatus: "passed",
            testOutput: "All checks passed.",
            blockedReason: null,
            summary: ["Added trust badges."],
            verificationNote: null,
            createdAtLabel: "2/28/2026, 10:00:00 AM",
            isCurrent: false,
            isLatest: true,
            isOriginal: false,
            canRestore: true,
          },
          {
            id: "revision-0",
            prompt: "Restore the original product page version.",
            status: "applied",
            testStatus: "passed",
            testOutput: null,
            blockedReason: null,
            summary: ["Restored the original seeded product page."],
            verificationNote: null,
            createdAtLabel: "2/28/2026, 9:00:00 AM",
            isCurrent: true,
            isLatest: false,
            isOriginal: true,
            canRestore: false,
          },
        ]}
        onRestoreRevision={vi.fn()}
      />,
    );

    expect(screen.getByText("Latest")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Original")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restore this version" })).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: "Restore this version" })).toHaveLength(1);
    expect(screen.getAllByText("Checks passed")).toHaveLength(2);
    expect(screen.getAllByText("This version passed the safety checks.")).toHaveLength(2);
    expect(screen.getByText("View check details")).toBeInTheDocument();
  });
});
