"use client";

import { useState, useRef } from "react";
import ProductCard from "../product/ProductCard";
import productsData from "@/data/products.json";
import { Product } from "@/types";
import { X, Sparkles } from "lucide-react";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
}

// Canonical, normalized data-driven brand directory
export const BRANDS: Brand[] = [
  { id: "levis", name: "Levi's", slug: "levis", logo: "/brands/levis.png" },
  { id: "hugo-boss", name: "Hugo Boss", slug: "hugo-boss", logo: "/brands/hugo-boss.png" },
  { id: "walmart", name: "Walmart", slug: "walmart", logo: "/brands/walmart.png" },
  { id: "uniqlo", name: "Uniqlo", slug: "uniqlo", logo: "/brands/uniqlo.png" },
  { id: "ralph-lauren", name: "Ralph Lauren", slug: "ralph-lauren", logo: "/brands/ralph-lauren.png" },
  { id: "puma", name: "Puma", slug: "puma", logo: "/brands/puma.png" },
  { id: "calvin-klein", name: "Calvin Klein", slug: "calvin-klein", logo: "/brands/calvin-klein.png" },
  { id: "decathlon", name: "Decathlon", slug: "decathlon", logo: "/brands/decathlon.png" },
  { id: "zara", name: "Zara", slug: "zara", logo: "/brands/zara.png" },
  { id: "us-polo-assn", name: "U.S. Polo Assn.", slug: "us-polo-assn", logo: "/brands/us-polo-assn.png" },
  { id: "tommy-hilfiger", name: "Tommy Hilfiger", slug: "tommy-hilfiger", logo: "/brands/tommy-hilfiger.png" },
  { id: "armani-exchange", name: "Armani Exchange", slug: "armani-exchange", logo: "/brands/armani-exchange.png" },
  { id: "united-colors-of-benetton", name: "United Colors of Benetton", slug: "united-colors-of-benetton", logo: "/brands/united-colors-of-benetton.png" },
  { id: "banana-republic", name: "Banana Republic", slug: "banana-republic", logo: "/brands/banana-republic.png" },
  { id: "5-11", name: "5.11", slug: "5-11", logo: "/brands/5-11.png" },
  { id: "jack-wolfskin", name: "Jack Wolfskin", slug: "jack-wolfskin", logo: "/brands/jack-wolfskin.png" },
  { id: "diesel", name: "Diesel", slug: "diesel", logo: "/brands/diesel.png" },
  { id: "fila", name: "FILA", slug: "fila", logo: "/brands/fila.png" },
  { id: "m-and-s", name: "M&S", slug: "m-and-s", logo: "/brands/m-and-s.png" },
  { id: "esmara", name: "Esmara", slug: "esmara", logo: "/brands/esmara.png" },
  { id: "timberland", name: "Timberland", slug: "timberland", logo: "/brands/timberland.png" },
  { id: "g-star-raw", name: "G-Star Raw", slug: "g-star-raw", logo: "/brands/g-star-raw.png" },
  { id: "mango", name: "Mango", slug: "mango", logo: "/brands/mango.png" },
  { id: "next", name: "Next", slug: "next", logo: "/brands/next.png" },
  { id: "esprit", name: "Esprit", slug: "esprit", logo: "/brands/esprit.png" },
  { id: "patagonia", name: "Patagonia", slug: "patagonia", logo: "/brands/patagonia.png" },
  { id: "lee", name: "Lee", slug: "lee", logo: "/brands/lee.png" },
  { id: "guess", name: "Guess", slug: "guess", logo: "/brands/guess.png" },
  { id: "hm", name: "H&M", slug: "hm", logo: "/brands/hm.png" },
  { id: "ovs", name: "OVS", slug: "ovs", logo: "/brands/ovs.png" },
  { id: "the-north-face", name: "The North Face", slug: "the-north-face", logo: "/brands/the-north-face.png" },
  { id: "columbia", name: "Columbia", slug: "columbia", logo: "/brands/columbia.png" },
  { id: "jack-and-jones", name: "Jack & Jones", slug: "jack-and-jones", logo: "/brands/jack-and-jones.png" },
  { id: "primark", name: "Primark", slug: "primark", logo: "/brands/primark.png" },
  { id: "arcteryx", name: "Arc'teryx", slug: "arcteryx", logo: "/brands/arcteryx.png" },
  { id: "carhartt", name: "Carhartt", slug: "carhartt", logo: "/brands/carhartt.png" },
  { id: "kappa", name: "Kappa", slug: "kappa", logo: "/brands/kappa.png" },
  { id: "pvh", name: "PVH", slug: "pvh", logo: "/brands/pvh.png" },
  { id: "salomon", name: "Salomon", slug: "salomon", logo: "/brands/salomon.png" },
  // Approved catalog brands preserved
  { id: "nike", name: "Nike", slug: "nike", logo: "/brands/nike.svg" },
  { id: "adidas", name: "Adidas", slug: "adidas", logo: "/brands/adidas.svg" },
  { id: "under-armour", name: "Under Armour", slug: "under-armour", logo: "/brands/under-armour.svg" },
  { id: "new-balance", name: "New Balance", slug: "new-balance", logo: "/brands/new-balance.svg" },
];

