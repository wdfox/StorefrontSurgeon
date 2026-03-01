"use client";

import { useEffect, useRef, type FormEvent, type ReactNode } from "react";

import { surgeryPresets } from "@/demo/presets";

const promptExamples = [
  {
    label: "Example: Add a stronger sticky buy bar",
    prompt: surgeryPresets["sticky-buy-bar"].prompt,
  },
  {
    label: "Example: Stronger urgency copy",
    prompt:
      "Strengthen the urgency copy near the price, make the primary purchase area feel more promotional",
  },
  {
    label: "Example: Soften the palette for a spring campaign",
    prompt:
      "Soften the palette and add a subtle spring campaign treatment while keeping the product page polished and conversion-aware.",
  },
];

function resizeTextarea(element: HTMLTextAreaElement | null) {
  if (!element) {
    return;
  }

  element.style.height = "0px";
  element.style.height = `${element.scrollHeight}px`;
}

type WorkspaceComposerProps = {
  preview: ReactNode;
  prompt: string;
  isBusy: boolean;
  isGenerationRunning: boolean;
  onPromptChange: (nextPrompt: string) => void;
  onSubmit: () => void;
};

export function WorkspaceComposer({
  preview,
  prompt,
  isBusy,
  isGenerationRunning,
  onPromptChange,
  onSubmit,
}: WorkspaceComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    resizeTextarea(textareaRef.current);
  }, [prompt]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <>
      <div className="relative">
        <div
          className={`transition-opacity duration-300 ${
            isGenerationRunning ? "opacity-55" : "opacity-100"
          }`}
        >
          {preview}
        </div>
        {isGenerationRunning ? (
          <div className="absolute inset-0 z-10 grid place-items-center rounded-[2rem] bg-[rgba(244,236,222,0.46)] backdrop-blur-[2px]">
            <div className="panel panel-strong flex flex-col items-center gap-3 rounded-[1.6rem] px-5 py-4 text-center shadow-[0_20px_55px_rgba(67,45,20,0.16)]">
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(191,90,44,0.2)] border-t-[var(--accent)]" />
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                  Updating preview
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  We&apos;re generating a new product page version.
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <form
        className="panel panel-strong relative mt-5 rounded-[1.8rem] border border-[rgba(108,89,73,0.16)] p-4 shadow-[0_24px_60px_rgba(67,45,20,0.16)] sm:p-5"
        onSubmit={handleSubmit}
      >
        <div className="eyebrow">Describe Your Change</div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="block flex-1">
            <span className="sr-only">Storefront change request</span>
            <textarea
              ref={textareaRef}
              className={`field min-h-[3.5rem] resize-none overflow-hidden rounded-[1.6rem] py-3 transition-opacity duration-200 ${
                isGenerationRunning ? "cursor-not-allowed opacity-70" : ""
              }`}
              rows={1}
              placeholder="What would you like to update?"
              value={prompt}
              disabled={isGenerationRunning}
              onChange={(event) => {
                resizeTextarea(event.target);
                onPromptChange(event.target.value);
              }}
            />
          </label>

          <button
            className={`button-primary min-w-28 ${isGenerationRunning ? "cursor-progress" : ""}`}
            type="submit"
            disabled={isBusy}
          >
            {isGenerationRunning ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[rgba(255,248,241,0.42)] border-t-[#fff8f1]" />
                <span>Generating...</span>
              </span>
            ) : (
              "Generate"
            )}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
          {promptExamples.map((example) => (
            <button
              key={example.label}
              className="pill cursor-pointer transition-transform duration-150 hover:-translate-y-0.5"
              type="button"
              disabled={isBusy}
              onClick={() => {
                onPromptChange(example.prompt);
              }}
            >
              {example.label}
            </button>
          ))}
        </div>
      </form>
    </>
  );
}
