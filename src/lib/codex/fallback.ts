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
      <style>{\`
        #gallery-front:checked ~ #gallery-stage-front,
        #gallery-texture:checked ~ #gallery-stage-texture,
        #gallery-styled:checked ~ #gallery-stage-styled,
        #gallery-back:checked ~ #gallery-stage-back {
          display: block;
        }
      \`}</style>
      <div className="grid gap-10 p-6 md:grid-cols-[1.05fr_0.95fr] md:p-8">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[1.5rem] bg-[linear-gradient(160deg,#f2c9a2_0%,#e7a96d_40%,#9e5b31_100%)] p-8 text-[#fffaf6]">
            <input defaultChecked id="gallery-front" name="product-gallery" type="radio" className="hidden" />
            <input id="gallery-texture" name="product-gallery" type="radio" className="hidden" />
            <input id="gallery-styled" name="product-gallery" type="radio" className="hidden" />
            <input id="gallery-back" name="product-gallery" type="radio" className="hidden" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="eyebrow text-[rgba(255,250,246,0.78)]">
                  Marea studio
                </div>
                <div className="display mt-4 text-3xl leading-tight">
                  Coastal Linen Camp Shirt
                </div>
              </div>
              <div className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#975122]">
                Summer capsule
              </div>
            </div>
            <div
              id="gallery-stage-front"
              role="img"
              aria-label="Front product image of the Coastal Linen Camp Shirt"
              className="mt-8 hidden rounded-[1.25rem]"
              style={{ backgroundImage: "url('/preview/coastal-linen-front.png')", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "cover", height: "22rem", width: "100%" }}
            />
            <div
              id="gallery-stage-texture"
              role="img"
              aria-label="Detail view of the Coastal Linen Camp Shirt fabric and buttons"
              className="mt-8 hidden rounded-[1.25rem]"
              style={{ backgroundImage: "url('/preview/coastal-linen-detail.png')", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "cover", height: "22rem", width: "100%" }}
            />
            <div
              id="gallery-stage-styled"
              role="img"
              aria-label="Model wearing the Coastal Linen Camp Shirt in Salt"
              className="mt-8 hidden rounded-[1.25rem]"
              style={{ backgroundImage: "url('/preview/coastal-linen-on-body-front.png')", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "cover", height: "22rem", width: "100%" }}
            />
            <div
              id="gallery-stage-back"
              role="img"
              aria-label="Back view of a model wearing the Coastal Linen Camp Shirt"
              className="mt-8 hidden rounded-[1.25rem]"
              style={{ backgroundImage: "url('/preview/coastal-linen-on-body-back.png')", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "cover", height: "22rem", width: "100%" }}
            />
            <div className="mt-4 flex items-center justify-between gap-4 rounded-[1.25rem] bg-white/10 p-4 text-sm text-[rgba(255,250,246,0.78)]">
              <div>
                <div className="font-semibold uppercase tracking-[0.18em] text-white/90">
                  Early access
                </div>
                <div className="mt-2 leading-7">
                  Best-selling linen, stronger purchase framing, and more visible reassurance.
                </div>
              </div>
              <div className="rounded-full bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                Limited stock
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { key: "front", label: "Front", src: "/preview/coastal-linen-front.png", alt: "Front product image of the Coastal Linen Camp Shirt" },
              { key: "texture", label: "Texture", src: "/preview/coastal-linen-detail.png", alt: "Close-up of the Coastal Linen Camp Shirt fabric" },
              { key: "styled", label: "Styled", src: "/preview/coastal-linen-on-body-front.png", alt: "Model wearing the Coastal Linen Camp Shirt in Salt" },
              { key: "back", label: "Back", src: "/preview/coastal-linen-on-body-back.png", alt: "Back view of a model wearing the Coastal Linen Camp Shirt" },
            ].map((image) => (
              <label
                htmlFor={"gallery-" + image.key}
                key={image.label}
                className="cursor-pointer rounded-2xl border border-[#e5c5a5] bg-[#fff5ea] px-3 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#7f5d45]"
              >
                <div
                  role="img"
                  aria-label={image.alt}
                  className="rounded-[1.25rem]"
                  style={{ backgroundImage: "url('" + image.src + "')", backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "cover", display: "block", height: "6rem", width: "100%" }}
                />
                <div className="mt-3">{image.label}</div>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="eyebrow">Summer sell-out</div>
            <h2 className="display text-4xl leading-tight md:text-5xl">
              The easiest warm-weather shirt to say yes to.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-[#644a37] md:text-base">
              Elevated with stronger reassurance, clearer urgency, and faster purchase paths on desktop and mobile.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {["30-day returns", "Free shipping over $75", "Secure checkout"].map((badge) => (
              <div
                key={badge}
                className="rounded-2xl border border-[#efdcc9] bg-[#fffaf4] px-3 py-4 text-center text-xs font-semibold uppercase tracking-[0.15em] text-[#6a5d52]"
              >
                {badge}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[#f0be90] bg-[#fff9f3] px-4 py-3 text-sm font-semibold text-[#a04f1e]">
            Low stock - only a few shirts remain in Salt.
          </div>

          <div className="space-y-5 rounded-[1.6rem] border border-[#dec0a2] bg-white/85 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-sm font-medium uppercase tracking-[0.18em] text-[#84624b]">
                  Coastal Linen Camp Shirt
                </div>
                <div className="mt-2 text-3xl font-bold">$118</div>
                <div className="mt-2 text-sm leading-7 text-[#6d6156]">
                  Relaxed fit, shell buttons, and garment-washed linen that softens with wear.
                </div>
              </div>
              <div className="rounded-full bg-[#ffe4c8] px-4 py-2 text-sm font-semibold text-[#975122]">
                Low stock — only 8 left
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#5b5046]">Color</span>
                <div className="rounded-2xl border border-[#dac8b6] bg-[#f8f1e8] px-4 py-3 text-sm">
                  Salt
                </div>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-semibold text-[#5b5046]">Size</span>
                <div className="rounded-2xl border border-[#dac8b6] bg-[#f8f1e8] px-4 py-3 text-sm">
                  M
                </div>
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                aria-label="Primary purchase button"
                className="flex-1 rounded-full bg-gradient-to-r from-[#ff8a3d] to-[#ff4d4d] px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-[0_10px_30px_rgba(255,77,77,0.18)]"
              >
                Buy now — limited stock
              </button>
              <button
                aria-label="Secondary details button"
                className="rounded-full border border-[#e1c4a6] bg-[#fff4e7] px-5 py-4 text-sm font-semibold text-[#6b472f]"
              >
                View size guide
              </button>
            </div>

            <p className="text-sm text-[#6d6156]">
              Free shipping over $150. Free returns for 30 days.
            </p>
          </div>
        </div>
      </div>

      <div className="hidden md:flex absolute left-8 right-8 bottom-8 z-40 items-center justify-between rounded-2xl border border-[#efd7c2] bg-white/95 p-4 shadow-[0_12px_30px_rgba(74,44,20,0.12)]">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-sm font-medium uppercase tracking-[0.18em] text-[#84624b]">
              Coastal Linen Camp Shirt
            </div>
            <div className="mt-2 text-lg font-bold">$118</div>
          </div>
          <div className="rounded-full bg-[#fff3e6] px-3 py-1 text-xs font-semibold text-[#7a3a1a]">
            Almost gone
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-4 text-sm text-[#5b5046]">
            <div className="inline-flex items-center gap-2">Free shipping</div>
            <div className="inline-flex items-center gap-2">30-day returns</div>
          </div>
          <button
            aria-label="Sticky buy button"
            className="rounded-full bg-gradient-to-r from-[#ff8a3d] to-[#ff4d4d] px-5 py-3 text-sm font-bold text-white shadow-[0_10px_30px_rgba(255,77,77,0.18)]"
          >
            Buy now
          </button>
        </div>
      </div>

      <div
        aria-label="Sticky mobile buy bar"
        className="fixed inset-x-4 bottom-4 z-10 rounded-[1.3rem] border border-[#d89d68] bg-[linear-gradient(135deg,#fff7ea_0%,#ffdcb8_100%)] px-4 py-3 shadow-[0_20px_55px_rgba(118,63,26,0.28)] md:hidden"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-[#31241d]">Buy now for $118</div>
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
