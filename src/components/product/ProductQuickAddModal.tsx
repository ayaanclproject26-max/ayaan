"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Minus, Plus, ShoppingBag, Check, Share2, Copy, MessageCircle, Phone } from "lucide-react";
import { useProductModal } from "@/lib/ProductModalContext";
import { useCart } from "@/lib/CartContext";

export default function ProductQuickAddModal() {
  const { selectedProduct: product, closeProductModal } = useProductModal();
  const { addToCart, setIsCartOpen } = useCart();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const moq = product?.moq ?? 1;
  const step = product?.quantityStep ?? moq;
  const stock = product?.availableStock ?? 9999;

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setActiveImageIndex(0);
      setQuantity(moq);
      setAddedSuccess(false);
    }
  }, [product, moq]);

  // Escape key closes modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeProductModal();
    };
    if (product) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
    }
  }, [product, closeProductModal]);

  const decreaseQty = useCallback(() => {
    setQuantity((prev) => Math.max(moq, prev - step));
  }, [moq, step]);

  const increaseQty = useCallback(() => {
    setQuantity((prev) => Math.min(stock, prev + step));
  }, [stock, step]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;
    // Use first available size
    const size = product.sizes?.[0] ?? "One Size";
    addToCart(product, size, quantity);
    setAddedSuccess(true);
    setTimeout(() => {
      closeProductModal();
      setIsCartOpen(true);
    }, 800);
  }, [product, quantity, addToCart, closeProductModal, setIsCartOpen]);

  const productUrl = typeof window !== "undefined" && product
    ? `${window.location.origin}/product/${product.slug}`
    : "";

  const handleShareWhatsApp = useCallback(() => {
    if (!product) return;
    const text = `Check out ${product.name} — ${productUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }, [product, productUrl]);

  const handleCopyLink = useCallback(async () => {
    if (!productUrl) return;
    try {
      await navigator.clipboard.writeText(productUrl);
      alert("Link copied to clipboard!");
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = productUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      alert("Link copied to clipboard!");
    }
  }, [productUrl]);

  const handleSendToAYC = useCallback(() => {
    if (!product) return;
    const text = `Hi AYC, I'm interested in:\n\nProduct: ${product.name}\nSKU: ${product.sku ?? "N/A"}\nQuantity: ${quantity} pcs\n\n${productUrl}`;
    window.open(`https://wa.me/8801XXXXXXXXX?text=${encodeURIComponent(text)}`, "_blank");
  }, [product, quantity, productUrl]);

  if (!product) return null;

  const isVisible = !!product;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-ink/60 backdrop-blur-sm z-[200] transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeProductModal}
      />

      {/* Modal */}
      <div
        className={`fixed inset-0 z-[210] flex items-center justify-center p-3 sm:p-6 transition-all duration-300 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
        onClick={closeProductModal}
      >
        <div
          className="bg-background w-full max-w-4xl max-h-[95vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ─── Header ─── */}
          <div className="flex items-start justify-between px-5 sm:px-8 pt-5 sm:pt-6 pb-3 sm:pb-4 border-b border-border/60">
            <div className="min-w-0 mr-4">
              <h2 className="text-lg sm:text-xl font-display font-semibold text-foreground tracking-tight truncate">
                {product.name}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-mono tracking-wider mt-0.5">
                {product.sku ?? "—"}
              </p>
            </div>
            <button
              onClick={closeProductModal}
              className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close product modal"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* ─── Scrollable Content ─── */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
            {/* Desktop: two-column | Mobile: single-column */}
            <div className="flex flex-col md:flex-row">
              {/* ═══ LEFT: Image Gallery ═══ */}
              <div className="md:w-[45%] md:shrink-0 p-4 sm:p-6">
                {/* Primary Image */}
                <div className="relative aspect-[3/4] bg-secondary rounded-xl overflow-hidden mb-3">
                  <img
                    src={product.images[activeImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                  {/* Stock Badge */}
                  <span className="absolute top-3 left-3 bg-emerald-600/90 text-white text-[0.625rem] font-bold uppercase py-1 px-2.5 tracking-widest rounded-md backdrop-blur-sm">
                    In Stock
                  </span>
                </div>
                {/* Thumbnails */}
                {product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar">
                    {product.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImageIndex(i)}
                        className={`shrink-0 w-16 h-20 sm:w-[72px] sm:h-[90px] rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          i === activeImageIndex
                            ? "border-foreground/80 ring-1 ring-foreground/20"
                            : "border-border/50 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt={`${product.name} view ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ═══ RIGHT: Product Info + Order Config ═══ */}
              <div className="md:w-[55%] p-4 sm:p-6 md:pl-0 flex flex-col gap-5">
                {/* Product Info Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 sm:p-5 bg-secondary/50 rounded-xl border border-border/40">
                  <InfoItem label="SKU" value={product.sku ?? "—"} mono />
                  <InfoItem label="MOQ" value={`${moq} pcs`} />
                  <InfoItem label="Available Stock" value={`${stock} pcs`} />
                  <InfoItem label="Brand" value={product.brand ?? "—"} />
                  <InfoItem label="Colours" value={`${product.colours ?? 1}`} />
                  <InfoItem label="Sizes" value={product.sizes?.join(", ") ?? "—"} />
                </div>

                {/* ─── Order Configuration Card ─── */}
                <div className="bg-background border border-border/60 rounded-xl p-4 sm:p-5 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    Order Configuration
                  </h3>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-xs text-muted-foreground">
                      <span className="block font-semibold text-foreground text-sm">{moq} pcs</span>
                      Min. Order Qty
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="block font-semibold text-foreground text-sm">{stock} pcs</span>
                      Available Stock
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="block font-semibold text-foreground text-sm">{product.sizes?.join(", ") ?? "—"}</span>
                      Sizes
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <span className="block font-semibold text-foreground text-sm">{product.colours ?? 1}</span>
                      Colours
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div className="mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                      Requested Quantity
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-border rounded-xl h-12 bg-secondary/30">
                        <button
                          onClick={decreaseQty}
                          disabled={quantity <= moq}
                          className="w-12 h-full flex items-center justify-center hover:bg-secondary rounded-l-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={16} strokeWidth={2} />
                        </button>
                        <span className="w-16 text-center text-base font-bold tabular-nums">
                          {quantity}
                        </span>
                        <button
                          onClick={increaseQty}
                          disabled={quantity >= stock}
                          className="w-12 h-full flex items-center justify-center hover:bg-secondary rounded-r-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label="Increase quantity"
                        >
                          <Plus size={16} strokeWidth={2} />
                        </button>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">pcs</span>
                    </div>
                    <p className="text-[0.6875rem] text-muted-foreground mt-2">
                      Quantity changes in multiples of {step}
                    </p>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={addedSuccess}
                    className={`w-full mt-4 h-12 sm:h-[3.25rem] rounded-xl text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all duration-300 press-feedback focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      addedSuccess
                        ? "bg-emerald-600 text-white cursor-default"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {addedSuccess ? (
                      <>
                        <Check size={18} strokeWidth={2.5} />
                        Added to Cart
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={18} strokeWidth={1.5} />
                        Add to Cart
                      </>
                    )}
                  </button>
                </div>

                {/* ─── Share Product ─── */}
                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <Share2 size={14} />
                    Share Product
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleShareWhatsApp}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] text-xs font-semibold uppercase tracking-wider hover:bg-[#25D366]/20 transition-colors press-feedback focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <MessageCircle size={15} />
                      WhatsApp
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-foreground text-xs font-semibold uppercase tracking-wider hover:bg-secondary/80 transition-colors press-feedback focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Copy size={15} />
                      Copy Link
                    </button>
                    <button
                      onClick={handleSendToAYC}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366]/10 text-[#25D366] text-xs font-semibold uppercase tracking-wider hover:bg-[#25D366]/20 transition-colors press-feedback focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Phone size={15} />
                      Send to AYC
                    </button>
                  </div>
                  <p className="text-[0.6875rem] text-muted-foreground mt-2.5 font-mono break-all">
                    {productUrl}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Mobile bottom close ─── */}
          <div className="md:hidden border-t border-border/60 p-4">
            <button
              onClick={closeProductModal}
              className="w-full py-3 rounded-xl border border-border text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:bg-secondary transition-colors press-feedback focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Small helper component ─── */
function InfoItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[0.6875rem] text-muted-foreground uppercase tracking-wider font-medium">{label}</dt>
      <dd className={`text-sm font-semibold text-foreground mt-0.5 ${mono ? "font-mono tracking-wider" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
