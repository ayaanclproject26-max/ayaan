import { AUDIENCE_CATEGORIES, PRODUCT_CATEGORIES } from "../filters";

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  audience?: string;
  description?: string;
}

export const CANONICAL_CATEGORIES: CategoryInfo[] = [
  { id: "c_sweaters", name: "Sweaters", slug: "sweaters", description: "Knits, pullovers, cardigans" },
  { id: "c_tshirts", name: "T-Shirts", slug: "t-shirts", description: "Crew neck, oversized, graphic tees" },
  { id: "c_hoodies", name: "Hoodies", slug: "hoodies", description: "Fleece, zip-up, pullover hoodies" },
  { id: "c_trousers", name: "Trousers", slug: "trousers", description: "Chinos, formal, joggers" },
  { id: "c_pants", name: "Pants", slug: "pants", description: "Jeans, cargo, denim" },
  { id: "c_shorts", name: "Shorts", slug: "shorts", description: "Casual, board, athletic shorts" },
  { id: "c_shirts", name: "Shirts", slug: "shirts", description: "Button-down, oxford, polo shirts" },
  { id: "c_beachwear", name: "Beachwear", slug: "beachwear", description: "Swimsuits, trunks, coverups" },
  { id: "c_socks", name: "Socks", slug: "socks", description: "Ankle, crew, athletic socks" },
  { id: "c_blouse", name: "Blouse", slug: "blouse", description: "Silk, chiffon, formal tops" },
  { id: "c_tanktop", name: "Tank Top", slug: "tank-top", description: "Ribbed, athletic, casual tanks" },
  { id: "c_tops", name: "Tops", slug: "tops", description: "General tops and tees" },
  { id: "c_sports", name: "Sports", slug: "sports", description: "Activewear, performance, gym wear" },
  { id: "c_towels", name: "Towels", slug: "towels", description: "Bath, face, beach towels" },
];

export function getCategories(): CategoryInfo[] {
  try {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ayaan_custom_categories");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return [...CANONICAL_CATEGORIES, ...parsed];
        }
      }
    }
  } catch {
    // Ignore
  }
  return CANONICAL_CATEGORIES;
}

export function getAudiences() {
  return AUDIENCE_CATEGORIES;
}
