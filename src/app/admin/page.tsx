"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { adminDashboardService, DashboardMetrics } from "@/services/admin";
import { 
  Package, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Truck, 
  FileText, 
  ArrowUpRight, 
  RefreshCw,
  Plus
} from "lucide-react";

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminDashboardService.getMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 bg-secondary/60 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 bg-card border border-border/70 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-8 bg-card border border-destructive/30 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-12">
        <AlertTriangle size={36} className="text-destructive mx-auto" />
        <h2 className="text-lg font-bold uppercase text-foreground">Dashboard Unavailable</h2>
        <p className="text-xs text-muted-foreground">{error || "Could not retrieve live metrics."}</p>
        <button
          type="button"
          onClick={fetchMetrics}
          className="px-5 py-2.5 rounded-full bg-foreground text-background text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 hover:opacity-90"
        >
          <RefreshCw size={14} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
            Executive Command Center
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time B2B enterprise operations, wholesale inventory velocity, and order pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchMetrics}
            className="p-2 rounded-full border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw size={15} />
          </button>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-foreground text-background font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-sm"
          >
            <Plus size={15} />
            <span>New Product</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-muted-foreground">
              Total Revenue
            </span>
            <DollarSign size={16} className="text-emerald-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-display font-bold text-foreground block tabular-nums">
            ${Number(metrics.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs font-sans text-muted-foreground block">Paid & Delivered Volume</span>
        </div>

        {/* Orders */}
        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-muted-foreground">
              Total Orders
            </span>
            <ShoppingBag size={16} className="text-primary" />
          </div>
          <span className="text-2xl sm:text-3xl font-display font-bold text-foreground block tabular-nums">
            {metrics.total_orders}
          </span>
          <div className="flex items-center gap-2 text-xs font-sans text-muted-foreground">
            <span>{metrics.pending_orders} pending</span>
            <span>•</span>
            <span>{metrics.processing_orders} processing</span>
          </div>
        </div>

        {/* Products */}
        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-muted-foreground">
              Catalog Items
            </span>
            <Package size={16} className="text-indigo-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-display font-bold text-foreground block tabular-nums">
            {metrics.total_products}
          </span>
          <span className="text-xs font-sans text-emerald-600 dark:text-emerald-400 block font-semibold">
            {metrics.active_products} Published (Live)
          </span>
        </div>

        {/* Customers */}
        <div className="p-5 rounded-2xl bg-card border border-border/70 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-muted-foreground">
              Registered Accounts
            </span>
            <Users size={16} className="text-amber-500" />
          </div>
          <span className="text-2xl sm:text-3xl font-display font-bold text-foreground block tabular-nums">
            {metrics.total_customers}
          </span>
          <span className="text-xs font-sans text-muted-foreground block">Wholesale & Retail Buyers</span>
        </div>
      </div>

      {/* Secondary Operational Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/70 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Clock size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground block">{metrics.pending_orders} Orders</span>
            <span className="text-xs text-muted-foreground">Awaiting Payment / Review</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/70 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <Truck size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground block">{metrics.processing_orders} Processing</span>
            <span className="text-xs text-muted-foreground">In Warehouse Packing</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/70 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground block">{metrics.delivered_orders} Delivered</span>
            <span className="text-xs text-muted-foreground">Completed Shipments</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/70 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-foreground block">{metrics.low_stock_items} Low Stock</span>
            <span className="text-xs text-muted-foreground">&lt;100 units in warehouse</span>
          </div>
        </div>
      </div>

      {/* Operational Feeds: Recent Orders & Recent RFQs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-card border border-border/70 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Recent Orders
              </h2>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {metrics.recent_orders && metrics.recent_orders.length > 0 ? (
            <div className="divide-y divide-border/60">
              {metrics.recent_orders.map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <Link
                      href={`/admin/orders/${ord.id}`}
                      className="font-mono font-bold text-foreground hover:text-primary transition-colors block"
                    >
                      {ord.order_number}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {ord.user?.name || ord.user?.email || "Guest Buyer"} • {new Date(ord.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-foreground block">
                      ${Number(ord.total_amount).toFixed(2)}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      ord.status === "delivered" 
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : ord.status === "processing"
                        ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                        : ord.status === "cancelled"
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    }`}>
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-8 text-center">No orders recorded yet.</p>
          )}
        </div>

        {/* Recent RFQs */}
        <div className="bg-card border border-border/70 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Recent B2B Quotations & RFQs
              </h2>
            </div>
            <Link
              href="/admin/rfq"
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>

          {metrics.recent_rfqs && metrics.recent_rfqs.length > 0 ? (
            <div className="divide-y divide-border/60">
              {metrics.recent_rfqs.map((rfq) => (
                <div key={rfq.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <Link
                      href={`/admin/rfq/${rfq.id}`}
                      className="font-mono font-bold text-foreground hover:text-primary transition-colors block"
                    >
                      {rfq.rfq_number}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {rfq.company_name || rfq.buyer_name} • {new Date(rfq.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      rfq.status === "ACCEPTED" || rfq.status === "APPROVED"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : rfq.status === "QUOTED"
                        ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                        : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    }`}>
                      {rfq.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground py-8 text-center">No RFQs submitted yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
