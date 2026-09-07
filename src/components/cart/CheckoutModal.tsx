"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import { createOrder } from "@/lib/services/orders";
import { uploadPaymentProof } from "@/lib/services/storage";
import { shippingService, ShippingQuoteOption, ShipmentSpecs } from "@/services/shipping.service";
import { getWhatsAppUrl } from "@/config/business-profile";
import { formatPrice } from "@/lib/formatters";
import {
  X,
  CreditCard,
  Building2,
  Truck,
  FileText,
  CheckCircle2,
  AlertCircle,
  Upload,
  ShieldCheck,
  ArrowRight,
  Plane,
  MessageCircle,
  Box,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Shipping mode: "aramex" = air quote from Aramex API, "manual" = discuss shipping directly */
type ShippingMode = "aramex" | "manual";

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();

  const [shippingName, setShippingName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "transfer" | "cod" | "net_30">("card");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Shipping Mode State ────────────────────────────────────────────────────
  // Two explicit customer choices:
  //   "aramex"  → Auto-quoted Aramex air freight, added to PI total
  //   "manual"  → Discuss shipping directly; no quote, no API call, excluded from PI
  const [shippingMode, setShippingMode] = useState<ShippingMode>("aramex");

  // Aramex quote state (only populated when shippingMode === "aramex")
  const [aramexQuote, setAramexQuote] = useState<ShippingQuoteOption | null>(null);
  const [shipmentSpecs, setShipmentSpecs] = useState<ShipmentSpecs | null>(null);
  const [aramexLoading, setAramexLoading] = useState(false);
  const [aramexError, setAramexError] = useState<string | null>(null);
  const [showSpecsDetails, setShowSpecsDetails] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Prefill user information when modal opens
  useEffect(() => {
    if (user) {
      if (!shippingName && user.name) setShippingName(user.name);
      if (!email && user.email) setEmail(user.email);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user, isOpen]);

  // Fetch Aramex quote — only when shippingMode is "aramex"
  const fetchAramexQuote = useCallback(async () => {
    if (shippingMode !== "aramex") return;
    if (!country || items.length === 0) return;
    if (!city.trim() && !postalCode.trim()) return;

    setAramexLoading(true);
    setAramexError(null);

    try {
      const response = await shippingService.getShippingQuotes({
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
        country_code: country,
        city: city.trim() || undefined,
        postal_code: postalCode.trim() || undefined,
        address1: address.trim() || undefined,
        // Only request air quotes — sea is not an offered customer option
        shipping_mode: "air",
      });

      if (response && response.quotes && response.quotes.length > 0) {
        setShipmentSpecs(response.shipment_specs);
        const airQuote = response.quotes.find((q) => q.mode === "air" && q.is_available);
        if (airQuote) {
          setAramexQuote(airQuote);
        } else {
          setAramexQuote(null);
          setAramexError("Unable to calculate Aramex shipping for this destination. Select 'Discuss Shipping Directly' or try again.");
        }
      } else {
        setAramexError("Unable to calculate Aramex shipping right now. Please try again or select 'Discuss Shipping Directly'.");
      }
    } catch (err: any) {
      setAramexError(err?.message || "Aramex shipping quote unavailable. Try again or select 'Discuss Shipping Directly'.");
      setAramexQuote(null);
    } finally {
      setAramexLoading(false);
    }
  }, [shippingMode, items, country, city, postalCode, address]);

  // Trigger Aramex quote refresh when destination, mode, or items change (debounced)
  useEffect(() => {
    if (!isOpen) return;
    if (shippingMode !== "aramex") return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      fetchAramexQuote();
    }, 350);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [isOpen, shippingMode, country, city, postalCode, items, fetchAramexQuote]);

  if (!isOpen) return null;

  // ── Derived financial totals ───────────────────────────────────────────────
  // Aramex: shipping charge is included in the PI total.
  // Manual: shipping charge is NOT included; to be confirmed separately.
  const aramexShippingCost = shippingMode === "aramex" && aramexQuote ? (aramexQuote.amount || 0) : 0;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + aramexShippingCost + tax;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!shippingName.trim() || !email.trim() || !address.trim() || !city.trim() || !postalCode.trim()) {
      setError("Please complete all shipping address fields.");
      return;
    }

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    // For Aramex: require a valid quote before placing the order
    if (shippingMode === "aramex" && !aramexQuote) {
      setError("Aramex shipping quote is required. Please wait for the quote to load, or select 'Discuss Shipping Directly'.");
      return;
    }

    setLoading(true);

    try {
      const userId = user?.id || `guest_${Date.now()}`;

      // Build shipping snapshot based on mode
      const shippingSnapshot =
        shippingMode === "aramex" && aramexQuote
          ? {
              provider: "aramex",
              mode: "air",
              shipping_method: aramexQuote.service_name,
              carrier: aramexQuote.carrier,
              quoted_shipping_charge: aramexQuote.amount,
              currency: "USD",
              package_quantity: shipmentSpecs?.package_quantity || items.reduce((s, i) => s + i.quantity, 0),
              carton_count: aramexQuote.carton_count || shipmentSpecs?.carton_count || 1,
              carton_dimensions: shipmentSpecs?.carton_dimensions,
              gross_weight: aramexQuote.gross_weight || shipmentSpecs?.gross_weight || 10.0,
              net_weight: shipmentSpecs?.net_weight,
              weight_unit: "kg",
              cbm: aramexQuote.cbm || shipmentSpecs?.cbm || 0.072,
              total_cbm: shipmentSpecs?.total_cbm || 0.072,
              chargeable_weight: aramexQuote.chargeable_weight,
              quote_reference_id: aramexQuote.quote_id,
              quoted_at: aramexQuote.quoted_at,
              is_provisional: Boolean(aramexQuote.is_provisional),
              port_of_loading: "Hazrat Shahjalal International Airport (DAC), Dhaka",
              notes: aramexQuote.notes,
            }
          : {
              // Manual shipping — no quote, to be discussed
              provider: "manual",
              mode: "manual",
              shipping_method: "Discuss Shipping Directly",
              carrier: null,
              quoted_shipping_charge: null, // explicitly null — not $0
              currency: "USD",
              notes: "Shipping to be confirmed directly with AYAAN CLOTHING team.",
            };

      const newOrder = await createOrder({
        userId,
        email: email.trim(),
        shippingName: shippingName.trim(),
        shippingPhone: phone.trim(),
        shippingAddress: address.trim(),
        shippingCity: city.trim(),
        shippingPostalCode: postalCode.trim(),
        shippingCountryCode: country,
        shippingMethod: shippingMode === "aramex" ? (aramexQuote?.service_name || "Aramex Priority Air Express") : "Manual — Discuss Shipping Directly",
        carrier: shippingMode === "aramex" ? (aramexQuote?.carrier || "Aramex Express Air") : undefined,
        shippingCost: shippingMode === "aramex" ? aramexShippingCost : 0, // 0 for manual = "not quoted", not "free"
        shippingQuoteId: shippingMode === "aramex" ? aramexQuote?.quote_id : undefined,
        shippingSnapshot,
        paymentMethod,
        items: items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          productSlug: item.product.slug,
          productImage: item.product.images[0],
          sku: item.product.sku,
          variantTitle: item.size && item.size !== "Assorted" ? `Size: ${item.size}` : "Assorted Package",
          unitPrice: item.unitPrice || item.product.price,
          quantity: item.quantity,
          packageBreakdown: item.packageBreakdown,
        })),
      });

      // If user uploaded payment receipt
      if (paymentProofFile && newOrder?.id) {
        try {
          await uploadPaymentProof(paymentProofFile, newOrder.id);
        } catch (uploadErr) {
          console.warn("Payment upload notice:", uploadErr);
        }
      }

      clearCart();
      onClose();

      if (user) {
        router.push(`/profile/orders/${newOrder.id}`);
      } else {
        router.push(`/login`);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const totalItemQuantity = items.reduce((s, i) => s + i.quantity, 0);

  // WhatsApp message for manual shipping inquiry
  const manualShippingWhatsAppMsg = `Hello AYAAN CLOTHING,\n\nI would like to discuss shipping options for my order.\n\nItems: ${totalItemQuantity} pcs\nMerchandise value: $${subtotal.toFixed(2)} USD\nDestination: ${city || "—"}, ${country}\n\nPlease advise on shipping arrangements.`;

  return (
    <>
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-xs z-[220] animate-in fade-in"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[230] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div
          className="bg-card border border-border/80 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h2 className="text-xl font-bold font-display text-foreground">
                Secure Checkout
              </h2>
              <p className="text-xs text-muted-foreground">
                Destination, shipping arrangement, and payment details
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handlePlaceOrder} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Shipping Destination */}
            <div>
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
                <Truck size={16} className="text-primary" />
                <span>1. Shipping Destination</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-body">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingName}
                    onChange={(e) => setShippingName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="buyer@example.com"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Phone / Mobile *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555 0192"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Destination Country *
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-secondary/30 text-foreground font-bold focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="US">United States (US)</option>
                    <option value="GB">United Kingdom (GB)</option>
                    <option value="DE">Germany (DE)</option>
                    <option value="FR">France (FR)</option>
                    <option value="CA">Canada (CA)</option>
                    <option value="AU">Australia (AU)</option>
                    <option value="AE">United Arab Emirates (AE)</option>
                    <option value="SA">Saudi Arabia (SA)</option>
                    <option value="NL">Netherlands (NL)</option>
                    <option value="IT">Italy (IT)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Fashion Ave, Suite 400"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="New York"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Postal / Zip Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="10001"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-secondary/30 text-foreground font-mono focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Shipping Selection — Two explicit paths */}
            <div>
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
                <Truck size={16} className="text-primary" />
                <span>2. Shipping Arrangement</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ── OPTION A: AIR — ARAMEX ─────────────────────────────── */}
                <button
                  type="button"
                  onClick={() => {
                    setShippingMode("aramex");
                    // Trigger quote fetch if not yet available
                  }}
                  className={`p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all cursor-pointer relative ${
                    shippingMode === "aramex"
                      ? "border-primary bg-primary/5 text-foreground shadow-xs ring-1 ring-primary"
                      : "border-border bg-card hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${shippingMode === "aramex" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "bg-secondary text-muted-foreground"}`}>
                        <Plane size={16} />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-foreground uppercase block tracking-wide">
                          ✈ Air — Aramex
                        </span>
                        <span className="text-[10px] text-muted-foreground block font-medium">
                          Priority Air Express · 3–5 business days
                        </span>
                      </div>
                    </div>
                    {shippingMode === "aramex" && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                  </div>

                  {/* Aramex quote display */}
                  <div className="pt-2 border-t border-border/50">
                    {shippingMode === "aramex" && aramexLoading ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-primary font-semibold">
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Calculating Aramex shipping…</span>
                      </div>
                    ) : shippingMode === "aramex" && aramexError ? (
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-destructive flex items-center gap-1">
                          <AlertCircle size={11} className="shrink-0" />
                          <span>Unable to calculate Aramex shipping right now.</span>
                        </p>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); fetchAramexQuote(); }}
                          className="text-[10px] text-primary underline font-semibold cursor-pointer"
                        >
                          Retry Quote
                        </button>
                      </div>
                    ) : aramexQuote ? (
                      <div className="flex items-baseline justify-between">
                        <span className="text-[10px] text-muted-foreground">
                          {aramexQuote.is_provisional ? "Estimated Freight" : "Carrier Quoted"}
                        </span>
                        <span className="font-black text-sm text-foreground">
                          ${(aramexQuote.amount || 0).toFixed(2)} USD
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        Enter city and postal code to calculate rate.
                      </p>
                    )}
                  </div>
                </button>

                {/* ── OPTION B: DISCUSS SHIPPING DIRECTLY ─────────────────── */}
                <button
                  type="button"
                  onClick={() => {
                    setShippingMode("manual");
                    // Clear any Aramex state — no quote applies
                  }}
                  className={`p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all cursor-pointer relative ${
                    shippingMode === "manual"
                      ? "border-primary bg-primary/5 text-foreground shadow-xs ring-1 ring-primary"
                      : "border-border bg-card hover:border-primary/50 text-muted-foreground"
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${shippingMode === "manual" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-secondary text-muted-foreground"}`}>
                        <MessageCircle size={16} />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-foreground uppercase block tracking-wide">
                          Discuss Shipping Directly
                        </span>
                        <span className="text-[10px] text-muted-foreground block font-medium">
                          Shipping confirmed separately with our team
                        </span>
                      </div>
                    </div>
                    {shippingMode === "manual" && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                  </div>

                  {/* Manual shipping info — no quote, no price */}
                  <div className="pt-2 border-t border-border/50 space-y-2">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Shipping charges are not included in your order total. Our team will confirm shipping arrangements with you directly.
                    </p>
                    {shippingMode === "manual" && (
                      <a
                        href={getWhatsAppUrl(manualShippingWhatsAppMsg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] text-[10px] font-bold uppercase tracking-wider hover:bg-[#25D366]/20 transition-colors"
                        aria-label="Inquire about shipping on WhatsApp"
                      >
                        <MessageCircle size={12} />
                        Inquire on WhatsApp
                      </a>
                    )}
                  </div>
                </button>
              </div>

              {/* Shipment specs summary badge (shown when Aramex quote is available) */}
              {shippingMode === "aramex" && shipmentSpecs && (
                <div className="mt-3 p-3 rounded-2xl bg-secondary/40 border border-border text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-foreground font-medium flex-wrap">
                      <Box size={14} className="text-primary shrink-0" />
                      <span><strong>{totalItemQuantity}</strong> pcs</span>
                      <span>•</span>
                      <span><strong>{shipmentSpecs.carton_count}</strong> cartons</span>
                      <span>•</span>
                      <span><strong>{shipmentSpecs.gross_weight}</strong> kg</span>
                      <span>•</span>
                      <span><strong>{shipmentSpecs.total_cbm}</strong> CBM</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSpecsDetails(!showSpecsDetails)}
                      className="text-[11px] text-primary hover:underline flex items-center gap-0.5 font-bold cursor-pointer shrink-0 ml-2"
                    >
                      <span>{showSpecsDetails ? "Hide" : "Details"}</span>
                      {showSpecsDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>
                  {showSpecsDetails && (
                    <div className="mt-2.5 pt-2.5 border-t border-border/60 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                      <div>Dimensions: <strong className="text-foreground">{shipmentSpecs.carton_dimensions.length}×{shipmentSpecs.carton_dimensions.width}×{shipmentSpecs.carton_dimensions.height} {shipmentSpecs.carton_dimensions.unit}</strong></div>
                      <div>Origin: <strong className="text-foreground">Dhaka EPZ, Bangladesh</strong></div>
                      <div>Destination: <strong className="text-foreground">{country} ({city || postalCode})</strong></div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Payment Method */}
            <div>
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
                <CreditCard size={16} className="text-primary" />
                <span>3. Payment Method</span>
              </h3>
              <div className={`grid grid-cols-1 ${user?.role === "b2b_buyer" ? "sm:grid-cols-4" : "sm:grid-cols-3"} gap-3 font-body`}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    paymentMethod === "card"
                      ? "border-primary bg-primary/5 text-foreground shadow-xs ring-1 ring-primary"
                      : "border-border hover:border-primary/40 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <CreditCard size={18} className={paymentMethod === "card" ? "text-primary" : "text-muted-foreground"} />
                    {paymentMethod === "card" && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                  <span className="font-bold text-xs text-foreground">Credit / Debit Card</span>
                  <span className="text-[10px] text-muted-foreground">Instant USD payment</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("transfer")}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    paymentMethod === "transfer"
                      ? "border-primary bg-primary/5 text-foreground shadow-xs ring-1 ring-primary"
                      : "border-border hover:border-primary/40 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Building2 size={18} className={paymentMethod === "transfer" ? "text-primary" : "text-muted-foreground"} />
                    {paymentMethod === "transfer" && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                  <span className="font-bold text-xs text-foreground">Bank Wire Transfer</span>
                  <span className="text-[10px] text-muted-foreground">SWIFT wire transfer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    paymentMethod === "cod"
                      ? "border-primary bg-primary/5 text-foreground shadow-xs ring-1 ring-primary"
                      : "border-border hover:border-primary/40 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Truck size={18} className={paymentMethod === "cod" ? "text-primary" : "text-muted-foreground"} />
                    {paymentMethod === "cod" && <CheckCircle2 size={14} className="text-primary" />}
                  </div>
                  <span className="font-bold text-xs text-foreground">Cash on Delivery</span>
                  <span className="text-[10px] text-muted-foreground">Pay on arrival</span>
                </button>

                {user?.role === "b2b_buyer" && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("net_30")}
                    className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      paymentMethod === "net_30"
                        ? "border-primary bg-primary/5 text-foreground shadow-xs ring-1 ring-primary"
                        : "border-border hover:border-primary/40 text-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <FileText size={18} className={paymentMethod === "net_30" ? "text-primary" : "text-muted-foreground"} />
                      {paymentMethod === "net_30" && <CheckCircle2 size={14} className="text-primary" />}
                    </div>
                    <span className="font-bold text-xs text-foreground">Net 30 Terms</span>
                    <span className="text-[10px] text-muted-foreground">B2B Trade Credit</span>
                  </button>
                )}
              </div>

              {/* Upload Payment Receipt for Bank Transfer */}
              {paymentMethod === "transfer" && (
                <div className="mt-3 p-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5">
                  <p className="text-xs font-semibold text-foreground mb-2">
                    Attach Payment Slip / Wire Transfer Document (Optional)
                  </p>
                  <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-card hover:bg-secondary cursor-pointer text-xs text-foreground transition-colors">
                    <Upload size={16} className="text-primary" />
                    <span>{paymentProofFile ? paymentProofFile.name : "Select Receipt Image or PDF"}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setPaymentProofFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="p-4 rounded-2xl bg-secondary/30 border border-border/80 space-y-2 text-sm font-body">
              <div className="flex justify-between text-muted-foreground">
                <span>Goods Value ({totalItemQuantity} pcs):</span>
                <span className="font-bold text-foreground">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span>Shipping:</span>
                  {shippingMode === "aramex" && (
                    <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded">
                      Aramex Air
                    </span>
                  )}
                </span>
                <span className="font-bold text-foreground">
                  {shippingMode === "manual" ? (
                    <span className="text-amber-600 dark:text-amber-400 text-xs">To be confirmed</span>
                  ) : aramexLoading ? (
                    <span className="text-muted-foreground text-xs">Calculating…</span>
                  ) : aramexQuote ? (
                    formatPrice(aramexShippingCost)
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Estimated Tax (5%):</span>
                <span className="font-bold text-foreground">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-foreground pt-2.5 border-t border-border">
                <span>
                  {shippingMode === "manual" ? "Merchandise Total (USD):" : "Grand Total (USD):"}
                </span>
                <span className="text-primary font-black">
                  {formatPrice(total)}
                  {shippingMode === "manual" && (
                    <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-semibold text-right">
                      + shipping (to be confirmed)
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
              <span>Orders backed by AYAAN CLOTHING buyer protection &amp; real-time order tracking</span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || (shippingMode === "aramex" && !aramexQuote)}
              className="w-full py-3.5 px-4 bg-primary text-primary-foreground font-bold rounded-2xl text-xs uppercase tracking-wider shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {shippingMode === "manual"
                      ? `Place Order — $${formatPrice(total)} Merchandise`
                      : `Place Order & Confirm ($${formatPrice(total)})`}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
