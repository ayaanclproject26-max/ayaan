"use client";

import { useState, useEffect } from "react";
import { 
  adminPromotionService, 
  PromotionRecord, 
  CouponRecord 
} from "@/services/admin";
import { 
  Percent, 
  Tag, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Calendar,
  Layers,
  Sparkles,
  RefreshCw
} from "lucide-react";

export default function AdminPromotionsPage() {
  const [activeTab, setActiveTab] = useState<"promotions" | "coupons">("promotions");
  
  // Promotions State
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [promoLoading, setPromoLoading] = useState(true);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromotionRecord | null>(null);

  // Promo Form
  const [promoTitle, setPromoTitle] = useState("");
  const [promoSubtitle, setPromoSubtitle] = useState("");
  const [promoType, setPromoType] = useState("hero_banner");
  const [promoImage, setPromoImage] = useState("");
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [promoBtnText, setPromoBtnText] = useState("");
  const [promoBtnTarget, setPromoBtnTarget] = useState("");
  const [promoActive, setPromoActive] = useState(true);
  const [promoSortOrder, setPromoSortOrder] = useState(0);

  // Coupons State
  const [coupons, setCoupons] = useState<CouponRecord[]>([]);
  const [couponLoading, setCouponLoading] = useState(true);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponRecord | null>(null);

  // Coupon Form
  const [couponCode, setCouponCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [minSpend, setMinSpend] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [couponActive, setCouponActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");

  const [feedback, setFeedback] = useState<string | null>(null);

  const loadPromotions = async () => {
    setPromoLoading(true);
    try {
      const data = await adminPromotionService.getPromotions();
      setPromotions(data);
    } catch (err) {
      console.error("Failed to load promotions:", err);
    } finally {
      setPromoLoading(false);
    }
  };

  const loadCoupons = async () => {
    setCouponLoading(true);
    try {
      const data = await adminPromotionService.getCoupons();
      setCoupons(data);
    } catch (err) {
      console.error("Failed to load coupons:", err);
    } finally {
      setCouponLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "promotions") {
      loadPromotions();
    } else {
      loadCoupons();
    }
  }, [activeTab]);

  // Handle Promo Save
  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoTitle.trim()) return;

    try {
      if (editingPromo) {
        await adminPromotionService.updatePromotion(editingPromo.id, {
          title: promoTitle.trim(),
          subtitle: promoSubtitle.trim() || undefined,
          type: promoType,
          image_url: promoImage.trim() || undefined,
          discount_percentage: promoDiscount ? Number(promoDiscount) : undefined,
          button_text: promoBtnText.trim() || undefined,
          button_target: promoBtnTarget.trim() || undefined,
          is_active: promoActive,
          sort_order: Number(promoSortOrder),
        });
        setFeedback(`Updated promotion: ${promoTitle}`);
      } else {
        await adminPromotionService.createPromotion({
          title: promoTitle.trim(),
          subtitle: promoSubtitle.trim() || undefined,
          type: promoType,
          image_url: promoImage.trim() || undefined,
          discount_percentage: promoDiscount ? Number(promoDiscount) : undefined,
          button_text: promoBtnText.trim() || undefined,
          button_target: promoBtnTarget.trim() || undefined,
          is_active: promoActive,
          sort_order: Number(promoSortOrder),
        });
        setFeedback(`Created promotion: ${promoTitle}`);
      }

      setIsPromoModalOpen(false);
      loadPromotions();
    } catch (err) {
      console.error("Failed to save promotion:", err);
    }
  };

  // Handle Coupon Save
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      if (editingCoupon) {
        await adminPromotionService.updateCoupon(editingCoupon.id, {
          code: couponCode.trim().toUpperCase(),
          discount_type: discountType,
          discount_value: Number(discountValue),
          min_spend: minSpend ? Number(minSpend) : undefined,
          usage_limit: usageLimit ? Number(usageLimit) : undefined,
          is_active: couponActive,
          expires_at: expiresAt || undefined,
        });
        setFeedback(`Updated coupon: ${couponCode.toUpperCase()}`);
      } else {
        await adminPromotionService.createCoupon({
          code: couponCode.trim().toUpperCase(),
          discount_type: discountType,
          discount_value: Number(discountValue),
          min_spend: minSpend ? Number(minSpend) : undefined,
          usage_limit: usageLimit ? Number(usageLimit) : undefined,
          is_active: couponActive,
          expires_at: expiresAt || undefined,
        });
        setFeedback(`Created coupon: ${couponCode.toUpperCase()}`);
      }

      setIsCouponModalOpen(false);
      loadCoupons();
    } catch (err) {
      console.error("Failed to save coupon:", err);
    }
  };

  const handleDeletePromo = async (id: number, title: string) => {
    if (!confirm(`Delete promotion "${title}"?`)) return;
    await adminPromotionService.deletePromotion(id);
    loadPromotions();
  };

  const handleDeleteCoupon = async (id: number, code: string) => {
    if (!confirm(`Delete coupon "${code}"?`)) return;
    await adminPromotionService.deleteCoupon(id);
    loadCoupons();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
            Promotions & Coupon Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Configure homepage marketing banners, seasonal discount campaigns, and promotional coupon vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "promotions" ? (
            <button
              type="button"
              onClick={() => {
                setEditingPromo(null);
                setPromoTitle("");
                setPromoSubtitle("");
                setPromoType("hero_banner");
                setPromoImage("");
                setPromoDiscount(0);
                setPromoBtnText("Explore Now");
                setPromoBtnTarget("/products");
                setPromoActive(true);
                setPromoSortOrder(0);
                setIsPromoModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Promotion Banner</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingCoupon(null);
                setCouponCode("");
                setDiscountType("percentage");
                setDiscountValue(10);
                setMinSpend(0);
                setUsageLimit(100);
                setCouponActive(true);
                setExpiresAt("");
                setIsCouponModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              <Plus size={15} />
              <span>Create Coupon Code</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="hover:underline">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-secondary/50 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("promotions")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === "promotions" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles size={14} />
          <span>Homepage Banners ({promotions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("coupons")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === "coupons" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Tag size={14} />
          <span>Discount Coupons ({coupons.length})</span>
        </button>
      </div>

      {/* Promotions Tab Content */}
      {activeTab === "promotions" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promoLoading ? (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Loading promotions...</span>
            </div>
          ) : promotions.length > 0 ? (
            promotions.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-3xl bg-card border border-border/70 shadow-xs flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider bg-secondary px-2.5 py-0.5 rounded-full text-foreground border border-border">
                      {p.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                      p.is_active ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                    }`}>
                      {p.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {p.image_url && (
                    <div className="h-32 rounded-2xl overflow-hidden bg-secondary border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <h3 className="font-bold text-sm text-foreground">{p.title}</h3>
                  {p.subtitle && <p className="text-xs text-muted-foreground line-clamp-2">{p.subtitle}</p>}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
                  <span className="text-muted-foreground text-xs">Order: #{p.sort_order}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPromo(p);
                        setPromoTitle(p.title);
                        setPromoSubtitle(p.subtitle || "");
                        setPromoType(p.type);
                        setPromoImage(p.image_url || "");
                        setPromoDiscount(p.discount_percentage || 0);
                        setPromoBtnText(p.button_text || "");
                        setPromoBtnTarget(p.button_target || "");
                        setPromoActive(p.is_active);
                        setPromoSortOrder(p.sort_order);
                        setIsPromoModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-secondary hover:bg-foreground hover:text-background text-foreground transition-colors"
                      title="Edit Promotion"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePromo(p.id, p.title)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      title="Delete Promotion"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-muted-foreground bg-card rounded-3xl border border-border">
              No promotions configured yet. Click Add Promotion Banner to create one.
            </div>
          )}
        </div>
      )}

      {/* Coupons Tab Content */}
      {activeTab === "coupons" && (
        <div className="bg-card border border-border/70 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-muted-foreground uppercase text-xs font-bold tracking-wider">
                  <th className="py-3 px-4">Coupon Code</th>
                  <th className="py-3 px-3">Discount</th>
                  <th className="py-3 px-3">Min Spend</th>
                  <th className="py-3 px-3">Usage</th>
                  <th className="py-3 px-3">Expires</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {couponLoading ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-muted-foreground">
                      <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span>Loading coupons...</span>
                    </td>
                  </tr>
                ) : coupons.length > 0 ? (
                  coupons.map((cp) => (
                    <tr key={cp.id} className="hover:bg-secondary/30 transition-colors font-medium">
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        {cp.code}
                      </td>

                      <td className="py-3 px-3 font-bold text-foreground">
                        {cp.discount_type === "percentage" ? `${cp.discount_value}% OFF` : `$${Number(cp.discount_value).toFixed(2)} OFF`}
                      </td>

                      <td className="py-3 px-3 text-muted-foreground">
                        {cp.min_spend ? `$${Number(cp.min_spend).toFixed(2)}` : "No Min"}
                      </td>

                      <td className="py-3 px-3 text-muted-foreground">
                        {cp.usage_count} / {cp.usage_limit || "∞"} uses
                      </td>

                      <td className="py-3 px-3 text-muted-foreground">
                        {cp.expires_at ? new Date(cp.expires_at).toLocaleDateString() : "Never"}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          cp.is_active ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"
                        }`}>
                          {cp.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCoupon(cp);
                              setCouponCode(cp.code);
                              setDiscountType(cp.discount_type);
                              setDiscountValue(cp.discount_value);
                              setMinSpend(cp.min_spend || 0);
                              setUsageLimit(cp.usage_limit || 100);
                              setCouponActive(cp.is_active);
                              setExpiresAt(cp.expires_at ? cp.expires_at.slice(0, 10) : "");
                              setIsCouponModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-secondary hover:bg-foreground hover:text-background text-foreground transition-colors"
                            title="Edit Coupon"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(cp.id, cp.code)}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete Coupon"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-muted-foreground">
                      No discount coupons found. Click Create Coupon Code to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Promo Modal */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base uppercase text-foreground">
                {editingPromo ? "Edit Promotion Banner" : "New Promotion Banner"}
              </h3>
              <button
                type="button"
                onClick={() => setIsPromoModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Knitwear Wholesale Event"
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">Subtitle / Caption</label>
                <input
                  type="text"
                  placeholder="Save up to 25% on volume orders over 500 pcs."
                  value={promoSubtitle}
                  onChange={(e) => setPromoSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">Banner Type</label>
                  <select
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="hero_banner">Hero Banner</option>
                    <option value="promo_card">Promo Card</option>
                    <option value="deal_banner">Deal Flash Banner</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">Sort Order</label>
                  <input
                    type="number"
                    value={promoSortOrder}
                    onChange={(e) => setPromoSortOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">Banner Image URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={promoImage}
                  onChange={(e) => setPromoImage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">Button Text</label>
                  <input
                    type="text"
                    placeholder="Explore Collection"
                    value={promoBtnText}
                    onChange={(e) => setPromoBtnText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">Target URL</label>
                  <input
                    type="text"
                    placeholder="/products?category=sweaters"
                    value={promoBtnTarget}
                    onChange={(e) => setPromoBtnTarget(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="promoActive"
                  checked={promoActive}
                  onChange={(e) => setPromoActive(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="promoActive" className="font-bold text-foreground cursor-pointer">
                  Active (Display on Storefront)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-border text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-foreground text-background text-xs font-bold uppercase hover:opacity-90 transition-opacity"
                >
                  Save Promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base uppercase text-foreground">
                {editingCoupon ? "Edit Coupon Code" : "Create Coupon Code"}
              </h3>
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER25"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground font-mono font-bold focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">Discount Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount ($)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">Discount Value *</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground font-bold focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">Min Spend ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={minSpend}
                    onChange={(e) => setMinSpend(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">Usage Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">Expiry Date</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="couponActive"
                  checked={couponActive}
                  onChange={(e) => setCouponActive(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="couponActive" className="font-bold text-foreground cursor-pointer">
                  Active (Can be redeemed at checkout)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-border text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-foreground text-background text-xs font-bold uppercase hover:opacity-90 transition-opacity"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
