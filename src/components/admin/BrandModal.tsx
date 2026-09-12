"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Upload, Trash2, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react";
import { brandService, BrandModel } from "@/services/brand.service";
import { uploadBrandLogo } from "@/lib/services/storage";
import BrandTile from "@/components/common/BrandTile";

export interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  brand?: BrandModel | null; // If provided, we are editing
  onSuccess?: (savedBrand: BrandModel) => void;
  defaultSortOrder?: number;
}

/**
 * Reusable Admin Brand Creation & Edit Modal
 *
 * Implements:
 * - Brand Name (required, trimmed)
 * - Brand Logo PNG Drag & Drop upload + file chooser
 * - Immediate live preview rendered via BrandTile (matching public storefront)
 * - Replace and Remove logo actions
 * - Type validation with helpful error messages
 * - Advanced optional fields (slug, website, sort_order, is_active) in collapsible section
 * - Preserves caller form state when invoked inline (e.g. from ProductForm)
 */
export default function BrandModal({
  isOpen,
  onClose,
  brand,
  onSuccess,
  defaultSortOrder = 1,
}: BrandModalProps) {
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [website, setWebsite] = useState("");
  const [sortOrder, setSortOrder] = useState(defaultSortOrder);
  const [isActive, setIsActive] = useState(true);

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal opens or brand changes
  useEffect(() => {
    if (isOpen) {
      if (brand) {
        setName(brand.name || "");
        setLogoUrl(brand.logo_url || brand.logo || "");
        setSlug(brand.slug || "");
        setWebsite(brand.website || "");
        setSortOrder(brand.sort_order ?? defaultSortOrder);
        setIsActive(brand.is_active ?? true);
      } else {
        setName("");
        setLogoUrl("");
        setSlug("");
        setWebsite("");
        setSortOrder(defaultSortOrder);
        setIsActive(true);
      }
      setErrorMessage("");
      setIsDragging(false);
      setIsUploading(false);
      setIsSaving(false);
    }
  }, [isOpen, brand, defaultSortOrder]);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setErrorMessage("");

    // Validate image format (PNG preferred)
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG preferred).");
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadBrandLogo(file);
      if (res.url) {
        setLogoUrl(res.url);
      } else {
        setErrorMessage("Could not process the uploaded logo.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to upload logo image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
    // Reset file input so re-selecting same file triggers change
    if (e.target) e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoUrl("");
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setErrorMessage("Brand name is required.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const effectiveSlug = slug.trim() || trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      let saved: BrandModel;

      if (brand && brand.id) {
        saved = await brandService.updateBrand(brand.id, {
          name: trimmedName,
          slug: effectiveSlug,
          logo_url: logoUrl || "",
          logo: logoUrl || "",
          website: website.trim() || null,
          sort_order: Number(sortOrder),
          is_active: isActive,
        });
      } else {
        saved = await brandService.createBrand({
          name: trimmedName,
          slug: effectiveSlug,
          logo_url: logoUrl || "",
          logo: logoUrl || "",
          website: website.trim() || null,
          sort_order: Number(sortOrder),
          is_active: isActive,
        });
      }

      if (onSuccess) {
        onSuccess(saved);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to save brand record.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-modal-title"
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div>
            <h3 id="brand-modal-title" className="font-display font-bold text-base sm:text-lg uppercase text-stone-900 dark:text-stone-100 tracking-tight">
              {brand ? "Edit Brand Record" : "Add Brand"}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Enter brand name and upload logo PNG. The logo is authoritative across the frontend.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={15} className="shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* 1. BRAND NAME (Required) */}
          <div className="space-y-1.5">
            <label htmlFor="brand-name-input" className="font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 block">
              Brand Name <span className="text-destructive">*</span>
            </label>
            <input
              id="brand-name-input"
              type="text"
              required
              autoFocus
              placeholder="e.g. Nike, Adidas, Decathlon"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!brand && !slug) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                }
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 dark:focus:ring-stone-100 transition-all"
            />
          </div>

          {/* 2. BRAND LOGO DROPZONE (Click or Drag & Drop) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Brand Logo <span className="text-stone-400 text-[10px] font-normal normal-case">(PNG preferred)</span>
              </label>
              {logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="text-stone-500 hover:text-destructive text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 size={12} />
                  <span>Remove Logo</span>
                </button>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
                isDragging
                  ? "border-stone-900 bg-stone-100 dark:bg-stone-800/80 scale-[1.01]"
                  : "border-stone-300 dark:border-stone-700 hover:border-stone-500 bg-stone-50/40 dark:bg-stone-800/20"
              }`}
            >
              {isUploading ? (
                <div className="py-3 flex flex-col items-center gap-2 text-stone-600 dark:text-stone-300">
                  <div className="w-6 h-6 border-2 border-stone-900 dark:border-stone-100 border-t-transparent rounded-full animate-spin" />
                  <span className="font-semibold text-xs">Processing logo...</span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300">
                    <Upload size={18} />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-stone-800 dark:text-stone-200 block">
                      Drag &amp; drop brand logo PNG here
                    </span>
                    <span className="text-[11px] text-stone-500 block mt-0.5">
                      or <span className="text-stone-900 dark:text-stone-100 font-bold underline">choose a file</span> from your device
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 3. LOGO LIVE PREVIEW (Rule 5 & 97: Admin preview matches public BrandTile) */}
          {logoUrl && (
            <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Storefront Preview
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[11px] font-semibold text-stone-700 dark:text-stone-300 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={11} />
                  <span>Replace Logo</span>
                </button>
              </div>

              <div className="flex items-center justify-center py-1">
                <div className="w-36">
                  <BrandTile
                    brand={{
                      name: name.trim() || "Brand Name",
                      logo_url: logoUrl,
                    }}
                    asButton={false}
                    size="md"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Advanced Brand Settings */}
          <div className="pt-1 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[11px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1 py-1 cursor-pointer transition-colors"
            >
              <span>{showAdvanced ? "Hide Advanced Settings" : "Advanced Settings (Slug, Website, Sort)"}</span>
              {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showAdvanced && (
              <div className="space-y-3 pt-2 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold uppercase tracking-wider text-stone-500 text-[10px]">
                      Slug / Identifier
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. decathlon"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 font-mono text-xs focus:ring-1 focus:ring-stone-900 outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold uppercase tracking-wider text-stone-500 text-[10px]">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-xs focus:ring-1 focus:ring-stone-900 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-stone-500 text-[10px]">
                    Official Website
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 text-xs focus:ring-1 focus:ring-stone-900 outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="brand-modal-active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <label htmlFor="brand-modal-active" className="font-semibold text-stone-700 dark:text-stone-300 cursor-pointer select-none">
                    Active (Visible on public storefront &amp; brand filters)
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold uppercase tracking-wider hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploading || !name.trim()}
              className="px-6 py-2 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            >
              {isSaving && <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              <span>{isSaving ? "Saving..." : brand ? "Update Brand" : "Save Brand"}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
