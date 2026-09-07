import { apiClient } from "./api-client";
import { isFrontendOnly } from "@/lib/frontend-mode";
import { mockStore } from "@/lib/mock-data/mock-store";

export interface BrandModel {
  id: string | number;
  name: string;
  slug: string;
  logo?: string;
  logo_url?: string;
  website?: string | null;
  sort_order?: number;
  is_active?: boolean;
  products_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BrandQueryParams {
  all?: boolean;
  isAdmin?: boolean;
  search?: string;
}

export class BrandService {
  /**
   * Fetch brands
   */
  async getBrands(options?: BrandQueryParams): Promise<BrandModel[]> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.get<any>("/brands", options as any);
        const items = Array.isArray(res) ? res : res?.data;
        if (Array.isArray(items) && items.length > 0) {
          return items;
        }
      } catch {
        // Fallback
      }
    }

    let list = mockStore.getBrands();
    if (!options?.isAdmin && !options?.all) {
      list = list.filter((b) => b.is_active !== false);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter((b) => b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q));
    }
    return list;
  }

  /**
   * Fetch single brand by slug or id
   */
  async getBrandBySlug(slugOrId: string): Promise<BrandModel | null> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.get<any>(`/brands/${slugOrId}`);
        const item = res?.data || res;
        if (item && item.id) return item;
      } catch {
        // Fallback
      }
    }

    return mockStore.getBrandBySlug(slugOrId);
  }

  /**
   * Create brand
   */
  async createBrand(data: {
    name: string;
    slug?: string;
    logo?: string;
    logo_url?: string;
    website?: string | null;
    sort_order?: number;
    is_active?: boolean;
  }): Promise<BrandModel> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.post<any>("/brands", data);
        const item = res?.data || res;
        if (item && item.id) return item;
      } catch {
        // Fallback
      }
    }

    return mockStore.saveBrand(data);
  }

  /**
   * Update brand
   */
  async updateBrand(id: string | number, updates: Partial<BrandModel>): Promise<BrandModel> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.put<any>(`/brands/${id}`, updates);
        const item = res?.data || res;
        if (item && item.id) return item;
      } catch {
        // Fallback
      }
    }

    return mockStore.saveBrand({ ...updates, id: String(id) });
  }

  /**
   * Delete brand
   */
  async deleteBrand(id: string | number): Promise<boolean> {
    if (!isFrontendOnly()) {
      try {
        await apiClient.delete<any>(`/brands/${id}`);
      } catch {
        // Fallback
      }
    }

    return mockStore.deleteBrand(id);
  }
}

export const brandService = new BrandService();
