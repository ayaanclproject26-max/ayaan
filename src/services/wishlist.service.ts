import { apiClient } from "./api-client";
import { Product } from "@/types";
import { isFrontendOnly } from "@/lib/frontend-mode";

export interface WishlistItemData {
  id: string;
  wishlist_id: string;
  product_id: string;
  product: Product;
  created_at?: string;
}

export interface WishlistData {
  id: string;
  user_id: string;
  items_count: number;
  items: WishlistItemData[];
}

export class WishlistService {
  private localKey = "ayaan_wishlist";

  /**
   * Get user's wishlist
   */
  async getWishlist(): Promise<WishlistItemData[]> {
    if (!isFrontendOnly()) {
      try {
        if (apiClient.getToken()) {
          const res = await apiClient.get<any>("/wishlist");
          const data = res?.data || res;
          if (data && Array.isArray(data.items)) {
            const items = data.items.map(this.normalizeWishlistItem);
            this.saveLocal(items);
            return items;
          }
        }
      } catch {
        // Local fallback
      }
    }

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(this.localKey);
        if (saved) {
          return JSON.parse(saved);
        }
      } catch {
        // Ignore
      }
    }

    return [];
  }

  /**
   * Add product to wishlist
   */
  async addToWishlist(product: Product): Promise<WishlistItemData[]> {
    if (!isFrontendOnly()) {
      try {
        if (apiClient.getToken()) {
          const res = await apiClient.post<any>("/wishlist", {
            product_id: product.id,
          });
          const data = res?.data || res;
          if (data && Array.isArray(data.items)) {
            const items = data.items.map(this.normalizeWishlistItem);
            this.saveLocal(items);
            return items;
          }
        }
      } catch {
        // Local fallback
      }
    }

    const current = await this.getWishlist();
    if (!current.some((i) => i.product_id === String(product.id))) {
      const newItem: WishlistItemData = {
        id: `w_${Date.now()}`,
        wishlist_id: "local",
        product_id: String(product.id),
        product,
        created_at: new Date().toISOString(),
      };
      const updated = [newItem, ...current];
      this.saveLocal(updated);
      return updated;
    }

    return current;
  }

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(productId: string): Promise<WishlistItemData[]> {
    if (!isFrontendOnly()) {
      try {
        if (apiClient.getToken()) {
          const res = await apiClient.delete<any>(`/wishlist/${productId}`);
          const data = res?.data || res;
          if (data && Array.isArray(data.items)) {
            const items = data.items.map(this.normalizeWishlistItem);
            this.saveLocal(items);
            return items;
          }
        }
      } catch {
        // Local fallback
      }
    }

    const current = await this.getWishlist();
    const updated = current.filter((i) => i.product_id !== String(productId));
    this.saveLocal(updated);
    return updated;
  }

  private normalizeWishlistItem(raw: any): WishlistItemData {
    const rawProd = raw.product || {};
    const images = Array.isArray(rawProd.images) && rawProd.images.length > 0
      ? rawProd.images
      : [rawProd.image || "/placeholder.jpg"];

    const price = rawProd.price !== undefined
      ? Number(rawProd.price)
      : Number(rawProd.wholesale_price) || 0;

    const product: Product = {
      id: String(rawProd.id || raw.product_id || ""),
      name: rawProd.name || "Product",
      slug: rawProd.slug || "product",
      price: price,
      oldPrice: rawProd.oldPrice ?? rawProd.msrp_price ?? null,
      categoryId: rawProd.categoryId || "c_sweaters",
      images: images,
      brand: rawProd.brand || "Ayaan",
      color: rawProd.color || rawProd.color_name,
      sku: rawProd.sku || "",
      sizes: rawProd.sizes || ["One Size"],
      isHot: Boolean(rawProd.isHot || rawProd.is_hot),
      isNew: Boolean(rawProd.isNew || rawProd.is_new),
    };

    return {
      id: String(raw.id || `w_${Date.now()}`),
      wishlist_id: String(raw.wishlist_id || "1"),
      product_id: String(raw.product_id || product.id),
      product,
      created_at: raw.created_at || new Date().toISOString(),
    };
  }

  private saveLocal(items: WishlistItemData[]) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(this.localKey, JSON.stringify(items));
        window.dispatchEvent(new CustomEvent("ayaan:wishlist-updated", { detail: items }));
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Clear local storage cache
   */
  clearLocal() {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(this.localKey);
        window.dispatchEvent(new CustomEvent("ayaan:wishlist-updated", { detail: [] }));
      } catch {
        // Ignore
      }
    }
  }
}

export const wishlistService = new WishlistService();
