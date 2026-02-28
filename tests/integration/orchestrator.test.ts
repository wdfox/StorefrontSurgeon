import { beforeEach, describe, expect, it, vi } from "vitest";

import { EDITABLE_PREVIEW_PATH } from "@/lib/revisions/constants";

const {
  generatePatchMock,
  projectState,
  prismaMock,
  revisionState,
} = vi.hoisted(() => {
  const projectState = {
    id: "project-1",
    activeSource: "",
  };

  const revisionState = {
    id: "revision-1",
    status: "pending",
    runStage: "generating",
    summary: [] as string[],
    patchText: "",
    sourceAfter: undefined as string | undefined,
    blockedReason: undefined as string | undefined,
    testStatus: "not_run",
    testOutput: undefined as string | undefined,
  };

  const prismaMock = {
    revision: {
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        if (where.id !== revisionState.id) {
          throw new Error("Unknown revision id.");
        }

        Object.assign(revisionState, data);
        return revisionState;
      }),
    },
    project: {
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        if (where.id !== projectState.id) {
          throw new Error("Unknown project id.");
        }

        Object.assign(projectState, data);
        return projectState;
      }),
    },
  };

  return {
    generatePatchMock: vi.fn(),
    projectState,
    prismaMock,
    revisionState,
  };
});

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/codex/adapter", () => ({
  generatePatch: generatePatchMock,
}));

import { executeRevision } from "@/lib/revisions/orchestrator";

const currentSource = `export default function ProductPreview() {
  return (
    <section aria-label="Product preview" className="rounded-[2rem] bg-[#fffaf2] p-6">
      <button>Add to cart</button>
    </section>
  );
}
`;

const validGeneratedSource = `export default function ProductPreview() {
  return (
    <section aria-label="Product preview" className="rounded-[2rem] bg-[#fffaf2] p-6 shadow-[0_20px_55px_rgba(118,63,26,0.28)]">
      <div className="rounded-2xl border border-[#decab3] bg-white/80 p-5">
        <div className="text-sm font-semibold text-[#7a3a1a]">Low stock - order soon</div>
        <button className="rounded-full bg-[#201812] px-5 py-4 text-sm font-bold text-[#fef7ef]">
          Buy now
        </button>
      </div>
    </section>
  );
}
`;

const forbiddenGeneratedSource = `import { updateCart } from "@/lib/cart";

export default function ProductPreview() {
  return (
    <section aria-label="Product preview">
      <button>Buy now</button>
    </section>
  );
}
`;

describe("executeRevision", () => {
  beforeEach(() => {
    projectState.id = "project-1";
    projectState.activeSource = currentSource;

    revisionState.id = "revision-1";
    revisionState.status = "pending";
    revisionState.runStage = "generating";
    revisionState.summary = [];
    revisionState.patchText = "";
    revisionState.sourceAfter = undefined;
    revisionState.blockedReason = undefined;
    revisionState.testStatus = "not_run";
    revisionState.testOutput = undefined;

    generatePatchMock.mockReset();
    prismaMock.revision.update.mockClear();
    prismaMock.project.update.mockClear();
  });

  it("promotes a generated preview only after validation, patch replay, and checks pass", async () => {
    generatePatchMock.mockResolvedValue({
      summary: ["Added urgency copy and a stronger CTA."],
      filesTouched: [EDITABLE_PREVIEW_PATH],
      sourceAfter: validGeneratedSource,
    });

    const result = await executeRevision({
      revisionId: revisionState.id,
      projectId: projectState.id,
      currentSource,
      request: {
        projectId: projectState.id,
        prompt: "Add urgency copy and a stronger buy button treatment.",
      },
    });

    expect(result).toMatchObject({
      revisionId: "revision-1",
      status: "applied",
      runStage: "complete",
      testStatus: "passed",
      sourceAfter: validGeneratedSource,
    });
    expect(projectState.activeSource).toBe(validGeneratedSource);
    expect(revisionState.status).toBe("applied");
    expect(revisionState.runStage).toBe("complete");
    expect(prismaMock.project.update).toHaveBeenCalledTimes(1);
  });

  it("blocks unsafe generated output and keeps the active project source unchanged", async () => {
    generatePatchMock.mockResolvedValue({
      summary: ["Tried to wire cart behavior into the preview."],
      filesTouched: [EDITABLE_PREVIEW_PATH],
      sourceAfter: forbiddenGeneratedSource,
    });

    const result = await executeRevision({
      revisionId: revisionState.id,
      projectId: projectState.id,
      currentSource,
      request: {
        projectId: projectState.id,
        prompt: "Add a purchase option to the product page.",
      },
    });

    expect(result).toMatchObject({
      revisionId: "revision-1",
      status: "blocked",
      runStage: "validating",
      blockedReason: "Editable preview must stay self-contained and may not add imports.",
    });
    expect(projectState.activeSource).toBe(currentSource);
    expect(revisionState.status).toBe("blocked");
    expect(revisionState.runStage).toBe("validating");
    expect(prismaMock.project.update).not.toHaveBeenCalled();
  });
});
