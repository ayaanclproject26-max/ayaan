"use client";

/**
 * /search — Infinite Scroll Product Listing
 *
 * Architecture:
 *  - Server-side pagination via GET /api/v1/products?page=N&per_page=24
 *  - IntersectionObserver sentinel triggers next-page fetches automatically
 *  - AbortController + generation counter prevents stale/race-condition appends
 *  - Duplicate product IDs are tracked and filtered at render time
 *  - URL stays in sync (?page=N) for crawlable paginated URLs
 *  - Filter/sort/query changes reset the list and restart from page 1
 */

import {
  Suspense,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import { ProductSkeletonRow } from "@/components/product/ProductCardSkeleton";
import { Product } from "@/types";
import { toStorefrontProduct } from "@/lib/services/products";
import { productService } from "@/services/product.service";
import { brandService, BrandModel } from "@/services/brand.service";
import { categoryService, CategoryModel } from "@/services/category.service";
import { getBrandLogoUrl } from "@/lib/brand-logos";
import {
  X,
  Filter,
  Sparkles,
  Search,
  User,
  Users,
  Smile,
  SlidersHorizontal,
  Check,
  AlertCircle,
  RotateCcw,
  ChevronDown,
} from "lucide-react";

import { AudienceSelector, AUDIENCE_OPTIONS } from "@/components/common/AudiencePill";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PER_PAGE = 24;

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest First" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "popular",    label: "Most Popular" },
  { value: "name_asc",   label: "Name A → Z" },
  { value: "name_desc",  label: "Name Z → A" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router      = useRouter();

  // ── URL params ──────────────────────────────────────────────────────────
  const query               = searchParams.get("query") || "";
  const initialBrandParam   = searchParams.get("brand") || "";
  const initialAudienceParam= searchParams.get("audience") || "";
  const initialCategoryParam= searchParams.get("category") || "";
  const initialSortParam    = (searchParams.get("sort") || "newest") as SortValue;
  const initialPageParam    = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  // ── Filter state (3 Distinct Dimensions: Audience, Category, Brand) ──────
  const [selectedBrands, setSelectedBrands] = useState<string[]>(() =>
    initialBrandParam ? initialBrandParam.split(",").map((s) => s.trim()).filter(Boolean) : []
  );
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(() =>
    initialAudienceParam
      ? initialAudienceParam.toUpperCase().split(",").map((s) => s.trim()).filter(Boolean)
      : []
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() =>
    initialCategoryParam ? initialCategoryParam.split(",").map((s) => s.trim()).filter(Boolean) : []
  );
  const [sort, setSort] = useState<SortValue>(initialSortParam);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  // ── Infinite scroll state ────────────────────────────────────────────────
  const [products,    setProducts]    = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(0);   // 0 = not yet fetched
  const [lastPage,    setLastPage]    = useState(1);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);  // initial load
  const [loadingMore, setLoadingMore] = useState(false); // subsequent pages
  const [error,       setError]       = useState<string | null>(null);

  // Duplicate guard
  const loadedIdsRef = useRef<Set<string>>(new Set());
  // Generation counter: increments on every filter/query/sort change
  const genRef = useRef(0);
  // Sentinel div observed by IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Active AbortController for the current in-flight request
  const abortRef = useRef<AbortController | null>(null);

  // ── Available live brands and product categories ──────────────────────────
  const [liveBrands, setLiveBrands] = useState<BrandModel[]>([]);
  const [liveCategories, setLiveCategories] = useState<CategoryModel[]>([]);

  useEffect(() => {
    async function loadTaxonomies() {
      try {
        const [bData, cData] = await Promise.all([
          brandService.getBrands(),
          categoryService.getCategories(),
        ]);
        setLiveBrands(bData);
        setLiveCategories(cData);
      } catch (err) {
        console.error("Failed to load search taxonomies:", err);
      }
    }
    loadTaxonomies();
  }, []);

  const availableBrands = useMemo(() => {
    return liveBrands.map((b) => b.name);
  }, [liveBrands]);

  const availableCategories = useMemo(() => {
    return liveCategories.map((c) => c.name);
  }, [liveCategories]);

  // ── URL sync helper ───────────────────────────────────────────────────────
  const updateUrl = useCallback(
    (brands: string[], audiences: string[], categories: string[], sortVal: SortValue, page: number) => {
      const params = new URLSearchParams();
      if (query)             params.set("query",    query);
      if (brands.length)     params.set("brand",    brands.join(","));
      if (audiences.length)  params.set("audience", audiences.map((a) => a.toLowerCase()).join(","));
      if (categories.length) params.set("category", categories.map((c) => c.toLowerCase()).join(","));
      if (sortVal !== "newest") params.set("sort", sortVal);
      if (page > 1)          params.set("page",     page.toString());
      router.replace(`/search?${params.toString()}`, { scroll: false });
    },
    [query, router]
  );

  // ── Core fetch function ───────────────────────────────────────────────────
  const fetchPage = useCallback(
    async (page: number, gen: number) => {
      // Abort any previous in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const isFirstPage = page === 1;
      if (isFirstPage) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
        setError(null);
      }

      try {
        const result = await productService.getProductsPaginated(
          {
            q:        query || undefined,
            brand:    selectedBrands.join(",") || undefined,
            audience: selectedAudiences.join(",") || undefined,
            category: selectedCategories.join(",") || undefined,
            sort,
            page,
            per_page: PER_PAGE,
          },
          controller.signal
        );

        // Discard stale responses (generation changed while request was in flight)
        if (gen !== genRef.current) return;

        const newProducts = result.data
          .map(toStorefrontProduct)
          .filter((p) => {
            if (loadedIdsRef.current.has(p.id)) return false;
            loadedIdsRef.current.add(p.id);
            return true;
          });

        setProducts((prev) => (isFirstPage ? newProducts : [...prev, ...newProducts]));
        setCurrentPage(result.meta.current_page);
        setLastPage(result.meta.last_page);
        setTotal(result.meta.total);

        // Sync URL
        updateUrl(selectedBrands, selectedAudiences, selectedCategories, sort, result.meta.current_page);
      } catch (err: any) {
        if (err?.name === "AbortError" || err?.message === "AbortError") return;
        if (gen !== genRef.current) return;
        setError("Couldn't load products. Please try again.");
      } finally {
        if (gen === genRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query, selectedBrands, selectedAudiences, selectedCategories, sort]
  );

  // ── Reset & reload on filter/sort/query change ────────────────────────────
  const resetAndReload = useCallback(
    (brands: string[], audiences: string[], categories: string[], sortVal: SortValue) => {
      genRef.current += 1;
      loadedIdsRef.current = new Set();
      setProducts([]);
      setCurrentPage(0);
      setLastPage(1);
      setTotal(0);
      setError(null);

      // Build params for fetchPage using latest filter values
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const gen = genRef.current;

      setLoading(true);

      productService
        .getProductsPaginated(
          {
            q:        query || undefined,
            brand:    brands.join(",") || undefined,
            audience: audiences.join(",") || undefined,
            category: categories.join(",") || undefined,
            sort:     sortVal,
            page:     1,
            per_page: PER_PAGE,
          },
          controller.signal
        )
        .then((result) => {
          if (gen !== genRef.current) return;
          const newProducts = result.data
            .map(toStorefrontProduct)
            .filter((p) => {
              if (loadedIdsRef.current.has(p.id)) return false;
              loadedIdsRef.current.add(p.id);
              return true;
            });
          setProducts(newProducts);
          setCurrentPage(result.meta.current_page);
          setLastPage(result.meta.last_page);
          setTotal(result.meta.total);
          updateUrl(brands, audiences, categories, sortVal, 1);
        })
        .catch((err) => {
          if (err?.name === "AbortError" || err?.message === "AbortError") return;
          if (gen !== genRef.current) return;
          setError("Couldn't load products. Please try again.");
        })
        .finally(() => {
          if (gen === genRef.current) {
            setLoading(false);
            setLoadingMore(false);
          }
        });
    },
    [query, updateUrl]
  );

  // ── Initial load (on mount and when query changes) ────────────────────────
  useEffect(() => {
    genRef.current += 1;
    loadedIdsRef.current = new Set();
    const gen = genRef.current;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setProducts([]);
    setCurrentPage(0);
    setLastPage(1);
    setTotal(0);
    setError(null);
    setLoading(true);

    productService
      .getProductsPaginated(
        {
          q:        query || undefined,
          brand:    selectedBrands.join(",") || undefined,
          audience: selectedAudiences.join(",") || undefined,
          category: selectedCategories.join(",") || undefined,
          sort,
          page:     initialPageParam,
          per_page: PER_PAGE,
        },
        controller.signal
      )
      .then((result) => {
        if (gen !== genRef.current) return;
        const newProducts = result.data
          .map(toStorefrontProduct)
          .filter((p) => {
            if (loadedIdsRef.current.has(p.id)) return false;
            loadedIdsRef.current.add(p.id);
            return true;
          });
        setProducts(newProducts);
        setCurrentPage(result.meta.current_page);
        setLastPage(result.meta.last_page);
        setTotal(result.meta.total);
      })
      .catch((err) => {
        if (err?.name === "AbortError" || err?.message === "AbortError") return;
        if (gen !== genRef.current) return;
        setError("Couldn't load products. Please try again.");
      })
      .finally(() => {
        if (gen === genRef.current) setLoading(false);
      });

    return () => {
      controller.abort();
    };
    // Only re-run on query change (filters have their own handlers)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // ── IntersectionObserver: auto-load next page ─────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loading &&
          !loadingMore &&
          !error &&
          currentPage > 0 &&
          currentPage < lastPage
        ) {
          const nextPage = currentPage + 1;
          const gen = genRef.current;
          setLoadingMore(true);

          productService
            .getProductsPaginated(
              {
                q:        query || undefined,
                brand:    selectedBrands.join(",") || undefined,
                audience: selectedAudiences.join(",") || undefined,
                sort,
                page:     nextPage,
                per_page: PER_PAGE,
              },
              undefined // no abort for sequential scroll loads
            )
            .then((result) => {
              if (gen !== genRef.current) return;
              const newProducts = result.data
                .map(toStorefrontProduct)
                .filter((p) => {
                  if (loadedIdsRef.current.has(p.id)) return false;
                  loadedIdsRef.current.add(p.id);
                  return true;
                });
              setProducts((prev) => [...prev, ...newProducts]);
              setCurrentPage(result.meta.current_page);
              setLastPage(result.meta.last_page);
              setTotal(result.meta.total);
              updateUrl(selectedBrands, selectedAudiences, selectedCategories, sort, result.meta.current_page);
            })
            .catch((err) => {
              if (err?.name === "AbortError") return;
              if (gen !== genRef.current) return;
              setError("Couldn't load more products.");
            })
            .finally(() => {
              if (gen === genRef.current) setLoadingMore(false);
            });
        }
      },
      { rootMargin: "600px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, loadingMore, error, currentPage, lastPage, query, selectedBrands, selectedAudiences, sort, updateUrl]);

  // ── Retry failed page ─────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    const nextPage = currentPage < lastPage ? currentPage + 1 : currentPage;
    fetchPage(nextPage, genRef.current);
  }, [currentPage, lastPage, fetchPage]);

  // ── Filter toggle handlers ────────────────────────────────────────────────
  const handleBrandToggle = useCallback(
    (brandName: string) => {
      const updated = selectedBrands.includes(brandName)
        ? selectedBrands.filter((b) => b !== brandName)
        : [...selectedBrands, brandName];
      setSelectedBrands(updated);
      resetAndReload(updated, selectedAudiences, selectedCategories, sort);
    },
    [selectedBrands, selectedAudiences, selectedCategories, sort, resetAndReload]
  );

  const handleAudienceToggle = useCallback(
    (audId: string) => {
      const upper = audId.toUpperCase();
      const updated = selectedAudiences.includes(upper)
        ? selectedAudiences.filter((a) => a !== upper)
        : [...selectedAudiences, upper];
      setSelectedAudiences(updated);
      resetAndReload(selectedBrands, updated, selectedCategories, sort);
    },
    [selectedBrands, selectedAudiences, selectedCategories, sort, resetAndReload]
  );

  const handleCategoryToggle = useCallback(
    (catName: string) => {
      const updated = selectedCategories.some((c) => c.toLowerCase() === catName.toLowerCase())
        ? selectedCategories.filter((c) => c.toLowerCase() !== catName.toLowerCase())
        : [...selectedCategories, catName];
      setSelectedCategories(updated);
      resetAndReload(selectedBrands, selectedAudiences, updated, sort);
    },
    [selectedBrands, selectedAudiences, selectedCategories, sort, resetAndReload]
  );

  const handleSortChange = useCallback(
    (newSort: SortValue) => {
      setSort(newSort);
      setIsSortOpen(false);
      resetAndReload(selectedBrands, selectedAudiences, selectedCategories, newSort);
    },
    [selectedBrands, selectedAudiences, selectedCategories, resetAndReload]
  );

  const handleClearFilters = useCallback(() => {
    setSelectedBrands([]);
    setSelectedAudiences([]);
    setSelectedCategories([]);
    resetAndReload([], [], [], sort);
  }, [sort, resetAndReload]);

  const handleClearSearch = useCallback(() => {
    router.push("/");
  }, [router]);

  // ── Body scroll lock (mobile drawer) ─────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isMobileDrawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileDrawerOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileDrawerOpen(false);
        setIsSortOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const activeFilterCount = selectedBrands.length + selectedAudiences.length + selectedCategories.length;
  const hasActiveFilters  = activeFilterCount > 0;
  const hasMore           = currentPage < lastPage;
  const isEndOfResults    = currentPage >= lastPage && currentPage > 0 && products.length > 0;

  const getBrandLogo = (brandName: string) => {
    const normalized = brandName.toLowerCase().replace(/[''.\s-]/g, "");
    const match = liveBrands.find(
      (b) =>
        b.name.toLowerCase() === brandName.toLowerCase() ||
        String(b.id).toLowerCase() === normalized ||
        b.slug.toLowerCase() === normalized
    );
    return getBrandLogoUrl(brandName, match?.logo_url || match?.logo);
  };

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Sort";

  // ── Filter sidebar content (reused in desktop sidebar + mobile drawer) ────
  const renderFilterContent = () => (
    <div className="space-y-6">
      {/* BRAND FILTER */}
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
                  {isSelected && (
                    <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check size={9} strokeWidth={3} />
                    </span>
                  )}
                  <div className="h-7 w-full flex items-center justify-center px-1 mb-1">
                    {logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logo}
                        alt={`${brandName} logo`}
                        className="max-h-7 max-w-[80px] w-auto object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-xs font-extrabold text-muted-foreground select-none">
                        {brandName.length <= 3
                          ? brandName.toUpperCase()
                          : brandName
                              .split(/\s+/)
                              .map((w) => w[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-foreground/80 truncate max-w-full px-0.5">
                    {brandName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. AUDIENCE FILTER */}
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

        <AudienceSelector
          selectedAudiences={selectedAudiences}
          onToggle={handleAudienceToggle}
          layout="grid"
        />
      </div>

      {/* 2. PRODUCT CATEGORY FILTER (Dynamic) */}
      {availableCategories.length > 0 && (
        <div className="flex flex-col gap-2.5 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground">
              PRODUCT CATEGORY
            </span>
            {selectedCategories.length > 0 && (
              <span className="text-[0.6875rem] font-semibold text-primary">
                {selectedCategories.length} selected
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
            {availableCategories.map((catName) => {
              const isSelected = selectedCategories.some((c) => c.toLowerCase() === catName.toLowerCase());
              return (
                <button
                  key={catName}
                  type="button"
                  onClick={() => handleCategoryToggle(catName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs scale-[1.02]"
                      : "bg-secondary/60 hover:bg-secondary border border-border/80 text-foreground/80 hover:text-foreground"
                  }`}
                >
                  {isSelected && <Check size={11} strokeWidth={3} />}
                  <span>{catName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ACTIVE FILTERS */}
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
            {selectedCategories.map((c) => (
              <span
                key={`side-c-${c}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary border border-border text-foreground font-semibold text-xs"
              >
                <span>{c}</span>
                <button
                  type="button"
                  onClick={() => handleCategoryToggle(c)}
                  className="hover:text-destructive transition-colors ml-0.5 p-0.5 cursor-pointer"
                  title={`Remove ${c}`}
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

  // ── Initial loading skeleton (full grid) ──────────────────────────────────
  if (loading) {
    return (
      <div className="w-full bg-background min-h-[70vh] py-6 sm:py-8">
        <div className="mx-auto w-full max-w-[1720px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/70 mb-6">
            <div className="space-y-2">
              <div className="h-7 bg-secondary/60 rounded-full w-64 animate-pulse" />
              <div className="h-4 bg-secondary/40 rounded-full w-48 animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col lg:flex-row items-start gap-6 xl:gap-8 w-full">
            <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
              <div className="bg-card border border-border/70 rounded-2xl p-5 h-96 animate-pulse" />
            </aside>
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5">
                <ProductSkeletonRow count={10} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Full render ───────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-background min-h-[70vh] py-6 sm:py-8">
      <div className="mx-auto w-full max-w-[1720px] px-4 sm:px-6 lg:px-8">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/70 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
                {query.trim()
                  ? `SEARCH RESULTS — ${total.toLocaleString()} PRODUCT${total !== 1 ? "S" : ""}`
                  : `ALL PRODUCTS — ${total.toLocaleString()} PRODUCT${total !== 1 ? "S" : ""}`}
              </h1>
              <Sparkles size={18} className="text-primary hidden sm:inline-block" />
            </div>
            {query.trim() && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Showing wholesale &amp; retail products matching{" "}
                <span className="font-semibold text-foreground">&ldquo;{query}&rdquo;</span>
              </p>
            )}
            {products.length > 0 && total > PER_PAGE && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {products.length.toLocaleString()} of {total.toLocaleString()} loaded
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Sort dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-border text-xs font-bold uppercase tracking-wider text-foreground bg-card hover:bg-secondary transition-colors cursor-pointer shadow-sm active:scale-95"
              >
                <span>{currentSortLabel}</span>
                <ChevronDown size={13} className={`transition-transform ${isSortOpen ? "rotate-180" : ""}`} />
              </button>
              {isSortOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-card border border-border/80 rounded-xl shadow-xl z-40 py-1 animate-in fade-in zoom-in-95 duration-100">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSortChange(opt.value)}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                        sort === opt.value
                          ? "text-primary bg-primary/[0.07]"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {query.trim() && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-foreground hover:bg-secondary text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer self-start sm:self-auto active:scale-95 shadow-sm"
              >
                <X size={14} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-col lg:flex-row items-start gap-6 xl:gap-8 w-full">

          {/* Desktop sidebar */}
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
              {renderFilterContent()}
            </div>
          </aside>

          {/* Product grid area */}
          <div className="flex-1 min-w-0 w-full flex flex-col gap-4">

            {/* Mobile filter button row */}
            <div className="lg:hidden flex items-center justify-between pb-2">
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(true)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm active:scale-95 ${
                  hasActiveFilters
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card hover:bg-secondary border-border text-foreground"
                }`}
              >
                <SlidersHorizontal size={14} />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary-foreground text-primary text-xs font-bold flex items-center justify-center">
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

            {/* Product grid */}
            {products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-5">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}

                {/* Loading more — skeleton cards inline with grid */}
                {loadingMore && <ProductSkeletonRow count={5} />}
              </div>
            ) : (
              /* Empty state */
              <div className="w-full py-16 px-4 text-center bg-card rounded-2xl border border-dashed border-border/80 flex flex-col items-center justify-center my-6 shadow-sm">
                <div className="w-14 h-14 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground mb-3.5">
                  <Search size={24} />
                </div>
                <h3 className="text-lg font-bold uppercase font-display mb-1 text-foreground">
                  No Products Found
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
                  {query.trim() ? (
                    <>No products match &ldquo;{query}&rdquo; with your selected filters. Try changing your search or filters.</>
                  ) : (
                    <>No products match your selected filter criteria. Try clearing one or more filters.</>
                  )}
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

            {/* Error / retry state */}
            {error && !loadingMore && (
              <div className="flex flex-col items-center gap-3 py-8 text-center animate-in fade-in">
                <div className="flex items-center gap-2 text-sm text-destructive font-semibold">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-border text-xs font-bold uppercase tracking-wider text-foreground hover:bg-secondary transition-colors cursor-pointer active:scale-95 shadow-sm"
                >
                  <RotateCcw size={13} />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Sentinel — triggers next page when it enters the viewport */}
            {hasMore && !error && (
              <div
                ref={sentinelRef}
                className="w-full h-4 mt-2"
                aria-hidden="true"
              />
            )}

            {/* End of results indicator */}
            {isEndOfResults && !hasMore && (
              <div className="flex items-center justify-center gap-3 py-10">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-3">
                  End of results — {total.toLocaleString()} products
                </span>
                <div className="h-px flex-1 bg-border/60" />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Mobile drawer backdrop */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 lg:hidden transition-opacity duration-300 animate-in fade-in"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile slide-in filter drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-card z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out lg:hidden border-r border-border ${
          isMobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {renderFilterContent()}
        </div>

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
            View {total.toLocaleString()} Results
          </button>
        </div>
      </div>

      {/* Sort dropdown backdrop */}
      {isSortOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsSortOpen(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export (wrapped in Suspense for useSearchParams)
// ---------------------------------------------------------------------------

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
