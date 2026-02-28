"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function CreateProjectButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function closeModal() {
    if (isSubmitting) {
      return;
    }

    setIsOpen(false);
    setProjectName("");
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = projectName.trim();

    if (!name) {
      setError("Enter a project name to continue.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const body = (await response.json().catch(() => null)) as
        | { error?: string; projectId?: string }
        | null;

      if (!response.ok || !body?.projectId) {
        setError(body?.error ?? "We couldn’t create that project.");
        setIsSubmitting(false);
        return;
      }

      setIsOpen(false);
      setProjectName("");
      router.push(`/projects/${body.projectId}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "We couldn’t create that project.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button type="button" className="button-primary" onClick={() => setIsOpen(true)}>
        Create project
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(33,29,24,0.32)] px-4 py-8 backdrop-blur-[3px]">
          <div className="panel panel-strong w-full max-w-xl rounded-[2rem] p-6 shadow-[0_28px_80px_rgba(33,29,24,0.2)] sm:p-7">
            <div>
              <div className="eyebrow">New project</div>
              <h2 className="display mt-3 text-3xl leading-tight">Create a new storefront</h2>
              <p className="mt-3 max-w-lg text-sm leading-7 text-[var(--muted)]">
                Start a new workspace from the same seeded linen shirt product page so you can
                iterate independently.
              </p>
            </div>

            <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                  Project name
                </span>
                <input
                  className="field"
                  type="text"
                  placeholder="Spring campaign refresh"
                  value={projectName}
                  disabled={isSubmitting}
                  autoFocus
                  onChange={(event) => setProjectName(event.target.value)}
                />
              </label>

              {error ? (
                <div className="rounded-[1.2rem] border border-[rgba(162,60,50,0.18)] bg-[rgba(162,60,50,0.08)] px-3 py-3 text-sm leading-7 text-[var(--danger)]">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="button-secondary"
                  disabled={isSubmitting}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="button-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
