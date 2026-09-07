import categoriesData from "@/data/categories.json";
import productsData from "@/data/products.json";

/**
 * Baseline data seeder info for development
 */
export async function seedInitialDataIfNeeded(): Promise<{ categoriesSeeded: number; productsSeeded: number }> {
  return {
    categoriesSeeded: categoriesData.length,
    productsSeeded: productsData.length,
  };
}
