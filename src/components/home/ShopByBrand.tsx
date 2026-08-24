"use client";

import { useState } from "react";

const brands = [
  {
    id: "nike",
    name: "Nike",
    logo: "https://cdn.simpleicons.org/nike/000000",
  },
  {
    id: "adidas",
    name: "Adidas",
    logo: "https://cdn.simpleicons.org/adidas/000000",
  },
  {
    id: "puma",
    name: "Puma",
    logo: "https://cdn.simpleicons.org/puma/000000",
  },
  {
    id: "levis",
    name: "Levi's",
    // Inline SVG fallback - Levi's wordmark (simpleicons slug is broken)
    logo: "",
    svgFallback: true,
  },
  {
    id: "hm",
    name: "H&M",
    logo: "https://cdn.simpleicons.org/handm/000000",
  },
  {
    id: "zara",
    name: "Zara",
    logo: "https://cdn.simpleicons.org/zara/000000",
  },
  {
    id: "underarmour",
    name: "Under Armour",
    logo: "https://cdn.simpleicons.org/underarmour/000000",
  },
  {
    id: "newbalance",
    name: "New Balance",
    logo: "https://cdn.simpleicons.org/newbalance/000000",
  },
];

/* Simple inline SVG wordmarks for brands that lack a CDN icon */
function LevisLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 32" className={className} fill="currentColor" aria-hidden="true">
      <text x="0" y="26" fontFamily="'Georgia', serif" fontWeight="700" fontSize="28" letterSpacing="-0.5">
        LEVI&apos;S
      </text>
    </svg>
  );
}

function BrandLogo({ brand }: { brand: typeof brands[0] }) {
  const [imgError, setImgError] = useState(false);

  if (brand.id === "levis" || imgError) {
    return (
      <div className="w-full flex items-center justify-center h-12 sm:h-14">
        {brand.id === "levis" ? (
          <LevisLogo className="h-7 sm:h-8 w-auto text-foreground/50 group-hover:text-foreground/90 transition-colors duration-300" />
        ) : (
          <span className="text-base font-bold text-foreground/50 group-hover:text-foreground/90 transition-colors duration-300 tracking-wide uppercase">
            {brand.name}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center h-12 sm:h-14">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={brand.logo}
        alt={`${brand.name} logo`}
        className="max-h-[70%] max-w-[75%] object-contain opacity-50 group-hover:opacity-90 transition-opacity duration-300"
        loading="lazy"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

export default function ShopByBrand() {
  return (
    <section id="brands" className="py-10 sm:py-12 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h2 className="text-fluid-h2 font-display uppercase tracking-tight">SHOP BY BRAND</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {brands.map((brand) => (
            <button
              key={brand.id}
              className="group flex flex-col items-center justify-center gap-3 p-5 sm:p-6 bg-background border border-border/60 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-foreground/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <BrandLogo brand={brand} />
              <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors uppercase tracking-widest">
                {brand.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
