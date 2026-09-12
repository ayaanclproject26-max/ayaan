"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { B2BProductInput, B2BProductVariant } from "@/types/b2b";
import { ShippingPackageProfile } from "@/types";
import { brandService, BrandModel } from "@/services/brand.service";
import BrandModal from "@/components/admin/BrandModal";
import { categoryService, CategoryModel } from "@/services/category.service";
import { generateProductSku } from "@/lib/services/products";
import { uploadProductImage } from "@/lib/services/storage";
import { formatPrice } from "@/lib/formatters";
import { calculateTotalCbm, validateShippingPackageProfiles } from "@/lib/services/shipping-package";
import { 
  Save, 
  Upload, 
  Trash2, 
  Plus, 
  Sparkles, 
  Check, 
  Play, 
  Layers, 
  DollarSign, 
  Package, 
  Tag, 
  ArrowLeft,
  X,
  AlertCircle,
  TrendingDown,
  Building2,
  Image as ImageIcon,
  ShieldCheck,
  CheckCircle2,
  Info,
  Truck,
  Box,
  Scale
} from "lucide-react";

interface ProductFormProps {
  initialData?: Partial<B2BProductInput>;
  isEdit?: boolean;
  onSubmit: (data: B2BProductInput) => Promise<void>;
}

// Predefined Color Palette with Hex and Text Contrast
const PREDEFINED_PALETTE = [
  { name: "Black", hex: "#111827", dark: true },
  { name: "White", hex: "#FFFFFF", dark: false },
  { name: "Navy", hex: "#1E3A8A", dark: true },
  { name: "Blue", hex: "#2563EB", dark: true },
  { name: "Red", hex: "#DC2626", dark: true },
  { name: "Green", hex: "#16A34A", dark: true },
  { name: "Yellow", hex: "#EAB308", dark: false },
  { name: "Orange", hex: "#EA580C", dark: true },
  { name: "Purple", hex: "#9333EA", dark: true },
  { name: "Pink", hex: "#EC4899", dark: true },
  { name: "Brown", hex: "#78350F", dark: true },
  { name: "Grey", hex: "#6B7280", dark: true },
  { name: "Beige", hex: "#D4C5B9", dark: false },
  { name: "Maroon", hex: "#881337", dark: true },
  { name: "Olive", hex: "#556B2F", dark: true },
  { name: "Charcoal", hex: "#374151", dark: true },
  { name: "Peach", hex: "#FFCBA4", dark: false },
  { name: "Teal", hex: "#0D9488", dark: true },
];

// Predefined Size Sets
const SIZE_PRESETS = [
  { label: "Standard Letter (XS–3XL)", sizes: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] },
  { label: "Core Letter (S–XL)", sizes: ["S", "M", "L", "XL"] },
  { label: "Numeric Waist (28–38)", sizes: ["28", "30", "32", "34", "36", "38"] },
  { label: "Universal", sizes: ["ONE SIZE"] },
];

