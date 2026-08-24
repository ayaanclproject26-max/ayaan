"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Globe, Coins, Check } from "lucide-react";
import {
  usePreferences,
  SUPPORTED_LANGUAGES,
  SUPPORTED_CURRENCIES,
} from "@/lib/PreferencesContext";

interface LanguageCurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LanguageCurrencyModal({
  isOpen,
  onClose,
}: LanguageCurrencyModalProps) {
  const { preferences, updateLanguageCurrency } = usePreferences();

  const [selectedLanguage, setSelectedLanguage] = useState<string>(preferences.language);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(preferences.currency);

  const modalRef = useRef<HTMLDivElement>(null);

  // Sync state with preferences when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedLanguage(preferences.language);
      setSelectedCurrency(preferences.currency);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, preferences]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateLanguageCurrency(selectedLanguage, selectedCurrency);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-[200] transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className="fixed inset-0 z-[210] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        onClick={onClose}
      >
        <div
          ref={modalRef}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 w-full max-w-[440px] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto transition-all transform animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lang-curr-modal-title"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-6 pb-2">
            <div>
              <h2
                id="lang-curr-modal-title"
                className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight"
              >
                Set language and currency
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Select your preferred language and currency. You can update the settings at any time.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 -mr-2 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close modal"
            >
              <X size={20} strokeWidth={2} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSave} className="p-6 pt-3 flex flex-col gap-5">
            {/* Language Field */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Globe size={14} className="text-amber-600 dark:text-amber-400" />
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Language
                </label>
              </div>
              <div className="relative">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50/50 dark:bg-white/[0.04] text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option
                      key={lang.code}
                      value={lang.code}
                      className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {lang.label} ({lang.native})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Currency Field */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Coins size={14} className="text-amber-600 dark:text-amber-400" />
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Currency
                </label>
              </div>
              <div className="relative">
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50/50 dark:bg-white/[0.04] text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                >
                  {SUPPORTED_CURRENCIES.map((curr) => (
                    <option
                      key={curr.code}
                      value={curr.code}
                      className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {curr.name} ({curr.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full mt-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all press-feedback focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Save
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
