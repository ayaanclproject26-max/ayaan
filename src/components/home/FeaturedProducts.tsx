"use client";

import { useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "../product/ProductCard";
import productsData from "@/data/products.json";
import { Product } from "@/types";

type Tab = "best-deals" | "top-selling";

export default function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState<Tab>("best-deals");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const products = productsData as Product[];

  const bestDeals = products.filter((p) => p.isHot).slice(0, 16);
  const topSelling = products.filter((p) => p.isNew).slice(0, 16);
  
  const displayProducts = activeTab === "best-deals" ? bestDeals : topSelling;

  // Split into pages of 8 products (4 cols * 2 rows = 8)
  const ITEMS_PER_PAGE = 8;
  const pages = Array.from({ length: Math.ceil(displayProducts.length / ITEMS_PER_PAGE) }, (_, i) => 
    displayProducts.slice(i * ITEMS_PER_PAGE, (i + 1) * ITEMS_PER_PAGE)
  );

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
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
              <button
                onClick={() => setActiveTab("best-deals")}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeTab === "best-deals" 
                    ? "bg-foreground text-background" 
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Best Deals
              </button>
              <button
                onClick={() => setActiveTab("top-selling")}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeTab === "top-selling" 
                    ? "bg-foreground text-background" 
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Top Selling
              </button>
            </div>
          </div>
          
          {/* Desktop Carousel Controls */}
          <div className="hidden md:flex items-center gap-2.5">
            <button 
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Product Grid Carousel */}
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
