import { apiClient } from "./api-client";
import { Product } from "@/types";
import { isFrontendOnly } from "@/lib/frontend-mode";

export interface CartItemData {
  id?: string;
  cart_id?: string;
  product_id?: string;
  product_variant_id?: string | null;
  product: Product;
  size: string;
  color?: string;
  quantity: number;
  unit_price?: number;
  line_total?: number;
  package_breakdown?: import("@/types").PackageBreakdown[];
}

export interface CartData {
  id?: string;
  user_id?: string | null;
  session_id?: string | null;
  items: CartItemData[];
  total_items: number;
  subtotal: number;
  currency?: string;
}

export class CartService {
  private localKey = "ayaan_cart";

  /**
   * Calculate active unit price based on 3-tier volume pricing.
   * Reads stock from all field aliases used by B2BProductInput and storefront Product.
   */
  private calculateTierUnitPrice(product: Product, quantity: number): number {
    const basePrice = Number(product.wholesalePrice ?? (product as any).standardPrice ?? product.price ?? 15);
    const bulkThreshold = product.bulkThreshold ? Number(product.bulkThreshold) : 200;
    const bulkPrice = product.bulkPrice ? Number(product.bulkPrice) : Math.round(basePrice * 0.8 * 100) / 100;
    const fullStockPrice = product.fullStockPrice ? Number(product.fullStockPrice) : Math.round(basePrice * 0.7 * 100) / 100;
    // Resolve stock from all possible field names used by different data sources
    const availableStock =
      Number(product.availableStock ?? (product as any).fullStockQuantity ?? (product as any).stock ?? 1000) || 1000;

    if (quantity >= availableStock) {
      return fullStockPrice;
    } else if (quantity >= bulkThreshold) {
      return bulkPrice;
    }
    return basePrice;
  }

