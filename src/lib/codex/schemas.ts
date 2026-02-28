import { z } from "zod";

export const codexPatchResponseSchema = z.object({
  summary: z.array(z.string()).min(1),
  sourceAfter: z.string().min(1),
  filesTouched: z.array(z.string()).min(1),
});

export const codexPatchResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "sourceAfter", "filesTouched"],
  properties: {
    summary: {
      type: "array",
      minItems: 1,
      items: {
        type: "string",
      },
    },
    sourceAfter: {
      type: "string",
      minLength: 1,
    },
    filesTouched: {
      type: "array",
      minItems: 1,
      items: {
        type: "string",
      },
    },
  },
} as const;