export default function ShopByBrand() {
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const productsSectionRef = useRef<HTMLDivElement>(null);

  const allProducts = productsData as Product[];

  // Normalize and filter products belonging to the selected brand
  const filteredProducts = selectedBrand
    ? allProducts.filter((p) => {
        if (!p.brand) return false;
        const pBrand = p.brand.toLowerCase().trim();
        const bName = selectedBrand.name.toLowerCase().trim();
        const bSlug = selectedBrand.slug.toLowerCase().trim();
        
        // Match exact or fuzzy (e.g., "The North Face" <-> "North Face", "Levi's" <-> "Levi's")
        return (
          pBrand === bName ||
          pBrand.replace(/['’.\s-]/g, "") === bName.replace(/['’.\s-]/g, "") ||
          pBrand.includes(bName) ||
          bName.includes(pBrand) ||
          bSlug.replace(/-/g, "").includes(pBrand.replace(/['’.\s-]/g, ""))
        );
      })
    : [];

  const handleBrandClick = (brand: Brand) => {
    if (selectedBrand?.id === brand.id) {
      setSelectedBrand(null);
    } else {
      setSelectedBrand(brand);
      // Smooth scroll to the filtered products display
      setTimeout(() => {
        productsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  };

  return (
    <section id="brands" className="py-10 sm:py-14 bg-background border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Section Heading */}
        <div className="mb-6 md:mb-8 text-center md:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-fluid-h2 font-display uppercase tracking-tight">SHOP BY BRAND</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Explore authentic collections from top global apparel and sportswear manufacturers
            </p>
          </div>
          {selectedBrand && (
            <button
              onClick={() => setSelectedBrand(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors self-center sm:self-auto"
            >
              <X size={14} />
              Clear Filter
            </button>
          )}
        </div>

        {/* 
          Brand Grid:
          - Desktop (xl: 10 cols): ~4 balanced rows for ~40 brands.
          - Large screens (lg: 8 cols): ~5 balanced rows.
          - Tablet (md: 6 cols, sm: 4 cols).
          - Mobile (grid-cols-3): 3 cols. Shows first 9 (3 rows) initially, then reveals rest via ALL BRANDS.
        */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5 sm:gap-3 transition-all duration-300">
          {BRANDS.map((brand, index) => {
            const isSelected = selectedBrand?.id === brand.id;
            // On mobile (< sm): hide items past the first 9 when collapsed
            const isHiddenOnMobile = index >= 9 && !isMobileExpanded;

            return (
              <button
                key={brand.id}
                type="button"
                onClick={() => handleBrandClick(brand)}
                aria-pressed={isSelected}
                className={`group relative flex flex-col items-center justify-between p-2.5 sm:p-3 bg-card hover:bg-card/90 border rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-center w-full h-[90px] sm:h-[96px] ${
                  isHiddenOnMobile ? "hidden sm:flex" : "flex"
                } ${
                  isSelected
                    ? "border-foreground ring-2 ring-foreground/30 bg-secondary/80 shadow-md scale-[1.02]"
                    : "border-border/60 hover:border-foreground/30"
                }`}
              >
                {/* Logo Area (Uniform fixed height across all cards) */}
                <div className="w-full flex-1 flex items-center justify-center min-h-0 overflow-hidden px-1">
                  <BrandLogo brand={brand} />
                </div>

                {/* Brand Name (Uniform text position & size) */}
                <span 
                  className={`text-[0.625rem] sm:text-[0.6875rem] font-semibold uppercase tracking-wider truncate w-full px-1 mt-1 transition-colors ${
                    isSelected ? "text-foreground font-bold" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                  title={brand.name}
                >
                  {brand.name}
                </span>

                {/* Subtle active indicator dot */}
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Expand / Collapse Button (Only shown on mobile) */}
        <div className="mt-6 flex justify-center sm:hidden">
          <button
            type="button"
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            className="px-6 py-2.5 border border-foreground text-foreground text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-foreground hover:text-background transition-colors duration-300 active:scale-95"
          >
            {isMobileExpanded ? "SHOW LESS" : "ALL BRANDS"}
          </button>
        </div>

        {/* Filtered Brand Products Showcase */}
        {selectedBrand && (
          <div 
            ref={productsSectionRef}
            className="mt-10 pt-8 border-t border-border/60 animate-in fade-in slide-in-from-top-4 duration-300"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-24 bg-card border border-border/80 rounded-lg p-1.5 flex items-center justify-center shadow-sm">
                  <BrandLogo brand={selectedBrand} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-display font-bold uppercase tracking-tight">
                      {selectedBrand.name} Collection
                    </h3>
                    <Sparkles size={16} className="text-primary hidden sm:inline-block" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {filteredProducts.length > 0
                      ? `Showing ${filteredProducts.length} wholesale & retail product${filteredProducts.length > 1 ? "s" : ""}`
                      : "Direct catalog query"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedBrand(null)}
                className="self-start sm:self-auto px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-border rounded-full hover:bg-secondary transition-colors"
              >
                Close View
              </button>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border/60 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto my-4">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                  <BrandLogo brand={selectedBrand} />
                </div>
                <h4 className="text-base sm:text-lg font-bold font-display uppercase mb-2">
                  No {selectedBrand.name} Products In Stock
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
                  We are currently restocking products for {selectedBrand.name}. Inquire directly for bulk wholesale custom orders or explore other brands above.
                </p>
                <button
                  onClick={() => setSelectedBrand(null)}
                  className="px-6 py-2.5 bg-foreground text-background text-xs font-semibold uppercase tracking-wider rounded-full hover:opacity-90 transition-opacity"
                >
                  Explore All Brands
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}

function BrandLogo({ brand }: { brand: Brand }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <span className="text-[0.625rem] sm:text-xs font-bold text-foreground/70 tracking-wide uppercase truncate max-w-full">
        {brand.name}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brand.logo}
      alt={`${brand.name} logo`}
      className="max-h-7 sm:max-h-8 max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-105"
      loading="lazy"
      onError={() => setImgError(true)}
    />
  );
}
