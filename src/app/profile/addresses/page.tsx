"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MapPin, Plus, Star, Pencil, Trash2, X, Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { UserAddress } from "@/types/api";

// ─── localStorage-backed address service ──────────────────────────────────────

const ADDR_KEY = "ayaan_customer_addresses_v1";

function loadAddresses(userId: string): UserAddress[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ADDR_KEY);
    const all: Record<string, UserAddress[]> = raw ? JSON.parse(raw) : {};
    return all[userId] || [];
  } catch {
    return [];
  }
}

function saveAddresses(userId: string, addresses: UserAddress[]): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ADDR_KEY);
    const all: Record<string, UserAddress[]> = raw ? JSON.parse(raw) : {};
    all[userId] = addresses;
    localStorage.setItem(ADDR_KEY, JSON.stringify(all));
  } catch {
    // ignore quota
  }
}

function generateId(): string {
  return `addr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Country list ──────────────────────────────────────────────────────────────

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "JP", name: "Japan" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "IN", name: "India" },
  { code: "CN", name: "China" },
  { code: "SG", name: "Singapore" },
  { code: "TR", name: "Turkey" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "PL", name: "Poland" },
  { code: "BD", name: "Bangladesh" },
  { code: "PK", name: "Pakistan" },
  { code: "LK", name: "Sri Lanka" },
  { code: "VN", name: "Vietnam" },
  { code: "KR", name: "South Korea" },
  { code: "HK", name: "Hong Kong SAR" },
  { code: "NZ", name: "New Zealand" },
  { code: "ZA", name: "South Africa" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
].sort((a, b) => a.name.localeCompare(b.name));

// ─── Blank address form ────────────────────────────────────────────────────────

type AddressForm = Omit<UserAddress, "id" | "user_id">;

function blankForm(): AddressForm {
  return {
    name: "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country_code: "US",
    is_default: false,
  };
}

// ─── InputField ───────────────────────────────────────────────────────────────

function InputField({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
      />
    </div>
  );
}

// ─── Address Form Modal ────────────────────────────────────────────────────────

function AddressModal({
  initial,
  onClose,
  onSave,
}: {
  initial: AddressForm;
  onClose: () => void;
  onSave: (f: AddressForm) => void;
}) {
  const [form, setForm] = useState<AddressForm>(initial);
  const [errors, setErrors] = useState<string[]>([]);

  const set = (key: keyof AddressForm, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!form.name.trim()) errs.push("Recipient name is required.");
    if (!form.address_line_1.trim()) errs.push("Address line 1 is required.");
    if (!form.city.trim()) errs.push("City is required.");
    if (!form.postal_code.trim()) errs.push("Postal code is required.");
    if (!form.country_code) errs.push("Country is required.");
    if (errs.length) { setErrors(errs); return; }
    onSave(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-white/10">
          <h3 className="text-base font-bold font-display text-slate-900 dark:text-white">
            {initial.name ? "Edit Address" : "New Address"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {errors.length > 0 && (
            <div className="flex gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-xs text-red-700 dark:text-red-400">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <ul className="space-y-0.5">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Recipient Name" value={form.name} onChange={(v) => set("name", v)} required />
            <InputField label="Phone" value={form.phone || ""} onChange={(v) => set("phone", v)} placeholder="+1 555 000 0000" type="tel" />
          </div>

          <InputField label="Company" value={(form as any).company_name || ""} onChange={(v) => set("company_name" as any, v)} placeholder="Company / Business (optional)" />
          <InputField label="Address Line 1" value={form.address_line_1} onChange={(v) => set("address_line_1", v)} required placeholder="Street address, P.O. box" />
          <InputField label="Address Line 2" value={form.address_line_2 || ""} onChange={(v) => set("address_line_2", v)} placeholder="Apt, suite, floor (optional)" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="City" value={form.city} onChange={(v) => set("city", v)} required />
            <InputField label="State / Region" value={form.state || ""} onChange={(v) => set("state", v)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Postal Code" value={form.postal_code} onChange={(v) => set("postal_code", v)} required />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                value={form.country_code}
                onChange={(e) => set("country_code", e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => set("is_default", e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              Set as default shipping address
            </span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-bold transition-all active:scale-[0.98] shadow-sm"
            >
              Save Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete confirmation ───────────────────────────────────────────────────────

function DeleteDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center shrink-0">
            <Trash2 size={16} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Address</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Are you sure you want to remove this saved address? This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Address Card ──────────────────────────────────────────────────────────────

function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  address: UserAddress;
  onEdit: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const country = COUNTRIES.find((c) => c.code === address.country_code)?.name || address.country_code;

  return (
    <div
      className={[
        "bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm flex flex-col gap-4",
        address.is_default
          ? "border-amber-300 dark:border-amber-700/50"
          : "border-slate-200 dark:border-white/10",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin size={14} className={address.is_default ? "text-amber-600" : "text-slate-400"} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {address.is_default ? "Default Shipping" : "Saved Address"}
          </span>
          {address.is_default && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-[0.6875rem] font-bold border border-amber-200 dark:border-amber-700/40">
              <Star size={10} fill="currentColor" />
              DEFAULT
            </span>
          )}
        </div>
      </div>

      {/* Address body */}
      <div className="text-sm space-y-0.5">
        <p className="font-bold text-slate-900 dark:text-white">{address.name}</p>
        {(address as any).company_name && (
          <p className="text-slate-500 dark:text-slate-400 text-xs">{(address as any).company_name}</p>
        )}
        <p className="text-slate-600 dark:text-slate-300">{address.address_line_1}</p>
        {address.address_line_2 && (
          <p className="text-slate-600 dark:text-slate-300">{address.address_line_2}</p>
        )}
        <p className="text-slate-600 dark:text-slate-300">
          {address.city}{address.state ? `, ${address.state}` : ""} {address.postal_code}
        </p>
        <p className="text-slate-600 dark:text-slate-300">{country}</p>
        {address.phone && (
          <p className="text-slate-500 dark:text-slate-400 text-xs pt-1">{address.phone}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-100 dark:border-white/[0.06]">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-all"
        >
          <Pencil size={12} />
          Edit
        </button>
        {!address.is_default && (
          <button
            type="button"
            onClick={onSetDefault}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-all"
          >
            <Star size={12} />
            Set Default
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all ml-auto"
        >
          <Trash2 size={12} />
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AddressesPage() {
  const { user } = useAuth();
  const userId = String(user?.id || "guest");

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<UserAddress | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserAddress | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  const reload = useCallback(() => {
    setAddresses(loadAddresses(userId));
  }, [userId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const persist = (next: UserAddress[]) => {
    saveAddresses(userId, next);
    setAddresses(next);
  };

  const handleSave = (form: AddressForm) => {
    let next: UserAddress[];

    if (editTarget) {
      // Update existing
      next = addresses.map((a) =>
        a.id === editTarget.id ? { ...a, ...form } : a
      );
    } else {
      // Create new
      const newAddr: UserAddress = {
        ...form,
        id: generateId(),
        user_id: userId,
      };
      next = [...addresses, newAddr];
    }

    // If new default — clear existing default
    if (form.is_default) {
      next = next.map((a) => ({
        ...a,
        is_default: a.id === (editTarget?.id || next[next.length - 1].id),
      }));
    }

    persist(next);
    setShowForm(false);
    setEditTarget(null);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const next = addresses.filter((a) => a.id !== deleteTarget.id);
    persist(next);
    setDeleteTarget(null);
  };

  const handleSetDefault = (address: UserAddress) => {
    const next = addresses.map((a) => ({ ...a, is_default: a.id === address.id }));
    persist(next);
  };

  const openEdit = (address: UserAddress) => {
    setEditTarget(address);
    setShowForm(true);
  };

  const openNew = () => {
    setEditTarget(null);
    setShowForm(true);
  };

  const initialForm: AddressForm = editTarget
    ? {
        name: editTarget.name,
        phone: editTarget.phone,
        address_line_1: editTarget.address_line_1,
        address_line_2: editTarget.address_line_2,
        city: editTarget.city,
        state: editTarget.state,
        postal_code: editTarget.postal_code,
        country_code: editTarget.country_code,
        is_default: editTarget.is_default,
      }
    : blankForm();

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Addresses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your saved shipping addresses.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-sm shrink-0"
        >
          <Plus size={14} />
          Add New Address
        </button>
      </div>

      {/* Success toast */}
      {savedMsg && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
          <Check size={14} />
          Address saved successfully.
        </div>
      )}

      {/* Content */}
      {addresses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm flex flex-col items-center justify-center text-center py-8 sm:py-10 px-6">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center mb-3">
            <MapPin size={20} className="text-slate-400" />
          </div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">No saved addresses</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
            Add a shipping address to make checkout faster.
          </p>
          <button
            type="button"
            onClick={openNew}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-sm"
          >
            <Plus size={13} />
            Add New Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses
            .slice()
            .sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0))
            .map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                onEdit={() => openEdit(addr)}
                onDelete={() => setDeleteTarget(addr)}
                onSetDefault={() => handleSetDefault(addr)}
              />
            ))}
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <AddressModal
          initial={initialForm}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSave={handleSave}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
