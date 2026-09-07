"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useWishlist } from "@/lib/WishlistContext";
import { useCart } from "@/lib/CartContext";
import { getUserOrders, OrderRecord } from "@/lib/services/orders";
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronRight,
  Heart,
  Trash2,
  Check,
  AlertCircle,
  X,
} from "lucide-react";
import { CustomerAccountHero } from "@/components/account/CustomerAccountHero";

export default function ProfileDashboardPage() {
  const { user, updateProfile } = useAuth();
  const { items: wishlistItems, removeFromWishlist } = useWishlist();
  const { addToCart, setIsCartOpen } = useCart();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Account Details edit state
  const [editField, setEditField] = useState<"name" | "email" | "phone" | "password" | null>(null);
  const [formValue, setFormValue] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [formError, setFormError] = useState("");
  const [savingField, setSavingField] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setSavingField(true);

    try {
      if (editField === "name") {
        if (!formValue.trim()) {
          setFormError("Full name is required.");
          setSavingField(false);
          return;
        }
        await updateProfile({ name: formValue.trim() });
        setProfileSuccess("Name updated successfully");
      } else if (editField === "email") {
        if (!formValue.trim() || !formValue.includes("@")) {
          setFormError("A valid email address is required.");
          setSavingField(false);
          return;
        }
        await updateProfile({ email: formValue.trim().toLowerCase() });
        setProfileSuccess("Email updated successfully");
      } else if (editField === "phone") {
        await updateProfile({ phone: formValue.trim() });
        setProfileSuccess("Phone number updated successfully");
      } else if (editField === "password") {
        if (formValue.length < 6) {
          setFormError("Password must be at least 6 characters.");
          setSavingField(false);
          return;
        }
        if (formValue !== passwordConfirm) {
          setFormError("Passwords do not match.");
          setSavingField(false);
          return;
        }
        // Save password
        await updateProfile({ ...user, password: formValue } as any);
        setProfileSuccess("Password changed successfully");
      }

      setEditField(null);
      setTimeout(() => setProfileSuccess(""), 3500);
    } catch (err: any) {
      setFormError(err?.message || "Failed to update account information.");
    } finally {
      setSavingField(false);
    }
  };

  useEffect(() => {
    async function loadOrders() {
      if (user?.id) {
        setLoading(true);
        const data = await getUserOrders(user.id);
        setOrders(data);
        setLoading(false);
      }
    }
    loadOrders();
  }, [user?.id]);

  const activeOrders = orders.filter((o) => o.status !== "cancelled" && o.fulfillment_status !== "delivered");
  const pastPurchases = orders.filter((o) => o.fulfillment_status === "delivered" || o.status === "fulfilled");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Welcome Hero */}
      <CustomerAccountHero orderCount={loading ? 0 : orders.length} />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.6875rem] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              Total Orders
            </span>
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Package size={14} className="sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tabular-nums mt-1.5 sm:mt-2 leading-tight">
            {loading ? "0" : orders.length}
          </p>
          <span className="text-[0.6875rem] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 block truncate">
            Lifetime orders
          </span>
        </div>

        {/* Active In-Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.6875rem] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              In Delivery
            </span>
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Truck size={14} className="sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-display text-amber-600 dark:text-amber-400 tabular-nums mt-1.5 sm:mt-2 leading-tight">
            {loading ? "0" : activeOrders.length}
          </p>
          <span className="text-[0.6875rem] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 block truncate">
            Active shipments
          </span>
        </div>

        {/* Past Purchases */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.6875rem] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              Delivered
            </span>
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={14} className="sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 tabular-nums mt-1.5 sm:mt-2 leading-tight">
            {loading ? "0" : pastPurchases.length}
          </p>
          <span className="text-[0.6875rem] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 block truncate">
            Completed purchases
          </span>
        </div>

        {/* Cancelled Orders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.6875rem] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
              Cancelled
            </span>
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <XCircle size={14} className="sm:w-4 sm:h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-display text-slate-700 dark:text-slate-300 tabular-nums mt-1.5 sm:mt-2 leading-tight">
            {loading ? "0" : cancelledOrders.length}
          </p>
          <span className="text-[0.6875rem] sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5 block truncate">
            Cancelled orders
          </span>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              Recent Orders & Tracking
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Track your recent purchases and shipments.
            </p>
          </div>
          <Link
            href="/profile/orders"
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="py-6 sm:py-8 flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400">Fetching order records...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-5 sm:py-7 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 mb-2.5">
              <Package size={20} />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">No orders yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs">
              Your orders will appear here.
            </p>
            <Link
              href="/"
              className="mt-3.5 px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.slice(0, 3).map((order) => {
              const isCancelled = order.status === "cancelled";
              const isDelivered = order.fulfillment_status === "delivered";

              return (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-white/[0.02]"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isCancelled 
                        ? "bg-red-100 dark:bg-red-950/50 text-red-600" 
                        : isDelivered 
                        ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600" 
                        : "bg-amber-100 dark:bg-amber-950/50 text-amber-600"
                    }`}>
                      {isCancelled ? <XCircle size={22} /> : isDelivered ? <CheckCircle2 size={22} /> : <Truck size={22} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          Order #{order.order_number}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          isCancelled
                            ? "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300"
                            : isDelivered
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                        }`}>
                          {isCancelled ? "Cancelled" : isDelivered ? "Delivered" : order.fulfillment_status || order.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Placed on {new Date(order.placed_at || order.created_at).toLocaleDateString()} • {order.items?.length || 1} item(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-white/10">
                    <div className="text-left sm:text-right">
                      <span className="text-xs uppercase text-slate-400 block">Total</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        ${(order.total_cents / 100).toFixed(2)}
                      </span>
                    </div>

                    <Link
                      href={`/profile/orders/${order.id}`}
                      className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <span>Track Order</span>
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Wishlist Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <Heart size={16} className="fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
                Saved Wishlist ({wishlistItems.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Products you have bookmarked for later
              </p>
            </div>
          </div>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="py-5 sm:py-7 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-400 flex items-center justify-center mb-2.5">
              <Heart size={20} />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Your wishlist is empty</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs">
              Save products for later.
            </p>
            <Link
              href="/"
              className="mt-3.5 px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all active:scale-95"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] flex gap-3.5 items-center justify-between"
              >
                <Link href={`/products/${item.product.slug}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-14 h-16 object-cover rounded-lg bg-secondary shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
                      ${item.product.price.toFixed(2)}
                    </p>
                    <span className="text-xs text-slate-400">{item.product.brand}</span>
                  </div>
                </Link>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(item.product, "One Size", 1);
                      setIsCartOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromWishlist(item.product_id)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors flex items-center justify-center"
                    title="Remove"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Details Workspace */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white">
              Account Details
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your personal account information.
            </p>
          </div>
          {profileSuccess && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40 animate-fade-in">
              <Check size={12} />
              {profileSuccess}
            </span>
          )}
        </div>

        <div className="space-y-4 text-xs">
          {/* PERSONAL INFORMATION */}
          <div>
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
              Personal Information
            </span>
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-4">
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[0.6875rem] uppercase tracking-wider font-semibold block">
                  Full Name
                </span>
                <p className="font-semibold text-slate-900 dark:text-white text-sm mt-0.5">
                  {user?.name || "Ayaan Clothing Buyer"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditField("name");
                  setFormValue(user?.name || "");
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors shrink-0"
              >
                Change
              </button>
            </div>
          </div>

          {/* CONTACT INFORMATION */}
          <div>
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
              Contact Information
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Email */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-slate-500 dark:text-slate-400 text-[0.6875rem] uppercase tracking-wider font-semibold block">
                    Email Address
                  </span>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm mt-0.5 truncate">
                    {user?.email || "—"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditField("email");
                    setFormValue(user?.email || "");
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors shrink-0"
                >
                  Change
                </button>
              </div>

              {/* Phone */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-slate-500 dark:text-slate-400 text-[0.6875rem] uppercase tracking-wider font-semibold block">
                    Phone Number
                  </span>
                  <p className={`font-semibold text-sm mt-0.5 truncate ${user?.phone ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-500 font-normal italic"}`}>
                    {user?.phone || "Not added yet"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditField("phone");
                    setFormValue(user?.phone || "");
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors shrink-0"
                >
                  {user?.phone ? "Change" : "Add Phone"}
                </button>
              </div>
            </div>
          </div>

          {/* SECURITY */}
          <div>
            <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
              Security
            </span>
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-4">
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[0.6875rem] uppercase tracking-wider font-semibold block">
                  Password
                </span>
                <p className="font-mono text-slate-900 dark:text-white text-sm mt-0.5 tracking-widest">
                  ••••••••••••
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditField("password");
                  setFormValue("");
                  setPasswordConfirm("");
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors shrink-0"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Field Modal */}
      {editField && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
                {editField === "name" && "Change Full Name"}
                {editField === "email" && "Change Email Address"}
                {editField === "phone" && (user?.phone ? "Change Phone Number" : "Add Phone Number")}
                {editField === "password" && "Change Password"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditField(null);
                  setFormError("");
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-xs text-red-700 dark:text-red-400">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveField} className="space-y-4 text-xs">
              {editField === "name" && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  />
                </div>
              )}

              {editField === "email" && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  />
                </div>
              )}

              {editField === "phone" && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+880 1800 000000"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  />
                </div>
              )}

              {editField === "password" && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={formValue}
                      onChange={(e) => setFormValue(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Re-enter password"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setEditField(null);
                    setFormError("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingField}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold transition-all disabled:opacity-50 active:scale-[0.98] shadow-sm"
                >
                  {savingField ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
