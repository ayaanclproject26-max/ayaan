"use client";

import { useState, useEffect } from "react";
import { 
  adminCustomerService, 
  CustomerRecord, 
  CustomerDetail 
} from "@/services/admin";
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  ShieldCheck, 
  ShoppingBag, 
  DollarSign, 
  RefreshCw, 
  Building, 
  Mail, 
  Phone, 
  FileText,
  Edit2
} from "lucide-react";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  // Filter & Search
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");

  // Selected customer for detail modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<string>("");
  const [editingApprovalStatus, setEditingApprovalStatus] = useState<string>("approved");
  const [editingPaymentTerms, setEditingPaymentTerms] = useState<string>("net_30");
  const [editingTaxId, setEditingTaxId] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await adminCustomerService.getCustomers({
        page,
        per_page: perPage,
        search: search || undefined,
        role: role !== "all" ? role : undefined,
      });
      setCustomers(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [page, search, role]);

  const handleOpenDetail = async (id: number) => {
    setDetailLoading(true);
    setSelectedCustomer(null);
    try {
      const detail = await adminCustomerService.getCustomerById(id);
      setSelectedCustomer(detail);
      setEditingRole(detail.role);
      setEditingApprovalStatus(detail.b2b_approval_status || "approved");
      setEditingPaymentTerms(detail.b2b_payment_terms || "net_30");
      setEditingTaxId(detail.tax_id || "");
    } catch (err) {
      console.error("Failed to load customer details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateB2bSettings = async () => {
    if (!selectedCustomer) return;
    try {
      await adminCustomerService.updateCustomer(selectedCustomer.id, {
        role: editingRole,
        b2b_approval_status: editingApprovalStatus,
        b2b_payment_terms: editingPaymentTerms,
        tax_id: editingTaxId.trim() || undefined,
      });
      setFeedback(`Account & B2B settings updated for ${selectedCustomer.name}`);
      setSelectedCustomer(null);
      loadCustomers();
    } catch (err) {
      console.error("Failed to update B2B settings:", err);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
            Customer Directory & Accounts
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage wholesale clients, retail customers, order histories, and corporate profiles.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCustomers}
          className="p-2 rounded-full border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors self-start sm:self-auto"
          title="Refresh Customers"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="hover:underline">✕</button>
        </div>
      )}

      {/* Search & Role Filter */}
      <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Name, Email, Phone, or Company Name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-1 focus:ring-primary outline-none w-full sm:w-auto"
        >
          <option value="all">All Roles</option>
          <option value="customer">Retail Customer</option>
          <option value="b2b_buyer">B2B Wholesale Buyer</option>
          <option value="sales">Sales Representative</option>
          <option value="admin">System Administrator</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="bg-card border border-border/70 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-muted-foreground uppercase text-xs font-bold tracking-wider">
                <th className="py-3 px-4">Customer Account</th>
                <th className="py-3 px-3">Company</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3 text-right">Orders</th>
                <th className="py-3 px-3 text-right">Total Spent</th>
                <th className="py-3 px-3 text-right">RFQs</th>
                <th className="py-3 px-3">Registered</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading customer directory...</span>
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/30 transition-colors font-medium">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-foreground block">{c.name}</span>
                        <span className="text-xs text-muted-foreground block">{c.email}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-muted-foreground">
                      {c.company_name || "—"}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        c.role === "admin"
                          ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                          : c.role === "b2b_buyer"
                          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                          : "bg-secondary border border-border text-foreground"
                      }`}>
                        {c.role}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right text-muted-foreground">
                      {c.orders_count || 0}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-foreground">
                      ${Number(c.total_spent || 0).toFixed(2)}
                    </td>

                    <td className="py-3 px-3 text-right text-muted-foreground">
                      {c.quotes_count || 0}
                    </td>

                    <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(c.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-foreground hover:text-background text-foreground text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Eye size={12} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    No customers match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > perPage && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, total)} of {total} accounts
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg border border-border disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page * perPage >= total}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded-lg border border-border disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail & Role Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-base uppercase text-foreground">
                  Customer Profile
                </h3>
                <span className="text-xs text-muted-foreground">{selectedCustomer.email}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                <span className="text-xs font-bold uppercase text-muted-foreground block">Full Name</span>
                <span className="font-bold text-foreground">{selectedCustomer.name}</span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                <span className="text-xs font-bold uppercase text-muted-foreground block">Company</span>
                <span className="font-bold text-foreground">{selectedCustomer.company_name || "—"}</span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                <span className="text-xs font-bold uppercase text-muted-foreground block">Total Orders</span>
                <span className="font-bold text-foreground">{selectedCustomer.orders_count}</span>
              </div>
              <div className="p-3 rounded-xl bg-secondary/30 border border-border">
                <span className="text-xs font-bold uppercase text-muted-foreground block">Total Spend</span>
                <span className="font-bold text-foreground">${Number(selectedCustomer.total_spent).toFixed(2)}</span>
              </div>
            </div>

            {/* Account & B2B Configuration */}
            <div className="p-5 rounded-2xl bg-secondary/20 border border-border space-y-4 text-xs">
              <span className="font-bold uppercase tracking-wider text-foreground block">
                Account Privileges & B2B Verification
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Account Role</label>
                  <select
                    value={editingRole}
                    onChange={(e) => setEditingRole(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-card text-foreground font-bold focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="customer">Retail Customer (Standard)</option>
                    <option value="b2b_buyer">B2B Wholesale Buyer</option>
                    <option value="sales">Sales Representative</option>
                    <option value="admin">System Administrator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">B2B Approval Status</label>
                  <select
                    value={editingApprovalStatus}
                    onChange={(e) => setEditingApprovalStatus(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-card text-foreground font-bold focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="approved">Approved (Active Wholesale)</option>
                    <option value="pending">Pending Verification</option>
                    <option value="rejected">Rejected / Denied</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Commercial Payment Terms</label>
                  <select
                    value={editingPaymentTerms}
                    onChange={(e) => setEditingPaymentTerms(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-card text-foreground font-bold focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="none">None (Immediate Payment / Card)</option>
                    <option value="net_30">Net 30 Days Credit</option>
                    <option value="net_60">Net 60 Days Credit</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Corporate Tax ID / VAT</label>
                  <input
                    type="text"
                    placeholder="e.g. US-TAX-98214"
                    value={editingTaxId}
                    onChange={(e) => setEditingTaxId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-card text-foreground font-mono focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleUpdateB2bSettings}
                  className="px-6 py-2 rounded-full bg-foreground text-background font-bold uppercase text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  Save Account Settings
                </button>
              </div>
            </div>


            {/* Recent Orders */}
            <div className="space-y-2 text-xs">
              <span className="font-bold uppercase tracking-wider text-muted-foreground block">
                Recent Order History ({selectedCustomer.recent_orders?.length || 0})
              </span>
              {selectedCustomer.recent_orders && selectedCustomer.recent_orders.length > 0 ? (
                <div className="divide-y divide-border/60 border border-border rounded-xl overflow-hidden bg-card">
                  {selectedCustomer.recent_orders.map((ord) => (
                    <div key={ord.id} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-foreground">{ord.order_number}</span>
                        <span className="text-xs text-muted-foreground block">{new Date(ord.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-foreground block">${Number(ord.total_amount).toFixed(2)}</span>
                        <span className="text-xs uppercase font-bold text-muted-foreground">{ord.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">No orders recorded for this customer.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
