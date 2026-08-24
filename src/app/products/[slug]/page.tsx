"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProductBySlugOrId, getProducts } from "@/lib/services/products";
import { useRfq } from "@/lib/RfqContext";
import { useCart } from "@/lib/CartContext";
import { B2BProductInput } from "@/types/b2b";
import ProductCard from "@/components/product/ProductCard";
import { 
  FileText, 
  ShoppingCart, 
  Check, 
  ShieldCheck, 
  Truck, 
  Sparkles, 
  AlertCircle, 
  ArrowLeft, 
  Video, 
  Globe2,
  Package,
  Share2
} from "lucide-react";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { addToRfq } = useRfq();
  const { addToCart, setIsCartOpen } = useCart();

  const [product, setProduct] = useState<B2BProductInput | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<B2BProductInput[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(50);
  const [showVideo, setShowVideo] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  useEffect(() => {
    async function load() {
      const p = await getProductBySlugOrId(slug);
      if (p) {
        setProduct(p);
        setSelectedImage(p.images[0] || "/placeholder.jpg");
        setSelectedSize(p.sizes?.[0] || "M");
        setSelectedColor(p.colors?.[0] || p.colorName || "Black");
        setQuantity(p.moq || 50);

        // Load related products from same brand or category
        const all = await getProducts({ brand: p.brand });
        setRelatedProducts(all.filter((item) => item.id !== p.id).slice(0, 5));
      }
      setLoading(false);
    }
    load();
  }, [slug]);

  const handleAddToRfq = () => {
    if (!product) return;
    addToRfq(product as any, quantity, {
      color: selectedColor,
      size: selectedSize,
    });
    setFeedbackMsg("Added to your RFQ cart!");
    setTimeout(() => {
      router.push("/rfq");
    }, 400);
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        categoryId: product.categoryId || "c_tops",
        price: product.wholesalePrice,
        oldPrice: product.msrpPrice,
        images: product.images,
        badge: product.isHot ? "Hot" : undefined,
        sizes: product.sizes || ["S", "M", "L"],
        color: selectedColor,
        isNew: product.isNew,
      } as any,
      selectedSize,
      quantity
    );
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
        <h2 className="text-xl font-bold uppercase">Product Not Found</h2>
        <Link href="/search" className="text-primary hover:underline mt-2 inline-block text-xs font-bold uppercase">
          ← Back to Catalog
        </Link>
      </div>
    );
  }

  const isBelowMoq = quantity < (product.moq || 1);

  return (
    <div className="w-full bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Link href="/search" className="hover:text-foreground">Catalog</Link>
          <span>/</span>
          <Link href={`/search?brand=${encodeURIComponent(product.brand)}`} className="hover:text-foreground">
            {product.brand}
          </Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-xs">{product.name}</span>
        </div>

        {feedbackMsg && (
          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center gap-2">
            <Check size={16} />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* MAIN PRODUCT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT: IMAGE GALLERY (6 Cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-secondary border border-border/80 shadow-md group">
              {showVideo && product.videoUrl ? (
                <iframe
                  src={product.videoUrl}
                  title={product.name}
                  className="w-full h-full object-cover"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                />
              )}

              {product.isHot && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500 text-white shadow-md">
                  Hot Sale
                </span>
              )}
            </div>

            {/* Thumbnail Switcher */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedImage(img);
                    setShowVideo(false);
                  }}
                  className={`w-16 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    selectedImage === img && !showVideo ? "border-primary ring-2 ring-primary/20" : "border-border opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}

              {product.videoUrl && (
                <button
                  type="button"
                  onClick={() => setShowVideo(true)}
                  className={`w-16 h-20 rounded-xl overflow-hidden border-2 shrink-0 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    showVideo ? "border-primary bg-primary/10" : "border-border bg-secondary opacity-70 hover:opacity-100"
                  }`}
                >
                  <Video size={18} className="text-primary" />
                  <span className="text-[9px] font-bold uppercase">Video</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: SPECS, WHOLESALE PRICING & QUOTE ACTION (6 Cols) */}
          <div className="lg:col-span-6 space-y-6">
            
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                  {product.brand}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  SKU: {product.sku}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
                {product.name}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Audience: {product.audience} • Category: {product.categoryName || "Apparel"} • Season: {product.collectionSeason || "2026 Core"}
              </p>
            </div>

            {/* Wholesale Pricing Tiers */}
            <div className="p-5 rounded-2xl bg-secondary/40 border border-border/70 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Wholesale Export Pricing (B2B)
              </span>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-display font-bold text-foreground">
                  ${product.wholesalePrice.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-muted-foreground">/ pc</span>
                {product.msrpPrice && (
                  <span className="text-xs text-muted-foreground line-through ml-2">
                    MSRP: ${product.msrpPrice.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground pt-2 border-t border-border/50">
                <span>MOQ: <strong className="text-foreground">{product.moq} pcs</strong></span>
                <span>•</span>
                <span>Available Stock: <strong className="text-foreground">{product.stock.toLocaleString()} pcs</strong></span>
              </div>
            </div>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Color: <span className="text-primary">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedColor === c
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card text-foreground hover:bg-secondary"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Size: <span className="text-primary">{selectedSize}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedSize === s
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-card text-foreground hover:bg-secondary"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector & MOQ Notice */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                Order Quantity
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-32 px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground font-bold text-sm focus:ring-1 focus:ring-primary outline-none"
                />
                <span className="text-xs text-muted-foreground font-semibold">pcs</span>

                {isBelowMoq && (
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle size={14} />
                    Minimum order is {product.moq} pcs
                  </span>
                )}
              </div>
            </div>

            {/* CTA BUTTONS: REQUEST A QUOTE & ADD TO CART */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleAddToRfq}
                className="w-full sm:flex-1 py-4 rounded-full bg-foreground text-background font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-all duration-150 cursor-pointer shadow-md active:scale-95 flex items-center justify-center gap-2 font-display"
              >
                <FileText size={16} />
                <span>Request a Quote (RFQ)</span>
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full sm:w-auto px-6 py-4 rounded-full border border-border text-foreground hover:bg-secondary font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingCart size={15} />
                <span>Sample Order</span>
              </button>
            </div>

            {/* Commercial Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Globe2 size={16} className="text-primary shrink-0" />
                <span>Export to 140+ countries</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary shrink-0" />
                <span>ISO & OEKO-TEX certified</span>
              </div>
            </div>

            {/* Specifications & Description */}
            <div className="pt-6 border-t border-border space-y-3 text-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Technical Specifications & Material
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description || "Premium export grade garment manufactured with high-density spinning and refined finishing for international wholesale standards."}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                <div>
                  <span className="font-bold text-foreground">Material:</span> {product.material || "100% Combed Cotton"}
                </div>
                <div>
                  <span className="font-bold text-foreground">Fabric Weight:</span> {product.weightGrams}g / m²
                </div>
              </div>
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
                  product={{
                    id: rp.id,
                    name: rp.name,
                    slug: rp.slug,
                    brand: rp.brand,
                    categoryId: rp.categoryId || "c_tops",
                    price: rp.wholesalePrice,
                    oldPrice: rp.msrpPrice,
                    images: rp.images || ["/placeholder.jpg"],
                    sizes: rp.sizes || ["S", "M", "L"],
                    color: rp.colorName,
                    isHot: rp.isHot,
                    isNew: rp.isNew,
                  }}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
