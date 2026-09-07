"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import categoriesData from "@/data/categories.json";
import initialProductsData from "@/data/products.json";
import ProductCard from "../product/ProductCard";
import { Product } from "@/types";
import { getProducts, toStorefrontProduct } from "@/lib/services/products";
import {
  filterProducts,
} from "@/lib/filters";
import { Check, X, Sparkles, RotateCcw } from "lucide-react";
import { categoryService, CategoryModel } from "@/services/category.service";
import { AudienceTiles } from "@/components/common/AudienceCard";

export default function CategoryHighlights() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["ALL"]);

  const [dynamicCategories, setDynamicCategories] = useState<CategoryModel[]>([]);
  const collectionSectionRef = useRef<HTMLDivElement>(null);
  const [allProducts, setAllProducts] = useState<Product[]>(() => (initialProductsData as Product[]));

  useEffect(() => {
    async function load() {
      try {
        const [dbList, cats] = await Promise.all([
          getProducts(),
          categoryService.getCategories(),
        ]);
        if (dbList && dbList.length > 0) {
          setAllProducts(dbList.map(toStorefrontProduct));
        }
        if (cats && cats.length > 0) {
          setDynamicCategories(cats);
        }
      } catch (err) {
        console.error("Failed to load storefront categories:", err);
      }
    }
    load();
  }, []);

  // Detailed product categories array with "ALL" prepended (strictly excludes audience segments)
  const detailedCategories = useMemo(() => {
    const audienceIds = new Set(["c_men", "c_women", "c_boys", "c_girls", "c_unisex", "men", "women", "boys", "girls", "unisex"]);
    const audienceNames = new Set(["MEN", "WOMEN", "BOYS", "GIRLS", "UNISEX"]);

    const productOnlyCats = dynamicCategories.filter(
      (c) =>
        !audienceIds.has(String(c.id).toLowerCase()) &&
        !audienceIds.has(String(c.slug || "").toLowerCase()) &&
        !audienceNames.has((c.name || "").toUpperCase()) &&
        c.is_active !== false
    );

    const allTile = {
      id: "all",
      name: "ALL",
      slug: "all",
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=800",
      image_url: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=800",
      sort_order: 0,
      is_active: true,
    };
    return [allTile, ...productOnlyCats];
  }, [dynamicCategories]);



  // Product categories list for filter pills
  const filterCategoryNames = useMemo(() => {
    const audienceIds = new Set(["c_men", "c_women", "c_boys", "c_girls", "c_unisex", "men", "women", "boys", "girls", "unisex"]);
    const audienceNames = new Set(["MEN", "WOMEN", "BOYS", "GIRLS", "UNISEX"]);

    const productOnlyCats = dynamicCategories.filter(
      (c) =>
        !audienceIds.has(String(c.id).toLowerCase()) &&
        !audienceIds.has(String(c.slug || "").toLowerCase()) &&
        !audienceNames.has((c.name || "").toUpperCase()) &&
        c.is_active !== false
    );
    return ["ALL", ...productOnlyCats.map((c) => c.name)];
  }, [dynamicCategories]);

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
      filterCategoryNames.find(
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
    <section id="categories" className="py-5 sm:py-8 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* AUDIENCE Section Title */}
        <div className="mb-3.5 sm:mb-5 text-center md:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-1.5 sm:gap-2">
          <div>
            <h2 className="text-fluid-h2 font-display font-bold uppercase tracking-tight">AUDIENCE</h2>
            <p className="text-xs sm:text-sm font-sans text-muted-foreground mt-0.5 sm:mt-1">
              Select one or multiple audiences to explore tailored collections
            </p>
          </div>
          {isCollectionOpen && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors self-center sm:self-auto cursor-pointer"
            >
              <RotateCcw size={13} />
              Exit Collection
            </button>
          )}
        </div>

        {/* Restored 5 Image-Based Audience Tiles (MEN, WOMEN, BOYS, GIRLS, UNISEX) */}
        <AudienceTiles
          selectedAudiences={selectedAudiences}
          onToggle={handleAudienceToggle}
        />

        {/* Separately: PRODUCT CATEGORY Section */}
        <div className="mt-8 pt-6 border-t border-border/60">
          <div className="flex items-center justify-between mb-3.5 sm:mb-4">
            <div>
              <h3 className="text-xs sm:text-sm font-display font-bold uppercase tracking-wider text-foreground">
                PRODUCT CATEGORY
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Browse apparel categories and export styles
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-4 sm:px-5 py-2 border border-border text-foreground text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-secondary transition-colors cursor-pointer"
            >
              {isExpanded ? "SHOW LESS" : "ALL CATEGORIES"}
            </button>
          </div>

          {/* Expanded Detailed Categories Grid */}
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${
              isExpanded ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3.5">
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
                      category={{ 
                        id: String(category.id),
                        name: category.name,
                        slug: category.slug || String(category.id),
                        image: category.image_url || category.image || "/categories/default.jpg"
                      }} 
                      variant="compact"
                      isActive={isSelected}
                      onClick={() => handleCategoryClick(category.name)}
                    />
                  );
                })}
              </div>
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
                    {filterCategoryNames.map((categoryName) => {
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
                            <span className="ml-1 text-xs">✓</span>
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
                    key={`badge-a-${aud}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border text-foreground font-semibold"
                  >
                    <span>{aud}</span>
                    <button
                      type="button"
                      onClick={() => handleAudienceToggle(aud)}
                      className="hover:text-destructive transition-colors ml-0.5 p-0.5"
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

                {/* Exit Collection Action */}
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-xs font-bold text-destructive hover:underline ml-2 cursor-pointer"
                >
                  Exit Collection
                </button>
              </div>
            </div>

            {/* PRODUCTS GRID */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border/70 rounded-2xl p-8 sm:p-14 text-center max-w-lg mx-auto my-6 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-secondary/80 flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                  <RotateCcw size={24} />
                </div>
                <h4 className="text-lg font-bold font-display uppercase mb-2">
                  No Products Found
                </h4>
                <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
                  No products currently match this combination of audience and categories. Try selecting another category or clearing filters.
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

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    slug: string;
    image: string;
    description?: string;
    imageClass?: string;
  };
  variant?: "primary" | "compact";
  isActive?: boolean;
  onClick?: () => void;
}

export function CategoryCard({
  category,
  variant = "primary",
  isActive = false,
  onClick,
}: CategoryCardProps) {
  const isPrimary = variant === "primary";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border transition-all duration-300 block w-full text-left cursor-pointer ${
        isPrimary ? "aspect-[16/10]" : "aspect-[4/3]"
      } ${
        isActive
          ? "border-foreground ring-2 ring-foreground shadow-lg scale-[1.02]"
          : "border-border hover:border-foreground/40 shadow-xs hover:shadow-md hover:-translate-y-0.5"
      }`}
    >
      {/* Background Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={category.image}
        alt={category.name}
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
          category.imageClass || "object-center"
        }`}
      />

      {/* Subtle Gradient Overlay for Text Legibility */}
      <div
        className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-300 ${
          isPrimary
            ? "from-black/80 via-black/25 to-black/5 group-hover:from-black/85"
            : "from-black/80 via-black/25 to-black/5 group-hover:from-black/90"
        } ${isActive ? "from-black/90 via-black/35" : ""}`}
      />

      {/* Active Selection Checkmark Badge */}
      {isActive && (
        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full bg-foreground text-background flex items-center justify-center shadow-md animate-in zoom-in-75">
          <Check size={11} strokeWidth={3} className="sm:w-3 sm:h-3" />
        </div>
      )}

      {/* Category Content */}
      <div
        className={`absolute inset-x-0 bottom-0 flex flex-col justify-end ${
          isPrimary ? "p-2.5 sm:p-3.5" : "p-2 sm:p-2.5"
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <h3
            className={`font-display font-bold uppercase tracking-tight text-white ${
              isPrimary
                ? "text-xs sm:text-sm md:text-base leading-tight"
                : "text-[11px] sm:text-xs font-semibold leading-tight"
            }`}
          >
            {category.name}
          </h3>
        </div>
      </div>
    </button>
  );
}
