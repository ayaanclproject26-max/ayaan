import initialProducts from "@/data/products.json";
import { Product } from "@/types";
import { B2BProductInput, B2BProductVariant } from "@/types/b2b";
import { insforge } from "../insforge/client";

const STORAGE_KEY = "ayaan_b2b_products_db";

/**
 * Normalizes a raw product object into full B2B product structure
 */
function normalizeToB2BProduct(p: any): B2BProductInput {
  const images = Array.isArray(p.images) && p.images.length > 0 
    ? p.images 
    : [p.image_url || p.image || "/placeholder.jpg"];

  let audienceVal: "MEN" | "WOMEN" | "BOYS" | "GIRLS" | "UNISEX" = "UNISEX";
  const catId = (p.categoryId || p.category_id || "").toLowerCase();
  if (catId.includes("men") && !catId.includes("women")) audienceVal = "MEN";
  else if (catId.includes("women")) audienceVal = "WOMEN";
  else if (catId.includes("boys")) audienceVal = "BOYS";
  else if (catId.includes("girls")) audienceVal = "GIRLS";
  else if (p.audience) audienceVal = p.audience;

  return {
    id: p.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: p.name || "Untitled Product",
    slug: p.slug || (p.name || "prod").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    sku: p.sku || `AYN-${Date.now().toString(36).toUpperCase()}`,
    brand: p.brand || "Ayaan",
    categoryId: p.categoryId || p.category_id || "c_tops",
    categoryName: p.categoryName || p.category || "Tops",
    audience: audienceVal,
    productType: p.productType || "Apparel",
    collectionSeason: p.collectionSeason || "2026 Core Collection",
    shortDescription: p.shortDescription || p.short_description || "",
    description: p.description || "",
    material: p.material || "100% Cotton",
    colorName: p.colorName || p.color_name || p.color || "Black",
    colorHex: p.colorHex || "#111827",
    weightGrams: p.weightGrams || 250,
    videoUrl: p.videoUrl || "",
    images: images,
    costPrice: p.costPrice || (p.price ? p.price * 0.6 : 10),
    wholesalePrice: p.wholesalePrice || (p.price_cents ? p.price_cents / 100 : p.price || 15),
    msrpPrice: p.msrpPrice || (p.compare_at_price_cents ? p.compare_at_price_cents / 100 : p.oldPrice || (p.price ? p.price * 1.6 : 25)),
    moq: p.moq || 50,
    stock: p.stock !== undefined ? p.stock : (p.inventory_count !== undefined ? p.inventory_count : 500),
    status: p.status === "draft" || p.status === "archived" || p.status === "unpublished" ? (p.status as any) : "published",
    isFeatured: Boolean(p.isFeatured || p.featured),
    isNew: Boolean(p.isNew),
    isHot: Boolean(p.isHot),
    isLimitedDeal: Boolean(p.isLimitedDeal),
    isBestDeal: Boolean(p.isBestDeal),
    sizes: p.sizes || ["S", "M", "L", "XL", "2XL"],
    colors: p.colors || [p.color || "Black"],
    variants: p.variants || [],
  };
}

/**
 * Initializes and retrieves in-memory/persisted product database
 */
export function getStoredProducts(): B2BProductInput[] {
  if (typeof window === "undefined") {
    return (initialProducts as any[]).map(normalizeToB2BProduct);
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Fallback to initial
  }

  const initialList = (initialProducts as any[]).map(normalizeToB2BProduct);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialList));
  } catch {
    // Storage full or unavailable
  }
  return initialList;
}

/**
 * Saves products to local persistent state and syncs to InsForge
 */
function persistProducts(list: B2BProductInput[]) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Ignore
    }
  }
}

/**
 * Generate a clean standard B2B SKU from brand, category, and name
 */
