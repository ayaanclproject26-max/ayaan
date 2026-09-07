import { apiClient } from "./api-client";
import { Category } from "@/types";
import { isFrontendOnly } from "@/lib/frontend-mode";
import { mockStore } from "@/lib/mock-data/mock-store";

export interface CategoryModel extends Category {
  parent_id?: number | string | null;
  accent_color?: string;
  sort_order?: number;
  is_active?: boolean;
  image_url?: string;
  parent?: CategoryModel | null;
  children?: CategoryModel[];
  products_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryQueryParams {
  all?: boolean;
  isAdmin?: boolean;
  search?: string;
}

export class CategoryService {
  /**
   * Fetch categories
   */
  async getCategories(options?: CategoryQueryParams): Promise<CategoryModel[]> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.get<any>("/categories", options as any);
        const items = Array.isArray(res) ? res : res?.data;
        if (Array.isArray(items) && items.length > 0) {
          return items;
        }
      } catch {
        // Fallback to local store
      }
    }

    let list = mockStore.getCategories();
    if (!options?.isAdmin && !options?.all) {
      list = list.filter((c) => c.is_active !== false);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
    }
    return list;
  }

  /**
   * Fetch single category by slug or id
   */
  async getCategoryBySlug(slugOrId: string): Promise<CategoryModel | null> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.get<any>(`/categories/${slugOrId}`);
        const item = res?.data || res;
        if (item && item.id) return item;
      } catch {
        // Fallback
      }
    }

    return mockStore.getCategoryBySlug(slugOrId);
  }

  /**
   * Create category
   */
  async createCategory(data: Partial<CategoryModel>): Promise<CategoryModel> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.post<any>("/categories", data);
        const item = res?.data || res;
        if (item && item.id) return item;
      } catch {
        // Fallback
      }
    }

    return mockStore.saveCategory(data);
  }

  /**
   * Update category
   */
  async updateCategory(id: number | string, data: Partial<CategoryModel>): Promise<CategoryModel> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.put<any>(`/categories/${id}`, data);
        const item = res?.data || res;
        if (item && item.id) return item;
      } catch {
        // Fallback
      }
    }

    return mockStore.saveCategory({ ...data, id: String(id) });
  }

  /**
   * Delete category
   */
  async deleteCategory(id: number | string): Promise<boolean> {
    if (!isFrontendOnly()) {
      try {
        await apiClient.delete<any>(`/categories/${id}`);
      } catch {
        // Fallback
      }
    }

    return mockStore.deleteCategory(id);
  }
}

export const categoryService = new CategoryService();
