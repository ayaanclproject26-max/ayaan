"use client";

import { useState, useMemo, useRef } from "react";
import categoriesData from "@/data/categories.json";
import productsData from "@/data/products.json";
import ProductCard from "../product/ProductCard";
import { Product } from "@/types";
import {
  PRODUCT_CATEGORIES,
  filterProducts,
} from "@/lib/filters";
import { Check, X, Sparkles, Filter, RotateCcw } from "lucide-react";

const detailedCategories = [
  { id: "all", name: "ALL", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=800" },
  { id: "sweaters", name: "Sweaters", image: "https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?auto=format&fit=crop&q=80&w=800" },
  { id: "t-shirts", name: "T-Shirts", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800" },
  { id: "hoodies", name: "Hoodies", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800" },
  { id: "trousers", name: "Trousers", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800" },
  { id: "pants", name: "Pants", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800" },
  { id: "shorts", name: "Shorts", image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=800" },
  { id: "shirts", name: "Shirts", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800" },
  { id: "beachwear", name: "Beachwear", image: "https://images.pexels.com/photos/103123/pexels-photo-103123.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { id: "socks", name: "Socks", image: "https://images.unsplash.com/photo-1582966772680-860e372bb558?auto=format&fit=crop&q=80&w=800" },
  { id: "blouse", name: "Blouse", image: "https://images.unsplash.com/photo-1589465885857-44edb59bbff2?auto=format&fit=crop&q=80&w=800" },
  { id: "tank-top", name: "Tank Top", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800" },
  { id: "tops", name: "Tops", image: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&q=80&w=800" },
  { id: "sports", name: "Sports", image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=800" },
  { id: "towels", name: "Towels", image: "https://images.pexels.com/photos/4207892/pexels-photo-4207892.jpeg?auto=compress&cs=tinysrgb&w=800" },
];

export default function CategoryHighlights() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["ALL"]);

  const collectionSectionRef = useRef<HTMLDivElement>(null);
  const allProducts = productsData as Product[];

  // Collection is open ONLY when an audience or specific category is selected
  const isCollectionOpen =
    selectedAudiences.length > 0 ||
    (!selectedCategories.includes("ALL") && selectedCategories.length > 0);

  // Toggle audience tile (multi-select)
  const handleAudienceToggle = (audienceName: string) => {
    const upper = audienceName.toUpperCase();
    setSelectedAudiences((prev) => {
      if (prev.includes(upper)) {
        return prev.filter((a) => a !== upper);
      } else {
        return [...prev, upper];
      }
    });

    // Smooth scroll to the audience collection showcase if opening
    setTimeout(() => {
      collectionSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 150);
  };

  // Handle detailed product category click (from ALL CATEGORIES accordion or collection filter row)
  const handleCategoryClick = (catName: string) => {
    if (catName.toUpperCase() === "ALL") {
      // "ALL" resets category filters within the current active collection
      setSelectedCategories(["ALL"]);
      return;
    }

    // Match proper case category
    const matched =
      PRODUCT_CATEGORIES.find(
        (c) => c.toLowerCase() === catName.toLowerCase()
      ) || catName;

    setSelectedCategories((prev) => {
      const withoutAll = prev.filter((c) => c !== "ALL");
      if (withoutAll.includes(matched)) {
        const next = withoutAll.filter((c) => c !== matched);
        return next.length === 0 ? ["ALL"] : next;
      } else {
        return [...withoutAll, matched];
      }
    });

    // If opened via detailed category tile, scroll down
    setTimeout(() => {
      collectionSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 150);
  };

  // "Clear All": Exits/collapses collection entirely and returns to normal homepage
  const handleClearAll = () => {
    setSelectedAudiences([]);
    setSelectedCategories(["ALL"]);
    
    // Smoothly ensure the user view remains comfortably at Shop by Category / Hot Sales
    const catSection = document.getElementById("categories");
    if (catSection) {
      catSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Dynamic Collection Title
  const collectionTitle = useMemo(() => {
    if (selectedAudiences.length === 0) {
      if (!selectedCategories.includes("ALL") && selectedCategories.length > 0) {
        return `${selectedCategories.join(" + ")} Collection`;
      }
      return "";
    }
    return `${selectedAudiences.join(" + ")} COLLECTION`;
  }, [selectedAudiences, selectedCategories]);

  // Combined Multi-Filter Execution: (Audience 1 OR Audience 2) AND (Category 1 OR Category 2)
  const filteredProducts = useMemo(() => {
    if (!isCollectionOpen) return [];
    return filterProducts({
      products: allProducts,
      audienceIds: selectedAudiences,
      categoryNames: selectedCategories,
    });
  }, [allProducts, selectedAudiences, selectedCategories, isCollectionOpen]);

  return (
    <section id="categories" className="py-10 sm:py-12 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Section Title */}
        <div className="mb-6 md:mb-8 text-center md:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-fluid-h2 font-display uppercase tracking-tight">SHOP BY CATEGORY</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Select one or multiple departments to explore tailored collections
            </p>
          </div>
          {isCollectionOpen && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors self-center sm:self-auto cursor-pointer"
            >
              <RotateCcw size={13} />
              Exit Collection
            </button>
          )}
        </div>
        
        {/* Primary Five Categories (MEN, WOMEN, BOYS, GIRLS, UNISEX) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {categoriesData.map((category) => {
            const isSelected = selectedAudiences.includes(category.name.toUpperCase());
            return (
              <CategoryCard
                key={category.id}
                category={category}
                variant="primary"
                isActive={isSelected}
                onClick={() => handleAudienceToggle(category.name)}
              />
            );
          })}
        </div>

        {/* Action Button: ALL CATEGORIES accordion */}
        <div className="mt-6 sm:mt-8 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-6 py-2.5 sm:px-8 sm:py-3 border border-foreground text-foreground text-sm font-semibold uppercase tracking-wider rounded-full hover:bg-foreground hover:text-background transition-colors duration-300 active:scale-95 cursor-pointer"
          >
            {isExpanded ? "SHOW LESS" : "ALL CATEGORIES"}
          </button>
        </div>

        {/* Expanded Detailed Categories Grid */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${
            isExpanded ? "grid-rows-[1fr] opacity-100 mt-6 sm:mt-8" : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
              {detailedCategories.map((category) => {
                const isSelected =
                  category.name === "ALL"
                    ? selectedCategories.includes("ALL")
                    : selectedCategories.some(
                        (c) => c.toLowerCase() === category.name.toLowerCase()
                      );

                return (
                  <CategoryCard 
                    key={category.id} 
                    category={{ ...category, slug: category.id }} 
                    variant="compact"
                    isActive={isSelected}
                    onClick={() => handleCategoryClick(category.name)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* 
          AUDIENCE COLLECTION SHOWCASE & PRODUCT CATEGORY FILTERS
          Visible ONLY when an audience or specific category is selected.
          When user clicks "Clear All", this section completely collapses,
          returning to the normal homepage with HOT SALES visible.
        */}
        {isCollectionOpen && (
          <div
            ref={collectionSectionRef}
            className="mt-12 pt-8 border-t border-border/70 animate-in fade-in duration-300"
          >
            {/* COLLECTION TITLE & COUNT */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-display font-bold uppercase tracking-tight">
                    {collectionTitle}
                  </h3>
                  <Sparkles size={16} className="text-primary hidden sm:inline-block" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedAudiences.length > 0
                    ? `Curated styles crafted for ${selectedAudiences.join(" + ")}`
                    : "Exploring category collection"}
                </p>
              </div>

              {/* Product Count Indicator & Close Trigger */}
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <span className="px-3.5 py-1.5 rounded-full bg-secondary text-foreground text-xs font-bold uppercase tracking-wider border border-border">
                  {filteredProducts.length} Product{filteredProducts.length !== 1 ? "s" : ""}
                </span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Close Collection"
                >
                  <X size={16} />
                </button>
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

              {/* Active Filter Badges & Clear All (Collection Exit) */}
              <div className="pt-3 border-t border-border/50 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground font-medium mr-1">Active filters:</span>

                {/* Audience Badges */}
                {selectedAudiences.map((aud) => (
                  <span
                    key={`badge-aud-${aud}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border text-foreground font-semibold"
                  >
                    <span>{aud}</span>
                    <button
                      type="button"
                      onClick={() => handleAudienceToggle(aud)}
                      className="hover:text-destructive transition-colors ml-0.5 p-0.5 cursor-pointer"
                      title={`Remove ${aud}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

                {/* Category Badges */}
                {!selectedCategories.includes("ALL") &&
                  selectedCategories.map((cat) => (
                    <span
                      key={`badge-cat-${cat}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border text-foreground font-semibold"
                    >
                      <span>{cat}</span>
                      <button
                        type="button"
                        onClick={() => handleCategoryClick(cat)}
                        className="hover:text-destructive transition-colors ml-0.5 p-0.5 cursor-pointer"
                        title={`Remove ${cat}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}

                {/* Clear All: Exits/Collapses Collection */}
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-bold text-destructive hover:underline ml-2 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* PRODUCT GRID / EMPTY STATE */}
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
                  No products match the selected combination of audience and categories. Try clearing one or more filters.
                </p>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-6 py-2.5 bg-foreground text-background text-xs font-semibold uppercase tracking-wider rounded-full hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Exit Collection
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}

export function CategoryCard({ 
  category, 
  variant = "primary",
  isActive = false,
  onClick,
}: { 
  category: { name: string; slug: string; image: string; [key: string]: any };
  variant?: "primary" | "compact";
  isActive?: boolean;
  onClick?: () => void;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative rounded-xl overflow-hidden bg-secondary text-left w-full cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        variant === "primary" ? "aspect-[4/3]" : "aspect-[4/5]"
      } ${
        isActive
          ? "ring-2 ring-foreground ring-offset-2 ring-offset-background shadow-md scale-[1.02]"
          : "hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {!imgError ? (
        <img 
          src={category.image} 
          alt={category.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
          <span className="text-white/20 text-xl md:text-2xl font-display font-bold uppercase text-center px-2">{category.name}</span>
        </div>
      )}
      
      <div className={`absolute inset-0 transition-colors duration-500 ${
        isActive ? "bg-[#111827]/45" : "bg-[#111827]/30 group-hover:bg-[#111827]/45"
      }`} />
      
      <div className={`absolute inset-0 flex flex-col justify-end text-white ${variant === "primary" ? "p-4 sm:p-5" : "p-3 sm:p-4"}`}>
        <h3 className={`${variant === "primary" ? "text-base sm:text-lg lg:text-xl font-bold font-display" : "text-sm sm:text-base leading-tight"} font-medium tracking-wide mb-1 uppercase`}>
          {category.name}
        </h3>
        {variant === "primary" && (
          <span className="text-xs sm:text-sm font-medium tracking-widest uppercase opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            {isActive ? "Selected ✓" : "Discover"}
          </span>
        )}
      </div>

      {/* Active Checkmark Badge */}
      {isActive && (
        <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold shadow-md">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}
