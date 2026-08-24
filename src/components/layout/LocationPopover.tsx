"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, MapPin, Check } from "lucide-react";

export interface DeliveryLocation {
  countryCode: string;
  countryName: string;
  flag: string;
  city?: string;
  postalCode?: string;
}

const COUNTRIES: { code: string; name: string; flag: string; cities?: string[] }[] = [
  {
    code: "BD",
    name: "Bangladesh",
    flag: "🇧🇩",
    cities: ["Dhaka", "Chittagong", "Sylhet", "Rajshahi", "Khulna", "Barisal", "Rangpur", "Mymensingh"],
  },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
];

interface LocationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: DeliveryLocation;
  onSelectLocation: (loc: DeliveryLocation) => void;
}

export default function LocationPopover({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation,
}: LocationPopoverProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>(currentLocation.countryCode);
  const [selectedCity, setSelectedCity] = useState<string>(currentLocation.city || "Dhaka");
  const [postalCode, setPostalCode] = useState<string>(currentLocation.postalCode || "");

  const popoverRef = useRef<HTMLDivElement>(null);

  // Sync with current location when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedCountry(currentLocation.countryCode);
      setSelectedCity(currentLocation.city || "Dhaka");
      setPostalCode(currentLocation.postalCode || "");
    }
  }, [isOpen, currentLocation]);

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

  const currentCountryObj = COUNTRIES.find((c) => c.code === selectedCountry) || COUNTRIES[0];

  const handleApply = () => {
    onSelectLocation({
      countryCode: currentCountryObj.code,
      countryName: currentCountryObj.name,
      flag: currentCountryObj.flag,
      city: currentCountryObj.cities ? selectedCity : undefined,
      postalCode: postalCode.trim() || undefined,
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
        className="fixed lg:absolute top-1/2 lg:top-full left-1/2 lg:left-auto lg:right-0 -translate-x-1/2 -translate-y-1/2 lg:translate-x-0 lg:translate-y-0 lg:mt-3 w-[92vw] max-w-[360px] bg-slate-900 border border-white/15 rounded-2xl shadow-2xl z-[120] p-5 text-white animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <MapPin size={18} className="text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Choose Delivery Location</h3>
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
          {/* Country Selection */}
          <div>
            <label className="block text-[11px] font-bold text-white/60 uppercase tracking-wider mb-2">
              Country / Region
            </label>
            <div className="grid grid-cols-2 gap-2">
              {COUNTRIES.map((country) => {
                const isSelected = selectedCountry === country.code;
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => {
                      setSelectedCountry(country.code);
                      if (country.cities && country.cities.length > 0) {
                        setSelectedCity(country.cities[0]);
                      }
                    }}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                      isSelected
                        ? "bg-amber-500/20 border-amber-500/80 text-white shadow-sm"
                        : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08] text-white/80"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base leading-none">{country.flag}</span>
                      <span className="truncate">{country.code} - {country.name}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-amber-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Division/City for Bangladesh */}
          {currentCountryObj.cities && (
            <div>
              <label className="block text-[11px] font-bold text-white/60 uppercase tracking-wider mb-1.5">
                City / Division
              </label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/15 text-white text-xs font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
              >
                {currentCountryObj.cities.map((city) => (
                  <option key={city} value={city} className="bg-slate-900 text-white">
                    {city}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Postal Code */}
          <div>
            <label className="block text-[11px] font-bold text-white/60 uppercase tracking-wider mb-1.5">
              Postal Code / Area (Optional)
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              placeholder="e.g. 1212 or Gulshan"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.08] border border-white/15 text-white placeholder:text-white/40 text-xs font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
            />
          </div>

          {/* Actions */}
          <button
            type="button"
            onClick={handleApply}
            className="w-full mt-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md transition-all press-feedback"
          >
            Apply & Deliver Here
          </button>
        </div>
      </div>
    </>
  );
}
