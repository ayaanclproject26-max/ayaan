"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getProductBySlugOrId, getProducts, toStorefrontProduct } from "@/lib/services/products";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import { B2BProductInput } from "@/types/b2b";
import { formatPrice } from "@/lib/formatters";
import ProductCard from "@/components/product/ProductCard";
import ProductGallery from "@/components/product/ProductGallery";
import ProductBrandLogoOverlay from "@/components/common/ProductBrandLogoOverlay";
import ProductPromotionBadges from "@/components/common/ProductPromotionBadges";

import { 
  ShoppingCart, 
  Check, 
  AlertCircle, 
  Package, 
  Heart, 
  TrendingDown, 
  MessageCircle,
} from "lucide-react";
import BUSINESS_PROFILE, { getWhatsAppUrl } from "@/config/business-profile";

interface ProductDetailViewProps {
  initialProduct?: B2BProductInput | null;
  slug: string;
}

const COLOR_MAP: Record<string, string> = {
  black: "#111827",
  white: "#FFFFFF",
  navy: "#1E3A8A",
  blue: "#2563EB",
  red: "#DC2626",
  green: "#16A34A",
  yellow: "#EAB308",
  orange: "#EA580C",
  purple: "#9333EA",
  pink: "#EC4899",
  brown: "#78350F",
  grey: "#6B7280",
  gray: "#6B7280",
  beige: "#D4C5B9",
  maroon: "#881337",
  olive: "#556B2F",
  charcoal: "#374151",
  peach: "#FFCBA4",
  teal: "#0D9488",
  cream: "#FFFDD0",
  khaki: "#C3B091",
  standard: "#111827",
  assorted: "#6366F1",
};

function getColorHex(colorName?: string): string {
  if (!colorName) return "#6B7280";
  const normalized = colorName.trim().toLowerCase();
  return COLOR_MAP[normalized] || "#94A3B8";
}

