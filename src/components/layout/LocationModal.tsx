"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Check, Search, MapPin, AlertCircle } from "lucide-react";
import { usePreferences, SUPPORTED_COUNTRIES, CountryInfo } from "@/lib/PreferencesContext";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSignIn: () => void;
}

export default function LocationModal({
  isOpen,
  onClose,
  onOpenSignIn,
}: LocationModalProps) {
  const { preferences, updateLocation } = usePreferences();

  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(preferences.countryCode);
  const [postalCode, setPostalCode] = useState<string>(preferences.postalCode || "");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync state with preferences when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCountryCode(preferences.countryCode);
      setPostalCode(preferences.postalCode || "");
      setIsCountryDropdownOpen(false);
      setCountrySearch("");
      setError(null);
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
        if (isCountryDropdownOpen) {
          setIsCountryDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isCountryDropdownOpen, onClose]);

  // Handle outside click for country dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isCountryDropdownOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCountryDropdownOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isCountryDropdownOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isCountryDropdownOpen]);

  if (!isOpen) return null;

  const currentCountry =
    SUPPORTED_COUNTRIES.find((c) => c.code === selectedCountryCode) || SUPPORTED_COUNTRIES[0];

  const filteredCountries = SUPPORTED_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate postal code if required or provided
    if (postalCode.trim().length > 0 && postalCode.trim().length < 2) {
      setError("Please enter a valid ZIP or postal code");
      return;
    }

    updateLocation(selectedCountryCode, postalCode.trim());
    onClose();
  };

  const handleSignInClick = () => {
    onClose();
    onOpenSignIn();
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
          aria-labelledby="location-modal-title"
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-6 pb-2">
            <div>
              <h2
                id="location-modal-title"
                className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight"
              >
                Specify your location
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Shipping options and fees vary based on your location
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
          <div className="p-6 pt-3 flex flex-col gap-4">
            {/* Primary Action: Sign In to Add Address */}
            <button
              type="button"
              onClick={handleSignInClick}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all press-feedback flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <MapPin size={16} />
              <span>Sign in to add address</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-0.5">
              <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                or
              </span>
              <div className="flex-1 h-[1px] bg-slate-200 dark:bg-white/10" />
            </div>

            {/* Country Selector & Postal Code Form */}
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {/* Country Selector Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Ship to Country / Region
                </label>
                <button
                  type="button"
                  onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50/50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-900 dark:text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl leading-none">{currentCountry.flag}</span>
                    <span className="font-semibold">{currentCountry.name}</span>
                    <span className="text-xs text-slate-400">({currentCountry.code})</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${
                      isCountryDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Country Dropdown Menu */}
                {isCountryDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-60 animate-in fade-in zoom-in-95 duration-150">
                    {/* Search Field */}
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                      <div className="relative">
                        <Search
                          size={14}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          placeholder="Search country..."
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Country List */}
                    <div className="overflow-y-auto p-1 flex flex-col gap-0.5">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((c) => {
                          const isSelected = selectedCountryCode === c.code;
                          return (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setSelectedCountryCode(c.code);
                                setIsCountryDropdownOpen(false);
                                setCountrySearch("");
                              }}
                              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                                isSelected
                                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold"
                                  : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-base leading-none">{c.flag}</span>
                                <span>{c.name}</span>
                              </div>
                              {isSelected && <Check size={14} className="text-amber-600 dark:text-amber-400" />}
                            </button>
                          );
                        })
                      ) : (
                        <div className="py-4 text-center text-xs text-slate-400">
                          No countries found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ZIP / Postal Code Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Enter ZIP or postal code
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => {
                    setPostalCode(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={currentCountry.postalCodePlaceholder || "Enter ZIP or postal code"}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50/50 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
                {error && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {error}
                  </p>
                )}
              </div>

              {/* Save Button */}
              <button
                type="submit"
                className="w-full mt-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all press-feedback focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
