import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export async function getOptionalSession() {
  return getServerSession(authOptions);
}

export async function requireSession() {
  const session = await getOptionalSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session;
}
