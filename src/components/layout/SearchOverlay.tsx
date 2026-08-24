"use client";

import { useState, useEffect } from "react";
import { Clock, ArrowRight, TrendingUp } from "lucide-react";
import productsData from "@/data/products.json";
import ProductCard from "../product/ProductCard";
import { Product } from "@/types";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onSelectTerm: (term: string) => void;
}

const DEFAULT_RECENT = ["Sweater", "T-Shirt", "Hoodie"];
const TRENDING_SEARCHES = ["Oversized T-Shirt", "Denim Jacket", "Summer Collection", "Linen Shirt", "Sweaters", "Polo Shirt"];

export default function SearchOverlay({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  onSelectTerm,
}: SearchOverlayProps) {
  const allProducts = productsData as Product[];

  // Persistent recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(DEFAULT_RECENT);

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
  }, [isOpen]);

  // Clear recent searches
  const handleClearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("ayaan_recent_searches");
    } catch {
      // Ignore storage errors
    }
  };

  // Trending default products
  const trendingProducts = allProducts.filter((p) => p.isHot || p.isNew).slice(0, 6);

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
                        onClick={() => onSelectTerm(term)}
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
                      onClick={() => onSelectTerm(term)}
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

          {/* Right Panel: Trending Products */}
          <div className="w-full lg:w-2/3 flex flex-col">
            <h3 className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Trending Products
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
              {trendingProducts.map((product) => (
                <div key={product.id} onClick={onClose}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
