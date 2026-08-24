"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  getProducts, 
  deleteProduct, 
  duplicateProduct, 
  togglePublishStatus 
} from "@/lib/services/products";
import { getBrands } from "@/lib/services/brands";
import { getCategories } from "@/lib/services/categories";
import { B2BProductInput } from "@/types/b2b";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Copy, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Package, 
  Layers, 
  AlertTriangle,
  ArrowUpDown
} from "lucide-react";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<B2BProductInput[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedAudience, setSelectedAudience] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const refreshProducts = async () => {
    setLoading(true);
    const data = await getProducts({
      isAdmin: true,
      search: searchQuery,
      brand: selectedBrand,
      audience: selectedAudience,
      status: selectedStatus,
    });
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    refreshProducts();
  }, [searchQuery, selectedBrand, selectedAudience, selectedStatus]);

  const brands = getBrands();
  const categories = getCategories();

  // Metrics
  const totalCount = products.length;
  const publishedCount = products.filter((p) => p.status === "published").length;
  const draftCount = products.filter((p) => p.status === "draft").length;
  const lowStockCount = products.filter((p) => p.stock < 100).length;

  const handleToggleStatus = async (product: B2BProductInput) => {
    const nextStatus = product.status === "published" ? "unpublished" : "published";
    await togglePublishStatus(product.id, nextStatus as any);
    setFeedbackMsg(`Updated ${product.name} to ${nextStatus.toUpperCase()}`);
    refreshProducts();
  };

  const handleDuplicate = async (id: string) => {
    const clone = await duplicateProduct(id);
    if (clone) {
      setFeedbackMsg(`Duplicated product: ${clone.name} (Draft)`);
      refreshProducts();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    await deleteProduct(id);
    setFeedbackMsg(`Deleted ${name}`);
    refreshProducts();
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(products.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkPublish = async () => {
    for (const id of selectedIds) {
      await togglePublishStatus(id, "published");
    }
    setSelectedIds([]);
    setFeedbackMsg("Published selected products.");
    refreshProducts();
  };

  const handleBulkUnpublish = async () => {
    for (const id of selectedIds) {
      await togglePublishStatus(id, "unpublished");
    }
    setSelectedIds([]);
    setFeedbackMsg("Unpublished selected products.");
    refreshProducts();
  };

  return (
    <div className="space-y-6">
      
      {/* Header with Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
            Product Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage wholesale catalog, MOQ, SKU formulas, and publishing status.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-sm self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Add New Product</span>
        </Link>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg("")} className="text-primary hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Total Catalog
          </span>
          <span className="text-2xl font-display font-bold text-foreground mt-1 block">
            {totalCount}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Published (Live)
          </span>
          <span className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
            {publishedCount}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
            Drafts / Unpublished
          </span>
          <span className="text-2xl font-display font-bold text-amber-600 dark:text-amber-400 mt-1 block">
            {draftCount}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
            Low Stock (&lt;100)
          </span>
          <span className="text-2xl font-display font-bold text-rose-600 dark:text-rose-400 mt-1 block">
            {lowStockCount}
          </span>
        </div>
      </div>

      {/* Search & Filtering Bar */}
      <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Name, Brand, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="all">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={selectedAudience}
            onChange={(e) => setSelectedAudience(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="all">All Audiences</option>
            <option value="MEN">MEN</option>
            <option value="WOMEN">WOMEN</option>
            <option value="BOYS">BOYS</option>
            <option value="GIRLS">GIRLS</option>
            <option value="UNISEX">UNISEX</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="unpublished">Unpublished</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-secondary rounded-xl border border-border flex items-center justify-between gap-3 text-xs">
          <span className="font-bold text-foreground">
            {selectedIds.length} items selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkPublish}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 cursor-pointer"
            >
              Publish Selected
            </button>
            <button
              type="button"
              onClick={handleBulkUnpublish}
              className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 cursor-pointer"
            >
              Unpublish Selected
            </button>
          </div>
        </div>
      )}

      {/* Products Dense Data Table */}
      <div className="bg-card border border-border/70 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4 w-8">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length === products.length && products.length > 0}
                    className="rounded border-border"
                  />
                </th>
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Brand</th>
                <th className="py-3 px-3">Audience / Cat</th>
                <th className="py-3 px-3 text-right">Wholesale</th>
                <th className="py-3 px-3 text-right">MOQ</th>
                <th className="py-3 px-3 text-right">Stock</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading products...</span>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/30 transition-colors font-medium">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => handleToggleSelect(p.id)}
                        className="rounded border-border"
                      />
                    </td>

                    {/* Thumbnail & Title */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.images[0] || "/placeholder.jpg"}
                          alt={p.name}
                          className="w-10 h-12 object-cover rounded-md bg-secondary shrink-0 border border-border/50"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-foreground block truncate max-w-[220px]">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground block truncate">
                            {p.productType || "Apparel"} • {p.material || "100% Cotton"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-muted-foreground">{p.sku}</td>
                    <td className="py-3 px-3 font-bold text-foreground">{p.brand}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary border border-border text-foreground">
                        {p.audience}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-foreground">
                      ${p.wholesalePrice.toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-right font-semibold text-muted-foreground">
                      {p.moq} pcs
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span className={`font-bold ${p.stock < 100 ? "text-rose-500" : "text-foreground"}`}>
                        {p.stock.toLocaleString()}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(p)}
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-opacity hover:opacity-80 ${
                          p.status === "published"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {p.status}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/products/${p.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="View on Storefront"
                        >
                          <Eye size={14} />
                        </Link>

                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit Product"
                        >
                          <Edit size={14} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(p.id)}
                          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Duplicate as Draft"
                        >
                          <Copy size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-muted-foreground">
                    No products matched your search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
