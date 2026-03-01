"use client";

import { getUserFacingBlockedReason } from "@/lib/revisions/userFacing";
import type { RevisionRunStage, RevisionStatus } from "@/lib/revisions/types";

import type { DrawerState, LatestRun } from "@/components/projects/workspaceTypes";

type StageCardState = "done" | "current" | "failed" | "blocked" | "waiting";

const stageLabels: Record<
  RevisionRunStage,
  { title: string; detail: string; compact: string }
> = {
  generating: {
    title: "Creating your update",
    detail: "Drafting a new version of this product page based on your request.",
    compact: "Creating",
  },
  validating: {
    title: "Checking for safe changes",
    detail: "Making sure the update stays inside the approved page area.",
    compact: "Checking",
  },
  testing: {
    title: "Reviewing the updated page",
    detail: "Running quick quality checks before the new version is marked ready.",
    compact: "Reviewing",
  },
  applying: {
    title: "Updating the preview",
    detail: "Replacing the current preview with the latest approved version.",
    compact: "Updating",
  },
  complete: {
    title: "Your update is ready",
    detail: "The latest version is now saved and ready to review in the workspace.",
    compact: "Ready",
  },
};

const stageOrder: RevisionRunStage[] = [
  "generating",
  "validating",
  "testing",
  "applying",
];

function isTerminalStatus(status: RevisionStatus) {
  return status !== "pending";
}

function getRunTone(status: RevisionStatus) {
  if (status === "applied") {
    return "text-[var(--success)]";
  }

  if (status === "blocked" || status === "failed") {
    return "text-[var(--danger)]";
  }

  if (status === "pending") {
    return "text-[var(--accent-strong)]";
  }

  return "text-[var(--muted)]";
}

function getRunLabel(status: RevisionStatus, runStage?: RevisionRunStage) {
  if (status === "pending") {
    return stageLabels[runStage ?? "generating"].compact;
  }

  if (status === "applied") {
    return "Ready";
  }

  if (status === "blocked") {
    return "Couldn’t apply";
  }

  if (status === "failed") {
    return "Needs review";
  }

  return "Ready";
}

function getDrawerCopy(run: LatestRun | null, error: string | null) {
  if (error) {
    return {
      title: "We couldn’t start this update",
      detail: "Please adjust the request and try again.",
    };
  }

  if (!run) {
    return stageLabels.complete;
  }

  if (run.status === "pending") {
    return stageLabels[run.runStage];
  }

  if (run.status === "applied") {
    return stageLabels.complete;
  }

  if (run.status === "blocked") {
    return {
      title: "This update couldn’t be applied",
      detail: "It tried to change something outside the page area this tool is allowed to update.",
    };
  }

  return {
    title: "This update needs review",
    detail: `The latest version stopped during ${stageLabels[run.runStage].compact.toLowerCase()}.`,
  };
}

function getStageState(stage: RevisionRunStage, run: LatestRun | null): StageCardState {
  if (!run) {
    return "waiting";
  }

  const currentIndex = stageOrder.indexOf(run.runStage);
  const stageIndex = stageOrder.indexOf(stage);

  if (run.status === "applied") {
    return "done";
  }

  if (run.status === "pending") {
    if (stageIndex < currentIndex) {
      return "done";
    }

    if (stageIndex === currentIndex) {
      return "current";
    }

    return "waiting";
  }

  if (stageIndex < currentIndex) {
    return "done";
  }

  if (stageIndex === currentIndex) {
    return run.status === "blocked" ? "blocked" : "failed";
  }

  return "waiting";
}

function getStageCardClasses(state: StageCardState) {
  if (state === "current") {
    return {
      panel: "border-[rgba(198,95,47,0.22)] bg-[rgba(198,95,47,0.10)]",
      badge: "border-[rgba(198,95,47,0.35)] bg-[rgba(198,95,47,0.12)]",
      text: "Working",
    };
  }

  if (state === "done") {
    return {
      panel: "border-[rgba(31,122,82,0.18)] bg-[rgba(31,122,82,0.08)]",
      badge: "border-[rgba(31,122,82,0.24)] bg-[rgba(31,122,82,0.12)]",
      text: "Done",
    };
  }

  if (state === "blocked") {
    return {
      panel: "border-[rgba(162,60,50,0.18)] bg-[rgba(162,60,50,0.08)]",
      badge: "border-[rgba(162,60,50,0.22)] bg-[rgba(162,60,50,0.10)]",
      text: "Couldn’t apply",
    };
  }

  if (state === "failed") {
    return {
      panel: "border-[rgba(162,60,50,0.18)] bg-[rgba(162,60,50,0.08)]",
      badge: "border-[rgba(162,60,50,0.22)] bg-[rgba(162,60,50,0.10)]",
      text: "Needs review",
    };
  }

  return {
    panel: "border-[rgba(108,89,73,0.12)] bg-[rgba(255,251,246,0.72)]",
    badge: "border-[rgba(108,89,73,0.14)] bg-white/70",
    text: "Waiting",
  };
}

