"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProductBySlugOrId, getProducts, toStorefrontProduct } from "@/lib/services/products";
import { useCart } from "@/lib/CartContext";
import { useWishlist } from "@/lib/WishlistContext";
import { useAuth } from "@/lib/AuthContext";
import { B2BProductInput } from "@/types/b2b";
import { formatPrice } from "@/lib/formatters";
import ProductCard from "@/components/product/ProductCard";
import ProductBrandLogoOverlay from "@/components/common/ProductBrandLogoOverlay";
import ProductPromotionBadges from "@/components/common/ProductPromotionBadges";

import { 
  ShoppingCart, 
  Check, 
  AlertCircle, 
  Play, 
  Package, 
  Heart, 
  TrendingDown, 
  MessageCircle,
  FileText,
  Download,
} from "lucide-react";
import BUSINESS_PROFILE, { getWhatsAppUrl } from "@/config/business-profile";
import { downloadProductOfferSheetPDF } from "@/lib/pdf-generator";

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
  const router = useRouter();
  const { addToCart, setIsCartOpen } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  const [product, setProduct] = useState<B2BProductInput | null>(initialProduct || null);
  const [relatedProducts, setRelatedProducts] = useState<B2BProductInput[]>([]);
  const [loading, setLoading] = useState(!initialProduct);

  const [selectedImage, setSelectedImage] = useState<string>(initialProduct?.images?.[0] || "");
  const [activeMediaType, setActiveMediaType] = useState<"image" | "video">("image");
  const [quantity, setQuantity] = useState<number>(initialProduct?.moq || 10);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  useEffect(() => {
    async function load() {
      if (!initialProduct) {
        setLoading(true);
        const p = await getProductBySlugOrId(slug);
        if (p) {
          setProduct(p);
          setSelectedImage(p.images[0] || "/placeholder.jpg");
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
    <div className="w-full bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Link href="/search" className="hover:text-foreground">Catalog</Link>
          <span>/</span>
          <Link href={`/search?brand=${encodeURIComponent(product.brand)}`} className="hover:text-foreground">
            {product.brand}
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-xs">{product.name}</span>
        </nav>

        {feedbackMsg && (
          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check size={16} />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* MAIN PRODUCT GRID (5 Cols Left Images, 7 Cols Right Specs & Wholesale Package Details) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT: GALLERY / MEDIA + SPECIFICATIONS (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Main Media Viewer (Image or Video) */}
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-secondary border border-border/70 shadow-sm">
              {activeMediaType === "video" && youtubeEmbedUrl ? (
                <div className="w-full h-full bg-black flex items-center justify-center">
                  <iframe
                    src={`${youtubeEmbedUrl}?autoplay=1&rel=0`}
                    title={`${product.name} product video`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedImage || product.images[0] || "/placeholder.jpg"}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover object-center"
                  />

                  {/* Normalized Promotional Badges (Top Left) */}
                  <ProductPromotionBadges product={product} variant="detail" />

                  {/* Actual Brand Logo Overlay (Top Right) */}
                  <ProductBrandLogoOverlay
                    brandName={product.brand}
                    brandLogo={product.brandLogo}
                    size="detail"
                    className="top-4 right-4"
                  />
                </>
              )}
            </div>

            {/* Thumbnail Rail (Max 6 visible on desktop, horizontally scrollable) */}
            <div className="relative">
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {product.images.map((img, idx) => {
                  const isActive = activeMediaType === "image" && selectedImage === img;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveMediaType("image");
                        setSelectedImage(img);
                      }}
                      className={`w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                        isActive
                          ? "border-primary ring-2 ring-primary/20 opacity-100"
                          : "border-border/70 opacity-70 hover:opacity-100 hover:border-border"
                      }`}
                      aria-label={`Select product image view ${idx + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={`${product.name} view ${idx + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                })}

                {/* Video Thumbnail (if product has a YouTube URL) */}
                {youtubeEmbedUrl && (
                  <button
                    type="button"
                    onClick={() => setActiveMediaType("video")}
                    className={`relative w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer bg-black/90 flex flex-col items-center justify-center group ${
                      activeMediaType === "video"
                        ? "border-primary ring-2 ring-primary/20 opacity-100"
                        : "border-border/70 opacity-75 hover:opacity-100 hover:border-border"
                    }`}
                    aria-label="Watch product video"
                    title="Watch product video"
                  >
                    {product.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0]}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:opacity-45 transition-opacity"
                      />
                    )}
                    <div className="relative z-10 w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Play size={11} className="fill-current ml-0.5" />
                    </div>
                    <span className="relative z-10 text-[9px] font-sans font-bold uppercase tracking-wider text-white mt-1 drop-shadow-xs">
                      Video
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Specifications Section — positioned underneath the thumbnail rail with ~24-32px spacing */}
            <div className="pt-6 sm:pt-7 mt-6 sm:mt-7 border-t border-border/70 space-y-3 font-sans">
              <h2 className="text-sm font-display font-bold uppercase tracking-wider text-foreground">
                Specifications
              </h2>
              
              {product.description && (
                <p className="font-sans text-muted-foreground leading-relaxed text-sm">
                  {product.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-1 text-sm font-sans">
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
                  <span className="text-[11px] text-muted-foreground block uppercase font-semibold tracking-wider">Material</span>
                  <span className="font-semibold text-foreground text-xs sm:text-sm mt-0.5 block leading-snug break-words">
                    {product.material || "100% Combed Cotton"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
                  <span className="text-[11px] text-muted-foreground block uppercase font-semibold tracking-wider">Weight</span>
                  <span className="font-semibold text-foreground text-xs sm:text-sm mt-0.5 block leading-snug">
                    {product.weightGrams ? `${product.weightGrams} g/m²` : "240 g/m²"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
                  <span className="text-[11px] text-muted-foreground block uppercase font-semibold tracking-wider">Season</span>
                  <span className="font-semibold text-foreground text-xs sm:text-sm mt-0.5 block leading-snug">
                    {product.collectionSeason || "2026 Core Line"}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-secondary/40 border border-border/50">
                  <span className="text-[11px] text-muted-foreground block uppercase font-semibold tracking-wider">Audience</span>
                  <span className="font-semibold text-foreground text-xs sm:text-sm mt-0.5 block leading-snug">
                    {product.audience || "UNISEX"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: WHOLESALE ASSORTMENT HIERARCHY (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* ========================================================= */}
            {/* GROUP 1: PRODUCT IDENTITY + PRICE + MOQ / STOCK */}
            {/* ========================================================= */}
            <div className="space-y-4 pb-5 border-b border-border/60">
              
              {/* 1. Brand / SKU / Category Metadata (Clean, Muted, Non-competing) */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-sans text-muted-foreground">
                <span className="font-bold text-foreground tracking-wider uppercase">{product.brand}</span>
                <span className="text-border">•</span>
                <span>SKU: <span className="font-mono text-[11px] text-foreground/80">{product.sku}</span></span>
                <span className="text-border">•</span>
                <span className="uppercase">{product.audience}</span>
                <span className="text-border">•</span>
                <span>{product.categoryName || "Apparel"}</span>
              </div>

              {/* 2. Product Title (Manrope, restrained weight, clearly larger than metadata) */}
              <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-foreground leading-tight">
                {product.name}
              </h1>

              {/* 3. Primary Commercial Price & Dynamic Discount */}
              <div className="space-y-1.5 pt-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-sans font-bold text-foreground tabular-nums tracking-tight">
                      {formatPrice(currentPrice)}
                    </span>
                    <span className="text-sm font-sans font-semibold text-muted-foreground uppercase tracking-wider">
                      / pc
                    </span>
                  </div>

                  {/* Secondary Reference MSRP & Dynamic Discount Badge */}
                  {product.msrpPrice && product.msrpPrice > currentPrice && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground line-through font-sans tabular-nums">
                        MSRP: {formatPrice(product.msrpPrice)}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-sans tabular-nums">
                        SAVE {Math.round(((product.msrpPrice - currentPrice) / product.msrpPrice) * 100)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* 4. Clean Compact MOQ / Stock Metadata Row */}
                <div className="flex items-center gap-3 text-xs font-sans text-muted-foreground pt-0.5">
                  <span>MOQ <strong className="text-foreground font-semibold tabular-nums">{moq} pcs</strong></span>
                  <span className="text-border">•</span>
                  <span>Stock <strong className="text-foreground font-semibold tabular-nums">{totalStock.toLocaleString()} pcs</strong></span>
                </div>
              </div>

            </div>

            {/* ========================================================= */}
            {/* GROUP 2: WHOLESALE PRICING + QUANTITY + MATRIX */}
            {/* ========================================================= */}
            <div className="space-y-6 pb-5 border-b border-border/60 font-sans">
              
              {/* 1. BUY MORE, SAVE MORE Tier Table */}
              <div className="space-y-2.5">
                <h3 className="text-xs sm:text-sm font-display font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <TrendingDown size={15} className="text-foreground/70" />
                  <span>Buy More, Save More</span>
                </h3>

                <div className="overflow-x-auto border border-border/80 rounded-xl bg-card">
                  <table className="w-full text-xs text-left font-sans min-w-[300px]">
                    <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                      <tr>
                        <th className="w-[30%] px-3.5 py-2.5 font-semibold text-foreground">Tier</th>
                        <th className="w-[32%] px-3.5 py-2.5 font-semibold text-foreground">Quantity</th>
                        <th className="w-[38%] px-3.5 py-2.5 font-bold text-right text-foreground">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {/* STANDARD */}
                      <tr
                        onClick={handleSelectStandard}
                        className={`cursor-pointer transition-colors duration-150 ${
                          isStandard
                            ? "bg-foreground/[0.04] text-foreground font-medium ring-1 ring-inset ring-foreground/10"
                            : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                        }`}
                      >
                        <td className="px-3.5 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full transition-all shrink-0 ${isStandard ? "bg-foreground scale-110" : "bg-muted-foreground/30"}`} />
                            <span className={`uppercase tracking-wider ${isStandard ? "font-bold text-foreground" : "font-semibold text-muted-foreground"}`}>Standard</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-3 font-normal text-muted-foreground tabular-nums">
                          {moq}–{bulkThreshold - 1} pcs
                        </td>
                        <td className="px-3.5 py-3 text-right tabular-nums whitespace-nowrap">
                          <span className={`font-bold tabular-nums text-sm ${isStandard ? "text-foreground" : "text-foreground/90"}`}>
                            {formatPrice(standardPrice)}
                          </span>
                        </td>
                      </tr>

                      {/* BULK */}
                      <tr
                        onClick={handleSelectBulk}
                        className={`cursor-pointer transition-colors duration-150 ${
                          isBulk
                            ? "bg-foreground/[0.04] text-foreground font-medium ring-1 ring-inset ring-foreground/10"
                            : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                        }`}
                      >
                        <td className="px-3.5 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full transition-all shrink-0 ${isBulk ? "bg-foreground scale-110" : "bg-muted-foreground/30"}`} />
                            <span className={`uppercase tracking-wider ${isBulk ? "font-bold text-foreground" : "font-semibold text-muted-foreground"}`}>Bulk</span>
                          </div>
                        </td>
                        <td className="px-3.5 py-3 font-normal text-muted-foreground tabular-nums">
                          {bulkThreshold}+ pcs
                        </td>
                        <td className="px-3.5 py-3 text-right tabular-nums whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {bulkSavingsPercent > 0 && (
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
                                {bulkSavingsPercent}% OFF
                              </span>
                            )}
                            <span className={`font-bold tabular-nums text-sm ${isBulk ? "text-foreground" : "text-foreground/90"}`}>
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
                              ? "bg-emerald-500/[0.06] text-foreground font-medium ring-1 ring-inset ring-emerald-500/20"
                              : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                          }`}
                        >
                          <td className="px-3.5 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full transition-all shrink-0 ${isFullStock ? "bg-emerald-600 scale-110" : "bg-muted-foreground/30"}`} />
                              <span className={`uppercase tracking-wider ${isFullStock ? "font-bold text-foreground" : "font-semibold text-muted-foreground"}`}>Full Stock</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-3 font-normal text-muted-foreground tabular-nums">
                            {totalStock.toLocaleString()} pcs
                          </td>
                          <td className="px-3.5 py-3 text-right tabular-nums whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {fullStockSavingsPercent > 0 && (
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
                                  {fullStockSavingsPercent}% OFF
                                </span>
                              )}
                              <span className={`font-bold tabular-nums text-sm ${isFullStock ? "text-foreground" : "text-foreground/90"}`}>
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

              {/* 2. ORDER QUANTITY & ESTIMATED TOTAL */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-display font-bold uppercase tracking-wider text-foreground">
                    Order Quantity
                  </h3>
                  <span className="text-xs font-sans text-muted-foreground font-medium tabular-nums">
                    MOQ: {moq} pcs • Step: {moq} pcs
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center border border-border rounded-xl bg-card shadow-2xs">
                      <button 
                        type="button" 
                        onClick={handleDecrement}
                        disabled={quantity <= moq && !isFullStock}
                        className="w-10 h-10 flex items-center justify-center text-foreground font-bold text-base hover:bg-secondary rounded-l-xl cursor-pointer transition-colors select-none disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Decrease quantity"
                        title={quantity <= moq ? `Minimum order quantity is ${moq} pcs` : undefined}
                      >
                        −
                      </button>
                      <div className="w-20 sm:w-24 text-center font-bold text-sm select-none tabular-nums font-sans">
                        {quantity.toLocaleString()}
                      </div>
                      <button 
                        type="button" 
                        onClick={handleIncrement}
                        disabled={isFullStock || (totalStock > 0 && quantity >= totalStock)}
                        className="w-10 h-10 flex items-center justify-center text-foreground font-bold text-base hover:bg-secondary rounded-r-xl cursor-pointer transition-colors select-none disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Increase quantity"
                        title={isFullStock || (totalStock > 0 && quantity >= totalStock) ? `Maximum available stock is ${totalStock.toLocaleString()} pcs` : undefined}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm text-muted-foreground font-medium">pcs</span>
                  </div>

                  {/* Estimated Total */}
                  <div className="text-right">
                    <span className="text-xs uppercase font-semibold text-muted-foreground block tracking-wider">
                      Est. Total
                    </span>
                    <span className="text-2xl font-bold text-foreground font-sans tabular-nums block leading-tight">
                      {formatPrice(currentPrice * quantity)}
                    </span>
                    <span className="text-[11px] text-muted-foreground block tabular-nums">
                      ({quantity.toLocaleString()} pcs × {formatPrice(currentPrice)} / pc)
                    </span>
                  </div>
                </div>

                {isBelowMoq && (
                  <div className="text-xs font-sans font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pt-1">
                    <AlertCircle size={14} />
                    <span>Minimum order quantity is {moq} pcs.</span>
                  </div>
                )}
              </div>

              {/* 3. INCLUDED COLORS & INCLUDED SIZES (Display-only) */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-display font-bold uppercase tracking-wider text-muted-foreground block">
                    Included Colors
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {colorsList.map((color, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary/70 text-foreground border border-border/50"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: getColorHex(color) }}
                        />
                        <span>{color}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-display font-bold uppercase tracking-wider text-muted-foreground block">
                    Included Sizes
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {sizesList.map((size, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold bg-secondary/70 text-foreground border border-border/50"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. PACKAGE BREAKDOWN MATRIX TABLE */}
              {matrixData && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-display font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      <Package size={14} className="text-foreground/70" />
                      <span>
                        {isFullStock 
                          ? `Full Stock — ${matrixData.grandTotal.toLocaleString()} pcs` 
                          : `Package Breakdown — ${quantity.toLocaleString()} pcs`}
                      </span>
                    </h3>
                    <span className="text-[11px] font-sans font-bold text-foreground px-2.5 py-0.5 bg-secondary rounded-full uppercase tracking-wider tabular-nums border border-border/60">
                      Total: {matrixData.grandTotal.toLocaleString()} pcs
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-border/70 rounded-xl bg-card">
                    <table className="w-full text-xs text-left min-w-[300px] font-sans">
                      <thead className="bg-secondary/60 text-[11px] uppercase tracking-wider text-muted-foreground border-b border-border/60">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Color</th>
                          {matrixData.sizes.map(s => (
                            <th key={s} className="px-3 py-2 font-semibold text-center">{s}</th>
                          ))}
                          <th className="px-3 py-2 font-bold text-right text-foreground">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {matrixData.colors.map(color => (
                          <tr key={color} className="hover:bg-secondary/20">
                            <td className="px-3 py-2 font-medium text-foreground flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full border border-black/10 shrink-0"
                                style={{ backgroundColor: getColorHex(color) }}
                              />
                              <span>{color}</span>
                            </td>
                            {matrixData.sizes.map(size => (
                              <td key={size} className="px-3 py-2 text-center text-muted-foreground tabular-nums">
                                {matrixData.cellMap[color]?.[size] || 0}
                              </td>
                            ))}
                            <td className="px-3 py-2 font-bold text-right text-foreground tabular-nums">
                              {matrixData.rowTotals[color] || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-secondary/40 border-t border-border font-bold text-foreground">
                        <tr>
                          <td className="px-3 py-2 uppercase text-[10px]">TOTAL</td>
                          {matrixData.sizes.map(size => (
                            <td key={size} className="px-3 py-2 text-center tabular-nums">
                              {matrixData.colTotals[size] || 0}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right text-foreground font-bold tabular-nums">
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
            {/* GROUP 3: PURCHASE ACTIONS (ADD TO CART, WISHLIST, WHATSAPP) */}
            {/* ========================================================= */}
            <div className="space-y-3 pt-1 font-sans">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full flex-1 py-4 rounded-xl bg-foreground text-background font-sans font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-all duration-150 cursor-pointer shadow-sm active:scale-[0.99] flex items-center justify-center gap-2.5"
                >
                  <ShoppingCart size={18} />
                  <span>Add to Cart</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (product) {
                      toggleWishlist(toStorefrontProduct(product));
                    }
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                    product && isInWishlist(product.id)
                      ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/30 dark:border-rose-800"
                      : "border-border/80 text-foreground hover:bg-secondary"
                  }`}
                  title={product && isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                  aria-label="Toggle wishlist"
                >
                  <Heart size={18} className={product && isInWishlist(product.id) ? "fill-current text-rose-600" : ""} />
                </button>
              </div>

              {/* Direct WhatsApp Product Inquiry CTA — NO phone number visible in CTA */}
              {product && (
                <a
                  href={getWhatsAppUrl(`Hello ${BUSINESS_PROFILE.name},\n\nI am interested in:\nProduct: ${product.name}\nSKU: ${product.sku}\nQuantity: ${quantity} pcs`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] font-sans font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <MessageCircle size={16} />
                  <span>Inquire on WhatsApp</span>
                </a>
              )}

              {/* Instant B2B Commercial Offer Sheet Download (Zero Shipping Details) */}
              {product && (
                <button
                  type="button"
                  onClick={() => {
                    const activeProfile = product.shippingPackageProfiles?.[0];
                    downloadProductOfferSheetPDF(
                      {
                        name: product.name,
                        sku: product.sku,
                        brand: product.brand,
                        category: product.categoryName || product.categoryId,
                        audience: product.audience,
                        price: currentPrice || product.wholesalePrice,
                        msrpPrice: product.msrpPrice,
                        moq: product.moq,
                        fabric: product.material,
                        gsm: 180,
                        composition: product.material,
                        sizes: sizesList,
                        color: colorsList,
                        imageUrl: product.images?.[0] || selectedImage,
                        packageBreakdown: product.packageAllocations,
                        cartonDimensions: activeProfile
                          ? {
                              length: activeProfile.carton_length || 60,
                              width: activeProfile.carton_width || 40,
                              height: activeProfile.carton_height || 35,
                              unit: "cm",
                            }
                          : { length: 60, width: 40, height: 35, unit: "cm" },
                        grossWeight: activeProfile?.gross_weight || (quantity * 0.35).toFixed(1),
                        netWeight: activeProfile?.net_weight ?? undefined,
                        cbm: (activeProfile as any)?.cbm ?? undefined,
                        pricingTiers: product.pricingTiers,
                      },
                      user ? { name: user.name, company: user.company_name, email: user.email, country: (user as any)?.country } : undefined,
                      quantity
                    );
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-border/80 bg-card hover:bg-secondary text-foreground font-sans font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <FileText size={15} className="text-primary" />
                  <span>Download Offer Sheet (PDF)</span>
                </button>
              )}
            </div>

          </div>

        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="pt-12 border-t border-border space-y-6">
            <h2 className="text-xl font-display font-bold uppercase tracking-tight text-foreground">
              More from {product.brand}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
