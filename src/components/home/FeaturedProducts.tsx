"use client";

import { useState, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "../product/ProductCard";
import { getBestDeals, getNewArrivals } from "@/lib/promotions";

type Tab = "best-deals" | "new-arrivals";

export default function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState<Tab>("best-deals");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Data-driven product sources sharing promotional query service
  const bestDeals = useMemo(() => getBestDeals(16), []);
  const newArrivals = useMemo(() => getNewArrivals(16), []);

  const displayProducts = activeTab === "best-deals" ? bestDeals : newArrivals;

  // Split into pages of 8 products (4 cols * 2 rows = 8)
  const ITEMS_PER_PAGE = 8;
  const pages = useMemo(() => {
    return Array.from(
      { length: Math.ceil(displayProducts.length / ITEMS_PER_PAGE) },
      (_, i) => displayProducts.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE)
    );
  }, [displayProducts]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section id="featured" className="pb-10 sm:pb-12 bg-background overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h2 className="text-fluid-h2 font-display uppercase tracking-tight mb-3 md:mb-4">FEATURED PRODUCTS</h2>
            <div className="flex items-center gap-2">
              {/* Tab 1: BEST DEALS (Primary Default Tab) */}
              <button
                type="button"
                onClick={() => setActiveTab("best-deals")}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  activeTab === "best-deals" 
                    ? "bg-foreground text-background shadow-sm" 
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Best Deals
              </button>

              {/* Tab 2: NEW ARRIVALS (With Subtle Active Glow Effect) */}
              <button
                type="button"
                onClick={() => setActiveTab("new-arrivals")}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  activeTab === "new-arrivals" 
                    ? "bg-foreground text-background shadow-[0_0_14px_rgba(255,255,255,0.22)] ring-1 ring-primary/40" 
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                New Arrivals
              </button>
            </div>
          </div>
          
          {/* Desktop Carousel Controls */}
          <div className="hidden md:flex items-center gap-2.5">
            <button 
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-colors cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-colors cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Product Grid Carousel (4 columns x 2 rows per page) */}
        <div className="relative -mx-4 sm:mx-0">
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4"
          >
            {pages.map((page, pageIndex) => (
              <div 
                key={pageIndex} 
                className="w-full shrink-0 snap-center px-4 sm:px-0"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  {page.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </section>
  );
}
