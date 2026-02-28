"use client";

import Link from "next/link";
import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { surgeryPresets } from "@/demo/presets";
import { DiffPanel } from "@/components/projects/DiffPanel";
import { RevisionTimeline } from "@/components/projects/RevisionTimeline";
import { TestStatusPanel } from "@/components/projects/TestStatusPanel";
import { getUserFacingBlockedReason } from "@/lib/revisions/userFacing";
import type {
  RevisionRunStage,
  RevisionReplayResponse,
  RevisionSnapshot,
  RevisionStatus,
  RestoreRequest,
  RestoreResponse,
  SurgeryPresetKey,
} from "@/lib/revisions/types";

type LatestRun = {
  id: string;
  prompt: string;
  status: RevisionStatus;
  runStage: RevisionRunStage;
  summary: string[];
  patchText: string | null;
  testStatus: string | null;
  testOutput: string | null;
  blockedReason: string | null;
  createdAtLabel: string;
};

type RevisionTimelineItem = {
  id: string;
  prompt: string;
  status: string;
  testStatus: string | null;
  blockedReason: string | null;
  summary: string[];
  createdAtLabel: string;
  isCurrent: boolean;
  isLatest: boolean;
  isOriginal: boolean;
  canRestore: boolean;
  canReplay: boolean;
};

type WorkspaceExperienceProps = {
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  currentVersionKey: "baseline" | string;
  hasOriginalVersionActive: boolean;
  baselineVersionLabel: string;
  latestRun: LatestRun | null;
  displayTestStatus: string | null;
  displayTestOutput: string | null;
  verificationNote: string | null;
  revisions: RevisionTimelineItem[];
  preview: ReactNode;
  actionSlot?: ReactNode;
};

type DrawerState = {
  requestPrompt: string;
  error: string | null;
};

type ActionNotice = {
  tone: "success" | "warning" | "error";
  text: string;
};

type RevisionNotice = {
  tone: "success" | "warning" | "error";
  text: string;
  technical?: string;
};

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

function mapSnapshotToRun(snapshot: RevisionSnapshot): LatestRun {
  return {
    id: snapshot.revisionId,
    prompt: snapshot.prompt,
    status: snapshot.status,
    runStage: snapshot.runStage,
    summary: snapshot.summary,
    patchText: snapshot.patchText,
    testStatus: snapshot.testStatus ?? null,
    testOutput: snapshot.testOutput ?? null,
    blockedReason: snapshot.blockedReason ?? null,
    createdAtLabel: new Date(snapshot.createdAt).toLocaleString(),
  };
}

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

