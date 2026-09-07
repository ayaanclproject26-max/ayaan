import { 
  productService, 
  normalizeToB2BProduct, 
  toStorefrontProduct, 
  generateProductSku, 
  ProductQueryParams,
  SearchSuggestionsResult,
  PaginatedProductsResult
} from "@/services/product.service";
import { B2BProductInput } from "@/types/b2b";

export { normalizeToB2BProduct, toStorefrontProduct, generateProductSku };
export type { ProductQueryParams, SearchSuggestionsResult, PaginatedProductsResult };

export async function getProducts(options?: ProductQueryParams): Promise<B2BProductInput[]> {
  return productService.getProducts(options);
}

export async function getProductsPaginated(
  options: ProductQueryParams,
  signal?: AbortSignal
): Promise<PaginatedProductsResult> {
  return productService.getProductsPaginated(options, signal);
}

export async function getProductBySlugOrId(slugOrId: string): Promise<B2BProductInput | null> {
  return productService.getProductBySlugOrId(slugOrId);
}

export async function getSearchSuggestions(query: string): Promise<SearchSuggestionsResult> {
  return productService.getSearchSuggestions(query);
}

export async function createProduct(input: B2BProductInput): Promise<B2BProductInput> {
  return productService.createProduct(input);
}

export async function updateProduct(id: string, updates: Partial<B2BProductInput>): Promise<B2BProductInput | null> {
  return productService.updateProduct(id, updates);
}

export async function duplicateProduct(id: string): Promise<B2BProductInput | null> {
  const source = await getProductBySlugOrId(id);
  if (!source) return null;

  const clone: B2BProductInput = {
    ...source,
    id: `prod_${Date.now()}_copy`,
    name: `${source.name} (Copy)`,
    slug: `${source.slug}-copy-${Math.random().toString(36).substring(2, 6)}`,
    sku: generateProductSku(source.brand, source.categoryName || "APP", `${source.name} Copy`),
    status: "draft",
  };

  return createProduct(clone);
}

export async function deleteProduct(id: string): Promise<boolean> {
  return productService.deleteProduct(id);
}

export async function togglePublishStatus(
  id: string, 
  newStatus: "published" | "draft" | "unpublished"
): Promise<B2BProductInput | null> {
  return updateProduct(id, { status: newStatus });
}

export async function getProductShippingSpecs(
  slugOrId: string,
  quantity: number,
  isFullStock: boolean = false
): Promise<any> {
  return productService.getProductShippingSpecs(slugOrId, quantity, isFullStock);
}
