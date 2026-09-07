"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "../product/ProductCard";
import { Product } from "@/types";
import { getBestDeals, getNewArrivals } from "@/lib/promotions";
import { getProducts, toStorefrontProduct } from "@/lib/services/products";

type Tab = "best-deals" | "new-arrivals";

export default function FeaturedProducts() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("best-deals");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Initial fallbacks
  const initialBestDeals = useMemo(() => getBestDeals(16), []);
  const initialNewArrivals = useMemo(() => getNewArrivals(16), []);

  const [bestDeals, setBestDeals] = useState<Product[]>(initialBestDeals);
  const [newArrivals, setNewArrivals] = useState<Product[]>(initialNewArrivals);

  useEffect(() => {
    async function loadDynamic() {
      // Best Deals (is_best_deal=true or is_featured=true)
      const dealsRes = await getProducts({ is_best_deal: true, per_page: 16 });
      if (dealsRes && dealsRes.length > 0) {
        setBestDeals(dealsRes.map(toStorefrontProduct));
      } else {
        const featRes = await getProducts({ is_featured: true, per_page: 16 });
        if (featRes && featRes.length > 0) {
          setBestDeals(featRes.map(toStorefrontProduct));
        }
      }

      // New Arrivals (is_new=true or newest)
      const newRes = await getProducts({ is_new: true, per_page: 16 });
      if (newRes && newRes.length > 0) {
        setNewArrivals(newRes.map(toStorefrontProduct));
      } else {
        const newestRes = await getProducts({ sort_by: "newest", per_page: 16 });
        if (newestRes && newestRes.length > 0) {
          setNewArrivals(newestRes.map(toStorefrontProduct));
        }
      }
    }
    loadDynamic();
  }, []);

  // Auto-activate tab from URL param (?tab=new-arrivals) or custom event and scroll into view
  useEffect(() => {
    const scrollToFeatured = () => {
      requestAnimationFrame(() => {
        if (sectionRef.current) {
          sectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    };

    const tabParam = searchParams.get("tab");
    if (tabParam === "new-arrivals") {
      setActiveTab("new-arrivals");
      scrollToFeatured();
    }

    const handleActivateEvent = () => {
      setActiveTab("new-arrivals");
      scrollToFeatured();
    };

    window.addEventListener("activate-new-arrivals", handleActivateEvent);
    return () => {
      window.removeEventListener("activate-new-arrivals", handleActivateEvent);
    };
  }, [searchParams]);

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
    <section id="featured" ref={sectionRef} className="pb-10 sm:pb-12 bg-background overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h2 className="text-fluid-h2 font-display font-bold uppercase tracking-tight mb-3 md:mb-4">FEATURED PRODUCTS</h2>
            <div className="flex items-center gap-2">
              {/* Tab 1: BEST DEALS (Primary Default Tab) */}
              <button
                type="button"
                onClick={() => setActiveTab("best-deals")}
                className={`px-4 py-2 rounded-full text-xs font-sans font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
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
                className={`px-4 py-2 rounded-full text-xs font-sans font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
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