export function WorkspaceExperience({
  projectId,
  projectName,
  projectDescription,
  currentVersionKey,
  hasOriginalVersionActive,
  baselineVersionLabel,
  latestRun,
  displayTestStatus,
  displayTestOutput,
  verificationNote,
  revisions,
  preview,
  actionSlot,
}: WorkspaceExperienceProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [selectedPresetKey, setSelectedPresetKey] = useState<SurgeryPresetKey | undefined>();
  const [liveRun, setLiveRun] = useState<LatestRun | null>(
    latestRun?.status === "pending" ? latestRun : null,
  );
  const [drawerPinned, setDrawerPinned] = useState(latestRun?.status === "pending");
  const [drawerState, setDrawerState] = useState<DrawerState>({
    requestPrompt: latestRun?.status === "pending" ? latestRun.prompt : "",
    error: null,
  });
  const [restorePendingKey, setRestorePendingKey] = useState<string | null>(null);
  const [replayPendingRevisionId, setReplayPendingRevisionId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<ActionNotice | null>(null);
  const [revisionNotices, setRevisionNotices] = useState<Record<string, RevisionNotice>>({});

  useEffect(() => {
    if (!liveRun || isTerminalStatus(liveRun.status)) {
      return;
    }

    let timeoutId: number | null = null;
    let cancelled = false;

    const pollRevision = async () => {
      try {
        const response = await fetch(
          `/api/projects/${projectId}/revisions/${liveRun.id}`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Could not load revision status.");
        }

        const snapshot = (await response.json()) as RevisionSnapshot;

        if (cancelled) {
          return;
        }

        const nextRun = mapSnapshotToRun(snapshot);
        setLiveRun(nextRun);

        if (isTerminalStatus(nextRun.status)) {
          setIsSubmitting(false);
          startTransition(() => {
            router.refresh();
          });
          return;
        }

        timeoutId = window.setTimeout(() => {
          void pollRevision();
        }, 700);
      } catch {
        if (cancelled) {
          return;
        }

        timeoutId = window.setTimeout(() => {
          void pollRevision();
        }, 1200);
      }
    };

    timeoutId = window.setTimeout(() => {
      void pollRevision();
    }, 700);

    return () => {
      cancelled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [liveRun, projectId, router, startTransition]);

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPrompt = prompt.trim();
    setActionNotice(null);

    if (!nextPrompt) {
      setDrawerPinned(true);
      setDrawerState({
        requestPrompt: "",
        error: "Enter a request before generating an update.",
      });
      return;
    }

    setIsSubmitting(true);
    setDrawerPinned(true);
    setDrawerState({
      requestPrompt: nextPrompt,
      error: null,
    });

    try {
      const response = await fetch(`/api/projects/${projectId}/surgeries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: nextPrompt,
          presetKey: selectedPresetKey,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        setDrawerState({
          requestPrompt: nextPrompt,
          error: body?.error ?? "We couldn’t generate that update.",
        });
        setIsSubmitting(false);
        return;
      }

      const snapshot = (await response.json()) as RevisionSnapshot;
      setLiveRun(mapSnapshotToRun(snapshot));
      setIsSubmitting(false);
    } catch (error) {
      setDrawerState({
        requestPrompt: nextPrompt,
        error: error instanceof Error ? error.message : "We couldn’t generate that update.",
      });
      setIsSubmitting(false);
    }
  }

  async function restoreVersion(
    restoreRequest: RestoreRequest,
    successMessage: string,
  ) {
    const restoreKey =
      restoreRequest.target === "baseline" ? "baseline" : restoreRequest.revisionId;

    setActionNotice(null);
    setRestorePendingKey(restoreKey);

    try {
      const response = await fetch(`/api/projects/${projectId}/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(restoreRequest),
      });

      const body = (await response.json().catch(() => null)) as
        | ({ error?: string } & Partial<RestoreResponse>)
        | null;

      if (!response.ok || !body) {
        const message = body?.error ?? "We couldn’t restore that version.";
        setActionNotice({
          tone: "error",
          text: message,
        });
        return;
      }

      if (body.status === "failed") {
        const reason = body.blockedReason ?? body.testOutput ?? "We couldn’t restore that version.";
        const friendlyReason = getUserFacingBlockedReason(reason);

        setActionNotice({
          tone: "error",
          text: friendlyReason?.summary ?? "We couldn’t restore that version.",
        });
        return;
      }

      setActionNotice({
        tone: "success",
        text: successMessage,
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setActionNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "We couldn’t restore that version.",
      });
    } finally {
      setRestorePendingKey(null);
    }
  }

  async function replayRevision(revisionId: string) {
    setReplayPendingRevisionId(revisionId);
    setRevisionNotices((current) => {
      const next = { ...current };
      delete next[revisionId];
      return next;
    });

    try {
      const response = await fetch(
        `/api/projects/${projectId}/revisions/${revisionId}/replay`,
        {
          method: "POST",
        },
      );
      const body = (await response.json().catch(() => null)) as
        | ({ error?: string } & Partial<RevisionReplayResponse>)
        | null;

      if (!response.ok || !body) {
        const technicalReason = body?.error ?? "We couldn’t replay that saved diff.";
        const friendlyReason = getUserFacingBlockedReason(technicalReason);

        setRevisionNotices((current) => ({
          ...current,
          [revisionId]: {
            tone: response.status === 409 ? "warning" : "error",
            text:
              response.status === 409
                ? "This saved diff was created for an older page state and can’t be replayed on the current version."
                : friendlyReason?.summary ?? "We couldn’t replay that saved diff.",
            technical: technicalReason,
          },
        }));
        return;
      }

      if (!body.ok) {
        setRevisionNotices((current) => ({
          ...current,
          [revisionId]: {
            tone: "warning",
            text: "This saved diff was created for an older page state and can’t be replayed on the current version.",
            technical: body.error ?? "We couldn’t replay that saved diff.",
          },
        }));
        return;
      }

      setRevisionNotices((current) => ({
        ...current,
        [revisionId]: {
          tone: "success",
          text: "This saved diff still applies cleanly to the current page. The active preview was left unchanged.",
          technical: body.patchText,
        },
      }));
    } catch (error) {
      setRevisionNotices((current) => ({
        ...current,
        [revisionId]: {
          tone: "error",
          text: "We couldn’t replay that saved diff.",
          technical: error instanceof Error ? error.message : undefined,
        },
      }));
    } finally {
      setReplayPendingRevisionId(null);
    }
  }

  const displayRun =
    liveRun && latestRun?.id === liveRun.id && latestRun.status !== "pending"
      ? latestRun
      : liveRun ?? latestRun;
  const currentTestStatus =
    displayRun?.id === latestRun?.id
      ? displayTestStatus
      : displayRun?.testStatus ?? displayTestStatus;
  const currentTestOutput =
    displayRun?.id === latestRun?.id
      ? displayTestOutput
      : displayRun?.testOutput ?? displayTestOutput;
  const currentBlockedReason =
    displayRun?.id === latestRun?.id
      ? latestRun?.blockedReason ?? null
      : displayRun?.blockedReason ?? null;
  const drawerVisible = drawerPinned && Boolean(displayRun || drawerState.error);
  const drawerCopy = getDrawerCopy(displayRun ?? null, drawerState.error);
  const isBusy =
    isSubmitting ||
    pending ||
    (liveRun ? !isTerminalStatus(liveRun.status) : false) ||
    Boolean(restorePendingKey) ||
    Boolean(replayPendingRevisionId);
  const canReopenDrawer = liveRun
    ? !isTerminalStatus(liveRun.status) && !drawerPinned
    : false;
  const drawerStatusLabel = displayRun
    ? getRunLabel(displayRun.status, displayRun.runStage)
    : "Ready";
  const blockedReasonCopy = getUserFacingBlockedReason(displayRun?.blockedReason);

  return (
    <>
      <main className="mx-auto min-h-screen max-w-[92rem] px-5 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <div className="eyebrow">Storefront update</div>
            <h1 className="display mt-3 text-4xl leading-tight sm:text-5xl md:text-6xl">
              {projectName}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
              Review the product page below, describe the change you want, and we’ll generate a new
              version with built-in safety checks in the background.
            </p>
            {projectDescription ? (
              <p className="mt-3 text-sm leading-7 text-[var(--muted)] opacity-80">
                {projectDescription}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!hasOriginalVersionActive ? (
              <button
                className="button-secondary"
                type="button"
                disabled={isBusy}
                onClick={() =>
                  void restoreVersion(
                    { target: "baseline" },
                    `${baselineVersionLabel} version restored.`,
                  )
                }
              >
                {restorePendingKey === "baseline" ? "Restoring..." : "Restore original"}
              </button>
            ) : null}
            <Link
              href="/projects"
              className="button-secondary inline-flex items-center gap-2"
            >
              Back to projects
            </Link>
            {actionSlot}
          </div>
        </header>

        {actionNotice ? (
          <div
            className={`mb-6 rounded-[1.4rem] border px-4 py-3 text-sm leading-7 ${
              actionNotice.tone === "success"
                ? "border-[rgba(31,122,82,0.18)] bg-[rgba(31,122,82,0.08)] text-[var(--success)]"
                : actionNotice.tone === "warning"
                  ? "border-[rgba(191,90,44,0.18)] bg-[rgba(191,90,44,0.08)] text-[var(--accent-strong)]"
                  : "border-[rgba(162,60,50,0.18)] bg-[rgba(162,60,50,0.08)] text-[var(--danger)]"
            }`}
          >
            {actionNotice.text}
          </div>
        ) : null}

        <section className="space-y-5">
          {preview}
          <form
            className="panel panel-strong relative mt-5 rounded-[1.8rem] border border-[rgba(108,89,73,0.16)] p-4 shadow-[0_24px_60px_rgba(67,45,20,0.16)] sm:p-5"
            onSubmit={(event) => void submitRequest(event)}
          >
            <div className="eyebrow">Describe Your Change</div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="block flex-1">
                <span className="sr-only">Storefront change request</span>
                <textarea
                  className="field min-h-[3.5rem] resize-none rounded-[1.6rem] overflow-hidden py-3"
                  rows={1}
                  placeholder="What would you like to update?"
                  value={prompt}
                  onChange={(event) => {
                    event.target.style.height = "0px";
                    event.target.style.height = `${event.target.scrollHeight}px`;
                    const nextPrompt = event.target.value;
                    setPrompt(nextPrompt);
                    setSelectedPresetKey(
                      nextPrompt === surgeryPresets["sticky-buy-bar"].prompt
                        ? "sticky-buy-bar"
                        : undefined,
                    );
                  }}
                />
              </label>

              <button
                className="button-primary min-w-28"
                type="submit"
                disabled={isBusy}
              >
                {isBusy ? "Generating..." : "Generate"}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
              {[
                {
                  label: "Example: Add a stronger sticky buy bar",
                  prompt: surgeryPresets["sticky-buy-bar"].prompt,
                },
                {
                  label: "Example: Add trust badges under the CTA",
                  prompt:
                    "Add visible trust badges under the primary CTA with shipping, returns, and secure checkout reassurance.",
                },
                {
                  label: "Example: Soften the palette for a spring campaign",
                  prompt:
                    "Soften the palette and add a subtle spring campaign treatment while keeping the product page polished and conversion-aware.",
                },
              ].map((example) => (
                <button
                  key={example.label}
                  className="pill cursor-pointer transition-transform duration-150 hover:-translate-y-0.5"
                  type="button"
                  disabled={isBusy}
                  onClick={() => {
                    setPrompt(example.prompt);
                    setSelectedPresetKey(
                      example.prompt === surgeryPresets["sticky-buy-bar"].prompt
                        ? "sticky-buy-bar"
                        : undefined,
                    );
                  }}
                >
                  {example.label}
                </button>
              ))}
            </div>
          </form>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <TestStatusPanel
            status={currentTestStatus}
            output={currentTestOutput}
            blockedReason={currentBlockedReason}
            note={displayRun?.id === latestRun?.id ? verificationNote : null}
          />
          <RevisionTimeline
            currentVersionKey={currentVersionKey}
            restorePendingKey={restorePendingKey}
            replayPendingRevisionId={replayPendingRevisionId}
            revisionNotices={revisionNotices}
            revisions={revisions}
            onReplayRevision={(revisionId) => void replayRevision(revisionId)}
            onRestoreRevision={(revisionId) =>
              void restoreVersion(
                { target: "revision", revisionId },
                "Saved version restored.",
              )
            }
          />
        </section>

        {displayRun ? (
          <section className="mt-6">
            <DiffPanel
              patchText={displayRun.patchText ?? null}
              summary={displayRun.summary ?? []}
            />
          </section>
        ) : null}
      </main>

      {canReopenDrawer ? (
        <button
          className="button-secondary fixed bottom-5 right-5 z-40 px-5 py-3 shadow-[0_18px_40px_rgba(67,45,20,0.18)]"
          type="button"
          onClick={() => {
            setDrawerPinned(true);
          }}
        >
          View progress
        </button>
      ) : null}

      <div
        className={`pointer-events-none fixed inset-y-0 right-0 z-50 flex w-full justify-end px-4 py-4 transition-opacity duration-300 ${drawerVisible ? "opacity-100" : "opacity-0"}`}
      >
        <aside
          className={`flex h-full w-full max-w-[25rem] flex-col rounded-[2rem] border border-[rgba(108,89,73,0.16)] bg-[linear-gradient(180deg,rgba(255,252,247,0.98)_0%,rgba(252,245,236,0.98)_100%)] p-5 shadow-[0_28px_80px_rgba(41,27,12,0.22)] backdrop-blur transition-transform duration-300 ${drawerVisible ? "pointer-events-auto translate-x-0" : "pointer-events-none translate-x-10"}`}
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="eyebrow">Update progress</div>
                <div className={`pill ${getRunTone(displayRun?.status ?? "pending")}`}>
                  {drawerStatusLabel}
                </div>
              </div>
              <h2 className="display mt-3 text-3xl leading-tight">{drawerCopy.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{drawerCopy.detail}</p>
            </div>

            <button
              className="button-secondary px-4 py-2"
              type="button"
              onClick={() => {
                setDrawerPinned(false);
              }}
            >
              Hide
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {stageOrder.map((stage, index) => {
              const state = getStageState(stage, displayRun ?? null);
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

          {displayRun && isTerminalStatus(displayRun.status) ? (
            <div className="mt-6 rounded-[1.5rem] border border-[rgba(108,89,73,0.12)] bg-[rgba(255,251,246,0.84)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[var(--foreground)]">Result</div>
                <div className={`pill ${getRunTone(displayRun.status)}`}>
                  {getRunLabel(displayRun.status, displayRun.runStage)}
                </div>
              </div>

              {displayRun.summary.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {displayRun.summary.map((item) => (
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
