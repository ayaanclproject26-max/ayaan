import { BRANDS, Brand } from "@/components/home/ShopByBrand";

// In-memory / persistent registry for brands (canonical 43 brands + admin created brands)
let customBrands: Brand[] = [];

export function getBrands(): Brand[] {
  try {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ayaan_custom_brands");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          customBrands = parsed;
        }
      }
    }
  } catch {
    // Ignore storage error
  }

  // Combine canonical brands + custom brands (no duplicate IDs)
  const combined = [...BRANDS];
  for (const cb of customBrands) {
    if (!combined.some((b) => b.id === cb.id || b.slug === cb.slug)) {
      combined.push(cb);
    }
  }
  return combined;
}

export function createBrand(name: string, logo?: string, slug?: string): Brand {
  const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const id = generatedSlug;
  const newBrand: Brand = {
    id,
    name,
    slug: generatedSlug,
    logo: logo || "/brands/generic.png",
  };

  const existing = getBrands();
  if (!existing.some((b) => b.id === id)) {
    customBrands.push(newBrand);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("ayaan_custom_brands", JSON.stringify(customBrands));
      } catch {
        // Ignore storage error
      }
    }
  }
  return newBrand;
}

export function updateBrand(id: string, updates: Partial<Brand>): Brand | null {
  const all = getBrands();
  const target = all.find((b) => b.id === id);
  if (!target) return null;

  Object.assign(target, updates);
  if (!customBrands.some((b) => b.id === id)) {
    customBrands.push(target);
  } else {
    customBrands = customBrands.map((b) => (b.id === id ? { ...b, ...updates } : b));
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("ayaan_custom_brands", JSON.stringify(customBrands));
    } catch {
      // Ignore
    }
  }
  return target;
}