export function generateProductSku(brand: string, category: string, name: string): string {
  const b = (brand || "AYN").replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
  const c = (category || "GEN").replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
  const n = (name || "PRD").replace(/[^a-zA-Z0-9]/g, "").substring(0, 3).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${b}-${c}-${n}-${rand}`;
}

/**
 * Fetch all products with filtering and pagination
 */
export async function getProducts(options?: {
  isAdmin?: boolean;
  search?: string;
  brand?: string;
  audience?: string;
  category?: string;
  status?: string;
}): Promise<B2BProductInput[]> {
  const all = getStoredProducts();

  return all.filter((p) => {
    // Storefront only gets "published" products
    if (!options?.isAdmin && p.status !== "published") {
      return false;
    }

    if (options?.status && options.status !== "all" && p.status !== options.status) {
      return false;
    }

    if (options?.brand && options.brand !== "all") {
      if (p.brand.toLowerCase() !== options.brand.toLowerCase()) return false;
    }

    if (options?.audience && options.audience !== "all") {
      if (p.audience.toUpperCase() !== options.audience.toUpperCase()) return false;
    }

    if (options?.category && options.category !== "all") {
      const pCat = (p.categoryName || p.categoryId || "").toLowerCase();
      if (!pCat.includes(options.category.toLowerCase())) return false;
    }

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      const match =
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
}

/**
 * Fetch single product by Slug or ID
 */
export async function getProductBySlugOrId(slugOrId: string): Promise<B2BProductInput | null> {
  const all = getStoredProducts();
  const found = all.find((p) => p.slug === slugOrId || p.id === slugOrId);
  return found || null;
}

/**
 * Create a new product in the database
 */
export async function createProduct(input: B2BProductInput): Promise<B2BProductInput> {
  const all = getStoredProducts();
  const id = input.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const slug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const sku = input.sku || generateProductSku(input.brand, input.categoryName || "APP", input.name);

  // Generate variants if custom sizes & colors are provided but no variant records exist
  let variants = input.variants || [];
  if (variants.length === 0 && input.sizes && input.sizes.length > 0) {
    const colors = input.colors && input.colors.length > 0 ? input.colors : [input.colorName || "Standard"];
    for (const c of colors) {
      for (const s of input.sizes) {
        variants.push({
          sku: `${sku}-${c.substring(0, 3).toUpperCase()}-${s.toUpperCase()}`,
          title: `${c} / ${s}`,
          color: c,
          size: s,
          wholesalePrice: input.wholesalePrice,
          stock: Math.floor(input.stock / (colors.length * input.sizes.length)) || 50,
          isActive: true,
        });
      }
    }
  }

  const newProduct: B2BProductInput = {
    ...input,
    id,
    slug,
    sku,
    variants,
  };

  const updatedList = [newProduct, ...all];
  persistProducts(updatedList);

  // Async sync to InsForge DB
  try {
    await insforge.database.from("products").insert([{
      name: newProduct.name,
      slug: newProduct.slug,
      sku: newProduct.sku,
      price_cents: Math.round(newProduct.wholesalePrice * 100),
      compare_at_price_cents: newProduct.msrpPrice ? Math.round(newProduct.msrpPrice * 100) : null,
      inventory_count: newProduct.stock,
      status: newProduct.status === "published" ? "active" : "draft",
      material: newProduct.material,
      color_name: newProduct.colorName,
      badge: newProduct.isHot ? "Hot" : (newProduct.isNew ? "New" : null),
      image_url: newProduct.images[0],
      description: newProduct.description,
      short_description: newProduct.shortDescription,
    }]);
  } catch (err) {
    console.warn("Async InsForge DB sync warning:", err);
  }

  return newProduct;
}

/**
 * Update an existing product
 */
export async function updateProduct(id: string, updates: Partial<B2BProductInput>): Promise<B2BProductInput | null> {
  const all = getStoredProducts();
  const index = all.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const existing = all[index];
  const updated: B2BProductInput = {
    ...existing,
    ...updates,
  };

  all[index] = updated;
  persistProducts(all);

  // Async sync to InsForge DB
  try {
    await insforge.database.from("products").update({
      name: updated.name,
      slug: updated.slug,
      sku: updated.sku,
      price_cents: Math.round(updated.wholesalePrice * 100),
      compare_at_price_cents: updated.msrpPrice ? Math.round(updated.msrpPrice * 100) : null,
      inventory_count: updated.stock,
      status: updated.status === "published" ? "active" : "draft",
      material: updated.material,
      color_name: updated.colorName,
      description: updated.description,
      image_url: updated.images[0],
    }).eq("sku", updated.sku);
  } catch (err) {
    console.warn("Async InsForge DB update warning:", err);
  }

  return updated;
}

/**
 * Duplicate a product (clones with unique SKU and slug in Draft status)
 */
export async function duplicateProduct(id: string): Promise<B2BProductInput | null> {
  const all = getStoredProducts();
  const source = all.find((p) => p.id === id);
  if (!source) return null;

  const timestamp = Date.now();
  const clone: B2BProductInput = {
    ...source,
    id: `prod_${timestamp}_copy`,
    name: `${source.name} (Copy)`,
    slug: `${source.slug}-copy-${Math.random().toString(36).substring(2, 6)}`,
    sku: generateProductSku(source.brand, source.categoryName || "APP", `${source.name} Copy`),
    status: "draft",
    variants: (source.variants || []).map((v) => ({
      ...v,
      sku: `${v.sku}-COPY`,
    })),
  };

  const updatedList = [clone, ...all];
  persistProducts(updatedList);
  return clone;
}

/**
 * Delete a product
 */
export async function deleteProduct(id: string): Promise<boolean> {
  const all = getStoredProducts();
  const filtered = all.filter((p) => p.id !== id);
  persistProducts(filtered);

  try {
    await insforge.database.from("products").delete().eq("id", id);
  } catch {
    // Ignore
  }
  return true;
}

/**
 * Toggle product publish status
 */
export async function togglePublishStatus(
  id: string, 
  newStatus: "published" | "draft" | "unpublished"
): Promise<B2BProductInput | null> {
  return updateProduct(id, { status: newStatus });
}
