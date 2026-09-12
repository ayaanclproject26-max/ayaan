"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import ProductCard from "../product/ProductCard";
import { Product } from "@/types";
import { getProducts, toStorefrontProduct } from "@/lib/services/products";
import initialProductsData from "@/data/products.json";
import {
  filterProducts,
} from "@/lib/filters";
import { X, Check, Filter, Sparkles, RotateCcw } from "lucide-react";

import { brandService, BrandModel } from "@/services/brand.service";
import { categoryService, CategoryModel } from "@/services/category.service";
import { getBrandLogoUrl } from "@/lib/brand-logos";
import BrandTile from "@/components/common/BrandTile";
import { Tag } from "lucide-react";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  sort_order?: number;
}

export default function ShopByBrand() {
  // Multi-select state
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["ALL"]);
  const [hasInteracted, setHasInteracted] = useState(false);

  const [brandList, setBrandList] = useState<Brand[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>(["ALL"]);
  const collectionSectionRef = useRef<HTMLDivElement>(null);
  const [allProducts, setAllProducts] = useState<Product[]>(() => (initialProductsData as Product[]));

  useEffect(() => {
    async function load() {
      try {
        const [dbList, brandsData, catsData] = await Promise.all([
          getProducts(),
          brandService.getBrands(),
          categoryService.getCategories(),
        ]);

        if (dbList && dbList.length > 0) {
          setAllProducts(dbList.map(toStorefrontProduct));
        }

        if (brandsData && brandsData.length > 0) {
          const formatted: Brand[] = brandsData.map((b: BrandModel) => ({
            id: String(b.slug || b.id),
            name: b.name,
            slug: b.slug,
            logo: b.logo_url || b.logo || `/brands/${b.slug}.png`,
            sort_order: b.sort_order,
          }));
          setBrandList(formatted);
        }

        if (catsData && catsData.length > 0) {
          const audienceNames = new Set(["MEN", "WOMEN", "BOYS", "GIRLS", "UNISEX"]);
          const productOnly = catsData.filter((c: CategoryModel) => !audienceNames.has(c.name.toUpperCase()) && c.is_active !== false);
          const catNames = ["ALL", ...productOnly.map((c: CategoryModel) => c.name)];
          setAvailableCategories(catNames);
        }
      } catch (err) {
        console.error("Failed to load storefront brands/categories:", err);
      }
    }
    load();
  }, []);

  // Selected Brand Objects
  const selectedBrands = useMemo(() => {
    return brandList.filter((b) => selectedBrandIds.includes(b.id) || selectedBrandIds.includes(b.slug));
  }, [selectedBrandIds, brandList]);

  // Handle brand card toggle (multi-select)
  const handleBrandClick = (brand: Brand) => {
    setHasInteracted(true);
    setSelectedBrandIds((prev) => {
      if (prev.includes(brand.id) || prev.includes(brand.slug)) {
        return prev.filter((id) => id !== brand.id && id !== brand.slug);
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
    <section id="brands" className="py-12 sm:py-16 bg-background border-t border-border/60 scroll-mt-20">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 2xl:px-12">
        
        {/* Section Heading & Subtitle */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-fluid-h2 font-display font-bold uppercase tracking-tight text-foreground">
              SHOP BY BRAND
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-sans mt-1.5 sm:mt-2">
              Select one or multiple brands to explore authentic wholesale &amp; retail apparel
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors self-start sm:self-auto bg-card border border-border/80 px-3.5 py-1.5 rounded-full shadow-xs cursor-pointer"
            >
              <RotateCcw size={13} />
              Reset Filters
            </button>
          )}
        </div>

        {/* Brand Grid: True 1:1 Squares with consistent responsive columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 sm:gap-4 lg:gap-4.5">
          {brandList.map((brand) => {
            const isSelected = selectedBrandIds.includes(brand.id) || selectedBrandIds.includes(brand.slug);

            return (
              <BrandTile
                key={brand.id}
                brand={brand}
                isSelected={isSelected}
                onClick={() => handleBrandClick(brand)}
                size="md"
              />
            );
          })}
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
                      className="inline-block h-9 w-9 aspect-square bg-card border border-border rounded-lg p-1 shadow-sm overflow-hidden flex items-center justify-center"
                      style={{ aspectRatio: "1 / 1" }}
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
                  <p className="section-subtitle mt-1 sm:mt-1.5">
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
                    {availableCategories.map((categoryName) => {
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
  const logoSrc = getBrandLogoUrl(brand.name, brand.logo) || brand.logo;

  if (imgError || !logoSrc) {
    // Rule 19: Strictly no initials like A, N, B, L
    return (
      <span className="text-stone-300 dark:text-stone-600" aria-hidden="true">
        <Tag size={13} strokeWidth={1.5} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoSrc}
      alt={`${brand.name} logo`}
      className="max-h-7 sm:max-h-8 max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-105"
      loading="lazy"
      onError={() => setImgError(true)}
    />
  );
}
