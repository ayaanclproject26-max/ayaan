"use client";

import { useState } from "react";
import { getCategories, getAudiences, CategoryInfo } from "@/lib/services/categories";
import { Layers, Plus, Users, Sparkles } from "lucide-react";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryInfo[]>(getCategories());
  const audiences = getAudiences();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCat: CategoryInfo = {
      id: `c_${Date.now()}`,
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: description.trim(),
    };

    const updated = [...categories, newCat];
    setCategories(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ayaan_custom_categories", JSON.stringify(updated));
      } catch {
        // Ignore
      }
    }
    setIsModalOpen(false);
    setName("");
    setSlug("");
    setDescription("");
  };

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
            Category & Audience Taxonomy
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage primary B2B audience taxonomy and apparel product category hierarchies.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus size={15} />
          <span>Add Custom Category</span>
        </button>
      </div>

      {/* Primary Audience Taxonomy */}
      <div className="p-6 bg-card border border-border/70 rounded-2xl shadow-xs space-y-4">
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
              className="p-4 rounded-xl bg-secondary/40 border border-border/70 text-center space-y-1"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-foreground block">
                {aud.name}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                slug: {aud.slug}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Apparel Product Categories */}
      <div className="p-6 bg-card border border-border/70 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-border/60">
          <Layers size={18} className="text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Apparel Product Categories ({categories.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-4 rounded-xl bg-secondary/30 border border-border/70 flex items-start justify-between gap-3"
            >
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {cat.name}
                </h3>
                <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                  ID: {cat.slug}
                </span>
                {cat.description && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {cat.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base uppercase text-foreground">
                Add Apparel Category
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4 text-xs">
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
                  placeholder="denim-jackets"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground font-mono focus:ring-1 focus:ring-primary outline-none"
                />
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
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
