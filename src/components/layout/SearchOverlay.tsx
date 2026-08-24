"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, ArrowRight, TrendingUp, X, Filter, RotateCcw, User, Users, Smile, Sparkles, Search } from "lucide-react";
import productsData from "@/data/products.json";
import ProductCard from "../product/ProductCard";
import { Product } from "@/types";
import {
  AUDIENCE_CATEGORIES,
  searchProducts,
  filterProducts,
} from "@/lib/filters";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearchExecuted: boolean;
  setIsSearchExecuted: (val: boolean) => void;
  onExecuteSearch: (query: string) => void;
}

const DEFAULT_RECENT = ["Sweater", "T-Shirt", "Hoodie"];
const TRENDING_SEARCHES = ["Oversized T-Shirt", "Denim Jacket", "Summer Collection", "Linen Shirt", "Sweaters", "Polo Shirt"];

const AUDIENCE_OPTIONS = [
  { id: "MEN", label: "MEN", icon: User },
  { id: "WOMEN", label: "WOMEN", icon: User },
  { id: "BOYS", label: "BOYS", icon: Smile },
  { id: "GIRLS", label: "GIRLS", icon: Sparkles },
  { id: "UNISEX", label: "UNISEX", icon: Users },
];

export default function SearchOverlay({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  isSearchExecuted,
  setIsSearchExecuted,
  onExecuteSearch,
}: SearchOverlayProps) {
  const allProducts = productsData as Product[];

  // Persistent recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(DEFAULT_RECENT);

  // Multi-select filters for search results
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ayaan_recent_searches");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentSearches(parsed);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Clear recent searches
  const handleClearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("ayaan_recent_searches");
    } catch {
      // Ignore storage errors
    }
  };

  // Click a recent or trending search term
  const handleTermClick = (term: string) => {
    setSearchQuery(term);
    setSelectedBrands([]);
    setSelectedAudiences([]);
    onExecuteSearch(term);
  };

  // Base search matches matching the text query
  const searchBaseResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchProducts(allProducts, searchQuery);
  }, [allProducts, searchQuery]);

  // Extract real available brands present in the search result set
  const availableBrands = useMemo(() => {
    const brands = searchBaseResults
      .map((p) => p.brand)
      .filter((b): b is string => Boolean(b));
    return Array.from(new Set(brands));
  }, [searchBaseResults]);

  // Filtered search results narrowing by selected Brands (OR) and Audiences (OR)
  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return filterProducts({
      products: searchBaseResults,
      brandIds: selectedBrands,
      audienceIds: selectedAudiences,
    });
  }, [searchBaseResults, selectedBrands, selectedAudiences, searchQuery]);

  // Trending default products when not in search results mode
  const trendingProducts = useMemo(() => {
    return allProducts.filter((p) => p.isHot || p.isNew).slice(0, 6);
  }, [allProducts]);

  // Toggle brand filter (multi-select)
  const handleBrandToggle = (brandName: string) => {
    setSelectedBrands((prev) => {
      if (prev.includes(brandName)) {
        return prev.filter((b) => b !== brandName);
      } else {
        return [...prev, brandName];
      }
    });
  };

  // Toggle audience filter (multi-select)
  const handleAudienceToggle = (audId: string) => {
    setSelectedAudiences((prev) => {
      if (prev.includes(audId)) {
        return prev.filter((a) => a !== audId);
      } else {
        return [...prev, audId];
      }
    });
  };

  // Clear only the search filter selections, keeping the original query
  const handleClearFilters = () => {
    setSelectedBrands([]);
    setSelectedAudiences([]);
  };

  // Clear search completely and return to default state
  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearchExecuted(false);
    setSelectedBrands([]);
    setSelectedAudiences([]);
  };

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent background body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isShowingResults = isSearchExecuted && searchQuery.trim() !== "";
  const hasActiveFilters = selectedBrands.length > 0 || selectedAudiences.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-40 transition-opacity duration-300 animate-in fade-in" 
        onClick={onClose} 
      />

      {/* Overlay Panel positioned right below header */}
      <div className="fixed top-[6.75rem] lg:top-[4.25rem] left-0 right-0 mx-auto w-full max-w-5xl z-[45] bg-white rounded-b-2xl lg:rounded-2xl lg:mt-4 shadow-2xl transition-transform duration-300 transform-gpu overflow-hidden max-h-[calc(100vh-7rem)] lg:max-h-[calc(100vh-6rem)] flex flex-col border border-border/40 animate-in zoom-in-95 duration-200">
        
        {/* Scrollable Content */}
        <div className="flex flex-col lg:flex-row h-full overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 gap-8 lg:gap-12 pb-12 w-full">
          
          {/* Left Panel: Recent Searches & Trending Terms */}
          <div className="w-full lg:w-1/3 flex-shrink-0 flex flex-col gap-7">
            
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground">
                    Recent Searches
                  </h3>
                  <button 
                    type="button"
                    onClick={handleClearRecent}
                    className="text-[0.6875rem] font-bold text-foreground hover:text-muted-foreground transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
                <ul className="flex flex-col gap-1">
                  {recentSearches.map((term) => (
                    <li key={term}>
                      <button 
                        type="button"
                        onClick={() => handleTermClick(term)}
                        className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/70 transition-colors group text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Clock size={15} className="text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{term}</span>
                        </div>
                        <ArrowRight size={14} className="text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trending Searches */}
            <div>
              <h3 className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-3.5">
                Trending Search
              </h3>
              <ul className="flex flex-col gap-1">
                {TRENDING_SEARCHES.map((term) => (
                  <li key={term}>
                    <button 
                      type="button"
                      onClick={() => handleTermClick(term)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/70 transition-colors group text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <TrendingUp size={15} className="text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">{term}</span>
                      </div>
                      <ArrowRight size={14} className="text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Right Panel: Search Results or Trending Products */}
          <div className="w-full lg:w-2/3 flex flex-col">
            
            {/* Search Results Mode */}
            {isShowingResults ? (
              <div className="space-y-4">
                
                {/* Header with Title, Count & Reset */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-display font-bold uppercase tracking-tight text-foreground">
                      SEARCH RESULTS — {filteredSearchResults.length} PRODUCT{filteredSearchResults.length !== 1 ? "S" : ""}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <X size={13} />
                    Clear Search
                  </button>
                </div>

                {/* Filter Controls Bar (Brand & Audience Filters) */}
                <div className="bg-secondary/35 border border-border/60 rounded-xl p-3.5 sm:p-4 space-y-3 shadow-sm">
                  
                  {/* Brand Filters (Multi-select) */}
                  {availableBrands.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground">
                        BRAND:
                      </span>
                      <div className="overflow-x-auto no-scrollbar py-0.5">
                        <div className="flex flex-wrap items-center gap-1.5 min-w-max sm:min-w-0">
                          {availableBrands.map((brandName) => {
                            const isSelected = selectedBrands.includes(brandName);
                            return (
                              <button
                                key={brandName}
                                type="button"
                                onClick={() => handleBrandToggle(brandName)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                  isSelected
                                    ? "bg-foreground text-background font-bold shadow-sm"
                                    : "bg-card hover:bg-card/80 text-foreground/75 border border-border/70 hover:border-foreground/30"
                                }`}
                              >
                                {brandName}
                                {isSelected && <span className="ml-1 text-[10px]">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Audience Filters (Multi-select) */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground">
                      AUDIENCE:
                    </span>
                    <div className="overflow-x-auto no-scrollbar py-0.5">
                      <div className="flex items-center gap-1.5 min-w-max">
                        {AUDIENCE_OPTIONS.map((aud) => {
                          const Icon = aud.icon;
                          const isSelected = selectedAudiences.includes(aud.id);
                          return (
                            <button
                              key={aud.id}
                              type="button"
                              onClick={() => handleAudienceToggle(aud.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                                isSelected
                                  ? "bg-foreground text-background font-bold shadow-sm"
                                  : "bg-card hover:bg-card/80 text-foreground/75 border border-border/70 hover:border-foreground/30"
                              }`}
                            >
                              <Icon size={12} className="shrink-0" />
                              <span>{aud.label}</span>
                              {isSelected && <span className="ml-0.5 text-[10px]">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Active Filter Chips & Clear Filters */}
                  {hasActiveFilters && (
                    <div className="pt-2.5 border-t border-border/50 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-muted-foreground font-medium mr-1">Active filters:</span>
                      
                      {selectedBrands.map((b) => (
                        <span
                          key={`b-${b}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-card border border-border text-foreground font-semibold text-[11px]"
                        >
                          <span>{b}</span>
                          <button
                            type="button"
                            onClick={() => handleBrandToggle(b)}
                            className="hover:text-destructive p-0.5"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}

                      {selectedAudiences.map((a) => (
                        <span
                          key={`a-${a}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-card border border-border text-foreground font-semibold text-[11px]"
                        >
                          <span>{a}</span>
                          <button
                            type="button"
                            onClick={() => handleAudienceToggle(a)}
                            className="hover:text-destructive p-0.5"
                          >
                            <X size={10} />
                          </button>
                        </span>
                      ))}

                      <button
                        type="button"
                        onClick={handleClearFilters}
                        className="text-xs font-bold text-destructive hover:underline ml-1 cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    </div>
                  )}

                </div>

                {/* Search Results Product Grid */}
                {filteredSearchResults.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4 pt-1">
                    {filteredSearchResults.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="w-full py-12 px-4 text-center bg-secondary/20 rounded-xl border border-dashed border-border flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground mb-3">
                      <Search size={20} />
                    </div>
                    <h4 className="text-sm font-bold uppercase font-display mb-1 text-foreground">
                      NO PRODUCTS FOUND
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-xs mb-4">
                      No products match &ldquo;{searchQuery}&rdquo; with the selected filters.
                    </p>
                    <div className="flex items-center gap-2">
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="px-4 py-1.5 bg-foreground text-background text-xs font-bold uppercase tracking-wider rounded-full hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          Clear Filters
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="px-4 py-1.5 border border-foreground text-foreground text-xs font-bold uppercase tracking-wider rounded-full hover:bg-secondary transition-colors cursor-pointer"
                      >
                        Clear Search
                      </button>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              /* Default Mode: Trending Products */
              <div>
                <h3 className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  Trending Products
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
                  {trendingProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </>
  );
}
