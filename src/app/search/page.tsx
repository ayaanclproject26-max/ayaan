"use client";

import { Suspense, useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import productsData from "@/data/products.json";
import ProductCard from "@/components/product/ProductCard";
import { Product } from "@/types";
import {
  searchProducts,
  filterProducts,
} from "@/lib/filters";
import { BRANDS } from "@/components/home/ShopByBrand";
import { 
  X, 
  Filter, 
  Sparkles, 
  Search, 
  User, 
  Users, 
  Smile, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Check
} from "lucide-react";

const PRODUCTS_PER_PAGE = 30;

const AUDIENCE_OPTIONS = [
  { id: "MEN", label: "MEN", icon: User },
  { id: "WOMEN", label: "WOMEN", icon: User },
  { id: "BOYS", label: "BOYS", icon: Smile },
  { id: "GIRLS", label: "GIRLS", icon: Sparkles },
  { id: "UNISEX", label: "UNISEX", icon: Users },
];

function getPaginationItems(currentPage: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const items: (number | "ellipsis")[] = [1];
  if (currentPage > 3) {
    items.push("ellipsis");
  }
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    if (!items.includes(i)) items.push(i);
  }
  if (currentPage < totalPages - 2) {
    items.push("ellipsis");
  }
  if (!items.includes(totalPages)) items.push(totalPages);
  return items;
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resultsTopRef = useRef<HTMLDivElement>(null);

  const query = searchParams.get("query") || "";
  const initialBrandParam = searchParams.get("brand") || "";
  const initialAudienceParam = searchParams.get("audience") || "";
  const initialPageParam = parseInt(searchParams.get("page") || "1", 10);

  const allProducts = productsData as Product[];

  // Mobile Filter Drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(() => {
    return isNaN(initialPageParam) || initialPageParam < 1 ? 1 : initialPageParam;
  });

  // Filter state initialized from URL search params
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() => {
    return initialBrandParam ? initialBrandParam.split(",").map((s) => s.trim()).filter(Boolean) : [];
  });
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(() => {
    return initialAudienceParam ? initialAudienceParam.toUpperCase().split(",").map((s) => s.trim()).filter(Boolean) : [];
  });

  // Synchronize state with URL params
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

    const pageNum = parseInt(searchParams.get("page") || "1", 10);
    setCurrentPage(isNaN(pageNum) || pageNum < 1 ? 1 : pageNum);
  }, [initialBrandParam, initialAudienceParam, searchParams]);

  // Update URL search parameters when filters or page change
  const updateUrlParams = useCallback(
    (newBrands: string[], newAudiences: string[], page: number) => {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (newBrands.length > 0) params.set("brand", newBrands.join(","));
      if (newAudiences.length > 0) params.set("audience", newAudiences.map((a) => a.toLowerCase()).join(","));
      if (page > 1) params.set("page", page.toString());

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

  // 4. Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const validatedCurrentPage = Math.min(Math.max(1, currentPage), totalPages || 1);

  const paginatedProducts = useMemo(() => {
    const startIndex = (validatedCurrentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [filteredProducts, validatedCurrentPage]);

  // Handle Page Change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === validatedCurrentPage) return;
    setCurrentPage(page);
    updateUrlParams(selectedBrands, selectedAudiences, page);
    
    // Smooth scroll to top of products grid
    resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Toggle brand selection (resets page to 1)
  const handleBrandToggle = (brandName: string) => {
    const updated = selectedBrands.includes(brandName)
      ? selectedBrands.filter((b) => b !== brandName)
      : [...selectedBrands, brandName];
    setSelectedBrands(updated);
    setCurrentPage(1);
    updateUrlParams(updated, selectedAudiences, 1);
  };

  // Toggle audience selection (resets page to 1)
  const handleAudienceToggle = (audId: string) => {
    const upper = audId.toUpperCase();
    const updated = selectedAudiences.includes(upper)
      ? selectedAudiences.filter((a) => a !== upper)
      : [...selectedAudiences, upper];
    setSelectedAudiences(updated);
    setCurrentPage(1);
    updateUrlParams(selectedBrands, updated, 1);
  };

  // Clear filters only (preserve query, reset page to 1)
  const handleClearFilters = () => {
    setSelectedBrands([]);
    setSelectedAudiences([]);
    setCurrentPage(1);
    updateUrlParams([], [], 1);
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

  // Helper to find logo asset for a brand name
  const getBrandLogo = (brandName: string) => {
    const normalized = brandName.toLowerCase().replace(/['’.\s-]/g, "");
    const match = BRANDS.find(
      (b) =>
        b.name.toLowerCase() === brandName.toLowerCase() ||
        b.id.toLowerCase() === normalized ||
        b.slug.toLowerCase() === normalized
    );
    return match ? match.logo : null;
  };

  // Reusable Filter Content (Brand logo tiles in 2-col, Audience tiles in 2-col, and active filters)
  const renderFilterContent = () => (
    <div className="space-y-6">
      {/* BRAND FILTER SECTION (2-COLUMN GRID OF REAL LOGO TILES) */}
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

          <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {availableBrands.map((brandName) => {
              const isSelected = selectedBrands.includes(brandName);
              const logo = getBrandLogo(brandName);

              return (
                <button
                  key={brandName}
                  type="button"
                  onClick={() => handleBrandToggle(brandName)}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 cursor-pointer h-[72px] text-center ${
                    isSelected
                      ? "border-primary bg-primary/[0.08] ring-1 ring-primary/30 shadow-xs"
                      : "border-border/75 bg-card hover:bg-secondary/70 hover:border-foreground/30"
                  }`}
                  title={brandName}
                >
                  {/* Subtle active checkmark badge */}
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check size={9} strokeWidth={3} />
                    </span>
                  )}

                  {/* Real Brand Logo or Styled Name */}
                  {logo ? (
                    <div className="h-7 w-full flex items-center justify-center px-1 mb-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logo}
                        alt={brandName}
                        className="max-h-7 max-w-[80px] w-auto object-contain"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <span className="text-xs font-bold font-display uppercase tracking-tight text-foreground line-clamp-1 mb-0.5">
                      {brandName}
                    </span>
                  )}

                  <span className="text-[10px] font-semibold text-foreground/80 truncate max-w-full px-0.5">
                    {brandName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* AUDIENCE FILTER SECTION (2-COLUMN GRID TILES MATCHING BRAND TILE SIZE, UNISEX CENTERED) */}
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

        <div className="grid grid-cols-2 gap-2">
          {/* First 4 Audiences (MEN, WOMEN, BOYS, GIRLS) */}
          {AUDIENCE_OPTIONS.slice(0, 4).map((aud) => {
            const Icon = aud.icon;
            const isSelected = selectedAudiences.includes(aud.id);

            return (
              <button
                key={aud.id}
                type="button"
                onClick={() => handleAudienceToggle(aud.id)}
                className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 cursor-pointer h-[72px] text-center ${
                  isSelected
                    ? "border-primary bg-primary/[0.08] ring-1 ring-primary/30 shadow-xs"
                    : "border-border/75 bg-card hover:bg-secondary/70 hover:border-foreground/30"
                }`}
              >
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check size={9} strokeWidth={3} />
                  </span>
                )}
                <Icon size={18} className={`mb-1 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {aud.label}
                </span>
              </button>
            );
          })}

          {/* UNISEX: Centered underneath in the 2-column layout */}
          <div className="col-span-2 flex justify-center">
            {(() => {
              const unisexAud = AUDIENCE_OPTIONS[4];
              const Icon = unisexAud.icon;
              const isSelected = selectedAudiences.includes(unisexAud.id);

              return (
                <button
                  type="button"
                  onClick={() => handleAudienceToggle(unisexAud.id)}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-200 cursor-pointer h-[72px] text-center w-[calc(50%-0.25rem)] ${
                    isSelected
                      ? "border-primary bg-primary/[0.08] ring-1 ring-primary/30 shadow-xs"
                      : "border-border/75 bg-card hover:bg-secondary/70 hover:border-foreground/30"
                  }`}
                >
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check size={9} strokeWidth={3} />
                    </span>
                  )}
                  <Icon size={18} className={`mb-1 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {unisexAud.label}
                  </span>
                </button>
              );
            })()}
          </div>
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
    <div className="w-full bg-background min-h-[70vh] py-6 sm:py-8" ref={resultsTopRef}>
      {/* Expansive Full-Width Container (92–96% viewport width) */}
      <div className="mx-auto w-full max-w-[1720px] px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Row: Heading with Total Count & Clear Search */}
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
          - Desktop: Left Portrait Sidebar + Right 30-Product Grid
          - Mobile: Mobile Filter Button + Slide-in Left Drawer + Product Grid
        */}
        <div className="flex flex-col lg:flex-row items-start gap-6 xl:gap-8 w-full">
          
          {/* DESKTOP LEFT SIDEBAR (STICKY PORTRAIT CARD) */}
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

              {/* Vertical Filter Groups */}
              {renderFilterContent()}
            </div>
          </aside>

          {/* RIGHT PRODUCT GRID AREA & PAGINATION */}
          <div className="flex-1 min-w-0 w-full flex flex-col">
            
            {/* Mobile / Tablet Filter Button */}
            <div className="lg:hidden flex items-center justify-between pb-4">
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm active:scale-95 ${
                  hasActiveFilters
                    ? "bg-primary text-primary-foreground border-primary font-bold"
                    : "bg-card hover:bg-secondary border-border text-foreground"
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary-foreground text-primary text-[10px] font-bold flex items-center justify-center">
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

            {/* Product Grid (30 Products: 5 columns x 6 rows on desktop) */}
            {paginatedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5">
                {paginatedProducts.map((product) => (
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

            {/* 
              PAGINATION CONTROLS:
              - Visible only when filtered products count > 30
              - 30 items per page
              - Elegant Ayaan styling with Previous / Next / Numbers / Ellipsis
            */}
            {filteredProducts.length > PRODUCTS_PER_PAGE && (
              <div className="mt-12 pt-8 border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground font-medium order-2 sm:order-1">
                  Showing <span className="font-semibold text-foreground">{(validatedCurrentPage - 1) * PRODUCTS_PER_PAGE + 1}</span>–<span className="font-semibold text-foreground">{Math.min(validatedCurrentPage * PRODUCTS_PER_PAGE, filteredProducts.length)}</span> of <span className="font-semibold text-foreground">{filteredProducts.length}</span> products
                </p>

                <nav className="flex items-center gap-1.5 order-1 sm:order-2" aria-label="Product Pagination">
                  {/* Previous Button */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(validatedCurrentPage - 1)}
                    disabled={validatedCurrentPage === 1}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-secondary disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer active:scale-95"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Page Numbers */}
                  {getPaginationItems(validatedCurrentPage, totalPages).map((item, idx) => {
                    if (item === "ellipsis") {
                      return (
                        <span
                          key={`ell-${idx}`}
                          className="w-9 h-9 flex items-center justify-center text-muted-foreground text-xs font-bold select-none"
                        >
                          ...
                        </span>
                      );
                    }

                    const pageNum = item as number;
                    const isCurrent = pageNum === validatedCurrentPage;

                    return (
                      <button
                        key={`page-${pageNum}`}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-9 h-9 rounded-full text-xs font-bold transition-all duration-150 cursor-pointer ${
                          isCurrent
                            ? "bg-foreground text-background shadow-sm"
                            : "border border-border text-foreground hover:bg-secondary active:scale-95"
                        }`}
                        aria-label={`Page ${pageNum}`}
                        aria-current={isCurrent ? "page" : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {/* Next Button */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(validatedCurrentPage + 1)}
                    disabled={validatedCurrentPage === totalPages}
                    className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-secondary disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer active:scale-95"
                    aria-label="Next Page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
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
          {renderFilterContent()}
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