  /**
   * Get user's active cart
   */
  async getCart(): Promise<CartData> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.get<any>("/cart");
        const data = res?.data || res;
        if (data && Array.isArray(data.items)) {
          return {
            id: data.id,
            user_id: data.user_id,
            session_id: data.session_id,
            items: data.items.map((i: any) => this.normalizeCartItem(i)),
            total_items: data.total_items ?? data.items.reduce((s: number, i: any) => s + (i.quantity || 1), 0),
            subtotal: data.subtotal ?? data.items.reduce((s: number, i: any) => s + (i.line_total || (i.product?.price || 0) * (i.quantity || 1)), 0),
            currency: data.currency || "USD",
          };
        }
      } catch {
        // Fallback
      }
    }

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(this.localKey);
        if (saved) {
          const rawItems = JSON.parse(saved);
          if (Array.isArray(rawItems)) {
            const items = rawItems.map((i: any) => this.normalizeCartItem(i));
            const total_items = items.reduce((sum, item) => sum + item.quantity, 0);
            const subtotal = items.reduce((sum, item) => sum + ((item.unit_price || item.product.price) * item.quantity), 0);
            return { items, total_items, subtotal, currency: "USD" };
          }
        }
      } catch {
        // Ignore
      }
    }

    return { items: [], total_items: 0, subtotal: 0, currency: "USD" };
  }

  /**
   * Add item to cart
   */
  async addToCart(
    product: Product,
    size: string,
    quantity: number = 1,
    variantId?: string,
    packageBreakdown?: import("@/types").PackageBreakdown[]
  ): Promise<CartData> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.post<any>("/cart", {
          product_id: product.id,
          variant_id: variantId,
          size: size || "Standard Assorted",
          quantity,
          package_breakdown: packageBreakdown,
        });

        const data = res?.data || res;
        if (data && Array.isArray(data.items)) {
          const cart: CartData = {
            id: data.id,
            user_id: data.user_id,
            session_id: data.session_id,
            items: data.items.map((i: any) => this.normalizeCartItem(i)),
            total_items: data.total_items ?? data.items.reduce((s: number, i: any) => s + (i.quantity || 1), 0),
            subtotal: data.subtotal ?? data.items.reduce((s: number, i: any) => s + (i.line_total || (i.product?.price || 0) * (i.quantity || 1)), 0),
            currency: data.currency || "USD",
          };
          this.saveLocal(cart.items);
          return cart;
        }
      } catch {
        // Fallback
      }
    }

    const currentCart = await this.getCart();
    const items = [...currentCart.items];
    const existingIndex = items.findIndex(
      (item) => String(item.product.id) === String(product.id) && item.size === (size || "Standard Assorted")
    );

    const unitPrice = this.calculateTierUnitPrice(product, quantity);

    if (existingIndex > -1) {
      const newQty = items[existingIndex].quantity + quantity;
      const newUnitPrice = this.calculateTierUnitPrice(product, newQty);
      items[existingIndex].quantity = newQty;
      items[existingIndex].unit_price = newUnitPrice;
      items[existingIndex].line_total = newUnitPrice * newQty;
      if (packageBreakdown) items[existingIndex].package_breakdown = packageBreakdown;
    } else {
      items.push({
        id: `ci_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        product,
        size: size || "Standard Assorted",
        quantity,
        unit_price: unitPrice,
        line_total: unitPrice * quantity,
        package_breakdown: packageBreakdown,
      });
    }

    this.saveLocal(items);
    const total_items = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + ((item.unit_price || item.product.price) * item.quantity), 0);
    return { items, total_items, subtotal, currency: "USD" };
  }

  /**
   * Update item quantity in cart
   */
  async updateItemQuantity(itemId: string, quantity: number): Promise<CartData> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.put<any>(`/cart/items/${itemId}`, { quantity });
        const data = res?.data || res;
        if (data && Array.isArray(data.items)) {
          const cart: CartData = {
            id: data.id,
            user_id: data.user_id,
            session_id: data.session_id,
            items: data.items.map((i: any) => this.normalizeCartItem(i)),
            total_items: data.total_items ?? data.items.reduce((s: number, i: any) => s + (i.quantity || 1), 0),
            subtotal: data.subtotal ?? data.items.reduce((s: number, i: any) => s + (i.line_total || (i.product?.price || 0) * (i.quantity || 1)), 0),
            currency: data.currency || "USD",
          };
          this.saveLocal(cart.items);
          return cart;
        }
      } catch {
        // Fallback
      }
    }

    const currentCart = await this.getCart();
    let items = [...currentCart.items];

    if (quantity <= 0) {
      items = items.filter((item) => item.id !== itemId && String(item.product.id) !== itemId);
    } else {
      const idx = items.findIndex((item) => item.id === itemId || String(item.product.id) === itemId);
      if (idx > -1) {
        const product = items[idx].product;
        const newUnitPrice = this.calculateTierUnitPrice(product, quantity);
        items[idx].quantity = quantity;
        items[idx].unit_price = newUnitPrice;
        items[idx].line_total = newUnitPrice * quantity;
      }
    }

    this.saveLocal(items);
    const total_items = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce((sum, item) => sum + ((item.unit_price || item.product.price) * item.quantity), 0);
    return { items, total_items, subtotal, currency: "USD" };
  }

  /**
   * Remove item from cart by ID or Product ID + Size
   */
  async removeFromCart(productId: string, size?: string, itemId?: string): Promise<CartData> {
    const targetId = itemId || productId;
    return this.updateItemQuantity(targetId, 0);
  }

  /**
   * Update quantity alias for CartContext
   */
  async updateQuantity(productId: string, size: string, quantity: number, itemId?: string): Promise<CartData> {
    const targetId = itemId || productId;
    return this.updateItemQuantity(targetId, quantity);
  }

  /**
   * Remove item from cart
   */
  async removeItem(itemId: string): Promise<CartData> {
    return this.updateItemQuantity(itemId, 0);
  }

  /**
   * Merge guest cart upon user login
   */
  async mergeGuestCart(): Promise<CartData | null> {
    return this.getCart();
  }

  /**
   * Clear all items from cart
   */
  async clearCart(): Promise<CartData> {
    if (!isFrontendOnly()) {
      try {
        await apiClient.delete("/cart").catch(() => null);
      } catch {
        // Fallback
      }
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(this.localKey);
        window.dispatchEvent(new CustomEvent("ayaan:cart-updated", { detail: [] }));
      } catch {
        // Ignore
      }
    }

    return { items: [], total_items: 0, subtotal: 0, currency: "USD" };
  }

  private normalizeCartItem(raw: any): CartItemData {
    const rawProd = raw.product || {};
    const images = Array.isArray(rawProd.images) && rawProd.images.length > 0
      ? rawProd.images
      : [rawProd.image_url || rawProd.image || "/placeholder.jpg"];

    const price = rawProd.price !== undefined
      ? Number(rawProd.price)
      : Number(rawProd.wholesale_price) || 15;

    const product: Product = {
      id: String(rawProd.id || raw.product_id || ""),
      name: rawProd.name || "Product",
      slug: rawProd.slug || "product",
      price: price,
      oldPrice: rawProd.oldPrice ?? rawProd.msrp_price ?? null,
      wholesalePrice: rawProd.wholesalePrice ?? rawProd.wholesale_price ?? price,
      standardPrice: rawProd.standardPrice ?? rawProd.wholesale_price ?? price,
      bulkThreshold: rawProd.bulkThreshold ?? rawProd.bulk_threshold ?? 200,
      bulkPrice: rawProd.bulkPrice ?? rawProd.bulk_price ?? Math.round(price * 0.8 * 100) / 100,
      fullStockPrice: rawProd.fullStockPrice ?? rawProd.full_stock_price ?? Math.round(price * 0.7 * 100) / 100,
      categoryId: rawProd.categoryId || "c_sweaters",
      images: images,
      brand: rawProd.brand || "Ayaan",
      color: rawProd.color || rawProd.color_name,
      sku: rawProd.sku || "",
      sizes: rawProd.sizes || ["One Size"],
      moq: rawProd.moq ? Number(rawProd.moq) : 10,
      availableStock: rawProd.stock || rawProd.availableStock || 1000,
    };

    const quantity = Number(raw.quantity) || 1;
    const unitPrice = raw.unit_price !== undefined
      ? Number(raw.unit_price)
      : this.calculateTierUnitPrice(product, quantity);

    return {
      id: String(raw.id || `ci_${Date.now()}`),
      cart_id: raw.cart_id,
      product_id: String(raw.product_id || product.id),
      product_variant_id: raw.product_variant_id,
      product,
      size: raw.size || "Standard Assorted",
      color: raw.color,
      quantity,
      unit_price: unitPrice,
      line_total: raw.line_total !== undefined ? Number(raw.line_total) : unitPrice * quantity,
      package_breakdown: raw.package_breakdown,
    };
  }

  private saveLocal(items: CartItemData[]) {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(this.localKey, JSON.stringify(items));
        window.dispatchEvent(new CustomEvent("ayaan:cart-updated", { detail: items }));
      } catch {
        // Ignore
      }
    }
  }
}

export const cartService = new CartService();