type WorkspaceProgressDrawerProps = {
  visible: boolean;
  canReopen: boolean;
  run: LatestRun | null;
  drawerState: DrawerState;
  onOpen: () => void;
  onClose: () => void;
};

export function WorkspaceProgressDrawer({
  visible,
  canReopen,
  run,
  drawerState,
  onOpen,
  onClose,
}: WorkspaceProgressDrawerProps) {
  const drawerCopy = getDrawerCopy(run, drawerState.error);
  const drawerStatusLabel = run ? getRunLabel(run.status, run.runStage) : "Ready";
  const blockedReasonCopy = getUserFacingBlockedReason(run?.blockedReason);

  return (
    <>
      {canReopen ? (
        <button
          className="button-secondary fixed bottom-5 right-5 z-40 px-5 py-3 shadow-[0_18px_40px_rgba(67,45,20,0.18)]"
          type="button"
          onClick={onOpen}
        >
          View progress
        </button>
      ) : null}

      <div
        className={`pointer-events-none fixed inset-y-0 right-0 z-50 flex w-full justify-end px-4 py-4 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
      >
        <aside
          className={`flex h-full w-full max-w-[25rem] flex-col rounded-[2rem] border border-[rgba(108,89,73,0.16)] bg-[linear-gradient(180deg,rgba(255,252,247,0.98)_0%,rgba(252,245,236,0.98)_100%)] p-5 shadow-[0_28px_80px_rgba(41,27,12,0.22)] backdrop-blur transition-transform duration-300 ${visible ? "pointer-events-auto translate-x-0" : "pointer-events-none translate-x-10"}`}
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="eyebrow">Update progress</div>
                <div className={`pill ${getRunTone(run?.status ?? "pending")}`}>
                  {drawerStatusLabel}
                </div>
              </div>
              <h2 className="display mt-3 text-3xl leading-tight">{drawerCopy.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{drawerCopy.detail}</p>
            </div>

            <button className="button-secondary px-4 py-2" type="button" onClick={onClose}>
              Hide
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {stageOrder.map((stage, index) => {
              const state = getStageState(stage, run);
              const classes = getStageCardClasses(state);

              return (
                <div
                  key={stage}
                  className={`rounded-[1.4rem] border px-4 py-4 transition-colors ${classes.panel}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-full border ${classes.badge}`}
                    >
                      {state === "current" ? (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                      ) : state === "done" ? (
                        <span className="text-sm font-bold text-[var(--success)]">✓</span>
                      ) : state === "blocked" || state === "failed" ? (
                        <span className="text-sm font-bold text-[var(--danger)]">!</span>
                      ) : (
                        <span className="text-xs font-semibold text-[var(--muted)]">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-[var(--foreground)]">
                          {stageLabels[stage].title}
                        </div>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                          {classes.text}
                        </div>
                      </div>
                      <div className="mt-1 text-xs leading-6 text-[var(--muted)]">
                        {stageLabels[stage].detail}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-[rgba(108,89,73,0.12)] bg-[rgba(255,251,246,0.84)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
              Requested change
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--foreground)]">
              {drawerState.requestPrompt || "No request captured."}
            </p>
          </div>

          {run && isTerminalStatus(run.status) ? (
            <div className="mt-6 rounded-[1.5rem] border border-[rgba(108,89,73,0.12)] bg-[rgba(255,251,246,0.84)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[var(--foreground)]">Result</div>
                <div className={`pill ${getRunTone(run.status)}`}>
                  {getRunLabel(run.status, run.runStage)}
                </div>
              </div>

              {run.summary.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {run.summary.map((item) => (
                    <div key={item} className="pill">
                      {item}
                    </div>
                  ))}
                </div>
              ) : null}

              {blockedReasonCopy ? (
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.16em] text-[var(--danger)]">
                    View technical reason
                  </summary>
                  <div className="mt-3 rounded-[1.2rem] border border-[rgba(162,60,50,0.18)] bg-[rgba(162,60,50,0.08)] px-3 py-3">
                    <p className="text-sm leading-7 text-[var(--danger)]">
                      {blockedReasonCopy.summary}
                    </p>
                    {blockedReasonCopy.guidance ? (
                      <p className="mt-2 text-sm leading-7 text-[var(--danger)] opacity-80">
                        {blockedReasonCopy.guidance}
                      </p>
                    ) : null}
                    <p className="mt-3 text-sm leading-7 text-[var(--danger)]">
                      {blockedReasonCopy.technical}
                    </p>
                  </div>
                </details>
              ) : null}
            </div>
          ) : null}

          {drawerState.error ? (
            <div className="mt-6 rounded-[1.5rem] border border-[rgba(162,60,50,0.18)] bg-[rgba(162,60,50,0.08)] px-4 py-4 text-sm leading-7 text-[var(--danger)]">
              {drawerState.error}
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}
