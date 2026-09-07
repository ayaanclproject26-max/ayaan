"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { adminOrderService } from "@/services/admin";
import { OrderRecord, OrderItemRecord, OrderStatusEvent } from "@/services/order.service";
import { 
  ArrowLeft, 
  ShoppingBag, 
  User, 
  MapPin, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileCheck, 
  AlertTriangle, 
  RefreshCw,
  ExternalLink,
  FileText,
  Printer,
  Box,
  Package,
  Ship,
  Send,
  AlertCircle,
  DollarSign
} from "lucide-react";

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Status transition state
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  // Fulfillment state
  const [fulfillmentStatus, setFulfillmentStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");

  // Payment proof review state
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">("approve");
  const [reviewNote, setReviewNote] = useState("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Akij Sea Freight Quote Modal State
  const [isSeaQuoteModalOpen, setIsSeaQuoteModalOpen] = useState(false);
  const [seaQuoteAmount, setSeaQuoteAmount] = useState<string>("");
  const [seaQuoteReference, setSeaQuoteReference] = useState<string>("");
  const [seaQuoteValidUntil, setSeaQuoteValidUntil] = useState<string>("");
  const [seaQuoteNotes, setSeaQuoteNotes] = useState<string>("");

  const loadOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminOrderService.getOrderById(id);
      setOrder(data);
      setNewStatus(data.status);
      setFulfillmentStatus(data.fulfillment_status || "unfulfilled");
      setCarrier(data.carrier || "Aramex");
      setTrackingNumber(data.tracking_number || "");
    } catch (err: any) {
      setError(err?.message || "Failed to load order.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !newStatus || newStatus === order.status) return;

    setActionLoading(true);
    try {
      const updated = await adminOrderService.updateOrderStatus(order.id, newStatus, statusNote.trim() || undefined);
      setOrder(updated);
      setStatusNote("");
      setFeedback({ type: "success", msg: `Order status changed to ${newStatus.toUpperCase()}.` });
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Failed to update order status." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateFulfillment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setActionLoading(true);
    try {
      const updated = await adminOrderService.updateFulfillment(
        order.id,
        fulfillmentStatus,
        trackingNumber.trim() || undefined,
        carrier.trim() || undefined
      );
      setOrder(updated);
      setFeedback({ type: "success", msg: "Fulfillment updated successfully." });
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Failed to update fulfillment." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAramexShipment = async () => {
    if (!order) return;
    if (!confirm(`Are you sure you want to create the official Aramex export shipment for Order #${order.order_number}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const result = await adminOrderService.createAramexShipment(order.id);
      if (result.order) {
        setOrder(result.order);
      } else {
        await loadOrder();
      }
      setFeedback({
        type: "success",
        msg: `Aramex shipment created successfully! AWB: ${result.tracking_number || "Generated"}.`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        msg: err?.message || "Failed to create Aramex shipment. Error details logged.",
      });
      await loadOrder();
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefreshTracking = async () => {
    if (!order || !order.tracking_number) return;

    setActionLoading(true);
    try {
      const result = await adminOrderService.refreshTracking(order.id);
      if (result.order) {
        setOrder(result.order);
      }
      setFeedback({
        type: "success",
        msg: `Carrier tracking refreshed. Current status: ${result.tracking?.carrier_status || "Updated"}.`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        msg: err?.message || "Failed to refresh live tracking.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewPaymentProof = async () => {
    if (!order) return;

    setActionLoading(true);
    try {
      const updated = await adminOrderService.reviewPaymentProof(
        order.id,
        reviewAction,
        reviewNote.trim() || undefined
      );
      setOrder(updated);
      setIsReviewModalOpen(false);
      setReviewNote("");
      setFeedback({ type: "success", msg: `Payment proof ${reviewAction}d.` });
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Payment proof review failed." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenSeaQuoteModal = () => {
    if (!order) return;
    setSeaQuoteAmount(order.shipping_cost ? String(order.shipping_cost) : "");
    setSeaQuoteReference(order.shipping_quote_id || `QT-AKJ-${Date.now().toString().slice(-6)}`);
    setSeaQuoteValidUntil(new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]);
    setSeaQuoteNotes(order.shipping_snapshot?.notes || "Akij Sea Freight Tariff Confirmed");
    setIsSeaQuoteModalOpen(true);
  };

  const handleSaveSeaQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setActionLoading(true);
    try {
      const result = await adminOrderService.updateShippingQuote(order.id, {
        amount: parseFloat(seaQuoteAmount) || 0,
        quote_reference: seaQuoteReference.trim(),
        valid_until: seaQuoteValidUntil || undefined,
        notes: seaQuoteNotes.trim(),
        carrier: "Akij Logistics",
      });
      setOrder(result.order);
      setIsSeaQuoteModalOpen(false);
      setFeedback({ 
        type: "success", 
        msg: `Akij sea freight quote updated to $${(parseFloat(seaQuoteAmount) || 0).toFixed(2)} USD successfully.` 
      });
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Failed to update sea freight quote." });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span className="text-xs text-muted-foreground">Loading order details...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 bg-card border border-destructive/30 rounded-3xl text-center space-y-4 max-w-md mx-auto my-12">
        <AlertTriangle size={36} className="text-destructive mx-auto" />
        <h2 className="text-lg font-bold uppercase text-foreground">Order Not Found</h2>
        <p className="text-xs text-muted-foreground">{error || "Could not retrieve order."}</p>
        <Link href="/admin/orders" className="text-xs font-bold uppercase text-primary hover:underline block">
          ← Back to Orders List
        </Link>
      </div>
    );
  }

  const snapshot = order.shipping_snapshot;
  const hasAwb = Boolean(order.tracking_number);
  const canShip = order.can_create_aramex_shipment || (!hasAwb && (order.payment_status === "paid" || order.payment_method === "net_30" || order.status === "processing"));

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Back Button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Orders</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
              Order {order.order_number}
            </h1>
            <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
              order.status === "delivered" 
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : order.status === "processing" || order.status === "shipped"
                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                : order.status === "cancelled"
                ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            }`}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Commercial Export Document Action Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/admin/documents/ORDER_SHEET/order_${order.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground hover:bg-secondary/80 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            title="Commercial Order Sheet"
          >
            <FileText size={13} className="text-primary" />
            <span>Order Sheet</span>
          </Link>

          <Link
            href={`/admin/documents/PROFORMA_INVOICE/order_${order.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground hover:bg-secondary/80 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            title="Proforma Invoice"
          >
            <FileText size={13} className="text-primary" />
            <span>PI</span>
          </Link>

          <Link
            href={`/admin/documents/COMMERCIAL_INVOICE/order_${order.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            title="Commercial Invoice"
          >
            <Printer size={13} />
            <span>Commercial Invoice</span>
          </Link>

          <Link
            href={`/admin/documents/PACKING_LIST/order_${order.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary border border-border text-foreground hover:bg-secondary/80 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            title="Packing List"
          >
            <Package size={13} className="text-primary" />
            <span>Packing List</span>
          </Link>

          <button
            type="button"
            onClick={loadOrder}
            className="p-2 rounded-xl border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Refresh Order"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between ${
          feedback.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            : "bg-destructive/10 border-destructive/20 text-destructive"
        }`}>
          <span>{feedback.msg}</span>
          <button onClick={() => setFeedback(null)} className="hover:underline">✕</button>
        </div>
      )}

      {/* Main Grid: Left Items & Payment Proof, Right Admin Controls & Customer Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Items */}
          <div className="bg-card border border-border/70 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <ShoppingBag size={16} className="text-primary" />
              <span>Purchased Line Items ({order.items?.length || 0})</span>
            </h2>

            <div className="divide-y divide-border/60">
              {order.items?.map((item: OrderItemRecord) => {
                const breakdown = typeof item.package_breakdown === "string" 
                  ? JSON.parse(item.package_breakdown) 
                  : item.package_breakdown;

                return (
                  <div key={item.id} className="py-4 flex items-center gap-4 text-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.product_image_url || "/placeholder.jpg"}
                      alt={item.product_name}
                      className="w-14 h-16 object-cover rounded-xl bg-secondary shrink-0 border border-border/50"
                    />
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <span className="font-bold text-foreground block truncate">
                        {item.product_name}
                      </span>
                      <span className="text-xs text-muted-foreground block font-mono">
                        SKU: {item.sku || "—"} {item.size && `• Size: ${item.size}`} {item.color && `• Color: ${item.color}`}
                      </span>

                      {/* Package breakdown matrix if wholesale lot */}
                      {Array.isArray(breakdown) && breakdown.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-0.5 text-[10px]">
                          {breakdown.map((bd: any, bIdx: number) => (
                            <span key={bIdx} className="bg-secondary/80 px-1 py-0.5 rounded border border-border/50 font-mono text-muted-foreground">
                              {bd.size}: <strong className="text-foreground">{bd.quantity}</strong>
                            </span>
                          ))}
                        </div>
                      )}

                      <span className="text-xs text-muted-foreground block mt-1">
                        ${Number(item.unit_price).toFixed(2)} × {item.quantity} units
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-foreground text-sm block">
                        ${Number(item.line_total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-border/60 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Goods Value (Subtotal)</span>
                <span className="font-bold text-foreground">${Number(order.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping Charge</span>
                <span className="font-bold text-foreground">
                  {Number(order.shipping_cost || 0) === 0 ? "FREE" : `$${Number(order.shipping_cost).toFixed(2)}`}
                </span>
              </div>
              {Number(order.other_charges || 0) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Other Charges</span>
                  <span className="font-bold text-foreground">${Number(order.other_charges).toFixed(2)}</span>
                </div>
              )}
              {Number(order.tax_amount || 0) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax (5%)</span>
                  <span className="font-bold text-foreground">${Number(order.tax_amount).toFixed(2)}</span>
                </div>
              )}
              {Number(order.discount_amount || 0) > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount</span>
                  <span>-${Number(order.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-foreground pt-2.5 border-t border-border/40">
                <span>Total Payable</span>
                <span>${Number(order.total_amount || 0).toFixed(2)} {order.currency || "USD"}</span>
              </div>
            </div>
          </div>

          {/* Carrier Logistics & Freight Card */}
          {(() => {
              const isSea = snapshot?.mode === "sea" 
                || snapshot?.provider === "akij" 
                || order.carrier?.toLowerCase().includes("akij") 
                || order.shipping_method?.toLowerCase().includes("sea");

              return (
                <div className="bg-card border border-border/70 rounded-3xl p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      {isSea ? <Ship size={18} className="text-primary" /> : <Truck size={18} className="text-primary" />}
                      <div>
                        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                          {isSea ? "Akij Logistics Sea Freight Integration" : "Aramex Carrier & Logistics Integration"}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          {isSea 
                            ? "Port of Loading: Chattogram Sea Port (CGP), Bangladesh • Ocean Container Freight" 
                            : "Direct server-side integration for shipment dispatch, AWB generation, and tracking."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSea ? (
                        <button
                          type="button"
                          onClick={handleOpenSeaQuoteModal}
                          className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <DollarSign size={14} />
                          <span>Update Akij Freight Quote</span>
                        </button>
                      ) : hasAwb ? (
                        <button
                          type="button"
                          onClick={handleRefreshTracking}
                          disabled={actionLoading}
                          className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-foreground text-xs font-bold uppercase tracking-wider hover:bg-secondary/80 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw size={13} className={actionLoading ? "animate-spin" : ""} />
                          <span>Refresh Tracking</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleCreateAramexShipment}
                          disabled={actionLoading || !canShip}
                          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm ${
                            canShip 
                              ? "bg-primary text-primary-foreground hover:opacity-90 cursor-pointer" 
                              : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                          }`}
                        >
                          <Send size={14} />
                          <span>{actionLoading ? "Creating Shipment..." : "Create Aramex Shipment"}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Error banner if last shipment attempt failed */}
                  {order.last_shipment_error && (
                    <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2.5">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-bold uppercase">Shipment Notice:</p>
                        <p>{order.last_shipment_error}</p>
                      </div>
                    </div>
                  )}

                  {/* Shipment details */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 rounded-2xl bg-secondary/30 border border-border/60 space-y-0.5">
                      <span className="text-[11px] font-bold uppercase text-muted-foreground block">Shipping Provider / Carrier</span>
                      <span className="font-bold text-foreground text-sm">{isSea ? "Akij Logistics" : (order.carrier || "Aramex")}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-secondary/30 border border-border/60 space-y-0.5">
                      <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                        {isSea ? "Quote / Reference ID" : "AWB / Tracking Number"}
                      </span>
                      <span className="font-mono font-bold text-primary text-sm">
                        {isSea 
                          ? (order.shipping_quote_id || snapshot?.quote_reference_id || "Pending Akij Quote")
                          : (order.tracking_number || "Not Issued")}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-secondary/30 border border-border/60 space-y-0.5">
                      <span className="text-[11px] font-bold uppercase text-muted-foreground block">
                        {isSea ? "Quoted Freight (USD)" : "Carrier Status"}
                      </span>
                      <span className="font-bold text-foreground">
                        {isSea 
                          ? (Number(order.shipping_cost) > 0 ? `$${Number(order.shipping_cost).toFixed(2)} USD` : "Pending Quote Confirmation")
                          : (order.carrier_status || (hasAwb ? "In Transit" : "Pending Dispatch"))}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-secondary/30 border border-border/60 space-y-0.5">
                      <span className="text-[11px] font-bold uppercase text-muted-foreground block">Carton Count</span>
                      <span className="font-bold text-foreground">
                        {snapshot?.carton_count || 1} Master ctn
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-secondary/30 border border-border/60 space-y-0.5">
                      <span className="text-[11px] font-bold uppercase text-muted-foreground block">Gross / Net Weight</span>
                      <span className="font-bold text-foreground">
                        {snapshot?.gross_weight ? `${snapshot.gross_weight} kg` : "N/A"} {snapshot?.net_weight ? `(Net: ${snapshot.net_weight} kg)` : ""}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-secondary/30 border border-border/60 space-y-0.5">
                      <span className="text-[11px] font-bold uppercase text-muted-foreground block">Shipment Volume</span>
                      <span className="font-bold text-foreground">
                        {snapshot?.cbm ? `${snapshot.cbm} CBM` : "0.072 CBM"}
                      </span>
                    </div>
                  </div>

                  {/* Action Links */}
                  {hasAwb && !isSea && (
                    <div className="pt-2 flex items-center gap-3 flex-wrap text-xs">
                      {order.direct_tracking_url && (
                        <a
                          href={order.direct_tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary hover:underline font-bold"
                        >
                          <span>View on Aramex Tracking Portal</span>
                          <ExternalLink size={13} />
                        </a>
                      )}

                      {order.shipment_label_url && (
                        <a
                          href={order.shipment_label_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-primary hover:underline font-bold"
                        >
                          <span>Download Official Shipping Label (PDF)</span>
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

          {/* Payment Proof Verification Box */}
          {order.payment_proof_url && (
            <div className="bg-card border border-border/70 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <FileCheck size={18} className="text-primary" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Offline Payment Proof Attached
                  </h2>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  order.payment_status === "paid" 
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" 
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                }`}>
                  Payment: {order.payment_status}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <a
                  href={order.payment_proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative group block rounded-2xl overflow-hidden border border-border bg-secondary shrink-0 w-36 h-36"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.payment_proof_url}
                    alt="Payment Proof Receipt"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-ink/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                    <ExternalLink size={16} />
                  </div>
                </a>

                <div className="space-y-3 flex-1 text-xs">
                  <p className="text-muted-foreground">
                    Buyer submitted receipt verification. Review the document carefully against bank deposits before approving.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setReviewAction("approve"); setIsReviewModalOpen(true); }}
                      className="px-4 py-2 rounded-full bg-emerald-600 text-white font-bold uppercase text-xs hover:bg-emerald-700 cursor-pointer shadow-xs"
                    >
                      Approve Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => { setReviewAction("reject"); setIsReviewModalOpen(true); }}
                      className="px-4 py-2 rounded-full bg-rose-600 text-white font-bold uppercase text-xs hover:bg-rose-700 cursor-pointer shadow-xs"
                    >
                      Reject Payment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline & Audit Events */}
          <div className="bg-card border border-border/70 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <span>Order Timeline & System Events</span>
            </h2>

            <div className="space-y-3">
              {order.status_events && order.status_events.length > 0 ? (
                order.status_events.map((ev: OrderStatusEvent) => (
                  <div key={ev.id} className="p-3.5 rounded-2xl bg-secondary/30 border border-border/60 flex items-start gap-3 text-xs">
                    <div className="p-1.5 rounded-full bg-primary/10 text-primary mt-0.5 shrink-0">
                      <CheckCircle2 size={13} />
                    </div>
                    <div className="flex-1">
                      <span className="font-bold text-foreground block">{ev.event_type}</span>
                      <p className="text-muted-foreground mt-0.5">{ev.message}</p>
                      <span className="text-xs text-muted-foreground block mt-1">
                        {new Date(ev.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No events recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col) Admin Controls & Customer Info */}
        <div className="space-y-6">
          
          {/* Order Status Control */}
          <div className="bg-card border border-border/70 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Update Order Status
            </h2>

            <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground font-bold focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">
                  Note / Reason
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional status transition note..."
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading || newStatus === order.status}
                className="w-full py-2.5 rounded-full bg-foreground text-background font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer"
              >
                {actionLoading ? "Updating..." : "Save Status"}
              </button>
            </form>
          </div>

          {/* Fulfillment Control */}
          <div className="bg-card border border-border/70 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Truck size={16} className="text-primary" />
              <span>Fulfillment & Carrier Status</span>
            </h2>

            <form onSubmit={handleUpdateFulfillment} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">
                  Fulfillment Status
                </label>
                <select
                  value={fulfillmentStatus}
                  onChange={(e) => setFulfillmentStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground font-bold focus:ring-1 focus:ring-primary outline-none"
                >
                  <option value="unfulfilled">Unfulfilled</option>
                  <option value="partial">Partial</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">
                  Carrier
                </label>
                <input
                  type="text"
                  placeholder="Aramex, DHL, FedEx..."
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">
                  Tracking / AWB Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3281928391"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/30 text-foreground font-mono focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 rounded-full bg-secondary hover:bg-foreground hover:text-background text-foreground font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                {actionLoading ? "Updating..." : "Update Shipment Info"}
              </button>
            </form>
          </div>

          {/* Customer & Shipping Info */}
          <div className="bg-card border border-border/70 rounded-3xl p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <User size={16} className="text-primary" />
              <span>Customer Information</span>
            </h2>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-muted-foreground block text-xs uppercase font-bold">Contact Name</span>
                <span className="font-bold text-foreground">{order.shipping_name || order.user?.name || "Guest"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase font-bold">Email</span>
                <span className="text-foreground">{order.email || order.user?.email || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs uppercase font-bold">Phone</span>
                <span className="text-foreground">{order.shipping_phone || "—"}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-border/60 space-y-2 text-xs">
              <span className="text-muted-foreground block text-xs uppercase font-bold">Shipping Destination</span>
              <p className="text-foreground leading-relaxed">
                {order.shipping_address1}
                {order.shipping_address2 && <><br />{order.shipping_address2}</>}
                <br />
                {order.shipping_city}, {order.shipping_region} {order.shipping_postal_code}
                <br />
                {order.shipping_country_code}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Proof Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base uppercase text-foreground">
                {reviewAction === "approve" ? "Approve Payment Proof" : "Reject Payment Proof"}
              </h3>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-muted-foreground">
                {reviewAction === "approve"
                  ? "Approving this receipt will immediately set the order payment status to PAID and move status to PROCESSING."
                  : "Rejecting this receipt will mark payment status as FAILED and log your rejection reason in the order history."}
              </p>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">
                  Reviewer Note
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={reviewAction === "approve" ? "Verified in bank statement ref #..." : "Receipt unreadable / amount mismatch..."}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-border text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReviewPaymentProof}
                  disabled={actionLoading}
                  className={`px-6 py-2 rounded-full text-white text-xs font-bold uppercase transition-opacity ${
                    reviewAction === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  {actionLoading ? "Processing..." : `Confirm ${reviewAction}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Akij Sea Freight Quote Modal */}
      {isSeaQuoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Ship size={18} className="text-primary" />
                <h3 className="font-bold text-base uppercase text-foreground">
                  Akij Sea Freight Quotation
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSeaQuoteModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSeaQuote} className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-secondary/40 border border-border/70 text-muted-foreground text-[11px] space-y-1">
                <div className="font-bold text-foreground">Authoritative Physical Packaging Specs:</div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>Pieces: <strong className="text-foreground">{snapshot?.package_quantity || order.items?.reduce((s, i) => s + i.quantity, 0)} pcs</strong></div>
                  <div>Cartons: <strong className="text-foreground">{snapshot?.carton_count || 1} ctn</strong></div>
                  <div>Volume: <strong className="text-foreground">{snapshot?.cbm || 0.072} CBM</strong></div>
                  <div>Gross Wt: <strong className="text-foreground">{snapshot?.gross_weight || 20} kg</strong></div>
                  <div>Net Wt: <strong className="text-foreground">{snapshot?.net_weight || 18} kg</strong></div>
                  <div>Port: <strong className="text-foreground">Chattogram Sea Port</strong></div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Quoted Freight Amount (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={seaQuoteAmount}
                    onChange={(e) => setSeaQuoteAmount(e.target.value)}
                    placeholder="250.00"
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/30 text-foreground font-mono font-bold focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Quote / Booking Reference
                  </label>
                  <input
                    type="text"
                    value={seaQuoteReference}
                    onChange={(e) => setSeaQuoteReference(e.target.value)}
                    placeholder="QT-AKJ-2026-001"
                    className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/30 text-foreground font-mono focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Quote Validity Date
                </label>
                <input
                  type="date"
                  value={seaQuoteValidUntil}
                  onChange={(e) => setSeaQuoteValidUntil(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Booking Notes & Logistics Terms
                </label>
                <textarea
                  rows={2}
                  value={seaQuoteNotes}
                  onChange={(e) => setSeaQuoteNotes(e.target.value)}
                  placeholder="LCL Container Vessel DAP rate from Chattogram port..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsSeaQuoteModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-border text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity shadow-md"
                >
                  {actionLoading ? "Saving Quote..." : "Save Akij Sea Quote"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
