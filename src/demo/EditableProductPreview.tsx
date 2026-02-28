export default function ProductPreview() {
  const gallery = [
    {
      key: "front",
      label: "Front",
      src: "/preview/coastal-linen-front.png",
      alt: "Front product image of the Coastal Linen Camp Shirt",
    },
    {
      key: "texture",
      label: "Texture",
      src: "/preview/coastal-linen-detail.png",
      alt: "Detail view of the Coastal Linen Camp Shirt fabric and buttons",
    },
    {
      key: "styled",
      label: "Styled",
      src: "/preview/coastal-linen-on-body-front.png",
      alt: "Model wearing the Coastal Linen Camp Shirt in Salt",
    },
    {
      key: "back",
      label: "Back",
      src: "/preview/coastal-linen-on-body-back.png",
      alt: "Back view of a model wearing the Coastal Linen Camp Shirt",
    },
  ];

  return (
    <section
      aria-label="Product preview"
      className="relative overflow-hidden rounded-[2rem] bg-[#fffaf2] text-[#211d18] shadow-[0_30px_90px_rgba(72,47,24,0.16)]"
    >
      <style>{`
        #gallery-front:checked ~ #gallery-stage-front,
        #gallery-texture:checked ~ #gallery-stage-texture,
        #gallery-styled:checked ~ #gallery-stage-styled,
        #gallery-back:checked ~ #gallery-stage-back {
          display: block;
        }

        #gallery-front:checked ~ #gallery-thumb-front,
        #gallery-texture:checked ~ #gallery-thumb-texture,
        #gallery-styled:checked ~ #gallery-thumb-styled,
        #gallery-back:checked ~ #gallery-thumb-back {
          background: rgba(255, 250, 244, 0.96);
          border-color: rgba(122, 75, 41, 0.34);
          box-shadow: 0 12px 30px rgba(88, 55, 31, 0.12);
          transform: translateY(-2px);
        }

        #gallery-front:checked ~ #gallery-thumb-front .gallery-frame,
        #gallery-texture:checked ~ #gallery-thumb-texture .gallery-frame,
        #gallery-styled:checked ~ #gallery-thumb-styled .gallery-frame,
        #gallery-back:checked ~ #gallery-thumb-back .gallery-frame {
          box-shadow: 0 0 0 2px rgba(122, 75, 41, 0.18);
        }

        #gallery-front:checked ~ #gallery-thumb-front .gallery-label,
        #gallery-texture:checked ~ #gallery-thumb-texture .gallery-label,
        #gallery-styled:checked ~ #gallery-thumb-styled .gallery-label,
        #gallery-back:checked ~ #gallery-thumb-back .gallery-label {
          color: #4e3728;
        }
      `}</style>
      <div className="grid gap-10 p-6 md:grid-cols-[1.05fr_0.95fr] md:p-8">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[1.5rem] bg-[linear-gradient(160deg,#f4ddc8_0%,#edd0b2_40%,#ceb19d_100%)] p-8 text-[#412819]">
            <input
              defaultChecked
              id="gallery-front"
              name="product-gallery"
              type="radio"
              className="hidden"
            />
            <input
              id="gallery-texture"
              name="product-gallery"
              type="radio"
              className="hidden"
            />
            <input
              id="gallery-styled"
              name="product-gallery"
              type="radio"
              className="hidden"
            />
            <input
              id="gallery-back"
              name="product-gallery"
              type="radio"
              className="hidden"
            />
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="eyebrow text-[rgba(65,40,25,0.74)]">
                  Marea studio
                </div>
                <div className="display mt-4 text-3xl leading-tight">
                  Coastal Linen Camp Shirt
                </div>
              </div>
              <div className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7a4b29]">
                Salt
              </div>
            </div>
            <div
              id="gallery-stage-front"
              role="img"
              aria-label="Front product image of the Coastal Linen Camp Shirt"
              className="mt-8 hidden rounded-[1.25rem]"
              style={{
                backgroundImage: "url('/preview/coastal-linen-front.png')",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                height: "22rem",
                width: "100%",
              }}
            />
            <div
              id="gallery-stage-texture"
              role="img"
              aria-label="Detail view of the Coastal Linen Camp Shirt fabric and buttons"
              className="mt-8 hidden rounded-[1.25rem]"
              style={{
                backgroundImage: "url('/preview/coastal-linen-detail.png')",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                height: "22rem",
                width: "100%",
              }}
            />
            <div
              id="gallery-stage-styled"
              role="img"
              aria-label="Model wearing the Coastal Linen Camp Shirt in Salt"
              className="mt-8 hidden rounded-[1.25rem]"
              style={{
                backgroundImage: "url('/preview/coastal-linen-on-body-front.png')",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                height: "22rem",
                width: "100%",
              }}
            />
            <div
              id="gallery-stage-back"
              role="img"
              aria-label="Back view of a model wearing the Coastal Linen Camp Shirt"
              className="mt-8 hidden rounded-[1.25rem]"
              style={{
                backgroundImage: "url('/preview/coastal-linen-on-body-back.png')",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                backgroundSize: "cover",
                height: "22rem",
                width: "100%",
              }}
            />
            <div className="mt-4 flex items-center justify-between gap-4 rounded-[1.25rem] bg-white/20 p-4 text-sm text-[#5f5448]">
              <div>
                <div className="font-semibold uppercase tracking-[0.18em] text-[#7d6a58]">
                  Everyday polish
                </div>
                <div className="mt-2 leading-7">
                  Soft European flax linen with a relaxed drape, shell buttons, and a fit that feels tailored without looking formal.
                </div>
              </div>
              <div className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6b472f]">
                Best seller
              </div>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3">
              {gallery.map((image) => (
                <label
                  id={`gallery-thumb-${image.key}`}
                  key={image.key}
                  htmlFor={`gallery-${image.key}`}
                  className="cursor-pointer rounded-2xl border border-[#dbc9b5] bg-[#f5ecdf] p-3 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#6a5b4e] transition-all duration-200"
                >
                  <div
                    role="img"
                    aria-label={image.alt}
                    className="gallery-frame rounded-[1.25rem]"
                    style={{
                      backgroundImage: `url('${image.src}')`,
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "cover",
                      display: "block",
                      height: "6rem",
                      width: "100%",
                    }}
                  />
                  <div className="gallery-label mt-3">{image.label}</div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="eyebrow">Warm-weather favorite</div>
            <h2 className="display text-4xl leading-tight md:text-5xl">
              Relaxed linen that still looks polished by dinner.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-[#5f5448] md:text-base">
              Cut with an easy drape, finished with shell buttons, and washed for
              a soft hand-feel from the first wear. Easy with drawstring trousers,
              refined enough for dinner reservations.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {["100% flax linen", "Machine washable", "Made in Portugal"].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-[#efe2d1] bg-[#fbf7f3] px-3 py-4 text-center text-xs font-semibold uppercase tracking-[0.15em] text-[#6a5d52]"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="space-y-5 rounded-[1.6rem] border border-[#decab3] bg-white/80 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-sm font-medium uppercase tracking-[0.18em] text-[#7d6a58]">
                  Coastal Linen Camp Shirt
                </div>
                <div className="mt-2 text-3xl font-bold">$118</div>
                <div className="mt-2 text-sm leading-7 text-[#6d6156]">
                  Relaxed fit with a straight hem, shell buttons, and a slightly
                  dropped shoulder.
                </div>
              </div>
              <div className="rounded-full bg-[#f2e0cf] px-4 py-2 text-sm font-semibold text-[#7a4b29]">
                4.8 from 214 reviews
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
                className="flex-1 rounded-full bg-[#201812] px-5 py-4 text-sm font-bold uppercase tracking-[0.12em] text-[#fef7ef]"
              >
                Add to bag
              </button>
              <button
                aria-label="Secondary details button"
                className="rounded-full border border-[#d9c6b1] bg-[#f8f2ea] px-5 py-4 text-sm font-semibold text-[#47352a]"
              >
                View size guide
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-[1.3rem] border border-[#efe2d1] bg-[#fffaf4] p-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#7d6a58]">
                  Delivery
                </div>
                <div className="mt-2 text-sm leading-7 text-[#6d6156]">
                  Free shipping over $150 and returns within 30 days.
                </div>
              </div>
              <div className="rounded-full bg-[#fff2e6] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7a3a1a]">
                Ships in 2 days
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
