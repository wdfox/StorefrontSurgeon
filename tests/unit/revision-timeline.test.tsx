import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RevisionTimeline } from "@/components/projects/RevisionTimeline";

describe("RevisionTimeline", () => {
  it("shows current/latest/original badges and only offers restore on restorable revisions", () => {
    render(
      <RevisionTimeline
        currentVersionKey="baseline"
        restorePendingKey={null}
        replayPendingRevisionId={null}
        revisionNotices={{}}
        revisions={[
          {
            id: "revision-1",
            prompt: "Add trust badges",
            status: "applied",
            testStatus: "passed",
            blockedReason: null,
            summary: ["Added trust badges."],
            createdAtLabel: "2/28/2026, 10:00:00 AM",
            isCurrent: false,
            isLatest: true,
            isOriginal: false,
            canRestore: true,
            canReplay: true,
          },
          {
            id: "revision-0",
            prompt: "Restore the original product page version.",
            status: "applied",
            testStatus: "passed",
            blockedReason: null,
            summary: ["Restored the original seeded product page."],
            createdAtLabel: "2/28/2026, 9:00:00 AM",
            isCurrent: true,
            isLatest: false,
            isOriginal: true,
            canRestore: false,
            canReplay: false,
          },
        ]}
        onReplayRevision={vi.fn()}
        onRestoreRevision={vi.fn()}
      />,
    );

    expect(screen.getByText("Latest")).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Original")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restore this version" })).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: "Restore this version" })).toHaveLength(1);
    expect(screen.getByText("Advanced demo controls")).toBeInTheDocument();
  });

  it("renders replay conflict notices inline with technical details tucked behind disclosure", () => {
    render(
      <RevisionTimeline
        currentVersionKey="revision-current"
        restorePendingKey={null}
        replayPendingRevisionId={null}
        revisionNotices={{
          "revision-1": {
            tone: "warning",
            text: "This saved diff was created for an older page state and can’t be replayed on the current version.",
            technical: "Patch no longer applies to current revision.",
          },
        }}
        revisions={[
          {
            id: "revision-1",
            prompt: "Add sticky buy bar",
            status: "applied",
            testStatus: "passed",
            blockedReason: null,
            summary: ["Added a sticky buy bar."],
            createdAtLabel: "2/28/2026, 8:00:00 AM",
            isCurrent: false,
            isLatest: false,
            isOriginal: false,
            canRestore: true,
            canReplay: true,
          },
        ]}
        onReplayRevision={vi.fn()}
        onRestoreRevision={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        "This saved diff was created for an older page state and can’t be replayed on the current version.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("View technical details"));

    expect(
      screen.getByText("Patch no longer applies to current revision."),
    ).toBeInTheDocument();
  });
});
