import { z } from "zod";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { restoreProjectRevision } from "@/lib/revisions/orchestrator";
import { getOptionalSession } from "@/lib/session";

const requestSchema = z.union([
  z.object({
    target: z.literal("baseline"),
  }),
  z.object({
    target: z.literal("revision"),
    revisionId: z.string().min(1),
  }),
]);

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getOptionalSession();
  const { projectId } = await context.params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = requestSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ error: "Request body was invalid." }, { status: 400 });
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
    const result = await restoreProjectRevision({
      projectId: project.id,
      restoreRequest: body.data,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not restore that version.";
    const status =
      message === "Revision not found."
        ? 404
        : message === "Project not found."
          ? 404
          : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
