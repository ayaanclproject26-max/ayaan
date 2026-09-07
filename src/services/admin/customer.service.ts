import { apiClient } from "@/services/api-client";
import { isFrontendOnly } from "@/lib/frontend-mode";
import { mockStore } from "@/lib/mock-data/mock-store";

export interface CustomerRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  company_name?: string;
  tax_id?: string;
  b2b_approval_status?: "pending" | "approved" | "rejected" | string;
  b2b_payment_terms?: "none" | "net_30" | "net_60" | "terms" | string;
  b2b_credit_limit?: number;
  avatar_url?: string;
  orders_count: number;
  quotes_count: number;
  total_spent: number;
  created_at: string;
}

export interface CustomerDetail extends CustomerRecord {
  addresses?: Array<{
    id: number;
    name: string;
    address1: string;
    city: string;
    postal_code: string;
    country_code: string;
    is_default: boolean;
  }>;
  recent_orders?: Array<{
    id: number;
    order_number: string;
    total_amount: number;
    status: string;
    payment_status: string;
    created_at: string;
  }>;
  recent_quotes?: Array<{
    id: number;
    rfq_number: string;
    request_title?: string;
    status: string;
    created_at: string;
  }>;
}

export interface CustomerQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  role?: string;
  sort?: string;
  direction?: "asc" | "desc";
}

export class AdminCustomerService {
  async getCustomers(params?: CustomerQueryParams): Promise<{
    data: CustomerRecord[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  }> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.get<any>("/admin/customers", params as any);
        const paginated = res?.data || res;
        if (paginated && Array.isArray(paginated.data)) {
          return paginated;
        }
      } catch {
        // Fallback
      }
    }

    const users = mockStore.getUsers().filter((u) => u.role === "customer" || u.role === "b2b_buyer");
    const orders = mockStore.getOrders();
    const rfqs = mockStore.getRfqs();

    let list: CustomerRecord[] = users.map((u) => {
      const userOrders = orders.filter((o) => String(o.user_id) === String(u.id) || o.email.toLowerCase() === u.email.toLowerCase());
      const userSpent = userOrders.reduce((sum, o) => sum + (o.payment_status === "paid" ? o.total_amount : 0), 0);
      const userRfqs = rfqs.filter((r) => r.buyerEmail.toLowerCase() === u.email.toLowerCase());

      return {
        id: Number(u.id),
        name: u.name,
        email: u.email,
        role: u.role || "customer",
        phone: u.phone,
        company_name: u.company_name,
        tax_id: u.tax_id,
        b2b_approval_status: u.b2b_approval_status || "approved",
        b2b_payment_terms: u.b2b_payment_terms || (u.role === "b2b_buyer" ? "net_30" : "none"),
        b2b_credit_limit: u.b2b_credit_limit || 50000,
        avatar_url: u.avatar_url,
        orders_count: userOrders.length,
        quotes_count: userRfqs.length,
        total_spent: Math.round(userSpent * 100) / 100,
        created_at: u.created_at || "2026-01-01T00:00:00Z",
      };
    });

    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.company_name?.toLowerCase().includes(q));
    }
    if (params?.role && params.role !== "all") {
      list = list.filter((c) => c.role === params.role);
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

  async getCustomerById(id: number | string): Promise<CustomerDetail> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.get<any>(`/admin/customers/${id}`);
        const data = res?.data || res;
        if (data && data.id) return data;
      } catch {
        // Fallback
      }
    }

    const user = mockStore.getUserById(id);
    if (!user) {
      throw new Error("Customer not found");
    }

    const orders = mockStore.getOrders().filter((o) => String(o.user_id) === String(id) || o.email.toLowerCase() === user.email.toLowerCase());
    const rfqs = mockStore.getRfqs().filter((r) => r.buyerEmail.toLowerCase() === user.email.toLowerCase());
    const totalSpent = orders.reduce((sum, o) => sum + (o.payment_status === "paid" ? o.total_amount : 0), 0);

    return {
      id: Number(user.id),
      name: user.name,
      email: user.email,
      role: user.role || "customer",
      phone: user.phone,
      company_name: user.company_name,
      tax_id: user.tax_id,
      b2b_approval_status: user.b2b_approval_status || "approved",
      b2b_payment_terms: user.b2b_payment_terms || (user.role === "b2b_buyer" ? "net_30" : "none"),
      b2b_credit_limit: user.b2b_credit_limit || 50000,
      avatar_url: user.avatar_url,
      orders_count: orders.length,
      quotes_count: rfqs.length,
      total_spent: Math.round(totalSpent * 100) / 100,
      created_at: user.created_at || "2026-01-01T00:00:00Z",
      addresses: [
        {
          id: 1,
          name: user.name,
          address1: "Commercial Export Office, Suite 100",
          city: "London",
          postal_code: "W1D 1BS",
          country_code: "GB",
          is_default: true,
        },
      ],
      recent_orders: orders.slice(0, 5).map((o, idx) => ({
        id: idx + 1,
        order_number: o.order_number,
        total_amount: o.total_amount,
        status: o.status,
        payment_status: o.payment_status,
        created_at: o.created_at,
      })),
      recent_quotes: rfqs.slice(0, 5).map((r, idx) => ({
        id: idx + 1,
        rfq_number: r.rfqNumber,
        request_title: r.requestTitle,
        status: r.status,
        created_at: r.createdAt,
      })),
    };
  }

  async updateCustomer(id: number | string, data: Partial<CustomerRecord>): Promise<CustomerRecord> {
    if (!isFrontendOnly()) {
      try {
        const res = await apiClient.put<any>(`/admin/customers/${id}`, data);
        const item = res?.data || res;
        if (item && item.id) return item;
      } catch {
        // Fallback
      }
    }

    const roleVal = (data.role === "admin" || data.role === "b2b_buyer" || data.role === "sales" || data.role === "customer") ? data.role : undefined;
    const approvalVal = (data.b2b_approval_status === "approved" || data.b2b_approval_status === "pending" || data.b2b_approval_status === "rejected") ? data.b2b_approval_status : undefined;
    const termsVal = (data.b2b_payment_terms === "none" || data.b2b_payment_terms === "net_30" || data.b2b_payment_terms === "net_60" || data.b2b_payment_terms === "terms") ? data.b2b_payment_terms : undefined;
    const updated = mockStore.saveUser({
      ...data,
      id: Number(id),
      role: roleVal,
      b2b_approval_status: approvalVal,
      b2b_payment_terms: termsVal,
    });
    return {
      id: Number(updated.id),
      name: updated.name,
      email: updated.email,
      role: updated.role || "customer",
      phone: updated.phone,
      company_name: updated.company_name,
      tax_id: updated.tax_id,
      b2b_approval_status: updated.b2b_approval_status,
      b2b_payment_terms: updated.b2b_payment_terms,
      b2b_credit_limit: updated.b2b_credit_limit,
      avatar_url: updated.avatar_url,
      orders_count: 1,
      quotes_count: 1,
      total_spent: 4320.00,
      created_at: updated.created_at || new Date().toISOString(),
    };
  }
}

export const adminCustomerService = new AdminCustomerService();
