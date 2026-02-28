"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setIsSubmitting(true);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("That email/password combination did not match the seeded demo user.");
      setIsSubmitting(false);
      return;
    }

    startTransition(() => {
      setIsSubmitting(false);
      router.push("/projects");
      router.refresh();
    });
  }

  const isBusy = isSubmitting || pending;

  return (
    <form
      action={handleSubmit}
      className="panel panel-strong w-full max-w-md rounded-[2rem] p-8"
    >
      <div className="space-y-2">
        <div className="eyebrow">Foundation login</div>
        <h1 className="display text-4xl leading-tight">
          Sign in to operate the storefront agent.
        </h1>
        <p className="text-sm leading-7 text-[var(--muted)]">
          Demo credentials: <strong>demo@storefrontsurgeon.dev</strong> /{" "}
          <strong>demo1234</strong>
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Email</span>
          <input
            className="field"
            type="email"
            name="email"
            defaultValue="demo@storefrontsurgeon.dev"
            required
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Password</span>
          <input
            className="field"
            type="password"
            name="password"
            defaultValue="demo1234"
            required
          />
        </label>
      </div>

      {error ? (
        <div className="status-danger mt-4 rounded-2xl border border-[rgba(162,60,50,0.18)] bg-[rgba(162,60,50,0.08)] px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <button className="button-primary mt-6 w-full" type="submit" disabled={isBusy}>
        {isBusy ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
