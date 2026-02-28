import fs from "node:fs/promises";
import path from "node:path";

import { z } from "zod";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getOptionalSession } from "@/lib/session";

const requestSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export async function POST(request: Request) {
  const session = await getOptionalSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = requestSchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ error: "Project name was invalid." }, { status: 400 });
  }

  const baselineSource = await fs.readFile(
    path.join(process.cwd(), "src/demo/EditableProductPreview.tsx"),
    "utf8",
  );

  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      name: body.data.name,
      description: null,
      baselineSource,
      activeSource: baselineSource,
    },
  });

  return NextResponse.json({
    projectId: project.id,
  });
}
