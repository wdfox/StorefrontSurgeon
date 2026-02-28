"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { surgeryPresets } from "@/demo/presets";

type SurgeryComposerProps = {
  projectId: string;
};

export function SurgeryComposer({ projectId }: SurgeryComposerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prompt, setPrompt] = useState(surgeryPresets["sticky-buy-bar"].prompt);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(presetKey?: "sticky-buy-bar") {
    setMessage(null);
    setIsSubmitting(true);
    const response = await fetch(`/api/projects/${projectId}/surgeries`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        presetKey,
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setMessage(body?.error ?? "Surgery request failed.");
      setIsSubmitting(false);
      return;
    }

    const body = (await response.json()) as { status: string };
    setMessage(`Revision ${body.status}.`);
    setIsSubmitting(false);

    startTransition(() => {
      router.refresh();
    });
  }

  const isBusy = isSubmitting || pending;

  return (
    <section className="panel rounded-[1.8rem] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Surgery composer</div>
          <h2 className="mt-2 text-2xl font-bold">
            Generate one constrained storefront patch.
          </h2>
        </div>
        <button
          className="button-secondary"
          type="button"
          disabled={isBusy}
          onClick={() => setPrompt(surgeryPresets["sticky-buy-bar"].prompt)}
        >
          Use preset
        </button>
      </div>

      <div className="mt-5 rounded-[1.4rem] border border-[rgba(108,89,73,0.14)] bg-[rgba(255,252,247,0.9)] p-4">
        <div className="text-sm font-semibold">
          {surgeryPresets["sticky-buy-bar"].title}
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {surgeryPresets["sticky-buy-bar"].description}
        </p>
      </div>

      <label className="mt-5 block space-y-2">
        <span className="text-sm font-semibold">Request</span>
        <textarea
          className="field min-h-32 resize-y"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </label>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          className="button-primary"
          type="button"
          disabled={isBusy}
          onClick={() => void submit("sticky-buy-bar")}
        >
          {isBusy ? "Generating..." : "Generate surgery"}
        </button>
        <button
          className="button-secondary"
          type="button"
          disabled={isBusy}
          onClick={() => void submit()}
        >
          {isBusy ? "Running..." : "Run freeform request"}
        </button>
      </div>

      {message ? (
        <p className="mt-4 text-sm font-semibold text-[var(--accent-strong)]">
          {message}
        </p>
      ) : null}
    </section>
  );
}