export default function ProductForm({ initialData, isEdit, onSubmit }: ProductFormProps) {
  const router = useRouter();

  // Section 1: Basic Info
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [sku, setSku] = useState(initialData?.sku || "");
  const [brand, setBrand] = useState(initialData?.brand || "Ayaan");
  const [brandId, setBrandId] = useState<string | number | undefined>(initialData?.brand_id);

  // Inline Brand Modal State
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  // Category State & Multi-Category Support
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "1");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() => {
    if (Array.isArray(initialData?.categories) && initialData.categories.length > 0) {
      return initialData.categories.map(String);
    }
    return [initialData?.categoryId ? String(initialData.categoryId) : "1"];
  });

  // Inline Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [inlineCatName, setInlineCatName] = useState("");
  const [inlineCatSlug, setInlineCatSlug] = useState("");
  const [inlineCatParentId, setInlineCatParentId] = useState("");
  const [inlineCatImage, setInlineCatImage] = useState("");
  const [inlineCatLoading, setInlineCatLoading] = useState(false);
  const [inlineCatError, setInlineCatError] = useState("");
  const [inlineCatUploading, setInlineCatUploading] = useState(false);

  const [audience, setAudience] = useState<"MEN" | "WOMEN" | "BOYS" | "GIRLS" | "UNISEX">(
    initialData?.audience || "UNISEX"
  );
  const [productType, setProductType] = useState(initialData?.productType || "T-Shirts");
  const [collectionSeason, setCollectionSeason] = useState(initialData?.collectionSeason || "2026 Core Collection");

  // Section 2: Specifications
  const [material, setMaterial] = useState(initialData?.material || "100% Combed Cotton, 180 GSM");
  const [weightGrams, setWeightGrams] = useState(initialData?.weightGrams || 250);
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || "");
  const [description, setDescription] = useState(initialData?.description || "");

  // Section 3: Three Purchasing Prices
  const [moq, setMoq] = useState(initialData?.moq || 10);
  const [wholesalePrice, setWholesalePrice] = useState(initialData?.wholesalePrice || 28.0);
  const [bulkThreshold, setBulkThreshold] = useState(initialData?.bulkThreshold || 200);
  const [bulkPrice, setBulkPrice] = useState(initialData?.bulkPrice || 22.40);
  const [fullStockPrice, setFullStockPrice] = useState(initialData?.fullStockPrice || 20.00);
  const [costPrice, setCostPrice] = useState(initialData?.costPrice || 12.0);
  const [msrpPrice, setMsrpPrice] = useState(initialData?.msrpPrice || 45.0);

  // Section 4: Colors
  const [selectedColors, setSelectedColors] = useState<string[]>(
    initialData?.colors && initialData.colors.length > 0 
      ? initialData.colors 
      : ["Black", "Blue"]
  );
  const [customColorName, setCustomColorName] = useState("");
  const [showCustomColorInput, setShowCustomColorInput] = useState(false);

  // Section 5: Sizes
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    initialData?.sizes && initialData.sizes.length > 0 
      ? initialData.sizes 
      : ["XS", "S", "M", "L", "XL"]
  );
  const [customSizeName, setCustomSizeName] = useState("");

  // Section 6: Package Allocation Matrix (Color x Size => quantity)
  const [matrixAllocations, setMatrixAllocations] = useState<Record<string, Record<string, number>>>(() => {
    const initial: Record<string, Record<string, number>> = {};
    const cols = initialData?.colors || ["Black", "Blue"];
    const szs = initialData?.sizes || ["XS", "S", "M", "L", "XL"];

    cols.forEach(c => {
      initial[c] = {};
      szs.forEach(s => {
        initial[c][s] = 1; // Default 1 per cell
      });
    });

    if (initialData?.packageAllocations && initialData.packageAllocations.length > 0) {
      initialData.packageAllocations.forEach(pa => {
        if (pa.color && pa.size) {
          if (!initial[pa.color]) initial[pa.color] = {};
          initial[pa.color][pa.size] = pa.quantity;
        }
      });
    }

    return initial;
  });

  // Section 7: Media & YouTube
  const [images, setImages] = useState<string[]>(
    initialData?.images && initialData.images.length > 0 
      ? initialData.images 
      : ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"]
  );
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || "");
  const [isUploading, setIsUploading] = useState(false);

  // Section 8: Inventory & Publishing
  const [stock, setStock] = useState(initialData?.stock || 710);
  const [status, setStatus] = useState<"published" | "draft" | "unpublished">(initialData?.status || "published");
  const [isFeatured, setIsFeatured] = useState(Boolean(initialData?.isFeatured));
  const [isNew, setIsNew] = useState(Boolean(initialData?.isNew));
  const [isHot, setIsHot] = useState(Boolean(initialData?.isHot));
  const [isLimitedDeal, setIsLimitedDeal] = useState(Boolean(initialData?.isLimitedDeal));
  const [isBestDeal, setIsBestDeal] = useState(Boolean(initialData?.isBestDeal));

  // Section 9: Shipping Package Profiles (Physical Carton Configuration)
  const [shippingProfiles, setShippingProfiles] = useState<ShippingPackageProfile[]>(() => {
    const raw = initialData?.shippingPackageProfiles || initialData?.shipping_package_profiles;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((p) => ({
        ...p,
        package_quantity: Number(p.package_quantity || 0),
        quantity_max: p.quantity_max !== undefined && p.quantity_max !== null ? Number(p.quantity_max) : null,
        carton_count: Number(p.carton_count || 1),
        carton_length: Number(p.carton_length || 60),
        carton_width: Number(p.carton_width || 40),
        carton_height: Number(p.carton_height || 30),
        dimension_unit: (p.dimension_unit || "cm") as "cm" | "in" | "m",
        gross_weight: Number(p.gross_weight || 20),
        net_weight: p.net_weight !== undefined && p.net_weight !== null ? Number(p.net_weight) : undefined,
        weight_unit: (p.weight_unit || "kg") as "kg" | "lbs" | "g",
        is_active: p.is_active !== undefined ? Boolean(p.is_active) : true,
      }));
    }
    const defaultMoq = initialData?.moq || 10;
    return [
      {
        package_quantity: defaultMoq,
        carton_count: 1,
        carton_length: 60,
        carton_width: 40,
        carton_height: 30,
        dimension_unit: "cm",
        gross_weight: 15,
        net_weight: 13.5,
        weight_unit: "kg",
        notes: "1 Master Export Carton (MOQ)",
        is_active: true,
      },
    ];
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [availableBrands, setAvailableBrands] = useState<BrandModel[]>([]);
  const [categories, setCategories] = useState<CategoryModel[]>([]);

  // Load live Brands and Categories from REST API
  useEffect(() => {
    async function fetchEntities() {
      try {
        const [bList, cList] = await Promise.all([
          brandService.getBrands({ isAdmin: true, all: true }),
          categoryService.getCategories({ isAdmin: true, all: true }),
        ]);
        setAvailableBrands(bList);
        setCategories(cList);
      } catch (err) {
        console.error("Failed to load brands/categories:", err);
      }
    }
    fetchEntities();
  }, []);

  // Use BrandModal handler
  const handleBrandCreated = (brand: BrandModel) => {
    setAvailableBrands(prev => {
      if (prev.some(b => String(b.id) === String(brand.id) || b.name === brand.name)) return prev;
      return [...prev, brand];
    });
    setBrand(brand.name);
    setBrandId(brand.id);
  };

  // Inline Category Submit Handler (100% preserves existing product form state)
  const handleInlineCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineCatName.trim()) return;
    setInlineCatLoading(true);
    setInlineCatError("");
    try {
      const created = await categoryService.createCategory({
        name: inlineCatName.trim(),
        slug: inlineCatSlug.trim() || undefined,
        parent_id: inlineCatParentId ? Number(inlineCatParentId) : null,
        image_url: inlineCatImage.trim() || undefined,
      });
      setCategories(prev => {
        if (prev.some(c => String(c.id) === String(created.id) || c.name === created.name)) return prev;
        return [...prev, created];
      });
      const newId = String(created.id);
      setCategoryId(newId);
      setSelectedCategoryIds(prev => prev.includes(newId) ? prev : [...prev, newId]);
      setInlineCatName("");
      setInlineCatSlug("");
      setInlineCatParentId("");
      setInlineCatImage("");
      setIsCategoryModalOpen(false);
    } catch (err: any) {
      setInlineCatError(err?.message || "Failed to create category");
    } finally {
      setInlineCatLoading(false);
    }
  };

  // Sync matrix structure whenever selectedColors or selectedSizes change
  useEffect(() => {
    setMatrixAllocations(prev => {
      const updated: Record<string, Record<string, number>> = {};
      selectedColors.forEach(c => {
        updated[c] = {};
        selectedSizes.forEach(s => {
          updated[c][s] = prev[c]?.[s] ?? 0;
        });
      });
      return updated;
    });
  }, [selectedColors, selectedSizes]);

  // Matrix Mathematics
  const matrixSummary = useMemo(() => {
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};
    let grandTotal = 0;

    selectedSizes.forEach(s => { colTotals[s] = 0; });

    selectedColors.forEach(c => {
      rowTotals[c] = 0;
      selectedSizes.forEach(s => {
        const val = matrixAllocations[c]?.[s] || 0;
        rowTotals[c] += val;
        colTotals[s] += val;
        grandTotal += val;
      });
    });

    const isMatch = grandTotal === moq;
    const diff = grandTotal - moq;

    return { rowTotals, colTotals, grandTotal, isMatch, diff };
  }, [selectedColors, selectedSizes, matrixAllocations, moq]);

  // Auto SKU Generator
  const handleGenerateSku = () => {
    const generated = generateProductSku(brand, productType, name);
    setSku(generated);
  };

  // Color selection
  const handleToggleColor = (colorName: string) => {
    setSelectedColors(prev => {
      if (prev.includes(colorName)) {
        if (prev.length === 1) return prev; // At least 1 color
        return prev.filter(c => c !== colorName);
      }
      return [...prev, colorName];
    });
  };

  const handleAddCustomColor = () => {
    const trimmed = customColorName.trim();
    if (trimmed && !selectedColors.includes(trimmed)) {
      setSelectedColors(prev => [...prev, trimmed]);
      setCustomColorName("");
      setShowCustomColorInput(false);
    }
  };

  // Size preset selection
  const handleApplySizePreset = (sizes: string[]) => {
    setSelectedSizes(sizes);
  };

  const handleToggleSize = (sizeName: string) => {
    setSelectedSizes(prev => {
      if (prev.includes(sizeName)) {
        if (prev.length === 1) return prev; // At least 1 size
        return prev.filter(s => s !== sizeName);
      }
      return [...prev, sizeName];
    });
  };

  const handleAddCustomSize = () => {
    const trimmed = customSizeName.trim();
    if (trimmed && !selectedSizes.includes(trimmed)) {
      setSelectedSizes(prev => [...prev, trimmed]);
      setCustomSizeName("");
    }
  };

  // Matrix Cell Update
  const handleCellChange = (color: string, size: string, value: string) => {
    const num = Math.max(0, parseInt(value) || 0);
    setMatrixAllocations(prev => ({
      ...prev,
      [color]: {
        ...(prev[color] || {}),
        [size]: num,
      }
    }));
  };

  // Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const res = await uploadProductImage(files[i]);
        if (res.url) {
          setImages(prev => [...prev, res.url]);
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
      setImages(prev => [...prev, imageUrlInput.trim()]);
      setImageUrlInput("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index: number) => {
    setImages(prev => {
      const copy = [...prev];
      const target = copy.splice(index, 1)[0];
      return [target, ...copy];
    });
  };

  // YouTube URL validator helper
  const parsedYoutubeId = useMemo(() => {
    if (!videoUrl.trim()) return null;
    const match = videoUrl.trim().match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }, [videoUrl]);

  // Shipping Package Profiles Actions
  const handleAddShippingProfile = (qty?: number, cartons?: number, label?: string) => {
    const targetQty = qty ?? Math.max(1, moq);
    const exists = shippingProfiles.some(p => p.package_quantity === targetQty && !p.quantity_max);
    if (exists) {
      setErrorMsg(`A shipping package profile for exact quantity ${targetQty} pcs already exists.`);
      return;
    }

    const calculatedCartons = cartons ?? Math.max(1, Math.round(targetQty / Math.max(1, moq)));
    const estGross = Math.round(((targetQty * (weightGrams || 250)) / 1000) * 1.15 * 10) / 10 || 15;
    const estNet = Math.round(((targetQty * (weightGrams || 250)) / 1000) * 10) / 10 || 13.5;

    const newProfile: ShippingPackageProfile = {
      package_quantity: targetQty,
      quantity_max: null,
      carton_count: calculatedCartons,
      carton_length: 60,
      carton_width: 40,
      carton_height: 30,
      dimension_unit: "cm",
      gross_weight: estGross,
      net_weight: estNet,
      weight_unit: "kg",
      notes: label ?? `${targetQty} pcs Master Export Carton`,
      is_active: true,
    };

    setShippingProfiles(prev => [...prev, newProfile]);
    setErrorMsg("");
  };

  const handleUpdateShippingProfile = (index: number, updates: Partial<ShippingPackageProfile>) => {
    setShippingProfiles(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleRemoveShippingProfile = (index: number) => {
    if (shippingProfiles.length <= 1) {
      setErrorMsg("At least one physical packaging profile is required.");
      return;
    }
    setShippingProfiles(prev => prev.filter((_, i) => i !== index));
    setErrorMsg("");
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // 1. Basic Validation
    if (!name.trim()) {
      setErrorMsg("Product name is required.");
      return;
    }
    if (!sku.trim()) {
      setErrorMsg("Product SKU is required.");
      return;
    }
    if (!brand.trim()) {
      setErrorMsg("Please select or add a brand.");
      return;
    }

    // 2. Pricing Validation
    if (moq <= 0) {
      setErrorMsg("MOQ must be greater than 0.");
      return;
    }
    if (bulkThreshold <= moq) {
      setErrorMsg(`Bulk quantity threshold (${bulkThreshold}) must be strictly greater than MOQ (${moq}).`);
      return;
    }
    if (wholesalePrice <= 0 || bulkPrice <= 0 || fullStockPrice <= 0) {
      setErrorMsg("Standard, bulk, and full-stock unit prices must all be positive values.");
      return;
    }

    // 3. Package Matrix Allocation Validation
    if (matrixSummary.grandTotal !== moq) {
      setErrorMsg(
        `Package allocation total (${matrixSummary.grandTotal} pcs) does not equal MOQ (${moq} pcs). Please balance your Color × Size matrix before saving.`
      );
      return;
    }

    // 4. Shipping Package Profiles Validation
    const shippingVal = validateShippingPackageProfiles(shippingProfiles);
    if (!shippingVal.valid) {
      setErrorMsg(shippingVal.error || "Please verify your shipping package profiles.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Selected Brand resolution
      const effectiveBrandName = brand.trim() || "Ayaan";
      const matchedBrand = availableBrands.find(b => b.name === effectiveBrandName || String(b.id) === String(brandId));
      const effectiveBrandLogo = matchedBrand?.logo_url || matchedBrand?.logo;

      // Build Package Allocations Array
      const flatAllocations: import("@/types/index").PackageAllocation[] = [];
      selectedColors.forEach(c => {
        selectedSizes.forEach(s => {
          const count = matrixAllocations[c]?.[s] || 0;
          if (count > 0) {
            flatAllocations.push({
              product_variant_id: 0,
              quantity: count,
              color: c,
              size: s,
            });
          }
        });
      });

      // Build Variants Array
      const variants: B2BProductVariant[] = [];
      selectedColors.forEach(c => {
        selectedSizes.forEach(s => {
          const varSku = `${sku}-${c.substring(0, 3).toUpperCase()}-${s.toUpperCase()}`;
          const count = matrixAllocations[c]?.[s] || 0;
          const varStock = Math.max(count * 10, Math.floor(stock / (selectedColors.length * selectedSizes.length)));
          variants.push({
            sku: varSku,
            title: `${c} / ${s}`,
            color: c,
            size: s,
            wholesalePrice: wholesalePrice,
            stock: varStock,
            isActive: true,
          });
        });
      });

      // Build Pricing Tiers
      const tiers: import("@/types/index").PricingTier[] = [
        {
          min_quantity: moq,
          max_quantity: bulkThreshold - 1,
          unit_price: wholesalePrice,
        },
        {
          min_quantity: bulkThreshold,
          max_quantity: null,
          unit_price: bulkPrice,
        },
      ];

      const productPayload: B2BProductInput = {
        id: initialData?.id || `prod_${Date.now()}`,
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        sku: sku.trim().toUpperCase(),
        brand: effectiveBrandName,
        brandLogo: effectiveBrandLogo,
        brand_id: matchedBrand?.id ? String(matchedBrand.id) : undefined,
        categoryId: categoryId,
        categories: selectedCategoryIds.map(Number).filter(n => !isNaN(n)),
        audience: audience,
        productType: productType,
        collectionSeason: collectionSeason,
        shortDescription: shortDescription,
        description: description,
        material: material,
        colorName: selectedColors[0] || "Black",
        colorHex: PREDEFINED_PALETTE.find(p => p.name === selectedColors[0])?.hex || "#111827",
        weightGrams: weightGrams,
        videoUrl: videoUrl.trim() || undefined,
        images: images.length > 0 ? images : ["/placeholder.jpg"],
        costPrice: costPrice,
        wholesalePrice: wholesalePrice,
        standardPrice: wholesalePrice,
        bulkThreshold: bulkThreshold,
        bulkPrice: bulkPrice,
        fullStockPrice: fullStockPrice,
        msrpPrice: msrpPrice,
        moq: moq,
        stock: stock,
        status: status,
        isFeatured: isFeatured,
        isNew: isNew,
        isHot: isHot,
        isLimitedDeal: isLimitedDeal,
        isBestDeal: isBestDeal,
        sizes: selectedSizes,
        colors: selectedColors,
        variants: variants,
        pricingTiers: tiers,
        packageAllocations: flatAllocations,
        shippingPackageProfiles: shippingProfiles,
        shipping_package_profiles: shippingProfiles,
        isPackageAssortment: true,
        fullStockQuantity: stock,
      };

      await onSubmit(productPayload);
      router.push("/admin/products");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save product. Please verify your fields.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto pb-16">
      
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-14 z-30 bg-background/95 backdrop-blur-md py-4 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl border border-border hover:bg-secondary text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold uppercase tracking-tight text-foreground">
              {isEdit ? `Edit Product: ${initialData?.name}` : "Create Wholesale Package Product"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Configure wholesale 3-tier pricing, predefined color & size assortment package, inventory, and media.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="px-4 py-2 rounded-full border border-border text-xs font-bold uppercase tracking-wider hover:bg-secondary transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !matrixSummary.isMatch}
            className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={15} />
            <span>{isSubmitting ? "Saving..." : isEdit ? "Update Product" : "Publish Product"}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. BASIC INFORMATION & BRAND SELECTION */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 space-y-6 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <Tag className="text-primary" size={18} />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            1. Basic Product Information & Brand
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground">
              Product Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                }
              }}
              placeholder="e.g. Core Heavyweight Organic Cotton Tee"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground">
              URL Slug <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. core-heavyweight-organic-cotton-tee"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* SKU Generator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                SKU Identifier <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateSku}
                className="text-xs font-bold uppercase tracking-wider text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles size={12} />
                <span>Auto-Generate</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. AYN-TSH-CRW-1001"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm font-mono text-foreground uppercase focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Brand Selection with Inline Brand Creator Modal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                Brand Directory <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsBrandModalOpen(true)}
                className="text-xs font-bold uppercase tracking-wider text-primary hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Add New Brand</span>
              </button>
            </div>

            <select
              value={brand}
              onChange={(e) => {
                const selectedVal = e.target.value;
                setBrand(selectedVal);
                const found = availableBrands.find(b => b.name === selectedVal);
                if (found) setBrandId(found.id);
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {availableBrands.map((b) => (
                <option key={b.id || b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Primary & Multiple Categories with Inline Category Creator Modal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                Primary Category <span className="text-destructive">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="text-xs font-bold uppercase tracking-wider text-primary hover:underline cursor-pointer flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Add New Category</span>
              </button>
            </div>

            <select
              value={categoryId}
              onChange={(e) => {
                const val = e.target.value;
                setCategoryId(val);
                if (!selectedCategoryIds.includes(val)) {
                  setSelectedCategoryIds(prev => [...prev, val]);
                }
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name} {c.parent ? `(${c.parent.name})` : ""}
                </option>
              ))}
            </select>

            {/* Additional Categories Checkbox Pills */}
            {categories.length > 1 && (
              <div className="pt-2 space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Additional Applicable Categories (Multi-Category Assignment):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 rounded-xl bg-secondary/20 border border-border/50">
                  {categories.map((c) => {
                    const cIdStr = String(c.id);
                    const isChecked = selectedCategoryIds.includes(cIdStr);
                    return (
                      <button
                        key={`cat-pill-${c.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryIds(prev => {
                            if (prev.includes(cIdStr)) {
                              if (prev.length === 1) return prev; // keep at least 1
                              return prev.filter(id => id !== cIdStr);
                            }
                            return [...prev, cIdStr];
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 ${
                          isChecked 
                            ? "bg-foreground text-background" 
                            : "bg-background border border-border text-foreground/75 hover:border-foreground/40"
                        }`}
                      >
                        {isChecked && <Check size={10} strokeWidth={3} />}
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground">
              Target Audience
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="UNISEX">UNISEX</option>
              <option value="MEN">MEN</option>
              <option value="WOMEN">WOMEN</option>
              <option value="BOYS">BOYS</option>
              <option value="GIRLS">GIRLS</option>
            </select>
          </div>
        </div>

        {/* Short & Detailed Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground">
              Short Description / Summary
            </label>
            <textarea
              rows={3}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Concise commercial summary for wholesale export..."
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground">
              Technical Description & Fabric Specifications
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Garment details, yarn count, sewing finish, certifications..."
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground">
              Fabric / Material
            </label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="e.g. 100% Combed Cotton, 240 GSM"
              className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground">
              Fabric Weight (Grams / GSM)
            </label>
            <input
              type="number"
              min={10}
              value={weightGrams}
              onChange={(e) => setWeightGrams(parseInt(e.target.value) || 250)}
              className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground">
              Collection / Season
            </label>
            <input
              type="text"
              value={collectionSeason}
              onChange={(e) => setCollectionSeason(e.target.value)}
              placeholder="e.g. 2026 Autumn/Winter"
              className="w-full px-4 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
      </div>

      {/* 2. THREE-PRICE WHOLESALE PRICING MODEL */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 space-y-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <DollarSign className="text-primary" size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              2. Three-Price Wholesale Purchasing Model
            </h2>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            Authoritative Pricing Architecture
          </span>
        </div>

        {/* Warning if Bulk Price >= Standard Price */}
        {bulkPrice >= wholesalePrice && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>
              Warning: Bulk price (${bulkPrice.toFixed(2)}) is equal to or higher than standard MOQ price (${wholesalePrice.toFixed(2)}). Bulk price is expected to provide a volume discount.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* TIER 1: STANDARD VOLUME */}
          <div className="p-4 rounded-xl border-2 border-border/80 bg-background space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Tier 1: Standard Price
              </span>
              <span className="text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                MOQ Range
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Minimum Order Quantity (MOQ)
              </label>
              <input
                type="number"
                min={1}
                required
                value={moq}
                onChange={(e) => setMoq(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2 rounded-lg border border-border bg-card text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Standard Unit Price ($/pc)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-muted-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3.5 py-2 rounded-lg border border-border bg-card text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                />
              </div>
            </div>

            <div className="text-xs text-muted-foreground font-medium pt-1">
              Active for: <strong className="text-foreground">{moq}–{bulkThreshold - 1} pcs</strong>
            </div>
          </div>

          {/* TIER 2: BULK HIGH-VOLUME */}
          <div className="p-4 rounded-xl border-2 border-border/80 bg-background space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Tier 2: Bulk Price
              </span>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                High Volume
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Bulk Threshold Quantity (pcs)
              </label>
              <input
                type="number"
                min={moq + 1}
                required
                value={bulkThreshold}
                onChange={(e) => setBulkThreshold(Math.max(moq + 1, parseInt(e.target.value) || (moq + 1)))}
                className="w-full px-3.5 py-2 rounded-lg border border-border bg-card text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Bulk Unit Price ($/pc)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-muted-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3.5 py-2 rounded-lg border border-border bg-card text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                />
              </div>
            </div>

            <div className="text-xs text-muted-foreground font-medium pt-1 flex items-center justify-between">
              <span>Active for: <strong className="text-foreground">{bulkThreshold}+ pcs</strong></span>
              {wholesalePrice > bulkPrice && (
                <span className="text-primary font-bold">
                  {Math.round(((wholesalePrice - bulkPrice) / wholesalePrice) * 100)}% OFF
                </span>
              )}
            </div>
          </div>

          {/* TIER 3: FULL STOCK PURCHASE */}
          <div className="p-4 rounded-xl border-2 border-border/80 bg-background space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Tier 3: Full-Stock Price
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                Take-All
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Available Inventory Stock (pcs)
              </label>
              <input
                type="number"
                min={moq}
                required
                value={stock}
                onChange={(e) => setStock(Math.max(moq, parseInt(e.target.value) || moq))}
                className="w-full px-3.5 py-2 rounded-lg border border-border bg-card text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-muted-foreground">
                Full-Stock Unit Price ($/pc)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-muted-foreground">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={fullStockPrice}
                  onChange={(e) => setFullStockPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3.5 py-2 rounded-lg border border-border bg-card text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                />
              </div>
            </div>

            <div className="text-xs text-muted-foreground font-medium pt-1 flex items-center justify-between">
              <span>Total Lot: <strong className="text-foreground">{formatPrice(stock * fullStockPrice)}</strong></span>
              {wholesalePrice > fullStockPrice && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {Math.round(((wholesalePrice - fullStockPrice) / wholesalePrice) * 100)}% OFF
                </span>
              )}
            </div>
          </div>

        </div>

        {/* Cost & MSRP Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Estimated Unit Production Cost ($/pc)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-muted-foreground">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-3.5 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Target Suggested Retail Price (MSRP $/pc)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-muted-foreground">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={msrpPrice}
                onChange={(e) => setMsrpPrice(parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-3.5 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. COLOR PALETTE CONFIGURATION & "OTHER" CUSTOM COLOR */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 space-y-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Layers className="text-primary" size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              3. Color Palette Configuration
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Selected: <strong className="text-foreground">{selectedColors.length} colors</strong>
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Select all colors included in the wholesale assortment package. Customers receive a combined package containing all configured colors.
        </p>

        {/* Predefined Palette Pills */}
        <div className="flex flex-wrap gap-2.5">
          {PREDEFINED_PALETTE.map((c) => {
            const isSelected = selectedColors.includes(c.name);
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => handleToggleColor(c.name)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs border ${
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "opacity-80 hover:opacity-100 border-border"
                }`}
                style={{
                  backgroundColor: c.hex,
                  color: c.dark ? "#FFFFFF" : "#111827",
                  borderColor: c.hex === "#FFFFFF" ? "#E2E8F0" : c.hex,
                }}
              >
                {isSelected && <Check size={13} className={c.dark ? "text-white" : "text-black"} />}
                <span>{c.name}</span>
              </button>
            );
          })}

          {/* Render Custom Colors if any */}
          {selectedColors
            .filter(c => !PREDEFINED_PALETTE.some(p => p.name.toLowerCase() === c.toLowerCase()))
            .map(customColor => (
              <div
                key={customColor}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-[#EFECE6] text-black border border-border/80 shadow-xs ring-2 ring-primary ring-offset-2 ring-offset-background"
              >
                <Check size={13} />
                <span>{customColor}</span>
                <button
                  type="button"
                  onClick={() => handleToggleColor(customColor)}
                  className="hover:text-rose-600 ml-1 cursor-pointer"
                  aria-label={`Remove color ${customColor}`}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
        </div>

        {/* "OTHER" Custom Color Input */}
        <div className="pt-2">
          {showCustomColorInput ? (
            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="text"
                value={customColorName}
                onChange={(e) => setCustomColorName(e.target.value)}
                placeholder="Enter custom color name (e.g. Midnight Charcoal)"
                className="flex-1 px-3.5 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="button"
                onClick={handleAddCustomColor}
                className="px-4 py-2 rounded-xl bg-foreground text-background text-xs font-bold uppercase tracking-wider hover:opacity-90 cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowCustomColorInput(false)}
                className="p-2 rounded-xl hover:bg-secondary text-muted-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustomColorInput(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-secondary hover:bg-secondary/80 border border-border text-foreground transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>+ Other Color</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. SIZES & PREDEFINED SIZE SETS */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 space-y-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Package className="text-primary" size={18} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              4. Size Sets & Sizing Configuration
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Selected: <strong className="text-foreground">{selectedSizes.length} sizes</strong>
          </span>
        </div>

        {/* Quick Size Presets */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Quick Size Set Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            {SIZE_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplySizePreset(preset.sizes)}
                className="px-3 py-1.5 rounded-lg border border-border/80 bg-secondary/50 hover:bg-secondary text-xs font-medium text-foreground transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Size Badges */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
            Included Sizes (Click to toggle):
          </span>
          <div className="flex flex-wrap gap-2">
            {["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "28", "30", "32", "34", "36", "38", "ONE SIZE"].map((sz) => {
              const isSelected = selectedSizes.includes(sz);
              return (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleToggleSize(sz)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-foreground text-background border-foreground shadow-xs"
                      : "bg-background text-muted-foreground border-border hover:border-foreground"
                  }`}
                >
                  {sz}
                </button>
              );
            })}

            {/* Custom Sizes */}
            {selectedSizes
              .filter(s => !["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "28", "30", "32", "34", "36", "38", "ONE SIZE"].includes(s))
              .map(cs => (
                <div
                  key={cs}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold bg-foreground text-background border border-foreground"
                >
                  <span>{cs}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleSize(cs)}
                    className="hover:text-rose-400 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Custom Size Addition */}
        <div className="flex items-center gap-2 max-w-xs pt-1">
          <input
            type="text"
            value={customSizeName}
            onChange={(e) => setCustomSizeName(e.target.value)}
            placeholder="Add custom size (e.g. 40, 4XL)"
            className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono uppercase"
          />
          <button
            type="button"
            onClick={handleAddCustomSize}
            className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-xs font-bold uppercase hover:bg-secondary/80 cursor-pointer"
          >
            Add
          </button>
        </div>
      </div>

      {/* 5. PACKAGE ALLOCATION MATRIX (STRICT MOQ VALIDATION) */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Package className="text-primary" size={18} />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                5. Product Package Assortment Matrix
              </h2>
              <p className="text-xs text-muted-foreground">
                Enter quantity distribution per color and size for a single MOQ package ({moq} pcs).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {matrixSummary.isMatch ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 rounded-full">
                <CheckCircle2 size={14} />
                <span>Total: {matrixSummary.grandTotal} / {moq} pcs (Valid)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-3 py-1 rounded-full">
                <AlertCircle size={14} />
                <span>Total: {matrixSummary.grandTotal} / {moq} pcs (Difference: {matrixSummary.diff > 0 ? `+${matrixSummary.diff}` : matrixSummary.diff})</span>
              </span>
            )}
          </div>
        </div>

        {/* Validation Alert */}
        {!matrixSummary.isMatch && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
            <Info size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              Grand allocation total is <strong>{matrixSummary.grandTotal} pcs</strong>. The package matrix grand total must equal product MOQ (<strong>{moq} pcs</strong>) before the product can be saved.
            </span>
          </div>
        )}

        {/* Interactive Matrix Table */}
        <div className="overflow-x-auto border border-border rounded-xl bg-background">
          <table className="w-full text-xs text-left min-w-[400px]">
            <thead className="bg-secondary/70 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="px-4 py-3 font-bold">Color \ Size</th>
                {selectedSizes.map((s) => (
                  <th key={s} className="px-3 py-3 font-bold text-center">{s}</th>
                ))}
                <th className="px-4 py-3 font-bold text-right text-foreground">Color Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {selectedColors.map((c) => (
                <tr key={c} className="hover:bg-secondary/20">
                  <td className="px-4 py-3 font-semibold text-foreground flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                      style={{
                        backgroundColor: PREDEFINED_PALETTE.find(p => p.name === c)?.hex || "#111827"
                      }}
                    />
                    <span>{c}</span>
                  </td>
                  {selectedSizes.map((s) => (
                    <td key={s} className="px-2 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={matrixAllocations[c]?.[s] ?? 0}
                        onChange={(e) => handleCellChange(c, s, e.target.value)}
                        className="w-16 px-2 py-1.5 rounded-lg border border-border bg-card text-center font-mono font-bold text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-mono font-bold text-foreground">
                    {matrixSummary.rowTotals[c] || 0}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-secondary/50 border-t border-border font-bold text-foreground">
              <tr>
                <td className="px-4 py-3 uppercase text-xs">SIZE TOTAL</td>
                {selectedSizes.map((s) => (
                  <td key={s} className="px-3 py-3 text-center font-mono">
                    {matrixSummary.colTotals[s] || 0}
                  </td>
                ))}
                <td className={`px-4 py-3 text-right font-mono text-sm ${matrixSummary.isMatch ? "text-primary font-bold" : "text-amber-600 font-bold"}`}>
                  {matrixSummary.grandTotal} pcs
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 6. SHIPPING & PHYSICAL PACKAGING PROFILES */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Truck className="text-primary" size={18} />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                6. Shipping & Physical Packaging Configuration
              </h2>
              <p className="text-xs text-muted-foreground">
                Authoritative physical packing configuration for order quantities. Total CBM and weights are calculated dynamically.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleAddShippingProfile(moq, 1, `${moq} pcs MOQ Package`)}
              className="px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Box size={13} className="text-primary" />
              <span>+ MOQ ({moq} pcs)</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddShippingProfile(bulkThreshold, Math.max(1, Math.round(bulkThreshold / Math.max(1, moq))), `${bulkThreshold} pcs Bulk Package`)}
              className="px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Box size={13} className="text-primary" />
              <span>+ Bulk ({bulkThreshold} pcs)</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddShippingProfile(stock, Math.max(1, Math.round(stock / Math.max(1, moq))), `${stock} pcs Full Stock Lot`)}
              className="px-3 py-1.5 rounded-lg border border-border bg-secondary text-foreground text-xs font-semibold hover:bg-secondary/80 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Box size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>+ Full Stock ({stock} pcs)</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddShippingProfile()}
              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Custom</span>
            </button>
          </div>
        </div>

        {/* Profiles List */}
        <div className="space-y-4">
          {shippingProfiles.map((profile, idx) => {
            const calculatedCbm = calculateTotalCbm(
              Number(profile.carton_length || 0),
              Number(profile.carton_width || 0),
              Number(profile.carton_height || 0),
              Number(profile.carton_count || 1),
              profile.dimension_unit || "cm"
            );

            return (
              <div 
                key={idx}
                className="p-4 rounded-xl border border-border bg-background space-y-4 relative hover:border-border/80 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Packaging Profile: {profile.package_quantity} pcs {profile.quantity_max ? `to ${profile.quantity_max} pcs` : ""}
                    </span>
                    <span className="text-xs font-mono font-bold bg-primary/15 text-primary px-2.5 py-0.5 rounded-md">
                      {calculatedCbm} CBM
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {shippingProfiles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveShippingProfile(idx)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Remove profile"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {/* Min Quantity */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-muted-foreground">
                      Package Qty (pcs)*
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={profile.package_quantity}
                      onChange={(e) => handleUpdateShippingProfile(idx, { package_quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  {/* Range Max Quantity (Optional) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-muted-foreground">
                      Max Qty (Range)
                    </label>
                    <input
                      type="number"
                      min={profile.package_quantity}
                      placeholder="Exact (optional)"
                      value={profile.quantity_max ?? ""}
                      onChange={(e) => {
                        const val = e.target.value.trim() === "" ? null : Math.max(profile.package_quantity, parseInt(e.target.value) || profile.package_quantity);
                        handleUpdateShippingProfile(idx, { quantity_max: val });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  {/* Carton Count */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-muted-foreground">
                      Carton Count*
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={profile.carton_count}
                      onChange={(e) => handleUpdateShippingProfile(idx, { carton_count: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  {/* Carton Dimensions: L x W x H */}
                  <div className="space-y-1 col-span-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase text-muted-foreground">
                        Carton L × W × H*
                      </label>
                      <select
                        value={profile.dimension_unit || "cm"}
                        onChange={(e) => handleUpdateShippingProfile(idx, { dimension_unit: e.target.value as any })}
                        className="text-[10px] uppercase font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5 border-0 focus:ring-0 cursor-pointer"
                      >
                        <option value="cm">cm</option>
                        <option value="in">inch</option>
                        <option value="m">m</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="L"
                        title="Length"
                        required
                        value={profile.carton_length}
                        onChange={(e) => handleUpdateShippingProfile(idx, { carton_length: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 rounded-lg border border-border bg-card text-center text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="W"
                        title="Width"
                        required
                        value={profile.carton_width}
                        onChange={(e) => handleUpdateShippingProfile(idx, { carton_width: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 rounded-lg border border-border bg-card text-center text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="H"
                        title="Height"
                        required
                        value={profile.carton_height}
                        onChange={(e) => handleUpdateShippingProfile(idx, { carton_height: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 rounded-lg border border-border bg-card text-center text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  {/* Gross & Net Weights */}
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase text-muted-foreground">
                        Gross / Net ({profile.weight_unit || "kg"})*
                      </label>
                      <select
                        value={profile.weight_unit || "kg"}
                        onChange={(e) => handleUpdateShippingProfile(idx, { weight_unit: e.target.value as any })}
                        className="text-[10px] uppercase font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5 border-0 focus:ring-0 cursor-pointer"
                      >
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="Gross"
                        title="Gross Weight (Total shipment weight)"
                        required
                        value={profile.gross_weight}
                        onChange={(e) => handleUpdateShippingProfile(idx, { gross_weight: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2 py-1.5 rounded-lg border border-border bg-card text-center text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        placeholder="Net (opt)"
                        title="Net Weight (Goods only)"
                        value={profile.net_weight ?? ""}
                        onChange={(e) => handleUpdateShippingProfile(idx, { net_weight: e.target.value.trim() === "" ? null : parseFloat(e.target.value) || null })}
                        className="w-full px-2 py-1.5 rounded-lg border border-border bg-card text-center text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile Notes & Computed CBM summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-border/40 text-xs">
                  <div className="md:col-span-3 flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase text-muted-foreground shrink-0">Notes:</span>
                    <input
                      type="text"
                      placeholder="e.g. 1 Export Master Carton (Double Wall Corrugated)"
                      value={profile.notes || ""}
                      onChange={(e) => handleUpdateShippingProfile(idx, { notes: e.target.value })}
                      className="w-full px-3 py-1 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 text-[11px] text-muted-foreground font-mono">
                    <span>Volumetric:</span>
                    <strong className="text-foreground">{calculatedCbm} CBM</strong>
                    <span>({profile.carton_count} ctn × {(calculatedCbm / Math.max(1, profile.carton_count)).toFixed(4)} m³)</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Informative Guidance Banner */}
        <div className="p-3.5 rounded-xl bg-secondary/60 border border-border text-xs text-muted-foreground flex items-start gap-2.5">
          <Info size={16} className="text-primary shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground">
              Authoritative Packaging Calculations Rule:
            </p>
            <p>
              CBM is computed centrally as <code className="text-foreground font-mono font-bold">Carton Count × (L × W × H)</code> in cubic meters. During buyer quotation and checkout, shipping weight and volume are resolved strictly from these profiles.
            </p>
          </div>
        </div>
      </div>

      {/* 7. MEDIA & YOUTUBE VIDEO */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 space-y-6 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <ImageIcon className="text-primary" size={18} />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            7. Product Images & YouTube Review Video
          </h2>
        </div>

        {/* Images Upload & URL inputs */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                placeholder="Paste image URL (https://...)"
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-xs font-bold uppercase hover:bg-secondary/80 cursor-pointer"
              >
                Add Image
              </button>
            </div>

            <label className="px-4 py-2.5 rounded-xl bg-foreground text-background text-xs font-bold uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-xs min-h-[44px]">
              <Upload size={14} />
              <span>{isUploading ? "Uploading..." : "Upload Product Image"}</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Canonical 3:4 Portrait Helper Notice */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-1 px-1">
            <p className="font-medium text-foreground/85">
              Recommended format: 3:4 portrait
            </p>
            <p className="text-[11px] text-muted-foreground">
              Direct phone camera photos accepted (presented safely in canonical 3:4 frame)
            </p>
          </div>

          {/* Images Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-border bg-secondary group shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`Product thumbnail ${idx + 1}`} className="w-full h-full object-cover object-center" />
                {idx === 0 && (
                  <span className="absolute top-1.5 left-1.5 text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-xs">
                    Primary
                  </span>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  {idx !== 0 && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryImage(idx)}
                      className="px-2 py-1 rounded bg-white text-black text-xs font-bold uppercase cursor-pointer"
                    >
                      Make Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="p-1.5 rounded-full bg-rose-600 text-white cursor-pointer hover:bg-rose-700"
                    aria-label="Remove image"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* YouTube Video URL Field */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Play size={14} className="text-rose-600 fill-current" />
              <span>YouTube Product Video Review URL (Optional)</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Paste a YouTube watch or share URL. When provided, a dedicated video review button will appear on the product page.
            </p>
          </div>

          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/dQw4w9WgXcQ"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />

          {parsedYoutubeId && (
            <div className="p-3 rounded-xl bg-secondary/40 border border-border flex items-center gap-3">
              <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                Valid YouTube Video ID: {parsedYoutubeId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 8. PUBLISHING STATUS & STOREFRONT FLAGS */}
      <div className="p-6 rounded-2xl bg-card border border-border/80 space-y-6 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <ShieldCheck className="text-primary" size={18} />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            8. Storefront Visibility & Merchandising Flags
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-foreground">
              Publication Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="published">Published (Live Storefront)</option>
              <option value="draft">Draft (Hidden)</option>
              <option value="unpublished">Archived</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-background cursor-pointer hover:bg-secondary/40 transition-colors">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded text-primary focus:ring-primary"
            />
            <span className="text-xs font-semibold text-foreground">Featured</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-background cursor-pointer hover:bg-secondary/40 transition-colors">
            <input
              type="checkbox"
              checked={isHot}
              onChange={(e) => setIsHot(e.target.checked)}
              className="rounded text-primary focus:ring-primary"
            />
            <span className="text-xs font-semibold text-foreground">Hot Sale</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-background cursor-pointer hover:bg-secondary/40 transition-colors">
            <input
              type="checkbox"
              checked={isNew}
              onChange={(e) => setIsNew(e.target.checked)}
              className="rounded text-primary focus:ring-primary"
            />
            <span className="text-xs font-semibold text-foreground">New Arrival</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-background cursor-pointer hover:bg-secondary/40 transition-colors">
            <input
              type="checkbox"
              checked={isLimitedDeal}
              onChange={(e) => setIsLimitedDeal(e.target.checked)}
              className="rounded text-primary focus:ring-primary"
            />
            <span className="text-xs font-semibold text-foreground">Limited Deal</span>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border bg-background cursor-pointer hover:bg-secondary/40 transition-colors">
            <input
              type="checkbox"
              checked={isBestDeal}
              onChange={(e) => setIsBestDeal(e.target.checked)}
              className="rounded text-primary focus:ring-primary"
            />
            <span className="text-xs font-semibold text-foreground">Best Deal</span>
          </label>
        </div>
      </div>

      {/* Form Bottom Bar */}
      <div className="flex items-center justify-between pt-4">
        <Link
          href="/admin/products"
          className="px-6 py-2.5 rounded-full border border-border text-xs font-bold uppercase tracking-wider hover:bg-secondary transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting || !matrixSummary.isMatch}
          className="px-8 py-3 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-display"
        >
          <Save size={16} />
          <span>{isSubmitting ? "Saving Product..." : isEdit ? "Save Changes" : "Create Product"}</span>
        </button>
      </div>

      {/* INLINE BRAND CREATION MODAL */}
      <BrandModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        onSuccess={(created) => {
          setAvailableBrands((prev) => {
            if (prev.some((b) => String(b.id) === String(created.id) || b.name === created.name)) return prev;
            return [...prev, created];
          });
          setBrand(created.name);
          setBrandId(created.id);
        }}
        defaultSortOrder={availableBrands.length + 1}
      />

      {/* INLINE CATEGORY CREATION MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-sm uppercase text-foreground">
                Add New Apparel Category
              </h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            {inlineCatError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold">
                {inlineCatError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">
                  Category Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Denim Jackets, Knitwear"
                  value={inlineCatName}
                  onChange={(e) => {
                    setInlineCatName(e.target.value);
                    if (!inlineCatSlug) {
                      setInlineCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/30 text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">
                  Slug / Identifier (Optional)
                </label>
                <input
                  type="text"
                  placeholder="denim-jackets"
                  value={inlineCatSlug}
                  onChange={(e) => setInlineCatSlug(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/30 text-foreground font-mono outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">
                  Parent Category (Hierarchy)
                </label>
                <select
                  value={inlineCatParentId}
                  onChange={(e) => setInlineCatParentId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-card text-foreground outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">None (Top Level)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
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
                  <div className="w-12 h-10 rounded-lg bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0">
                    {inlineCatImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={inlineCatImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={18} className="text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      placeholder="Image URL or upload"
                      value={inlineCatImage}
                      onChange={(e) => setInlineCatImage(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-border bg-secondary/30 text-foreground text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-secondary hover:bg-card text-[11px] font-bold cursor-pointer transition-colors">
                      <Upload size={11} />
                      <span>{inlineCatUploading ? "Uploading..." : "Upload Image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setInlineCatUploading(true);
                          try {
                            const res = await uploadProductImage(file);
                            if (res.url) setInlineCatImage(res.url);
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setInlineCatUploading(false);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-border text-xs font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={inlineCatLoading || !inlineCatName.trim()}
                  onClick={handleInlineCategorySubmit}
                  className="px-6 py-2 rounded-full bg-foreground text-background text-xs font-bold uppercase hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
                >
                  {inlineCatLoading ? "Creating..." : "Create & Select Category"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </form>
  );
}
