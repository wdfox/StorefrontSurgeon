"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="button-secondary"
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          void signOut({ callbackUrl: "/login" });
        });
      }}
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}
