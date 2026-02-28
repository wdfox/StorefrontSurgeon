import { execFileSync } from "node:child_process";

import { Codex } from "@openai/codex-sdk";

import {
  codexPatchResponseJsonSchema,
  codexPatchResponseSchema,
} from "@/lib/codex/schemas";
import type {
  CodexPatchResponse,
  GenerateSurgeryRequest,
} from "@/lib/revisions/types";

import { buildCodexPrompt } from "./prompts";

function resolveCodexBinaryPath() {
  if (process.env.CODEX_PATH) {
    return process.env.CODEX_PATH;
  }

  try {
    return execFileSync("which", ["codex"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return undefined;
  }
}

export async function generateLivePatch({
  currentSource,
  request,
}: {
  currentSource: string;
  request: GenerateSurgeryRequest;
}): Promise<CodexPatchResponse> {
  const codexPathOverride = resolveCodexBinaryPath();
  const configuredModel = process.env.OPENAI_CODEX_MODEL?.trim() || undefined;

  const codex = new Codex({
    apiKey: process.env.OPENAI_API_KEY || undefined,
    codexPathOverride,
  });

  const thread = codex.startThread({
    ...(configuredModel ? { model: configuredModel } : {}),
    sandboxMode: "read-only",
    approvalPolicy: "never",
    workingDirectory: process.cwd(),
  });

  let result;

  try {
    result = await thread.run(buildCodexPrompt({ currentSource, request }), {
      outputSchema: codexPatchResponseJsonSchema,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Codex SDK request failed.";

    throw new Error(
      `Codex SDK request failed. Ensure you either set OPENAI_API_KEY or run 'npx codex login', and if needed set CODEX_PATH to a working codex binary. ${message}`,
    );
  }

  try {
    return codexPatchResponseSchema.parse(JSON.parse(result.finalResponse));
  } catch {
    throw new Error("Codex SDK returned malformed patch output.");
  }
}
