import type { SurgeryPresetKey } from "@/lib/revisions/types";

export const surgeryPresets: Record<
  SurgeryPresetKey,
  { title: string; prompt: string; description: string }
> = {
  "sticky-buy-bar": {
    title: "Responsive buy bar refresh",
    prompt:
      "Add a responsive sticky buy bar with price context, visible desktop trust badges, stronger urgency copy, and more promotional CTA styling while keeping the update purely presentational.",
    description:
      "Creates an obvious before-and-after preview by changing the editable product component while staying safely away from checkout or cart logic.",
  },
};
