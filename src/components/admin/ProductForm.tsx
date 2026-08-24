"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { B2BProductInput, B2BProductVariant } from "@/types/b2b";
import { getBrands, createBrand } from "@/lib/services/brands";
import { getCategories } from "@/lib/services/categories";
import { generateProductSku } from "@/lib/services/products";
import { uploadProductImage } from "@/lib/services/storage";
import { 
  Save, 
  Upload, 
  Trash2, 
  Plus, 
  Sparkles, 
  Check, 
  Video, 
  Layers, 
  DollarSign, 
  Package, 
  Tag, 
  ArrowLeft,
  X,
  AlertCircle
} from "lucide-react";

interface ProductFormProps {
  initialData?: Partial<B2BProductInput>;
  isEdit?: boolean;
  onSubmit: (data: B2BProductInput) => Promise<void>;
}

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "28", "30", "32", "34", "36", "ONE SIZE"];
const PRESET_COLORS = ["Black", "White", "Navy", "Heather Grey", "Olive", "Beige", "Charcoal", "Red", "Blue"];

export default function ProductForm({ initialData, isEdit, onSubmit }: ProductFormProps) {
  const router = useRouter();

  // Section 1: Basic Info
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [brand, setBrand] = useState(initialData?.brand || "Nike");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "c_tshirts");
  const [audience, setAudience] = useState<"MEN" | "WOMEN" | "BOYS" | "GIRLS" | "UNISEX">(
    initialData?.audience || "MEN"
  );
  const [productType, setProductType] = useState(initialData?.productType || "T-Shirts");
  const [collectionSeason, setCollectionSeason] = useState(initialData?.collectionSeason || "Summer 2026");

  // Section 2: Details
  const [material, setMaterial] = useState(initialData?.material || "100% Combed Cotton, 180 GSM");
  const [colorName, setColorName] = useState(initialData?.colorName || "Black");
  const [colorHex, setColorHex] = useState(initialData?.colorHex || "#111827");
  const [weightGrams, setWeightGrams] = useState(initialData?.weightGrams || 250);
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || "");
  const [description, setDescription] = useState(initialData?.description || "");

  // Section 3: Pricing
  const [costPrice, setCostPrice] = useState(initialData?.costPrice || 8.0);
  const [wholesalePrice, setWholesalePrice] = useState(initialData?.wholesalePrice || 14.5);
  const [msrpPrice, setMsrpPrice] = useState(initialData?.msrpPrice || 28.0);

  // Section 4: Wholesale
  const [moq, setMoq] = useState(initialData?.moq || 50);
  const [stock, setStock] = useState(initialData?.stock || 500);

  // Section 5: Variants
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initialData?.sizes || ["S", "M", "L", "XL"]);
  const [selectedColors, setSelectedColors] = useState<string[]>(initialData?.colors || ["Black", "White"]);
  const [customSizeInput, setCustomSizeInput] = useState("");
  const [customColorInput, setCustomColorInput] = useState("");

  // Section 6: Media
  const [images, setImages] = useState<string[]>(
    initialData?.images && initialData.images.length > 0 
      ? initialData.images 
      : ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"]
  );
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || "");
  const [isUploading, setIsUploading] = useState(false);

  // Section 7: Publishing & Flags
  const [status, setStatus] = useState<"published" | "draft" | "unpublished">(initialData?.status || "published");
  const [isFeatured, setIsFeatured] = useState(Boolean(initialData?.isFeatured));
  const [isNew, setIsNew] = useState(Boolean(initialData?.isNew));
  const [isHot, setIsHot] = useState(Boolean(initialData?.isHot));
  const [isLimitedDeal, setIsLimitedDeal] = useState(Boolean(initialData?.isLimitedDeal));
  const [isBestDeal, setIsBestDeal] = useState(Boolean(initialData?.isBestDeal));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const brands = getBrands();
  const categories = getCategories();

  // Auto SKU Generator
  const handleGenerateSku = () => {
    const generated = generateProductSku(brand, productType, name);
    setSku(generated);
  };

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const res = await uploadProductImage(files[i]);
        if (res.url) {
          setImages((prev) => [...prev, res.url]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    setImages((prev) => {
      const copy = [...prev];
      const target = copy.splice(index, 1)[0];
      return [target, ...copy];
    });
  };

  const handleToggleSize = (s: string) => {
    setSelectedSizes((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
    );
  };

  const handleAddCustomSize = () => {
    if (customSizeInput.trim() && !selectedSizes.includes(customSizeInput.trim())) {
      setSelectedSizes((prev) => [...prev, customSizeInput.trim()]);
      setCustomSizeInput("");
    }
  };

  const handleToggleColor = (c: string) => {
    setSelectedColors((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
    );
  };

  const handleAddCustomColor = () => {
    if (customColorInput.trim() && !selectedColors.includes(customColorInput.trim())) {
      setSelectedColors((prev) => [...prev, customColorInput.trim()]);
      setCustomColorInput("");
    }
  };

  const calculateMargin = () => {
    if (!wholesalePrice || !costPrice) return 0;
    return (((wholesalePrice - costPrice) / wholesalePrice) * 100).toFixed(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim() || !brand.trim() || !wholesalePrice) {
      setErrorMsg("Please provide Product Name, Brand, and Wholesale Price.");
      return;
    }

    if (images.length === 0) {
      setErrorMsg("Please add at least one product image.");
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const generatedSku = sku.trim() || generateProductSku(brand, productType, name);

      const categoryObj = categories.find((c) => c.id === categoryId);

      const productPayload: B2BProductInput = {
        id: initialData?.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        name: name.trim(),
        slug: generatedSlug,
        sku: generatedSku,
        brand: brand.trim(),
        categoryId,
        categoryName: categoryObj?.name || productType,
        audience,
        productType,
        collectionSeason,
        material,
        colorName,
        colorHex,
        weightGrams: Number(weightGrams),
        shortDescription,
        description,
        costPrice: Number(costPrice),
        wholesalePrice: Number(wholesalePrice),
        msrpPrice: Number(msrpPrice),
        moq: Number(moq),
        stock: Number(stock),
        images,
        videoUrl,
        status,
        isFeatured,
        isNew,
        isHot,
        isLimitedDeal,
        isBestDeal,
        sizes: selectedSizes,
        colors: selectedColors,
      };

      await onSubmit(productPayload);
      router.push("/admin/products");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save product. Please verify inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl pb-16">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/80">
        <div>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground uppercase tracking-wider mb-2"
          >
            <ArrowLeft size={13} />
            <span>Back to Products</span>
          </Link>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight text-foreground">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="px-4 py-2 rounded-full border border-border text-xs font-bold uppercase hover:bg-secondary cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-full bg-foreground text-background font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            <Save size={15} />
            <span>{isSubmitting ? "Saving..." : isEdit ? "Update Product" : "Publish Product"}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. BASIC INFORMATION */}
      <div className="p-6 bg-card border border-border/70 rounded-2xl shadow-xs space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border/60">
          1. Basic Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Product Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Nike Men's Sportswear Club Fleece Hoodie"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                SKU *
              </label>
              <button
                type="button"
                onClick={handleGenerateSku}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={11} />
                <span>Generate</span>
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. NIK-HD-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Brand *
            </label>
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Audience Taxonomy *
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="MEN">MEN</option>
              <option value="WOMEN">WOMEN</option>
              <option value="BOYS">BOYS</option>
              <option value="GIRLS">GIRLS</option>
              <option value="UNISEX">UNISEX</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Product Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                const found = categories.find((c) => c.id === e.target.value);
                if (found) setProductType(found.name);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Collection / Season
            </label>
            <input
              type="text"
              placeholder="e.g. Summer 2026 / Core Essentials"
              value={collectionSeason}
              onChange={(e) => setCollectionSeason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              URL Slug
            </label>
            <input
              type="text"
              placeholder="product-url-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. PRODUCT DETAILS & SPECS */}
      <div className="p-6 bg-card border border-border/70 rounded-2xl shadow-xs space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border/60">
          2. Product Details & Material Specifications
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Material / Fabric Composition
            </label>
            <input
              type="text"
              placeholder="e.g. 100% Ring-Spun Combed Cotton, 180 GSM Single Jersey"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Weight (Grams)
            </label>
            <input
              type="number"
              value={weightGrams}
              onChange={(e) => setWeightGrams(parseInt(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-1 sm:col-span-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Full Product Description
            </label>
            <textarea
              rows={4}
              placeholder="Technical descriptions, stitching details, wash care, and packaging specifications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. PRICING & WHOLESALE (USD) */}
      <div className="p-6 bg-card border border-border/70 rounded-2xl shadow-xs space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border/60">
          3. Pricing & Minimum Order Quantities (MOQ)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Cost Price (USD)
            </label>
            <input
              type="number"
              step="0.01"
              value={costPrice}
              onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground">
              Wholesale Price (USD) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={wholesalePrice}
              onChange={(e) => setWholesalePrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-primary/50 bg-secondary/30 text-xs font-bold text-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              MSRP / Retail Price (USD)
            </label>
            <input
              type="number"
              step="0.01"
              value={msrpPrice}
              onChange={(e) => setMsrpPrice(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Profit Margin
            </label>
            <div className="h-[42px] px-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center font-bold text-xs text-emerald-600 dark:text-emerald-400">
              {calculateMargin()}% Margin
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground">
              Minimum Order Qty (MOQ) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={moq}
              onChange={(e) => setMoq(parseInt(e.target.value) || 1)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground">
              Available Stock (Units) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={stock}
              onChange={(e) => setStock(parseInt(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* 4. CUSTOM SIZES & COLORS (VARIANT MATRIX) */}
      <div className="p-6 bg-card border border-border/70 rounded-2xl shadow-xs space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border/60">
          4. Custom Sizes & Colors (Variant Setup)
        </h2>

        {/* Sizes */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Select Sizes / Numeric Sizes
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleToggleSize(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  selectedSizes.includes(s)
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Add Custom Size */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Add Custom Size (e.g. 4XL, 38, Kids-6)"
              value={customSizeInput}
              onChange={(e) => setCustomSizeInput(e.target.value)}
              className="w-64 px-3 py-1.5 text-xs rounded-lg border border-border bg-secondary/30"
            />
            <button
              type="button"
              onClick={handleAddCustomSize}
              className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs font-bold hover:bg-card cursor-pointer"
            >
              + Add Size
            </button>
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-2 pt-3 border-t border-border/50">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Select Colors
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleToggleColor(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  selectedColors.includes(c)
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Add Custom Color */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              placeholder="Add Custom Color (e.g. Sage Green, Burgundy)"
              value={customColorInput}
              onChange={(e) => setCustomColorInput(e.target.value)}
              className="w-64 px-3 py-1.5 text-xs rounded-lg border border-border bg-secondary/30"
            />
            <button
              type="button"
              onClick={handleAddCustomColor}
              className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs font-bold hover:bg-card cursor-pointer"
            >
              + Add Color
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="p-3 bg-secondary/30 rounded-xl text-xs text-muted-foreground">
          Generates <strong>{selectedColors.length * selectedSizes.length}</strong> variant combinations in InsForge variant table.
        </div>
      </div>

      {/* 5. MEDIA & IMAGES */}
      <div className="p-6 bg-card border border-border/70 rounded-2xl shadow-xs space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border/60">
          5. Product Media (InsForge Storage Bucket: product-images)
        </h2>

        {/* Upload & URL Input */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <label className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border bg-secondary/40 hover:bg-secondary text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0">
            <Upload size={14} />
            <span>{isUploading ? "Uploading to InsForge..." : "Upload from Device"}</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <div className="flex items-center gap-2 flex-1 w-full">
            <input
              type="url"
              placeholder="Or paste direct image URL (https://...)"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-border bg-secondary/30 outline-none"
            />
            <button
              type="button"
              onClick={handleAddImageUrl}
              className="px-4 py-2 rounded-xl bg-secondary border border-border text-xs font-bold hover:bg-card cursor-pointer"
            >
              Add URL
            </button>
          </div>
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative aspect-[3/4] rounded-xl overflow-hidden bg-secondary border border-border group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`Media ${idx + 1}`} className="w-full h-full object-cover" />

              {idx === 0 && (
                <span className="absolute top-1.5 left-1.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                  Primary
                </span>
              )}

              <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {idx !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimaryImage(idx)}
                    className="p-1 rounded bg-card text-[10px] font-bold text-foreground"
                    title="Make Primary"
                  >
                    Primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="p-1 rounded bg-destructive text-destructive-foreground"
                  title="Remove"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Video URL */}
        <div className="space-y-1 pt-3 border-t border-border/50">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Video size={14} />
            <span>Optional Product Video URL (YouTube embed / MP4)</span>
          </label>
          <input
            type="url"
            placeholder="https://www.youtube.com/embed/..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* 6. PUBLISHING STATUS & PROMOTIONAL FLAGS */}
      <div className="p-6 bg-card border border-border/70 rounded-2xl shadow-xs space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border/60">
          6. Publishing Status & Storefront Badges
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Product Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              <option value="published">PUBLISHED (Live on Storefront)</option>
              <option value="draft">DRAFT (Admin Only)</option>
              <option value="unpublished">UNPUBLISHED (Hidden)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Homepage Promotional Flags
            </label>
            <div className="flex flex-wrap gap-2.5">
              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded border-border"
                />
                <span>Featured</span>
              </label>

              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNew}
                  onChange={(e) => setIsNew(e.target.checked)}
                  className="rounded border-border"
                />
                <span>New Arrival</span>
              </label>

              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={isHot}
                  onChange={(e) => setIsHot(e.target.checked)}
                  className="rounded border-border"
                />
                <span>Hot Sale</span>
              </label>

              <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBestDeal}
                  onChange={(e) => setIsBestDeal(e.target.checked)}
                  className="rounded border-border"
                />
                <span>Best Deal</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Submit Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="px-5 py-2.5 rounded-full border border-border text-xs font-bold uppercase hover:bg-secondary cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3 rounded-full bg-foreground text-background font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
        >
          <Save size={15} />
          <span>{isSubmitting ? "Saving..." : isEdit ? "Update Product" : "Publish Product"}</span>
        </button>
      </div>

    </form>
  );
}
