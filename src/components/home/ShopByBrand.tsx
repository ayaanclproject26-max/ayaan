"use client";

import { useState, useMemo, useRef } from "react";
import ProductCard from "../product/ProductCard";
import productsData from "@/data/products.json";
import { Product } from "@/types";
import {
  PRODUCT_CATEGORIES,
  filterProducts,
} from "@/lib/filters";
import { X, Check, Filter, Sparkles, RotateCcw, User, Users, Smile } from "lucide-react";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
}

// Canonical, normalized data-driven brand directory (43 brands)
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
  // Multi-select state
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["ALL"]);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const collectionSectionRef = useRef<HTMLDivElement>(null);
  const allProducts = productsData as Product[];

  // Selected Brand Objects
  const selectedBrands = useMemo(() => {
    return BRANDS.filter((b) => selectedBrandIds.includes(b.id));
  }, [selectedBrandIds]);

  // Handle brand card toggle (multi-select)
  const handleBrandClick = (brand: Brand) => {
    setHasInteracted(true);
    setSelectedBrandIds((prev) => {
      if (prev.includes(brand.id)) {
        return prev.filter((id) => id !== brand.id);
      } else {
        return [...prev, brand.id];
      }
    });

    // Smooth scroll to the collection showcase
    setTimeout(() => {
      collectionSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 150);
  };

  // Handle Category filter toggle (multi-select with ALL reset)
  const handleCategoryClick = (categoryName: string) => {
    setHasInteracted(true);
    if (categoryName === "ALL") {
      setSelectedCategories(["ALL"]);
      return;
    }

    setSelectedCategories((prev) => {
      const withoutAll = prev.filter((c) => c !== "ALL");
      if (withoutAll.includes(categoryName)) {
        const next = withoutAll.filter((c) => c !== categoryName);
        return next.length === 0 ? ["ALL"] : next;
      } else {
        return [...withoutAll, categoryName];
      }
    });
  };

  // Clear all filters
  const handleClearAll = () => {
    setSelectedBrandIds([]);
    setSelectedCategories(["ALL"]);
  };

  // Dynamic Collection Title
  const collectionTitle = useMemo(() => {
    if (selectedBrands.length === 0) {
      if (!selectedCategories.includes("ALL") && selectedCategories.length > 0) {
        return `${selectedCategories.join(" + ")} Collection`;
      }
      return "All Brands Collection";
    }
    if (selectedBrands.length === 1) {
      return `${selectedBrands[0].name} Collection`;
    }
    if (selectedBrands.length === 2) {
      return `${selectedBrands[0].name} + ${selectedBrands[1].name} Collection`;
    }
    if (selectedBrands.length === 3) {
      return `${selectedBrands[0].name} + ${selectedBrands[1].name} + ${selectedBrands[2].name} Collection`;
    }
    return `${selectedBrands[0].name}, ${selectedBrands[1].name} + ${selectedBrands.length - 2} More Collection`;
  }, [selectedBrands, selectedCategories]);

  // Combined Multi-Filter Execution using shared filter module
  const filteredProducts = useMemo(() => {
    return filterProducts({
      products: allProducts,
      brandIds: selectedBrandIds,
      categoryNames: selectedCategories,
    });
  }, [allProducts, selectedBrandIds, selectedCategories]);

  // Check if any filter is active
  const hasActiveFilters =
    selectedBrandIds.length > 0 ||
    (!selectedCategories.includes("ALL") && selectedCategories.length > 0);

  const shouldShowCollection = hasInteracted || selectedBrandIds.length > 0 || !selectedCategories.includes("ALL");

  return (
    <section id="brands" className="py-10 sm:py-14 bg-background border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Section Heading */}
        <div className="mb-6 md:mb-8 text-center md:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-fluid-h2 font-display uppercase tracking-tight">SHOP BY BRAND</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Select one or multiple brands to explore authentic wholesale & retail apparel
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors self-center sm:self-auto"
            >
              <RotateCcw size={13} />
              Reset Filters
            </button>
          )}
        </div>

        {/* Brand Grid (Desktop: 10 cols (~4 balanced rows), Mobile: 3 cols, 3 visible rows) */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5 sm:gap-3 transition-all duration-300">
          {BRANDS.map((brand, index) => {
            const isSelected = selectedBrandIds.includes(brand.id);
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
                    ? "border-foreground ring-2 ring-foreground/30 bg-secondary/90 shadow-md scale-[1.02]"
                    : "border-border/60 hover:border-foreground/30"
                }`}
              >
                {/* Logo Area */}
                <div className="w-full flex-1 flex items-center justify-center min-h-0 overflow-hidden px-1">
                  <BrandLogo brand={brand} />
                </div>

                {/* Brand Name */}
                <span
                  className={`text-[0.625rem] sm:text-[0.6875rem] font-semibold uppercase tracking-wider truncate w-full px-1 mt-1 transition-colors ${
                    isSelected ? "text-foreground font-bold" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                  title={brand.name}
                >
                  {brand.name}
                </span>

                {/* Active Indicator */}
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-foreground text-background flex items-center justify-center text-[10px] shadow-sm">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Expand / Collapse Button */}
        <div className="mt-6 flex justify-center sm:hidden">
          <button
            type="button"
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            className="px-6 py-2.5 border border-foreground text-foreground text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-foreground hover:text-background transition-colors duration-300 active:scale-95"
          >
            {isMobileExpanded ? "SHOW LESS" : "ALL BRANDS"}
          </button>
        </div>

        {/* 
          BRAND COLLECTION SHOWCASE & PRODUCT CATEGORY FILTERS
          Hierarchy:
          BRAND COLLECTION TITLE
          ↓
          PRODUCT CATEGORY FILTERS (Clean pill rows)
          ↓
          SELECTED FILTER SUMMARY / CLEAR ALL
          ↓
          PRODUCTS GRID
        */}
        {shouldShowCollection && (
          <div
            ref={collectionSectionRef}
            className="mt-12 pt-8 border-t border-border/70 animate-in fade-in duration-300"
          >
            {/* COLLECTION TITLE & COUNT */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex -space-x-2 overflow-hidden items-center">
                  {selectedBrands.slice(0, 4).map((b) => (
                    <div
                      key={b.id}
                      className="inline-block h-9 w-14 bg-card border border-border rounded-lg p-1 shadow-sm overflow-hidden flex items-center justify-center"
                      title={b.name}
                    >
                      <BrandLogo brand={b} />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-display font-bold uppercase tracking-tight">
                      {collectionTitle}
                    </h3>
                    <Sparkles size={16} className="text-primary hidden sm:inline-block" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedBrands.length > 0
                      ? `Curated catalog matching ${selectedBrands.map((b) => b.name).join(" + ")}`
                      : "Browsing all global manufacturer brands"}
                  </p>
                </div>
              </div>

              {/* Product Count indicator */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="px-3.5 py-1.5 rounded-full bg-secondary text-foreground text-xs font-bold uppercase tracking-wider border border-border">
                  {filteredProducts.length} Product{filteredProducts.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* PRODUCT CATEGORY FILTERS CONTAINER */}
            <div className="bg-secondary/40 border border-border/60 rounded-2xl p-4 sm:p-5 mb-8 space-y-3 shadow-sm">
              <div className="flex flex-col gap-2">
                <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground">
                  Product Category:
                </span>
                <div className="overflow-x-auto no-scrollbar py-1">
                  <div className="flex flex-wrap items-center gap-2 min-w-max sm:min-w-0">
                    {PRODUCT_CATEGORIES.map((categoryName) => {
                      const isSelected =
                        categoryName === "ALL"
                          ? selectedCategories.includes("ALL")
                          : selectedCategories.includes(categoryName);

                      return (
                        <button
                          key={categoryName}
                          type="button"
                          onClick={() => handleCategoryClick(categoryName)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "bg-foreground text-background font-bold shadow-sm"
                              : "bg-card hover:bg-card/80 text-foreground/75 border border-border/70 hover:border-foreground/30"
                          }`}
                        >
                          {categoryName}
                          {isSelected && categoryName !== "ALL" && (
                            <span className="ml-1 text-[10px]">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Active Filter Badges & Clear All */}
              {hasActiveFilters && (
                <div className="pt-3 border-t border-border/50 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-muted-foreground font-medium mr-1">Active filters:</span>
                  
                  {/* Brand Badges */}
                  {selectedBrands.map((b) => (
                    <span
                      key={`badge-b-${b.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border text-foreground font-semibold"
                    >
                      <span>{b.name}</span>
                      <button
                        type="button"
                        onClick={() => handleBrandClick(b)}
                        className="hover:text-destructive transition-colors ml-0.5 p-0.5"
                        title={`Remove ${b.name}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}

                  {/* Category Badges */}
                  {!selectedCategories.includes("ALL") &&
                    selectedCategories.map((cat) => (
                      <span
                        key={`badge-c-${cat}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border text-foreground font-semibold"
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() => handleCategoryClick(cat)}
                          className="hover:text-destructive transition-colors ml-0.5 p-0.5"
                          title={`Remove ${cat}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}

                  {/* Clear All */}
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-bold text-destructive hover:underline ml-2 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* PRODUCTS GRID / EMPTY STATE */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border/70 rounded-2xl p-8 sm:p-14 text-center max-w-lg mx-auto my-6 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-secondary/80 flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                  <Filter size={24} />
                </div>
                <h4 className="text-lg font-bold font-display uppercase mb-2">
                  No Products Found
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
                  No products match the selected combination of brands and categories. Try clearing one or more filters.
                </p>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-6 py-2.5 bg-foreground text-background text-xs font-semibold uppercase tracking-wider rounded-full hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Clear All Filters
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
