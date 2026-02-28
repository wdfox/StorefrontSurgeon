import fs from "node:fs";
import path from "node:path";

import type {
  CodexPatchResponse,
  GenerateSurgeryRequest,
} from "@/lib/revisions/types";

import { generateFallbackPatch } from "./fallback";
import { generateLivePatch } from "./live";

function hasCodexLoginSession() {
  const codexHome = process.env.CODEX_HOME ?? path.join(process.env.HOME ?? "", ".codex");

  if (!codexHome) {
    return false;
  }

  return fs.existsSync(path.join(codexHome, "auth.json"));
}

export async function generatePatch({
  currentSource,
  request,
}: {
  currentSource: string;
  request: GenerateSurgeryRequest;
}): Promise<CodexPatchResponse> {
  if (process.env.OPENAI_API_KEY || hasCodexLoginSession()) {
    return generateLivePatch({ currentSource, request });
  }

  return generateFallbackPatch({ currentSource, request });
}
