export default function ProductPreview() {
  return (
    <section
      aria-label="Product preview"
      className="relative overflow-hidden rounded-[2rem] bg-[#fffaf2] text-[#211d18] shadow-[0_30px_90px_rgba(72,47,24,0.16)]"
    >
      <div className="grid gap-10 p-6 md:grid-cols-[1.05fr_0.95fr] md:p-8">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[1.5rem] bg-[linear-gradient(160deg,#f4ddc8_0%,#edd0b2_40%,#ceb19d_100%)] p-8 text-[#412819]">
            <div className="eyebrow text-[rgba(65,40,25,0.74)]">
              Season preview
            </div>
            <div className="mt-8 grid h-72 place-items-center rounded-[1.25rem] border border-white/40 bg-white/20 text-center text-sm font-semibold uppercase tracking-[0.35em] text-white/90">
              Product image
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["Front", "Detail", "Fabric"].map((label) => (
              <div
                key={label}
                className="rounded-2xl border border-[#dbc9b5] bg-[#f5ecdf] px-3 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#6a5b4e]"
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
            <p className="max-w-xl text-sm leading-7 text-[#5f5448] md:text-base">
              A calm, polished PDP designed to feel reliable before it feels
              promotional.
            </p>
          </div>

          <div className="space-y-5 rounded-[1.6rem] border border-[#decab3] bg-white/80 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-sm font-medium uppercase tracking-[0.18em] text-[#7d6a58]">
                  Women&apos;s resort shirt
                </div>
                <div className="mt-2 text-3xl font-bold">$68</div>
              </div>
              <div className="rounded-full bg-[#f2e0cf] px-4 py-2 text-sm font-semibold text-[#7a4b29]">
                4.8 from 1,240 reviews
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

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                aria-label="Primary purchase button"
                className="flex-1 rounded-full bg-[#201812] px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-[#fef7ef]"
              >
                Add to cart
              </button>
              <button
                aria-label="Secondary details button"
                className="rounded-full border border-[#d9c6b1] bg-[#f8f2ea] px-5 py-4 text-sm font-semibold text-[#47352a]"
              >
                See size guide
              </button>
            </div>

            <p className="text-sm text-[#6d6156]">Free shipping over $75.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
