import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/LoginForm";
import { getOptionalSession } from "@/lib/session";

export default async function LoginPage() {
  const session = await getOptionalSession();

  if (session) {
    redirect("/projects");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-5xl">
        <div className="mb-10 max-w-2xl">
          <div className="eyebrow">Storefront Surgeon</div>
          <h1 className="display mt-3 text-5xl leading-tight md:text-6xl">
            Treat Codex like a bounded storefront engineer.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-[var(--muted)]">
            This foundation proves the entire loop: authenticated session,
            persisted revisions, validated patches, deterministic previews, and
            test-backed acceptance.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
