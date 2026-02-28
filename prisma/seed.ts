import fs from "node:fs";
import path from "node:path";

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const sourcePath = path.join(process.cwd(), "src/demo/EditableProductPreview.tsx");
  const baselineSource = fs.readFileSync(sourcePath, "utf8");
  const passwordHash = await bcrypt.hash("demo1234", 10);

  const user = await prisma.user.upsert({
    where: {
      email: "demo@storefrontsurgeon.dev",
    },
    update: {
      name: "Storefront Demo User",
      passwordHash,
    },
    create: {
      email: "demo@storefrontsurgeon.dev",
      name: "Storefront Demo User",
      passwordHash,
    },
  });

  await prisma.project.upsert({
    where: {
      id: "seed-project-storefront-surgeon",
    },
    update: {
      userId: user.id,
      name: "Spring Conversion Refresh",
      description: null,
      baselineSource,
      activeSource: baselineSource,
    },
    create: {
      id: "seed-project-storefront-surgeon",
      userId: user.id,
      name: "Spring Conversion Refresh",
      description: null,
      baselineSource,
      activeSource: baselineSource,
    },
  });

  await prisma.revision.deleteMany({
    where: {
      projectId: "seed-project-storefront-surgeon",
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