export default function ProductDetailView({ initialProduct, slug }: ProductDetailViewProps) {
  const { addToCart, setIsCartOpen } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<B2BProductInput | null>(initialProduct || null);
  const [relatedProducts, setRelatedProducts] = useState<B2BProductInput[]>([]);
  const [loading, setLoading] = useState(!initialProduct);

  const [quantity, setQuantity] = useState<number>(initialProduct?.moq || 10);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  useEffect(() => {
    async function load() {
      if (!initialProduct) {
        setLoading(true);
        const p = await getProductBySlugOrId(slug);
        if (p) {
          setProduct(p);
          setQuantity(p.moq || 10);

          const all = await getProducts({ brand: p.brand });
          setRelatedProducts(all.filter((item) => item.id !== p.id).slice(0, 5));
        }
        setLoading(false);
      } else {
        const all = await getProducts({ brand: initialProduct.brand });
        setRelatedProducts(all.filter((item) => item.id !== initialProduct.id).slice(0, 5));
      }
    }
    load();
  }, [slug, initialProduct]);

  const moq = Math.max(1, product?.moq || 10);
  const isBelowMoq = quantity < moq;

  // 1. Standard Base Price
  const standardPrice = product?.standardPrice ?? product?.wholesalePrice ?? 28.0;

  // 2. Bulk Tier Threshold and Unit Price
  const bulkTierFromList = product?.pricingTiers?.find(t => t.min_quantity > moq);
  const bulkThreshold = product?.bulkThreshold 
    ?? (bulkTierFromList ? bulkTierFromList.min_quantity : moq * 20); // Default dynamic 20x MOQ if unspecified
  
  const bulkPrice = product?.bulkPrice 
    ?? (bulkTierFromList ? bulkTierFromList.unit_price : Math.round(standardPrice * 0.8 * 100) / 100);

  // 3. Total Available Stock
  const totalStock = useMemo(() => {
    if (!product) return 0;
    if (product.fullStockQuantity) return product.fullStockQuantity;
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }
    return product.stock || 710;
  }, [product]);

  // 4. Exact Full Stock Price Resolution (Backend-aligned rule: never worse than valid tier for totalStock)
  const applicableNormalPriceForFullStock = totalStock >= bulkThreshold ? bulkPrice : standardPrice;
  const configuredFullStockPrice = product?.fullStockPrice !== undefined && product?.fullStockPrice !== null
    ? Number(product.fullStockPrice)
    : null;

  const resolvedFullStockPrice = configuredFullStockPrice !== null && configuredFullStockPrice > 0
    ? Math.min(configuredFullStockPrice, applicableNormalPriceForFullStock)
    : applicableNormalPriceForFullStock;

  // Purchasing Mode Resolution
  const isFullStock = Boolean(totalStock > 0 && quantity === totalStock);
  const isBulk = !isFullStock && quantity >= bulkThreshold;
  const isStandard = !isFullStock && !isBulk;

  const currentPrice = isFullStock 
    ? resolvedFullStockPrice 
    : (isBulk ? bulkPrice : standardPrice);

  // Savings Percentages
  const bulkSavingsPercent = standardPrice > bulkPrice 
    ? Math.round(((standardPrice - bulkPrice) / standardPrice) * 100) 
    : 0;

  const fullStockSavingsPercent = standardPrice > resolvedFullStockPrice 
    ? Math.round(((standardPrice - resolvedFullStockPrice) / standardPrice) * 100) 
    : 0;

  // Extract YouTube Video
  const youtubeEmbedUrl = useMemo(() => {
    if (product?.youtubeEmbedUrl) return product.youtubeEmbedUrl;
    if (product?.youtubeVideoId) return `https://www.youtube-nocookie.com/embed/${product.youtubeVideoId}`;
    if (!product?.videoUrl) return null;
    const url = product.videoUrl.trim();
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
  }, [product]);

  // Informational Colors & Sizes Lists
  const colorsList = useMemo(() => {
    if (!product) return ["Black"];
    if (product.colors && product.colors.length > 0) return product.colors;
    if (product.colorName) return [product.colorName];
    return ["Black"];
  }, [product]);

  const sizesList = useMemo(() => {
    if (!product) return ["S", "M", "L", "XL"];
    if (product.sizes && product.sizes.length > 0) return product.sizes;
    return ["S", "M", "L", "XL"];
  }, [product]);

  // Package Assortment Matrix Computation (Display-only)
  const matrixData = useMemo(() => {
    if (!product) return null;

    const colors = colorsList;
    const sizes = sizesList;

    const cellMap: Record<string, Record<string, number>> = {};
    colors.forEach(c => {
      cellMap[c] = {};
      sizes.forEach(s => { cellMap[c][s] = 0; });
    });

    if (isFullStock && product.variants && product.variants.length > 0) {
      // Authoritative live warehouse inventory breakdown for Full Stock
      product.variants.forEach(v => {
        const c = v.color || colors[0];
        const s = v.size || sizes[0];
        if (!cellMap[c]) cellMap[c] = {};
        cellMap[c][s] = (cellMap[c][s] || 0) + (v.stock || 0);
      });
    } else if (product.packageAllocations && product.packageAllocations.length > 0) {
      // Standard package allocation scaled proportionally by quantity / moq
      const mult = quantity / moq;
      let runningTotal = 0;
      const flatList: { color: string; size: string; count: number }[] = [];

      product.packageAllocations.forEach(a => {
        const c = a.color || colors[0];
        const s = a.size || sizes[0];
        // Support both `quantity` (canonical) and legacy `count` field names
        const baseQty = (a.quantity ?? (a as any).count ?? 0) as number;
        const count = Math.round(baseQty * mult);
        flatList.push({ color: c, size: s, count });
        runningTotal += count;
      });

      // Guarantee SUM(all cells) === quantity mathematically (deterministic remainder on last item)
      const diff = quantity - runningTotal;
      if (diff !== 0 && flatList.length > 0) {
        flatList[flatList.length - 1].count += diff;
      }

      flatList.forEach(item => {
        if (!cellMap[item.color]) cellMap[item.color] = {};
        cellMap[item.color][item.size] = (cellMap[item.color][item.size] || 0) + item.count;
      });

    } else {
      // Fallback: Proportional distribution across colors and sizes
      const totalCombinations = colors.length * sizes.length;
      const basePerCell = Math.floor(quantity / Math.max(1, totalCombinations));
      let remainder = quantity % Math.max(1, totalCombinations);

      colors.forEach(c => {
        sizes.forEach(s => {
          const extra = remainder > 0 ? 1 : 0;
          if (remainder > 0) remainder--;
          cellMap[c][s] = basePerCell + extra;
        });
      });
    }

    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};
    let grandTotal = 0;

    sizes.forEach(s => { colTotals[s] = 0; });

    colors.forEach(c => {
      rowTotals[c] = 0;
      sizes.forEach(s => {
        const val = cellMap[c]?.[s] || 0;
        rowTotals[c] += val;
        colTotals[s] += val;
        grandTotal += val;
      });
    });

    return { colors, sizes, cellMap, rowTotals, colTotals, grandTotal };
  }, [product, quantity, isFullStock, moq, colorsList, sizesList]);

  // Pricing Row Click Handlers
  const handleSelectStandard = () => {
    setQuantity(moq);
  };

  const handleSelectBulk = () => {
    setQuantity(bulkThreshold);
  };

  const handleSelectFullStock = () => {
    if (totalStock > 0) {
      setQuantity(totalStock);
    }
  };

  const handleIncrement = () => {
    if (isFullStock) return; // already at max
    const nextQty = quantity + moq;
    if (totalStock > 0 && nextQty >= totalStock) {
      setQuantity(totalStock);
    } else {
      setQuantity(nextQty);
    }
  };

  const handleDecrement = () => {
    if (isFullStock) {
      // Step down smoothly to nearest valid multiple of MOQ below totalStock
      const nearestMultiple = Math.floor((totalStock - 1) / moq) * moq;
      setQuantity(Math.max(moq, nearestMultiple));
      return;
    }
    // Never go below MOQ
    if (quantity <= moq) return;
    setQuantity(q => Math.max(moq, q - moq));
  };


  // Handle Add to Cart
  const handleAddToCart = () => {
    if (!product) return;

    const packageBreakdown: import("@/types").PackageBreakdown[] = [];
    if (matrixData) {
      matrixData.colors.forEach(c => {
        matrixData.sizes.forEach(s => {
          const qty = matrixData.cellMap[c]?.[s] || 0;
          if (qty > 0) {
            const matchedVariant = product.variants?.find(
              v => (v.color === c || !v.color) && (v.size === s || !v.size)
            );
            packageBreakdown.push({
              product_variant_id: matchedVariant ? Number(matchedVariant.id) : null,
              color: c,
              size: s,
              quantity: qty
            });
          }
        });
      });
    }

    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        categoryId: product.categoryId || "c_tops",
        price: currentPrice,
        oldPrice: product.msrpPrice,
        images: product.images,
        badge: product.isHot ? "Hot" : undefined,
        sizes: sizesList,
        color: colorsList.join(", "),
        isNew: product.isNew,
        moq: moq,
      } as any,
      "Assorted",
      quantity,
      undefined,
      packageBreakdown
    );
    setFeedbackMsg("Added to cart");
    setTimeout(() => {
      setFeedbackMsg("");
    }, 3000);
    setIsCartOpen(true);
  };

  if (loading) {
    return (
      <div className="w-full min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="w-full min-h-[70vh] py-20 text-center">
        <h2 className="text-xl font-bold uppercase font-display">Product Not Found</h2>
        <Link href="/search" className="text-primary hover:underline mt-2 inline-block text-xs font-bold uppercase">
          ← Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-background min-h-screen py-4 sm:py-6">
      <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-5">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Link href="/search" className="hover:text-foreground transition-colors">Catalog</Link>
          <span className="text-border">/</span>
          <Link href={`/search?brand=${encodeURIComponent(product.brand)}`} className="hover:text-foreground transition-colors">
            {product.brand}
          </Link>
          <span className="text-border">/</span>
          <span className="text-foreground truncate max-w-xs">{product.name}</span>
        </nav>

        {feedbackMsg && (
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check size={16} />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* MAIN PRODUCT GRID (5 Cols Left Images ≈ 41.7%, 7 Cols Right Purchase Hierarchy ≈ 58.3%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* LEFT: GALLERY / MEDIA + SPECIFICATIONS (5 Cols with controlled max-width) */}
          <div className="lg:col-span-5 space-y-3.5 max-w-[420px] xl:max-w-[440px] w-full mx-auto lg:mx-0">
            {/* Unified Media Experience (Images + Video + Lightbox) */}
            <ProductGallery
              images={product.images}
              productName={product.name}
              productSlug={product.slug}
              videoUrl={product.videoUrl}
              youtubeVideoId={product.youtubeVideoId}
              youtubeEmbedUrl={youtubeEmbedUrl || product.youtubeEmbedUrl}
              variant="detail"
              overlayContent={
                <>
                  {/* Normalized Promotional Badges (Top Left) */}
                  <ProductPromotionBadges product={product} variant="detail" />

                  {/* Actual Brand Logo Overlay (Top Right) */}
                  <ProductBrandLogoOverlay
                    brandName={product.brand}
                    brandLogo={product.brandLogo}
                    size="detail"
                    className="top-3 right-3 sm:top-4 sm:right-4"
                  />
                </>
              }
            />

            {/* Specifications Section — positioned underneath thumbnail rail with clean, compact spacing */}
            <div className="pt-4 mt-4 border-t border-border/60 space-y-2 font-sans">
              <h2 className="text-xs font-display font-bold uppercase tracking-wider text-foreground">
                Specifications
              </h2>
              
              {product.description && (
                <p className="font-sans text-muted-foreground leading-relaxed text-xs">
                  {product.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 pt-0.5 text-xs font-sans">
                <div className="p-2 rounded-lg bg-secondary/30 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block uppercase font-semibold tracking-wider">Material</span>
                  <span className="font-semibold text-foreground text-xs mt-0.5 block leading-snug break-words">
                    {product.material || "100% Combed Cotton"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-secondary/30 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block uppercase font-semibold tracking-wider">Weight</span>
                  <span className="font-semibold text-foreground text-xs mt-0.5 block leading-snug">
                    {product.weightGrams ? `${product.weightGrams} g/m²` : "240 g/m²"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-secondary/30 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block uppercase font-semibold tracking-wider">Season</span>
                  <span className="font-semibold text-foreground text-xs mt-0.5 block leading-snug">
                    {product.collectionSeason || "2026 Core Line"}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-secondary/30 border border-border/40">
                  <span className="text-[10px] text-muted-foreground block uppercase font-semibold tracking-wider">Audience</span>
                  <span className="font-semibold text-foreground text-xs mt-0.5 block leading-snug">
                    {product.audience || "UNISEX"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: WHOLESALE PURCHASE HIERARCHY (7 Cols — Sticky on Desktop) */}
          <div className="lg:col-span-7 space-y-2.5 sm:space-y-3 lg:sticky lg:top-[80px] lg:self-start max-w-xl xl:max-w-2xl w-full">
            
            {/* ========================================================= */}
            {/* 1. PRODUCT IDENTITY & METADATA HIERARCHY */}
            {/* ========================================================= */}
            <div className="space-y-1.5 pb-2.5 border-b border-border/60">
              
              {/* Structured Metadata (Brand prominent, SKU · Audience · Category secondary) */}
              <div className="space-y-0.5">
                <div className="text-xs font-bold uppercase tracking-wider text-primary">
                  {product.brand}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-sans text-muted-foreground">
                  <span>SKU: <span className="font-mono text-foreground/90 font-medium">{product.sku}</span></span>
                  <span className="text-border/80">·</span>
                  <span className="uppercase font-medium">{product.audience}</span>
                  <span className="text-border/80">·</span>
                  <span className="font-medium">{product.categoryName || "Apparel"}</span>
                </div>
              </div>

              {/* Product Title */}
              <h1 className="text-xl sm:text-2xl font-display font-bold uppercase tracking-tight text-foreground leading-tight">
                {product.name}
              </h1>

              {/* Price Hierarchy */}
              <div className="space-y-1 pt-0.5">
                {/* Dominant Primary B2B Unit Price */}
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-sans font-bold text-foreground tabular-nums tracking-tight">
                    {formatPrice(currentPrice)}
                  </span>
                  <span className="text-xs font-sans font-medium text-muted-foreground uppercase tracking-wider">
                    / pc
                  </span>
                </div>

                {/* Compact Secondary MOQ & Stock Facts */}
                <div className="flex items-center gap-1.5 text-xs font-sans text-muted-foreground">
                  <span>MOQ: <strong className="text-foreground font-semibold tabular-nums">{moq} pcs</strong></span>
                  <span className="text-border/80">·</span>
                  <span>Stock: <strong className="text-foreground font-semibold tabular-nums">{totalStock.toLocaleString()} pcs</strong></span>
                </div>
              </div>

            </div>

            {/* ========================================================= */}
            {/* 2. BUY MORE, SAVE MORE TIER TABLE */}
            {/* ========================================================= */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-display font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <TrendingDown size={14} className="text-primary" />
                  <span>Buy More, Save More</span>
                </h3>
                <span className="text-[10px] text-muted-foreground/70">Select a tier to set order volume</span>
              </div>

              <div className="overflow-x-auto border border-border/70 rounded-lg bg-card/60 shadow-2xs">
                <table className="w-full text-xs text-left font-sans min-w-[280px]">
                  <thead className="bg-secondary/40 text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                    <tr>
                      <th className="w-[32%] px-3 py-1 font-semibold text-foreground">Tier</th>
                      <th className="w-[34%] px-3 py-1 font-semibold text-foreground">Quantity</th>
                      <th className="w-[34%] px-3 py-1 font-bold text-right text-foreground">Unit Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {/* STANDARD */}
                    <tr
                      onClick={handleSelectStandard}
                      className={`cursor-pointer transition-colors duration-150 ${
                        isStandard
                          ? "bg-foreground/[0.03] text-foreground font-medium"
                          : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      }`}
                    >
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${isStandard ? "bg-foreground scale-110" : "bg-muted-foreground/30"}`} />
                          <span className={`uppercase tracking-wider text-xs ${isStandard ? "font-bold text-foreground" : "font-semibold text-muted-foreground"}`}>Standard</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 font-normal text-muted-foreground tabular-nums text-xs">
                        {moq}–{bulkThreshold - 1} pcs
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums whitespace-nowrap">
                        <span className="font-bold tabular-nums text-xs sm:text-sm text-foreground">
                          {formatPrice(standardPrice)}
                        </span>
                      </td>
                    </tr>

                    {/* BULK */}
                    <tr
                      onClick={handleSelectBulk}
                      className={`cursor-pointer transition-colors duration-150 ${
                        isBulk
                          ? "bg-foreground/[0.03] text-foreground font-medium"
                          : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      }`}
                    >
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${isBulk ? "bg-foreground scale-110" : "bg-muted-foreground/30"}`} />
                          <span className={`uppercase tracking-wider text-xs ${isBulk ? "font-bold text-foreground" : "font-semibold text-muted-foreground"}`}>Bulk</span>
                        </div>
                      </td>
                      <td className="px-3 py-1.5 font-normal text-muted-foreground tabular-nums text-xs">
                        {bulkThreshold}+ pcs
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {bulkSavingsPercent > 0 && (
                            <span className="text-[9px] uppercase font-semibold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
                              {bulkSavingsPercent}% OFF
                            </span>
                          )}
                          <span className="font-bold tabular-nums text-xs sm:text-sm text-foreground">
                            {formatPrice(bulkPrice)}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* FULL STOCK */}
                    {totalStock > moq && (
                      <tr
                        onClick={handleSelectFullStock}
                        className={`cursor-pointer transition-colors duration-150 ${
                          isFullStock
                            ? "bg-foreground/[0.03] text-foreground font-medium"
                            : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                        }`}
                      >
                        <td className="px-3 py-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full transition-all shrink-0 ${isFullStock ? "bg-emerald-600 scale-110" : "bg-muted-foreground/30"}`} />
                            <span className={`uppercase tracking-wider text-xs ${isFullStock ? "font-bold text-foreground" : "font-semibold text-muted-foreground"}`}>Full Stock</span>
                          </div>
                        </td>
                        <td className="px-3 py-1.5 font-normal text-muted-foreground tabular-nums text-xs">
                          {totalStock.toLocaleString()} pcs
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {fullStockSavingsPercent > 0 && (
                              <span className="text-[9px] uppercase font-semibold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
                                {fullStockSavingsPercent}% OFF
                              </span>
                            )}
                            <span className="font-bold tabular-nums text-xs sm:text-sm text-foreground">
                              {formatPrice(resolvedFullStockPrice)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 3. UNIFIED ORDER QUANTITY & ESTIMATED TOTAL DECISION BLOCK */}
            {/* ========================================================= */}
            <div className="p-2.5 sm:p-3 rounded-lg border border-border/60 bg-secondary/15 space-y-2 font-sans">
              <div className="flex items-center justify-between text-[11px] font-display font-bold uppercase tracking-wider">
                <span className="text-foreground">Order Quantity</span>
                <span className="text-muted-foreground">Est. Total</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                {/* Quantity Stepper */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-border rounded-lg bg-card shadow-2xs h-8 sm:h-8.5">
                    <button 
                      type="button" 
                      onClick={handleDecrement}
                      disabled={quantity <= moq && !isFullStock}
                      className="w-8 h-full flex items-center justify-center text-foreground font-bold text-sm hover:bg-secondary rounded-l-lg cursor-pointer transition-colors select-none disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Decrease quantity"
                      title={quantity <= moq ? `Minimum order quantity is ${moq} pcs` : undefined}
                    >
                      −
                    </button>
                    <div className="w-16 sm:w-18 text-center font-bold text-xs sm:text-sm select-none tabular-nums font-sans">
                      {quantity.toLocaleString()}
                    </div>
                    <button 
                      type="button" 
                      onClick={handleIncrement}
                      disabled={isFullStock || (totalStock > 0 && quantity >= totalStock)}
                      className="w-8 h-full flex items-center justify-center text-foreground font-bold text-sm hover:bg-secondary rounded-r-lg cursor-pointer transition-colors select-none disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                      title={isFullStock || (totalStock > 0 && quantity >= totalStock) ? `Maximum available stock is ${totalStock.toLocaleString()} pcs` : undefined}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">pcs</span>
                </div>

                {/* Estimated Total */}
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-bold text-foreground font-sans tabular-nums block leading-tight">
                    {formatPrice(currentPrice * quantity)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block tabular-nums">
                    ({quantity.toLocaleString()} pcs × {formatPrice(currentPrice)} / pc)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-sans text-muted-foreground pt-1 border-t border-border/40">
                <span>Multiples of {moq} pcs</span>
                {isBelowMoq && (
                  <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle size={11} /> Minimum order quantity is {moq} pcs
                  </span>
                )}
              </div>
            </div>

            {/* ========================================================= */}
            {/* 4. WHOLESALE PACKAGE / ASSORTMENT INFORMATION */}
            {/* ========================================================= */}
            <div className="space-y-2 p-2.5 sm:p-3 rounded-lg border border-border/60 bg-card/60 font-sans">
              <div className="flex items-center justify-between pb-1.5 border-b border-border/50">
                <div className="flex items-center gap-1.5">
                  <Package size={14} className="text-primary" />
                  <h3 className="text-xs font-display font-bold uppercase tracking-wider text-foreground">
                    Package Assortment
                  </h3>
                </div>
                <span className="text-[10px] font-sans font-medium text-muted-foreground bg-secondary/60 px-2 py-0.5 rounded border border-border/40 tabular-nums">
                  {matrixData ? `${matrixData.grandTotal.toLocaleString()} pcs total` : `${moq} pcs / pack`}
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground leading-snug">
                Pre-assorted wholesale package with the following colorway and size mix.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Included Colors (Display-only) */}
                <div className="space-y-1 p-2 rounded-md bg-secondary/25 border border-border/40">
                  <span className="text-[9px] font-display font-bold uppercase tracking-wider text-muted-foreground block">
                    Included Colors
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {colorsList.map((color, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-background text-foreground border border-border/50"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: getColorHex(color) }}
                        />
                        <span>{color}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Included Sizes (Display-only) */}
                <div className="space-y-1 p-2 rounded-md bg-secondary/25 border border-border/40">
                  <span className="text-[9px] font-display font-bold uppercase tracking-wider text-muted-foreground block">
                    Included Sizes
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {sizesList.map((size, i) => (
                      <span
                        key={i}
                        className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-background text-foreground border border-border/50"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Package Breakdown Matrix Table (if available) */}
              {matrixData && (
                <div className="pt-1 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-display font-bold uppercase tracking-wider text-foreground">
                      {isFullStock ? "Full Stock Breakdown Matrix" : "Assortment Ratio Matrix"}
                    </span>
                    <span className="text-[9px] text-muted-foreground">Units per package breakdown</span>
                  </div>

                  <div className="overflow-x-auto border border-border/60 rounded-md bg-background">
                    <table className="w-full text-xs text-left min-w-[260px] font-sans">
                      <thead className="bg-secondary/40 text-[9px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                        <tr>
                          <th className="px-2 py-1 font-semibold">Color</th>
                          {matrixData.sizes.map((s) => (
                            <th key={s} className="px-2 py-1 font-semibold text-center">{s}</th>
                          ))}
                          <th className="px-2 py-1 font-bold text-right text-foreground">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-[10px]">
                        {matrixData.colors.map((color) => (
                          <tr key={color} className="hover:bg-secondary/20">
                            <td className="px-2 py-1 font-medium text-foreground flex items-center gap-1.5">
                              <span
                                className="w-1.5 h-1.5 rounded-full border border-black/10 shrink-0"
                                style={{ backgroundColor: getColorHex(color) }}
                              />
                              <span>{color}</span>
                            </td>
                            {matrixData.sizes.map((size) => (
                              <td key={size} className="px-2 py-1 text-center text-muted-foreground tabular-nums">
                                {matrixData.cellMap[color]?.[size] || 0}
                              </td>
                            ))}
                            <td className="px-2 py-1 font-bold text-right text-foreground tabular-nums">
                              {matrixData.rowTotals[color] || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-secondary/30 border-t border-border font-bold text-foreground text-[10px]">
                        <tr>
                          <td className="px-2 py-1 uppercase text-[9px]">TOTAL</td>
                          {matrixData.sizes.map((size) => (
                            <td key={size} className="px-2 py-1 text-center tabular-nums">
                              {matrixData.colTotals[size] || 0}
                            </td>
                          ))}
                          <td className="px-2 py-1 text-right text-foreground font-bold tabular-nums">
                            {matrixData.grandTotal.toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* 5. PRIMARY ACTION: ADD TO CART (+ WISHLIST & SECONDARY CTAS) */}
            {/* ========================================================= */}
            <div className="space-y-2 pt-0.5 font-sans">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full flex-1 h-10 sm:h-11 px-5 rounded-lg bg-foreground text-background font-sans font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all duration-150 cursor-pointer shadow-xs active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={15} />
                  <span>Add to Cart</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (product) {
                      toggleWishlist(toStorefrontProduct(product));
                    }
                  }}
                  className={`h-10 sm:h-11 w-10 sm:w-11 rounded-lg border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                    product && isInWishlist(product.id)
                      ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/30 dark:border-rose-800"
                      : "border-border/80 text-foreground hover:bg-secondary"
                  }`}
                  title={product && isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                  aria-label="Toggle wishlist"
                >
                  <Heart size={16} className={product && isInWishlist(product.id) ? "fill-current text-rose-600" : ""} />
                </button>
              </div>

              {/* Secondary B2B Action (WhatsApp Inquiry Only — Offer Sheet Removed) */}
              {product && (
                <a
                  href={getWhatsAppUrl(`Hello ${BUSINESS_PROFILE.name},\n\nI am interested in:\nProduct: ${product.name}\nSKU: ${product.sku}\nQuantity: ${quantity} pcs`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-9 sm:h-9.5 px-3 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] font-sans font-semibold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
                >
                  <MessageCircle size={14} />
                  <span>Inquire on WhatsApp</span>
                </a>
              )}
            </div>

          </div>

        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="pt-8 sm:pt-10 border-t border-border space-y-4">
            <h2 className="text-lg sm:text-xl font-display font-bold uppercase tracking-tight text-foreground">
              More from {product.brand}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {relatedProducts.map((rp) => (
                <ProductCard
                  key={rp.id}
                  product={toStorefrontProduct(rp)}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
