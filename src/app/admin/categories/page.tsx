"use client";

import { useState, useEffect, useMemo } from "react";
import { categoryService, CategoryModel } from "@/services/category.service";
import { uploadProductImage } from "@/lib/services/storage";
import { AUDIENCE_CATEGORIES } from "@/lib/filters";

import { 
  Layers, 
  Plus, 
  Users, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  Search,
  Upload,
  Image as ImageIcon
} from "lucide-react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const audiences = AUDIENCE_CATEGORIES;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryModel | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [accentColor, setAccentColor] = useState("#3B82F6");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await categoryService.getCategories({ isAdmin: true, all: true });
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setParentId("");
    setDescription("");
    setImageUrl("");
    setAccentColor("#3B82F6");
    setIsActive(true);
    setSortOrder(categories.length > 0 ? Math.max(...categories.map(c => c.sort_order || 0)) + 1 : 1);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CategoryModel) => {
    setEditingCategory(c);
    setName(c.name);
    setSlug(c.slug);
    setParentId(c.parent_id ? String(c.parent_id) : "");
    setDescription(c.description || "");
    setImageUrl(c.image || c.image_url || "");
    setAccentColor(c.accent_color || "#3B82F6");
    setIsActive(c.is_active ?? true);
    setSortOrder(c.sort_order || 0);
    setIsModalOpen(true);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadProductImage(file);
      if (res.url) {
        setImageUrl(res.url);
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
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, {
          name: name.trim(),
          slug: slug.trim() || undefined,
          parent_id: parentId ? Number(parentId) : null,
          description: description.trim() || undefined,
          image_url: imageUrl.trim() || undefined,
          accent_color: accentColor,
          is_active: isActive,
          sort_order: Number(sortOrder),
        });
        setFeedback({ type: "success", msg: `Updated category: ${name}` });
      } else {
        await categoryService.createCategory({
          name: name.trim(),
          slug: slug.trim() || undefined,
          parent_id: parentId ? Number(parentId) : null,
          description: description.trim() || undefined,
          image_url: imageUrl.trim() || undefined,
          accent_color: accentColor,
          is_active: isActive,
          sort_order: Number(sortOrder),
        });
        setFeedback({ type: "success", msg: `Created category: ${name}` });
      }

      setIsModalOpen(false);
      loadCategories();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Failed to save category." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (c: CategoryModel) => {
    try {
      const newStatus = !c.is_active;
      await categoryService.updateCategory(c.id, { is_active: newStatus });
      setFeedback({
        type: "success",
        msg: `Category "${c.name}" is now ${newStatus ? "ACTIVE" : "INACTIVE"}.`,
      });
      loadCategories();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Failed to toggle status." });
    }
  };

  const handleDelete = async (c: CategoryModel) => {
    if (!confirm(`Are you sure you want to delete category "${c.name}"?`)) return;
    try {
      await categoryService.deleteCategory(c.id);
      setFeedback({ type: "success", msg: `Deleted category: ${c.name}` });
      loadCategories();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Failed to delete category." });
    }
  };

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        filterStatus === "ALL" ||
        (filterStatus === "ACTIVE" && c.is_active !== false) ||
        (filterStatus === "INACTIVE" && c.is_active === false);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, filterStatus]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
            Category &amp; Audience Taxonomy
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage primary B2B audience taxonomy and apparel product category hierarchies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadCategories}
            className="p-2.5 rounded-full border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors self-start sm:self-auto cursor-pointer"
            title="Refresh Categories"
          >
            <RefreshCw size={15} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-sm self-start sm:self-auto cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Category</span>
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

      {/* Primary Audience Taxonomy */}
      <div className="p-6 bg-card border border-border/70 rounded-3xl shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border/60">
          <Users size={18} className="text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Primary Audience Taxonomy (5 Core Segments)
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {audiences.map((aud) => (
            <div
              key={aud.id}
              className="p-4 rounded-2xl bg-secondary/40 border border-border/70 text-center space-y-1"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-foreground block">
                {aud.name}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                slug: {aud.slug}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Apparel Product Categories */}
      <div className="p-6 bg-card border border-border/70 rounded-3xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Apparel Categories &amp; Hierarchy ({categories.length})
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-1.5 text-xs rounded-xl border border-border bg-background text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">
            <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span>Loading categories from API...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="p-4 rounded-2xl bg-secondary/30 border border-border/70 flex items-start justify-between gap-3 group hover:border-foreground/30 transition-all"
              >
                {/* Category Image Thumbnail */}
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-secondary border border-border shrink-0 flex items-center justify-center">
                  {cat.image || cat.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cat.image || cat.image_url}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={20} className="text-muted-foreground" />
                  )}
                </div>

                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground truncate">
                      {cat.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(cat)}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase cursor-pointer transition-colors ${
                        cat.is_active !== false 
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25" 
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                      title="Click to toggle active status"
                    >
                      {cat.is_active !== false ? "Active" : "Inactive"}
                    </button>
                  </div>

                  <span className="text-[11px] text-muted-foreground font-mono block truncate">
                    slug: {cat.slug} {cat.parent && `• Parent: ${cat.parent.name}`}
                  </span>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>Order: {cat.sort_order ?? 0}</span>
                    <span>•</span>
                    <span>{cat.products_count ?? 0} products</span>
                  </div>

                  {cat.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 rounded-lg bg-card hover:bg-foreground hover:text-background text-foreground transition-colors cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base uppercase text-foreground">
                {editingCategory ? "Edit Apparel Category" : "Add Apparel Category"}
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
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Denim Jackets"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory && !slug) {
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
                  placeholder="denim-jackets"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground font-mono focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">
                  Parent Category (Hierarchy)
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="">None (Top Level)</option>
                  {categories
                    .filter((c) => !editingCategory || String(c.id) !== String(editingCategory.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-bold uppercase tracking-wider text-muted-foreground block">
                  Category Tile Image (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-12 rounded-lg bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={18} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      placeholder="Image URL or upload below"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-secondary/30 text-foreground text-xs focus:ring-1 focus:ring-primary outline-none"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border bg-secondary hover:bg-card text-[11px] font-bold cursor-pointer transition-colors">
                      <Upload size={11} />
                      <span>{isUploading ? "Uploading..." : "Upload Local Image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-border bg-secondary/30 text-foreground font-mono text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vintage, Sherpa-lined, washed denim"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="catActive" className="font-bold text-foreground cursor-pointer">
                  Active (Visible on Storefront &amp; Filters)
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
                  {actionLoading ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
