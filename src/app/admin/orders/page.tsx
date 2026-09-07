"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  adminOrderService, 
  AdminOrderQueryParams 
} from "@/services/admin";
import { OrderRecord, OrderItemRecord } from "@/services/order.service";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  ArrowUpDown
} from "lucide-react";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  // Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [fulfillmentStatus, setFulfillmentStatus] = useState("all");

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await adminOrderService.getOrders({
        page,
        per_page: perPage,
        search: search || undefined,
        status: status !== "all" ? status : undefined,
        payment_status: paymentStatus !== "all" ? paymentStatus : undefined,
        fulfillment_status: fulfillmentStatus !== "all" ? fulfillmentStatus : undefined,
      });

      setOrders(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page, search, status, paymentStatus, fulfillmentStatus]);

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "delivered":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
      case "processing":
      case "shipped":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400";
      case "cancelled":
      case "refunded":
        return "bg-rose-500/15 text-rose-600 dark:text-rose-400";
      default:
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
            Order & Fulfillment Management
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time pipeline of retail & wholesale orders, fulfillment processing, and offline payment verification.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          className="p-2 rounded-full border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors self-start sm:self-auto"
          title="Refresh Orders"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Order #, Customer Name, Email, or Shipping Address..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="all">All Order Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentStatus}
            onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={fulfillmentStatus}
            onChange={(e) => { setFulfillmentStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="all">All Fulfillment</option>
            <option value="unfulfilled">Unfulfilled</option>
            <option value="partial">Partial</option>
            <option value="fulfilled">Fulfilled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border/70 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-muted-foreground uppercase text-xs font-bold tracking-wider">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3 text-right">Items</th>
                <th className="py-3 px-3 text-right">Total Amount</th>
                <th className="py-3 px-3 text-center">Payment</th>
                <th className="py-3 px-3 text-center">Fulfillment</th>
                <th className="py-3 px-3 text-center">Order Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading orders...</span>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((ord) => {
                  const itemCount = ord.items?.reduce((sum: number, it: OrderItemRecord) => sum + (it.quantity || 1), 0) || ord.items?.length || 0;
                  const hasProof = !!ord.payment_proof_url && ord.payment_status === "pending";


                  return (
                    <tr key={ord.id} className="hover:bg-secondary/30 transition-colors font-medium">
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="font-mono font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                        >
                          <span>{ord.order_number}</span>
                          {hasProof && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" title="Payment proof attached" />
                          )}
                        </Link>
                      </td>

                      <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                        {new Date(ord.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-foreground block truncate max-w-[180px]">
                          {ord.shipping_name || ord.user?.name || "Customer"}
                        </span>
                        <span className="text-xs text-muted-foreground block truncate max-w-[180px]">
                          {ord.email || ord.user?.email || "—"}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right text-muted-foreground">
                        {itemCount} pcs
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-foreground">
                        ${Number(ord.total_amount).toFixed(2)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          ord.payment_status === "paid"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : ord.payment_status === "pending"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        }`}>
                          {ord.payment_status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          ord.fulfillment_status === "fulfilled"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-secondary text-muted-foreground border border-border"
                        }`}>
                          {ord.fulfillment_status || "unfulfilled"}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(ord.status)}`}>
                          {ord.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/orders/${ord.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-foreground hover:text-background text-foreground text-xs font-bold transition-colors"
                        >
                          <Eye size={12} />
                          <span>Review</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-muted-foreground">
                    No orders match your filter criteria.
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
              Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, total)} of {total} orders
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
    </div>
  );
}
