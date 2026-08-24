"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Globe, Check, Coins } from "lucide-react";

export interface LangCurrPreference {
  language: string;
  languageLabel: string;
  currency: string;
  currencySymbol: string;
}

const LANGUAGES = [
  { code: "English", label: "English (US)", native: "English" },
  { code: "Bengali", label: "Bengali (BD)", native: "বাংলা" },
  { code: "Arabic", label: "Arabic (AE)", native: "العربية" },
];

const CURRENCIES = [
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
];

interface LanguageCurrencyPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentPref: LangCurrPreference;
  onSelectPref: (pref: LangCurrPreference) => void;
}

export default function LanguageCurrencyPopover({
  isOpen,
  onClose,
  currentPref,
  onSelectPref,
}: LanguageCurrencyPopoverProps) {
  const [selectedLang, setSelectedLang] = useState<string>(currentPref.language);
  const [selectedCurr, setSelectedCurr] = useState<string>(currentPref.currency);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync state when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedLang(currentPref.language);
      setSelectedCurr(currentPref.currency);
    }
  }, [isOpen, currentPref]);

  // Handle outside click & Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApply = () => {
    const langObj = LANGUAGES.find((l) => l.code === selectedLang) || LANGUAGES[0];
    const currObj = CURRENCIES.find((c) => c.code === selectedCurr) || CURRENCIES[0];

    onSelectPref({
      language: langObj.code,
      languageLabel: langObj.native,
      currency: currObj.code,
      currencySymbol: currObj.symbol,
    });
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs z-[110] lg:hidden animate-in fade-in"
        onClick={onClose}
      />

      {/* Popover Card */}
      <div
        ref={popoverRef}
        className="fixed lg:absolute top-1/2 lg:top-full left-1/2 lg:left-auto lg:right-0 -translate-x-1/2 -translate-y-1/2 lg:translate-x-0 lg:translate-y-0 lg:mt-3 w-[92vw] max-w-[340px] bg-slate-900 border border-white/15 rounded-2xl shadow-2xl z-[120] p-5 text-white animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Language & Currency</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4">
          {/* Language Selection */}
          <div>
            <label className="block text-[11px] font-bold text-white/60 uppercase tracking-wider mb-2">
              Select Language
            </label>
            <div className="flex flex-col gap-1.5">
              {LANGUAGES.map((lang) => {
                const isSelected = selectedLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setSelectedLang(lang.code)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-500/80 text-white shadow-sm"
                        : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-white/80"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{lang.native}</span>
                      <span className="text-white/50 text-[11px]">({lang.label})</span>
                    </div>
                    {isSelected && <Check size={14} className="text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Coins size={13} className="text-amber-400" />
              <label className="block text-[11px] font-bold text-white/60 uppercase tracking-wider">
                Select Currency
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CURRENCIES.map((curr) => {
                const isSelected = selectedCurr === curr.code;
                return (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => setSelectedCurr(curr.code)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-500/80 text-white shadow-sm"
                        : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-white/80"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-amber-400">{curr.symbol}</span>
                      <span className="truncate">{curr.code}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-amber-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleApply}
            className="w-full mt-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all press-feedback"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </>
  );
}
