"use client";

import { useState } from "react";
import { getBrands, createBrand, updateBrand } from "@/lib/services/brands";
import { uploadProductImage } from "@/lib/services/storage";
import { Brand } from "@/components/home/ShopByBrand";
import { Tag, Plus, Upload, Edit2, Check, Search } from "lucide-react";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>(getBrands());
  const [search, setSearch] = useState("");

  // Modal / Create State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logo, setLogo] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const refresh = () => {
    setBrands(getBrands());
  };

  const handleOpenCreate = () => {
    setEditingBrand(null);
    setName("");
    setSlug("");
    setLogo("/brands/generic.png");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Brand) => {
    setEditingBrand(b);
    setName(b.name);
    setSlug(b.slug);
    setLogo(b.logo);
    setIsModalOpen(true);
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadProductImage(file);
      if (res.url) {
        setLogo(res.url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingBrand) {
      updateBrand(editingBrand.id, {
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        logo: logo || "/brands/generic.png",
      });
      setFeedback(`Updated brand: ${name}`);
    } else {
      createBrand(name.trim(), logo, slug.trim());
      setFeedback(`Created new brand: ${name}`);
    }

    setIsModalOpen(false);
    refresh();
  };

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
            Brand Management ({brands.length})
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage canonical and custom brand assets. Logos are automatically synced across Shop by Brand and Search filters.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus size={15} />
          <span>Add New Brand</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback("")} className="text-primary hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search brands..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
        />
      </div>

      {/* Brands Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {filtered.map((b) => (
          <div
            key={b.id}
            className="p-4 rounded-2xl bg-card border border-border/70 hover:border-foreground/30 transition-all flex flex-col items-center justify-between gap-3 text-center group"
          >
            <div className="w-16 h-12 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.logo}
                alt={b.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-xs text-foreground block truncate max-w-[120px]">
                {b.name}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono block">
                {b.slug}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleOpenEdit(b)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 cursor-pointer"
            >
              <Edit2 size={12} />
              <span>Edit</span>
            </button>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base uppercase text-foreground">
                {editingBrand ? "Edit Brand" : "Create New Brand"}
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
                  placeholder="e.g. Under Armour"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">
                  Slug / Identifier
                </label>
                <input
                  type="text"
                  placeholder="under-armour"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground font-mono focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold uppercase tracking-wider text-muted-foreground block">
                  Brand Logo
                </label>
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo || "/brands/generic.png"}
                    alt="Preview"
                    className="w-14 h-12 object-contain bg-secondary rounded-lg border border-border p-1"
                  />
                  <label className="px-3 py-2 rounded-xl border border-border bg-secondary hover:bg-card text-xs font-bold cursor-pointer transition-colors">
                    <span>{isUploading ? "Uploading..." : "Upload Logo"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadLogo}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-border text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-foreground text-background text-xs font-bold uppercase hover:opacity-90 transition-opacity"
                >
                  Save Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
