"use client";

import Link from "next/link";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { surgeryPresets } from "@/demo/presets";
import { DiffPanel } from "@/components/projects/DiffPanel";
import { RevisionTimeline } from "@/components/projects/RevisionTimeline";
import { WorkspaceComposer } from "@/components/projects/WorkspaceComposer";
import { WorkspaceProgressDrawer } from "@/components/projects/WorkspaceProgressDrawer";
import type {
  ActionNotice,
  DrawerState,
  LatestRun,
  RevisionTimelineItem,
} from "@/components/projects/workspaceTypes";
import { getUserFacingBlockedReason } from "@/lib/revisions/userFacing";
import type {
  RevisionSnapshot,
  RestoreRequest,
  RestoreResponse,
  SurgeryPresetKey,
} from "@/lib/revisions/types";

type WorkspaceExperienceProps = {
  projectId: string;
  projectName: string;
  projectDescription: string | null;
  currentVersionKey: "baseline" | string;
  hasOriginalVersionActive: boolean;
  baselineVersionLabel: string;
  latestRun: LatestRun | null;
  revisions: RevisionTimelineItem[];
  preview: ReactNode;
  actionSlot?: ReactNode;
};

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

function isTerminalStatus(status: LatestRun["status"]) {
  return status !== "pending";
}

function getPresetKeyForPrompt(nextPrompt: string): SurgeryPresetKey | undefined {
  return nextPrompt === surgeryPresets["sticky-buy-bar"].prompt
    ? "sticky-buy-bar"
    : undefined;
}

export function WorkspaceExperience({
  projectId,
  projectName,
  projectDescription,
  currentVersionKey,
  hasOriginalVersionActive,
  baselineVersionLabel,
  latestRun,
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
  const [actionNotice, setActionNotice] = useState<ActionNotice | null>(null);

  function syncPrompt(nextPrompt: string) {
    setPrompt(nextPrompt);
    setSelectedPresetKey(getPresetKeyForPrompt(nextPrompt));
  }

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
          setPrompt("");
          setSelectedPresetKey(undefined);
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

  async function submitRequest() {
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

  const displayRun =
    liveRun && latestRun?.id === liveRun.id && latestRun.status !== "pending"
      ? latestRun
      : liveRun ?? latestRun;
  const drawerVisible = drawerPinned && Boolean(displayRun || drawerState.error);
  const isGenerationRunning =
    isSubmitting || pending || (liveRun ? !isTerminalStatus(liveRun.status) : false);
  const isBusy = isGenerationRunning || Boolean(restorePendingKey);
  const canReopenDrawer = liveRun
    ? !isTerminalStatus(liveRun.status) && !drawerPinned
    : false;

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
                : "border-[rgba(162,60,50,0.18)] bg-[rgba(162,60,50,0.08)] text-[var(--danger)]"
            }`}
          >
            {actionNotice.text}
          </div>
        ) : null}

        <section className="space-y-5">
          <WorkspaceComposer
            preview={preview}
            prompt={prompt}
            isBusy={isBusy}
            isGenerationRunning={isGenerationRunning}
            onPromptChange={syncPrompt}
            onSubmit={() => {
              void submitRequest();
            }}
          />
        </section>

        <section className="mt-8">
          <RevisionTimeline
            currentVersionKey={currentVersionKey}
            restorePendingKey={restorePendingKey}
            revisions={revisions}
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

      <WorkspaceProgressDrawer
        visible={drawerVisible}
        canReopen={canReopenDrawer}
        run={displayRun ?? null}
        drawerState={drawerState}
        onOpen={() => {
          setDrawerPinned(true);
        }}
        onClose={() => {
          setDrawerPinned(false);
        }}
      />
    </>
  );
}
