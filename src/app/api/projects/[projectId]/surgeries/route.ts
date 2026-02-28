import { z } from "zod";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { executeRevision } from "@/lib/revisions/orchestrator";
import { getOptionalSession } from "@/lib/session";

const requestSchema = z.object({
  prompt: z.string().min(1),
  presetKey: z.literal("sticky-buy-bar").optional(),
});

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
    return NextResponse.json(
      { error: "Request body was invalid." },
      { status: 400 },
    );
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const result = await executeRevision({
    projectId: project.id,
    currentSource: project.activeSource,
    request: {
      projectId: project.id,
      prompt: body.data.prompt,
      presetKey: body.data.presetKey,
    },
  });

  return NextResponse.json(result);
}
