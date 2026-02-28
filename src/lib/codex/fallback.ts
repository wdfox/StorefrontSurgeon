import { EDITABLE_PREVIEW_PATH } from "@/lib/revisions/constants";
import type {
  CodexPatchResponse,
  GenerateSurgeryRequest,
} from "@/lib/revisions/types";

const FORBIDDEN_PATTERN = /\b(cart|checkout|pricing engine)\b/i;

function buildStickyBarSource() {
  return `export default function ProductPreview() {
  return (
    <section
      aria-label="Product preview"
      className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#fff5ea_0%,#ffe6cf_100%)] text-[#23160f] shadow-[0_30px_90px_rgba(110,58,25,0.18)]"
    >
      <div className="grid gap-10 p-6 md:grid-cols-[1.05fr_0.95fr] md:p-8">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[1.5rem] bg-[linear-gradient(160deg,#f2c9a2_0%,#e7a96d_40%,#9e5b31_100%)] p-8 text-[#fffaf6]">
            <div className="eyebrow text-[rgba(255,250,246,0.78)]">
              Conversion refresh
            </div>
            <div className="mt-8 grid h-72 place-items-center rounded-[1.25rem] border border-white/30 bg-white/10 text-center text-sm font-semibold uppercase tracking-[0.35em] text-white/90">
              Product image
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["Front", "Detail", "Fabric"].map((label) => (
              <div
                key={label}
                className="rounded-2xl border border-[#e5c5a5] bg-[#fff5ea] px-3 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#7f5d45]"
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="eyebrow">Spring reset</div>
            <h2 className="display text-4xl leading-tight md:text-5xl">
              Linen layers for the first warm weekends.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-[#644a37] md:text-base">
              Refreshed with stronger purchase framing, trust messaging, and a
              more promotional above-the-fold treatment.
            </p>
          </div>

          <div className="rounded-2xl border border-[#f0be90] bg-[#fff9f3] px-4 py-3 text-sm font-semibold text-[#a04f1e]">
            Low stock - order soon before this colorway sells out.
          </div>

          <div className="space-y-5 rounded-[1.6rem] border border-[#dec0a2] bg-white/85 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-sm font-medium uppercase tracking-[0.18em] text-[#84624b]">
                  Women&apos;s resort shirt
                </div>
                <div className="mt-2 text-3xl font-bold">$68</div>
              </div>
              <div className="rounded-full bg-[#ffe4c8] px-4 py-2 text-sm font-semibold text-[#975122]">
                Bestseller
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#5b5046]">Color</span>
                <div className="rounded-2xl border border-[#dac8b6] bg-[#f8f1e8] px-4 py-3 text-sm">
                  Sandstone
                </div>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#5b5046]">Size</span>
                <div className="rounded-2xl border border-[#dac8b6] bg-[#f8f1e8] px-4 py-3 text-sm">
                  Medium
                </div>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {["Free returns", "Secure checkout", "Fast shipping"].map((badge) => (
                <div
                  key={badge}
                  className="rounded-2xl border border-[#efdcc9] bg-[#fffaf4] px-3 py-4 text-center text-xs font-semibold uppercase tracking-[0.15em] text-[#6a5d52]"
                >
                  {badge}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                aria-label="Primary purchase button"
                className="flex-1 rounded-full bg-[#1f1812] px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-[#fff7ef]"
              >
                Add to cart
              </button>
              <button
                aria-label="Secondary details button"
                className="rounded-full border border-[#e1c4a6] bg-[#fff4e7] px-5 py-4 text-sm font-semibold text-[#6b472f]"
              >
                Compare fit
              </button>
            </div>

            <p className="text-sm text-[#6d6156]">
              Free shipping over $75. Free returns for 30 days.
            </p>
          </div>
        </div>
      </div>

      <div
        aria-label="Sticky mobile buy bar"
        className="fixed inset-x-4 bottom-4 z-10 rounded-[1.3rem] border border-[#d89d68] bg-[linear-gradient(135deg,#fff7ea_0%,#ffdcb8_100%)] px-4 py-3 shadow-[0_20px_55px_rgba(118,63,26,0.28)] md:hidden"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-[#31241d]">Buy now for $68</div>
            <div className="text-xs text-[#7f6047]">
              Free returns and secure checkout.
            </div>
          </div>
          <button className="rounded-full bg-[#1f1812] px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#fff7f0]">
            Buy now
          </button>
        </div>
      </div>
    </section>
  );
}
`;
}

function createBlockedPatch(): CodexPatchResponse {
  return {
    summary: ["Attempted to modify forbidden cart logic."],
    filesTouched: ["src/lib/cart.ts"],
    sourceAfter: `import { updateCart } from "@/lib/cart";`,
  };
}

export function generateFallbackPatch({
  request,
}: {
  currentSource: string;
  request: GenerateSurgeryRequest;
}): CodexPatchResponse {
  if (FORBIDDEN_PATTERN.test(request.prompt)) {
    return createBlockedPatch();
  }

  return {
    summary: [
      "Added a sticky mobile buy bar.",
      "Expanded the preview with trust badges and urgency copy.",
      "Adjusted colors and CTA controls inside the editable component.",
    ],
    filesTouched: [EDITABLE_PREVIEW_PATH],
    sourceAfter: buildStickyBarSource(),
  };
}
