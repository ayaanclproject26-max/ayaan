"use client";

import { Suspense, useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import productsData from "@/data/products.json";
import ProductCard from "@/components/product/ProductCard";
import { Product } from "@/types";
import {
  searchProducts,
  filterProducts,
} from "@/lib/filters";
import { X, Filter, Sparkles, Search, User, Users, Smile, SlidersHorizontal } from "lucide-react";

const AUDIENCE_OPTIONS = [
  { id: "MEN", label: "MEN", icon: User },
  { id: "WOMEN", label: "WOMEN", icon: User },
  { id: "BOYS", label: "BOYS", icon: Smile },
  { id: "GIRLS", label: "GIRLS", icon: Sparkles },
  { id: "UNISEX", label: "UNISEX", icon: Users },
];

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get("query") || "";
  const initialBrandParam = searchParams.get("brand") || "";
  const initialAudienceParam = searchParams.get("audience") || "";

  const allProducts = productsData as Product[];

  // Mobile Filter Drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Filter state initialized from URL search params
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    return initialBrandParam ? initialBrandParam.split(",").map((s) => s.trim()).filter(Boolean) : [];
  });
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(() => {
    return initialAudienceParam ? initialAudienceParam.toUpperCase().split(",").map((s) => s.trim()).filter(Boolean) : [];
  });

  // Keep state synchronized with URL query params
  useEffect(() => {
    if (initialBrandParam) {
      setSelectedBrands(initialBrandParam.split(",").map((s) => s.trim()).filter(Boolean));
    } else {
      setSelectedBrands([]);
    }

    if (initialAudienceParam) {
      setSelectedAudiences(initialAudienceParam.toUpperCase().split(",").map((s) => s.trim()).filter(Boolean));
    } else {
      setSelectedAudiences([]);
    }
  }, [initialBrandParam, initialAudienceParam]);

  // Update URL search parameters when filters change
  const updateUrlFilters = useCallback(
    (newBrands: string[], newAudiences: string[]) => {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (newBrands.length > 0) params.set("brand", newBrands.join(","));
      if (newAudiences.length > 0) params.set("audience", newAudiences.map((a) => a.toLowerCase()).join(","));

      const newUrl = `/search?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    },
    [query, router]
  );

  // 1. Search products matching text query
  const searchBaseResults = useMemo(() => {
    if (!query.trim()) return allProducts;
    return searchProducts(allProducts, query);
  }, [allProducts, query]);

  // 2. Extract real unique brands present in the search result set
  const availableBrands = useMemo(() => {
    const brands = searchBaseResults
      .map((p) => p.brand)
      .filter((b): b is string => Boolean(b));
    return Array.from(new Set(brands)).sort((a, b) => a.localeCompare(b));
  }, [searchBaseResults]);

  // 3. Narrow results by selected brands (OR) and selected audiences (OR)
  const filteredProducts = useMemo(() => {
    return filterProducts({
      products: searchBaseResults,
      brandIds: selectedBrands,
      audienceIds: selectedAudiences,
    });
  }, [searchBaseResults, selectedBrands, selectedAudiences]);

  // Toggle brand selection
  const handleBrandToggle = (brandName: string) => {
    const updated = selectedBrands.includes(brandName)
      ? selectedBrands.filter((b) => b !== brandName)
      : [...selectedBrands, brandName];
    setSelectedBrands(updated);
    updateUrlFilters(updated, selectedAudiences);
  };

  // Toggle audience selection
  const handleAudienceToggle = (audId: string) => {
    const upper = audId.toUpperCase();
    const updated = selectedAudiences.includes(upper)
      ? selectedAudiences.filter((a) => a !== upper)
      : [...selectedAudiences, upper];
    setSelectedAudiences(updated);
    updateUrlFilters(selectedBrands, updated);
  };

  // Clear filters only (preserve query)
  const handleClearFilters = () => {
    setSelectedBrands([]);
    setSelectedAudiences([]);
    updateUrlFilters([], []);
  };

  // Clear search completely (return to homepage)
  const handleClearSearch = () => {
    router.push("/");
  };

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileDrawerOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileDrawerOpen]);

  const activeFilterCount = selectedBrands.length + selectedAudiences.length;
  const hasActiveFilters = activeFilterCount > 0;

  // Reusable Filter Sections for both Desktop Sidebar & Mobile Drawer
  const renderFilterSections = () => (
    <div className="space-y-6">
      {/* BRAND FILTER GROUP */}
      {availableBrands.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground">
              BRAND
            </span>
            {selectedBrands.length > 0 && (
              <span className="text-[0.6875rem] font-semibold text-primary">
                {selectedBrands.length} selected
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto pr-1">
            {availableBrands.map((brandName) => {
              const isSelected = selectedBrands.includes(brandName);
              return (
                <button
                  key={brandName}
                  type="button"
                  onClick={() => handleBrandToggle(brandName)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? "bg-foreground text-background font-bold shadow-sm ring-1 ring-foreground"
                      : "bg-secondary/70 hover:bg-secondary text-foreground/80 border border-border/70 hover:border-foreground/30"
                  }`}
                >
                  <span>{brandName}</span>
                  {isSelected && <span className="ml-1 text-[11px]">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* AUDIENCE FILTER GROUP */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground">
            AUDIENCE
          </span>
          {selectedAudiences.length > 0 && (
            <span className="text-[0.6875rem] font-semibold text-primary">
              {selectedAudiences.length} selected
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {AUDIENCE_OPTIONS.map((aud) => {
            const Icon = aud.icon;
            const isSelected = selectedAudiences.includes(aud.id);
            return (
              <button
                key={aud.id}
                type="button"
                onClick={() => handleAudienceToggle(aud.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? "bg-foreground text-background font-bold shadow-sm ring-1 ring-foreground"
                    : "bg-secondary/70 hover:bg-secondary text-foreground/80 border border-border/70 hover:border-foreground/30"
                }`}
              >
                <Icon size={13} className="shrink-0" />
                <span>{aud.label}</span>
                {isSelected && <span className="ml-0.5 text-[11px]">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE FILTERS SECTION */}
      {hasActiveFilters && (
        <div className="pt-4 border-t border-border/60 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground">
              ACTIVE FILTERS
            </span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-bold text-destructive hover:underline cursor-pointer"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedBrands.map((b) => (
              <span
                key={`side-b-${b}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary border border-border text-foreground font-semibold text-xs"
              >
                <span>{b}</span>
                <button
                  type="button"
                  onClick={() => handleBrandToggle(b)}
                  className="hover:text-destructive transition-colors ml-0.5 p-0.5 cursor-pointer"
                  title={`Remove ${b}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
            {selectedAudiences.map((a) => (
              <span
                key={`side-a-${a}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary border border-border text-foreground font-semibold text-xs"
              >
                <span>{a}</span>
                <button
                  type="button"
                  onClick={() => handleAudienceToggle(a)}
                  className="hover:text-destructive transition-colors ml-0.5 p-0.5 cursor-pointer"
                  title={`Remove ${a}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full bg-background min-h-[70vh] py-6 sm:py-8">
      {/* Expansive Full-Width Container (92–96% viewport width) */}
      <div className="mx-auto w-full max-w-[1720px] px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Row: Heading, Count, and Clear Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/70 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
                SEARCH RESULTS — {filteredProducts.length} PRODUCT{filteredProducts.length !== 1 ? "S" : ""}
              </h1>
              <Sparkles size={18} className="text-primary hidden sm:inline-block" />
            </div>
            {query.trim() && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Showing authentic wholesale & retail products matching &ldquo;<span className="font-semibold text-foreground">{query}</span>&rdquo;
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleClearSearch}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-foreground hover:bg-secondary text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer self-start sm:self-auto active:scale-95 shadow-sm"
          >
            <X size={14} />
            <span>Clear Search</span>
          </button>
        </div>

        {/* 
          MAIN CONTENT AREA: 
          - Desktop: Left Portrait Sidebar + Right Product Grid
          - Mobile: Mobile Filter Button + Slide-in Left Drawer + Product Grid
        */}
        <div className="flex flex-col lg:flex-row items-start gap-6 xl:gap-8 w-full">
          
          {/* DESKTOP LEFT SIDEBAR (STICKY) */}
          <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
            <div className="sticky top-[5.25rem] bg-card border border-border/70 rounded-2xl p-5 shadow-sm space-y-6 max-h-[calc(100vh-6.5rem)] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-foreground" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                  </h2>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="text-xs font-bold text-destructive hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Render Vertical Filter Groups */}
              {renderFilterSections()}
            </div>
          </aside>

          {/* RIGHT PRODUCT GRID AREA */}
          <div className="flex-1 min-w-0 w-full">
            
            {/* Mobile / Tablet Filter Button */}
            <div className="lg:hidden flex items-center justify-between pb-4">
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm active:scale-95 ${
                  hasActiveFilters
                    ? "bg-foreground text-background border-foreground font-bold"
                    : "bg-card hover:bg-secondary border-border text-foreground"
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-background text-foreground text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs font-bold text-destructive hover:underline cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="w-full py-16 px-4 text-center bg-card rounded-2xl border border-dashed border-border/80 flex flex-col items-center justify-center my-6 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground mb-3.5">
                  <Search size={24} />
                </div>
                <h3 className="text-lg font-bold uppercase font-display mb-1 text-foreground">
                  No Products Found
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
                  {query.trim()
                    ? `No products match "${query}" with your selected filters. Try changing your search or filters.`
                    : "No products match your selected filter criteria. Try clearing one or more filters."}
                </p>
                <div className="flex items-center gap-3">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleClearFilters}
                      className="px-6 py-2.5 bg-foreground text-background text-xs font-bold uppercase tracking-wider rounded-full hover:opacity-90 transition-opacity cursor-pointer active:scale-95"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-6 py-2.5 border border-foreground text-foreground text-xs font-bold uppercase tracking-wider rounded-full hover:bg-secondary transition-colors cursor-pointer active:scale-95"
                  >
                    Clear Search
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* MOBILE SLIDE-IN FILTER DRAWER (FROM LEFT) */}
      {isMobileDrawerOpen && (
        <div 
          className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300 animate-in fade-in"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-card z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out lg:hidden border-r border-border ${
          isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-foreground" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(false)}
            className="p-1.5 rounded-full hover:bg-secondary transition-colors cursor-pointer"
            aria-label="Close filters"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {renderFilterSections()}
        </div>

        {/* Drawer Footer CTA */}
        <div className="p-4 border-t border-border bg-card flex items-center gap-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="flex-1 py-2.5 px-4 rounded-full border border-border text-foreground text-xs font-bold uppercase tracking-wider hover:bg-secondary transition-colors text-center cursor-pointer active:scale-95"
            >
              Clear All
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(false)}
            className="flex-1 py-2.5 px-4 rounded-full bg-foreground text-background text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity text-center cursor-pointer font-display active:scale-95"
          >
            View {filteredProducts.length} Results
          </button>
        </div>
      </div>

    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-[60vh] flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-foreground border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground">
              Loading Search Results...
            </p>
          </div>
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
