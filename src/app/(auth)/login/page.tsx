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
            Request storefront updates in plain language.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-[var(--muted)]">
            Describe the change you want to make, review the updated page, and
            let the built-in safety checks handle the technical guardrails in
            the background.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
