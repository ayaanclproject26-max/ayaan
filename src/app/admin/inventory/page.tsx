"use client";

import { useState, useEffect } from "react";
import { 
  adminInventoryService, 
  InventoryRecord, 
  Warehouse 
} from "@/services/admin";
import { 
  Warehouse as WarehouseIcon, 
  Search, 
  Filter, 
  AlertTriangle, 
  RefreshCw, 
  Plus, 
  Edit3, 
  ArrowUpDown, 
  History,
  CheckCircle2,
  X
} from "lucide-react";

export default function AdminInventoryPage() {
  const [inventories, setInventories] = useState<InventoryRecord[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modal State for Adjustment
  const [adjustingItem, setAdjustingItem] = useState<InventoryRecord | null>(null);
  const [adjustMode, setAdjustMode] = useState<"set" | "delta">("set");
  const [targetQuantity, setTargetQuantity] = useState<number>(0);
  const [adjustmentDelta, setAdjustmentDelta] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [adjustingLoading, setAdjustingLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Warehouse Create Modal
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [newWhName, setNewWhName] = useState("");
  const [newWhCode, setNewWhCode] = useState("");
  const [newWhCountry, setNewWhCountry] = useState("US");
  const [newWhCity, setNewWhCity] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [invRes, whRes] = await Promise.all([
        adminInventoryService.getInventory({
          page,
          per_page: perPage,
          search: search || undefined,
          warehouse_id: selectedWarehouse !== "all" ? selectedWarehouse : undefined,
          low_stock: lowStockOnly ? true : undefined,
        }),
        adminInventoryService.getWarehouses(),
      ]);

      setInventories(invRes.data);
      setTotal(invRes.total);
      setWarehouses(whRes);
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Failed to load inventory." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, search, selectedWarehouse, lowStockOnly]);

  const handleOpenAdjust = (item: InventoryRecord) => {
    setAdjustingItem(item);
    setTargetQuantity(item.quantity);
    setAdjustmentDelta(0);
    setAdjustMode("set");
    setReason("");
  };

  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem || !reason.trim()) return;

    setAdjustingLoading(true);
    try {
      if (adjustMode === "set") {
        await adminInventoryService.adjustInventory({
          inventory_id: adjustingItem.id,
          new_quantity: Number(targetQuantity),
          reason: reason.trim(),
        });
      } else {
        await adminInventoryService.adjustInventory({
          inventory_id: adjustingItem.id,
          adjustment_amount: Number(adjustmentDelta),
          reason: reason.trim(),
        });
      }

      setFeedback({ type: "success", msg: `Stock updated for ${adjustingItem.variant?.sku || "item"}.` });
      setAdjustingItem(null);
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Inventory adjustment failed." });
    } finally {
      setAdjustingLoading(false);
    }
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhName.trim() || !newWhCode.trim()) return;

    try {
      await adminInventoryService.createWarehouse({
        name: newWhName.trim(),
        code: newWhCode.trim().toUpperCase(),
        country_code: newWhCountry.trim(),
        city: newWhCity.trim() || undefined,
        is_active: true,
      });

      setFeedback({ type: "success", msg: `Warehouse ${newWhName} created.` });
      setIsWarehouseModalOpen(false);
      setNewWhName("");
      setNewWhCode("");
      setNewWhCity("");
      loadData();
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Failed to create warehouse." });
    }
  };

  const calculatedResult = adjustingItem
    ? adjustMode === "set"
      ? Number(targetQuantity)
      : Number(adjustingItem.quantity) + Number(adjustmentDelta)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold uppercase tracking-tight text-foreground">
            Inventory & Warehouse Hub
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Server-authoritative inventory tracking, warehouse allocation, and auditable stock adjustment logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsWarehouseModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card hover:bg-secondary font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
          >
            <WarehouseIcon size={14} />
            <span>Add Warehouse</span>
          </button>
          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-full border border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh Inventory"
          >
            <RefreshCw size={15} />
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

      {/* Filter Bar */}
      <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Product Name, Variant Title, or SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-secondary/30 text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedWarehouse}
            onChange={(e) => { setSelectedWarehouse(e.target.value); setPage(1); }}
            className="px-3 py-2 text-xs rounded-xl border border-border bg-card text-foreground focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="all">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => { setLowStockOnly(!lowStockOnly); setPage(1); }}
            className={`px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
              lowStockOnly
                ? "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertTriangle size={13} />
            <span>Low Stock (&lt;100)</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-card border border-border/70 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-muted-foreground uppercase text-xs font-bold tracking-wider">
                <th className="py-3 px-4">Item & Variant</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3">Warehouse</th>
                <th className="py-3 px-3 text-right">Available</th>
                <th className="py-3 px-3 text-right">Reserved</th>
                <th className="py-3 px-3 text-right">Total Variant Stock</th>
                <th className="py-3 px-3">Last Adjusted</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading inventory records...</span>
                  </td>
                </tr>
              ) : inventories.length > 0 ? (
                inventories.map((inv) => {
                  const product = inv.variant?.product;
                  const isLow = inv.quantity < 100;
                  const latestAdjustment = inv.adjustments?.[0];

                  return (
                    <tr key={inv.id} className="hover:bg-secondary/30 transition-colors font-medium">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product?.images?.[0]?.image_url || "/placeholder.jpg"}
                            alt={product?.name || "Product"}
                            className="w-10 h-12 object-cover rounded-md bg-secondary shrink-0 border border-border/50"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-foreground block truncate max-w-[220px]">
                              {product?.name || "Catalog Product"}
                            </span>
                            <span className="text-xs text-muted-foreground block truncate">
                              {inv.variant?.title || `Size: ${inv.variant?.size || "STD"}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-muted-foreground">
                        {inv.variant?.sku || "—"}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-foreground block">
                          {inv.warehouse?.name || "Main Warehouse"}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {inv.warehouse?.code || "MAIN"}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span className={`font-bold ${isLow ? "text-rose-500" : "text-foreground"}`}>
                          {inv.quantity.toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right text-muted-foreground">
                        {inv.reserved_quantity?.toLocaleString() || 0}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-foreground">
                        {inv.variant?.stock?.toLocaleString() ?? inv.quantity.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-xs text-muted-foreground">
                        {latestAdjustment ? (
                          <span title={`Reason: ${latestAdjustment.reason}`}>
                            {latestAdjustment.adjustment_amount > 0 ? `+${latestAdjustment.adjustment_amount}` : latestAdjustment.adjustment_amount} ({new Date(latestAdjustment.created_at).toLocaleDateString()})
                          </span>
                        ) : (
                          new Date(inv.updated_at).toLocaleDateString()
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenAdjust(inv)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary hover:bg-foreground hover:text-background text-foreground text-xs font-bold transition-colors cursor-pointer"
                        >
                          <Edit3 size={12} />
                          <span>Adjust</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground">
                    No inventory records match your criteria.
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
              Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, total)} of {total} records
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

      {/* Adjust Inventory Modal */}
      {adjustingItem && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-base uppercase text-foreground">
                  Adjust Inventory Stock
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {adjustingItem.variant?.sku} • {adjustingItem.warehouse?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdjustingItem(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmAdjust} className="space-y-4 text-xs">
              <div className="flex items-center gap-2 p-1 bg-secondary/50 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAdjustMode("set")}
                  className={`flex-1 py-1.5 rounded-lg font-bold uppercase transition-all ${
                    adjustMode === "set" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  Set Absolute Qty
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustMode("delta")}
                  className={`flex-1 py-1.5 rounded-lg font-bold uppercase transition-all ${
                    adjustMode === "delta" ? "bg-foreground text-background shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  Add / Subtract
                </button>
              </div>

              {adjustMode === "set" ? (
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">
                    New Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground font-bold text-base focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">
                    Adjustment Delta (+/-) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. +50 or -20"
                    value={adjustmentDelta}
                    onChange={(e) => setAdjustmentDelta(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground font-bold text-base focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              )}

              {/* Preview */}
              <div className="p-3 bg-secondary/40 rounded-xl border border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Previous: {adjustingItem.quantity}</span>
                <span className="font-bold text-foreground">
                  Resulting: {calculatedResult} {calculatedResult < 0 && <span className="text-rose-500">(Invalid Negative)</span>}
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">
                  Reason for Adjustment *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Received shipment, Physical audit correction, Damaged items"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setAdjustingItem(null)}
                  className="px-4 py-2 rounded-full border border-border text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustingLoading || calculatedResult < 0}
                  className="px-6 py-2 rounded-full bg-foreground text-background text-xs font-bold uppercase hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {adjustingLoading ? "Updating..." : "Save Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Warehouse Modal */}
      {isWarehouseModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base uppercase text-foreground">
                Add Fulfillment Warehouse
              </h3>
              <button
                type="button"
                onClick={() => setIsWarehouseModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. West Coast Logistics Hub"
                  value={newWhName}
                  onChange={(e) => setNewWhName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="WH-LAX"
                    value={newWhCode}
                    onChange={(e) => setNewWhCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground font-mono focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-muted-foreground">
                    Country Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="US"
                    value={newWhCountry}
                    onChange={(e) => setNewWhCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground uppercase focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-muted-foreground">
                  City
                </label>
                <input
                  type="text"
                  placeholder="Los Angeles"
                  value={newWhCity}
                  onChange={(e) => setNewWhCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsWarehouseModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-border text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-foreground text-background text-xs font-bold uppercase hover:opacity-90 transition-opacity"
                >
                  Create Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
