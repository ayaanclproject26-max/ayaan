"use client";

import { useState, useEffect, useMemo } from "react";
import { brandService, BrandModel } from "@/services/brand.service";
import { Plus, Edit2, Trash2, Search, RefreshCw } from "lucide-react";
import BrandTile from "@/components/common/BrandTile";
import BrandModal from "@/components/admin/BrandModal";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandModel | null>(null);
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
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BrandModel) => {
    setEditingBrand(b);
    setIsModalOpen(true);
  };

  const handleBrandSaved = (saved: BrandModel) => {
    setFeedback({
      type: "success",
      msg: editingBrand ? `Updated brand "${saved.name}".` : `Created new brand "${saved.name}".`,
    });
    loadBrands();
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

  const nextSortOrder = brands.length > 0 ? Math.max(...brands.map((b) => b.sort_order || 0)) + 1 : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
            Brand Assets Directory ({brands.length})
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage manufacturer brand records. Brand logos and names are automatically synchronized across Shop by Brand and Search filters.
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
            <span>Add Brand</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="hover:underline ml-3 cursor-pointer">
            ✕
          </button>
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

      {/* Brands Grid (Conforms to Rule 24: Admin uses unified BrandTile presentation) */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground">
          <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <span>Loading brands from directory...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4">
          {filteredBrands.map((b) => (
            <div
              key={b.id}
              className="relative group flex flex-col justify-between"
            >
              {/* Central Brand Tile Display */}
              <BrandTile
                brand={b}
                asButton={false}
                size="md"
                className="w-full"
              />

              {/* Status and Action Bar */}
              <div className="flex items-center justify-between px-1 pt-1.5 gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleActive(b)}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase cursor-pointer transition-colors ${
                    b.is_active !== false
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  title="Click to toggle active status"
                >
                  {b.is_active !== false ? "Active" : "Inactive"}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(b)}
                    className="p-1 rounded-md bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer"
                    title="Edit Brand"
                  >
                    <Edit2 size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(b)}
                    className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive text-xs transition-colors cursor-pointer"
                    title="Delete Brand"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unified Brand Modal */}
      <BrandModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        brand={editingBrand}
        onSuccess={handleBrandSaved}
        defaultSortOrder={nextSortOrder}
      />
    </div>
  );
}

