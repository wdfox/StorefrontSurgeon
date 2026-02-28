import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { replayRevisionPatch } from "@/lib/revisions/orchestrator";
import { getOptionalSession } from "@/lib/session";

type RouteContext = {
  params: Promise<{
    projectId: string;
    revisionId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
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

  try {
    const result = await replayRevisionPatch({
      projectId: project.id,
      revisionId,
    });

    if (!result.ok) {
      const status =
        result.error === "Patch no longer applies to current revision." ? 409 : 400;

      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not replay the stored diff.";
    const status =
      message === "Revision not found."
        ? 404
        : message === "Project not found."
          ? 404
          : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
