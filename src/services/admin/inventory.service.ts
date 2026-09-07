import { apiClient } from "@/services/api-client";
import { isFrontendOnly } from "@/lib/frontend-mode";
import { mockStore } from "@/lib/mock-data/mock-store";

export interface InventoryRecord {
  id: number;
  product_variant_id: number;
  warehouse_id: number;
  quantity: number;
  reserved_quantity: number;
  created_at: string;
  updated_at: string;
  variant?: {
    id: number;
    sku: string;
    title: string;
    size?: string;
    color?: string;
    stock: number;
    product?: {
      id: number;
      name: string;
      slug: string;
      sku: string;
      wholesale_price: number;
      images?: Array<{ id: number; image_url: string }>;
    };
  };
  warehouse?: {
    id: number;
    name: string;
    code: string;
  };
  adjustments?: Array<{
    id: number;
    previous_quantity: number;
    adjustment_amount: number;
    resulting_quantity: number;
    reason: string;
    created_at: string;
    admin_user?: {
      id: number;
      name: string;
      email: string;
    };
  }>;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address?: string;
  city?: string;
  country_code: string;
  is_active: boolean;
  inventories_count?: number;
}

export interface InventoryQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  warehouse_id?: number | string;
  low_stock?: boolean;
  sort?: string;
  direction?: "asc" | "desc";
}

export interface InventoryAdjustmentPayload {
  inventory_id?: number;
  variant_id?: number;
  warehouse_id?: number;
  adjustment_amount?: number;
  new_quantity?: number;
  reason: string;
}

export class AdminInventoryService {
  async getInventory(params?: InventoryQueryParams): Promise<{
    data: InventoryRecord[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  }> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.get<any>("/admin/inventory", params as any);
        const paginated = res?.data || res;
        if (paginated && Array.isArray(paginated.data)) {
          return paginated;
        }
      } catch {
        // Fallback
      }
    }

    let list = mockStore.getInventory();
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((i) => i.variant?.title.toLowerCase().includes(q) || i.variant?.sku.toLowerCase().includes(q));
    }
    if (params?.warehouse_id && params.warehouse_id !== "all") {
      list = list.filter((i) => String(i.warehouse_id) === String(params.warehouse_id));
    }
    if (params?.low_stock) {
      list = list.filter((i) => i.quantity < 200);
    }

    const page = params?.page ?? 1;
    const perPage = params?.per_page ?? 20;
    const start = (page - 1) * perPage;
    const sliced = list.slice(start, start + perPage);

    return {
      data: sliced,
      current_page: page,
      last_page: Math.max(1, Math.ceil(list.length / perPage)),
      total: list.length,
      per_page: perPage,
    };
  }

  async adjustInventory(payload: InventoryAdjustmentPayload): Promise<any> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.post<any>("/admin/inventory/adjust", payload);
        const data = res?.data || res;
        if (data) return data;
      } catch {
        // Fallback
      }
    }

    return mockStore.adjustInventory(payload);
  }

  async getWarehouses(): Promise<Warehouse[]> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.get<any>("/admin/warehouses");
        const data = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(data) && data.length > 0) return data;
      } catch {
        // Fallback
      }
    }

    return mockStore.getWarehouses();
  }

  async createWarehouse(data: Partial<Warehouse>): Promise<Warehouse> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.post<any>("/admin/warehouses", data);
        const item = res?.data || res;
        if (item && item.id) return item;
      } catch {
        // Fallback
      }
    }

    return mockStore.createWarehouse(data);
  }
}

export const adminInventoryService = new AdminInventoryService();
