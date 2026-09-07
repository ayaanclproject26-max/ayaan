"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  User,
  Mail,
  Phone,
  Lock,
  Check,
  AlertCircle,
  X,
  ShieldCheck,
} from "lucide-react";

export default function AccountDetailsPage() {
  const { user, updateProfile } = useAuth();

  // Edit Field State
  const [editField, setEditField] = useState<"name" | "email" | "phone" | "password" | null>(null);
  const [formValue, setFormValue] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [formError, setFormError] = useState("");
  const [savingField, setSavingField] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");

  const handleOpenEdit = (field: "name" | "email" | "phone" | "password") => {
    setEditField(field);
    setFormError("");
    if (field === "name") setFormValue(user?.name || "");
    else if (field === "email") setFormValue(user?.email || "");
    else if (field === "phone") setFormValue(user?.phone || "");
    else {
      setFormValue("");
      setPasswordConfirm("");
    }
  };

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
        setProfileSuccess("Full name updated successfully.");
      } else if (editField === "email") {
        if (!formValue.trim() || !formValue.includes("@")) {
          setFormError("A valid email address is required.");
          setSavingField(false);
          return;
        }
        await updateProfile({ email: formValue.trim().toLowerCase() });
        setProfileSuccess("Email address updated successfully.");
      } else if (editField === "phone") {
        await updateProfile({ phone: formValue.trim() });
        setProfileSuccess("Phone number updated successfully.");
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
        await updateProfile({ ...user, password: formValue } as any);
        setProfileSuccess("Password updated successfully.");
      }

      setEditField(null);
      setTimeout(() => setProfileSuccess(""), 4000);
    } catch (err: any) {
      setFormError(err?.message || "Failed to update account information.");
    } finally {
      setSavingField(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Account Details
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your personal profile credentials and account security settings.
          </p>
        </div>

        {profileSuccess && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3.5 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 animate-fade-in self-start sm:self-auto">
            <Check size={13} />
            {profileSuccess}
          </span>
        )}
      </div>

      {/* Main Details Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
        {/* Section 1: Personal Information */}
        <div>
          <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-100 dark:border-white/10">
            <User size={15} className="text-amber-600 dark:text-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Personal Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[0.6875rem] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block">
                  Full Name
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 truncate">
                  {user?.name || "Ayaan Buyer"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenEdit("name")}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
              >
                Change
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[0.6875rem] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block">
                  Company / Organization
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 truncate">
                  {user?.company_name || "Ayaan Wholesale Partner"}
                </p>
              </div>
              <span className="text-[0.6875rem] text-slate-400 font-medium shrink-0">
                Registered
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div>
          <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-100 dark:border-white/10">
            <Mail size={15} className="text-amber-600 dark:text-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Contact Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Email */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[0.6875rem] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block">
                  Email Address
                </span>
                <p className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 truncate">
                  {user?.email || "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenEdit("email")}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* Phone */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[0.6875rem] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block">
                  Phone Number
                </span>
                <p
                  className={`text-sm mt-0.5 truncate ${
                    user?.phone
                      ? "font-bold text-slate-900 dark:text-white"
                      : "text-slate-400 italic font-normal"
                  }`}
                >
                  {user?.phone || "Not provided yet"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenEdit("phone")}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
              >
                {user?.phone ? "Change" : "Add"}
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Security & Verification */}
        <div>
          <div className="flex items-center gap-2 pb-2.5 mb-3 border-b border-slate-100 dark:border-white/10">
            <Lock size={15} className="text-amber-600 dark:text-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Security & Verification
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Password */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-4">
              <div>
                <span className="text-[0.6875rem] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block">
                  Password
                </span>
                <p className="font-mono text-slate-900 dark:text-white text-sm mt-0.5 tracking-widest">
                  ••••••••••••
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenEdit("password")}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors shrink-0 cursor-pointer"
              >
                Change
              </button>
            </div>

            {/* Verification Status */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-4">
              <div>
                <span className="text-[0.6875rem] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block">
                  Verification Status
                </span>
                <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                  <ShieldCheck size={14} />
                  <span>Verified B2B Buyer</span>
                </div>
              </div>
              <span className="text-[0.6875rem] text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingField}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold transition-all disabled:opacity-50 active:scale-[0.98] shadow-xs cursor-pointer"
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
