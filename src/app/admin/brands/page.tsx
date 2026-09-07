"use client";

import { useState, useEffect, useMemo } from "react";
import { brandService, BrandModel } from "@/services/brand.service";
import { uploadProductImage } from "@/lib/services/storage";
import { Tag, Plus, Upload, Edit2, Trash2, Search, RefreshCw, Globe, CheckCircle2, XCircle } from "lucide-react";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modal / Create State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandModel | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [website, setWebsite] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const data = await brandService.getBrands({ isAdmin: true, all: true });
      setBrands(data);
    } catch (err) {
      console.error("Failed to load brands:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  const handleOpenCreate = () => {
    setEditingBrand(null);
    setName("");
    setSlug("");
    setLogoUrl("/brands/generic.png");
    setWebsite("");
    setSortOrder(brands.length > 0 ? Math.max(...brands.map(b => b.sort_order || 0)) + 1 : 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BrandModel) => {
    setEditingBrand(b);
    setName(b.name);
    setSlug(b.slug);
    setLogoUrl(b.logo_url || b.logo || "/brands/generic.png");
    setWebsite(b.website || "");
    setSortOrder(b.sort_order || 0);
    setIsActive(b.is_active ?? true);
    setIsModalOpen(true);
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadProductImage(file);
      if (res.url) {
        setLogoUrl(res.url);
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setActionLoading(true);
    try {
      if (editingBrand) {
        await brandService.updateBrand(editingBrand.id, {
          name: name.trim(),
          slug: slug.trim() || undefined,
          logo_url: logoUrl || "/brands/generic.png",
          website: website.trim() || null,
          sort_order: Number(sortOrder),
          is_active: isActive,
        });
        setFeedback({ type: "success", msg: `Updated brand: ${name}` });
      } else {
        await brandService.createBrand({
          name: name.trim(),
          slug: slug.trim() || undefined,
          logo_url: logoUrl || "/brands/generic.png",
          website: website.trim() || null,
          sort_order: Number(sortOrder),
          is_active: isActive,
        });
        setFeedback({ type: "success", msg: `Created brand: ${name}` });
      }

      setIsModalOpen(false);
      loadBrands();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Failed to save brand." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (b: BrandModel) => {
    try {
      const newStatus = !b.is_active;
      await brandService.updateBrand(b.id, { is_active: newStatus });
      setFeedback({
        type: "success",
        msg: `Brand "${b.name}" is now ${newStatus ? "ACTIVE" : "INACTIVE"}.`,
      });
      loadBrands();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Failed to toggle status." });
    }
  };

  const handleDelete = async (b: BrandModel) => {
    if (!confirm(`Are you sure you want to delete brand "${b.name}"?`)) return;

    try {
      await brandService.deleteBrand(b.id);
      setFeedback({ type: "success", msg: `Deleted brand: ${b.name}` });
      loadBrands();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Failed to delete brand." });
    }
  };

  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.slug.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "ACTIVE" && b.is_active !== false) ||
        (filterStatus === "INACTIVE" && b.is_active === false);

      return matchesSearch && matchesStatus;
    });
  }, [brands, search, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
            Brand Assets Directory ({brands.length})
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage manufacturer brand records. Logos and sort orders are automatically synchronized across Shop by Brand and Search filters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadBrands}
            className="p-2.5 rounded-full border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors self-start sm:self-auto cursor-pointer"
            title="Refresh Brands"
          >
            <RefreshCw size={15} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <Plus size={15} />
            <span>Add New Brand</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in ${
          feedback.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            : "bg-destructive/10 border-destructive/20 text-destructive"
        }`}>
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="hover:underline ml-3">✕</button>
        </div>
      )}

      {/* Controls: Search & Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search brands by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="ALL">All Statuses ({brands.length})</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Brands Grid */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">
          <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Loading brands from API...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredBrands.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-3xl bg-card border border-border/70 hover:border-foreground/30 transition-all flex flex-col items-center justify-between gap-3 text-center group relative shadow-xs"
            >
              {/* Logo Area */}
              <div className="w-16 h-12 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.logo_url || b.logo || `/brands/${b.slug}.png`}
                  alt={b.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    // Fallback to generic logo on missing asset
                    (e.target as HTMLImageElement).src = "/brands/generic.png";
                  }}
                />
              </div>

              {/* Brand Meta */}
              <div className="min-w-0 w-full space-y-0.5">
                <span className="font-bold text-xs text-foreground block truncate">
                  {b.name}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono block truncate">
                  {b.slug}
                </span>
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(b)}
                    className={`px-1.5 py-0.2 rounded text-[8px] font-bold uppercase cursor-pointer transition-colors ${
                      b.is_active !== false 
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25" 
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    title="Click to toggle active status"
                  >
                    {b.is_active !== false ? "Active" : "Inactive"}
                  </button>
                  <span className="text-[10px] text-muted-foreground">
                    • {b.products_count ?? 0} prods
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(b)}
                  className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 cursor-pointer"
                  title="Edit Brand"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(b)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-xs flex items-center gap-1 cursor-pointer"
                  title="Delete Brand"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base uppercase text-foreground">
                {editingBrand ? "Edit Brand Record" : "Create New Brand Record"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Loro Piana"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingBrand && !slug) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">
                  Slug / Identifier (Optional, Auto-Generated)
                </label>
                <input
                  type="text"
                  placeholder="loro-piana"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground font-mono focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold uppercase tracking-wider text-muted-foreground block">
                  Brand Logo (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-12 rounded-lg bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0 p-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl || "/brands/generic.png"}
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      placeholder="Logo URL or upload file"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-secondary/30 text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-secondary hover:bg-card text-[11px] font-bold cursor-pointer transition-colors">
                      <Upload size={11} />
                      <span>{isUploading ? "Uploading..." : "Upload Logo Image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadLogo}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">
                    Official Website
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="brandActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="brandActive" className="font-bold text-foreground cursor-pointer">
                  Active (Visible in Shop by Brand &amp; Product Selectors)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-border text-xs font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 rounded-full bg-foreground text-background text-xs font-bold uppercase hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  {actionLoading ? "Saving..." : "Save Brand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
