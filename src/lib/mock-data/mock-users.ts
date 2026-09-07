import { User } from "@/types/api";

export interface MockUserData extends User {
  password: string;
}

export const INITIAL_MOCK_USERS: MockUserData[] = [
  // 1. Retail Customer
  {
    id: 101,
    name: "Sarah Jenkins",
    email: "testuser@example.com",
    password: "testpass",
    role: "customer",
    phone: "+1-555-0199",
    company_name: "Jenkins Apparel Boutique",
    tax_id: "US-TAX-89210",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    b2b_approval_status: "approved",
    b2b_payment_terms: "none",
    b2b_credit_limit: 5000,
    created_at: "2026-01-15T10:00:00Z",
  },
  // 2. B2B Wholesale Buyer
  {
    id: 102,
    name: "Marcus Vance",
    email: "buyer@ayaanclothing.com",
    password: "password",
    role: "b2b_buyer",
    phone: "+44 20 7946 0912",
    company_name: "Vance & Co Retail Ltd",
    tax_id: "GB987654321",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    b2b_approval_status: "approved",
    b2b_payment_terms: "net_30",
    b2b_credit_limit: 50000,
    created_at: "2026-02-01T12:00:00Z",
  },
  // 3. Admin User
  {
    id: 1,
    name: "Ayaan Admin",
    email: "admin@ayaanclothing.com",
    password: "admin123",
    role: "admin",
    phone: "+8801826304930",
    company_name: "Ayaan Clothing Exporter Ltd",
    tax_id: "BD-EXP-2010",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    b2b_approval_status: "approved",
    b2b_payment_terms: "net_60",
    b2b_credit_limit: 250000,
    created_at: "2026-01-01T00:00:00Z",
  },
];
