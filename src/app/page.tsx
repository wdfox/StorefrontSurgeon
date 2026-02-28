import { redirect } from "next/navigation";

import { getOptionalSession } from "@/lib/session";

export default async function Home() {
  const session = await getOptionalSession();
  redirect(session ? "/projects" : "/login");
}
