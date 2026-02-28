import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getRevisionSnapshot } from "@/lib/revisions/orchestrator";
import { getOptionalSession } from "@/lib/session";

type RouteContext = {
  params: Promise<{
    projectId: string;
    revisionId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getOptionalSession();
  const { projectId, revisionId } = await context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const revision = await prisma.revision.findFirst({
    where: {
      id: revisionId,
      projectId,
    },
    select: {
      id: true,
    },
  });

  if (!revision) {
    return NextResponse.json({ error: "Revision not found." }, { status: 404 });
  }

  const snapshot = await getRevisionSnapshot(revisionId);

  if (!snapshot) {
    return NextResponse.json({ error: "Revision not found." }, { status: 404 });
  }

  return NextResponse.json(snapshot);
}
