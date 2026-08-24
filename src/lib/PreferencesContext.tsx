"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  defaultCurrency: string;
  defaultLanguage: string;
  postalCodePlaceholder?: string;
  postalCodeRequired?: boolean;
}

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  {
    code: "BD",
    name: "Bangladesh",
    flag: "🇧🇩",
    defaultCurrency: "BDT",
    defaultLanguage: "English",
    postalCodePlaceholder: "e.g. 1212 or 1000",
    postalCodeRequired: false,
  },
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    defaultCurrency: "USD",
    defaultLanguage: "English",
    postalCodePlaceholder: "e.g. 90210 or 10001",
    postalCodeRequired: false,
  },
  {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    defaultCurrency: "GBP",
    defaultLanguage: "English",
    postalCodePlaceholder: "e.g. SW1A 1AA",
    postalCodeRequired: false,
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    defaultCurrency: "AED",
    defaultLanguage: "English",
    postalCodePlaceholder: "e.g. Dubai / Abu Dhabi",
    postalCodeRequired: false,
  },
  {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    defaultCurrency: "USD",
    defaultLanguage: "English",
    postalCodePlaceholder: "e.g. M5V 2T6",
    postalCodeRequired: false,
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    flag: "🇸🇦",
    defaultCurrency: "AED",
    defaultLanguage: "Arabic",
    postalCodePlaceholder: "e.g. 11564",
    postalCodeRequired: false,
  },
  {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    defaultCurrency: "USD",
    defaultLanguage: "English",
    postalCodePlaceholder: "e.g. 2000",
    postalCodeRequired: false,
  },
  {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    defaultCurrency: "EUR",
    defaultLanguage: "English",
    postalCodePlaceholder: "e.g. 10115",
    postalCodeRequired: false,
  },
  {
    code: "FR",
    name: "France",
    flag: "🇫🇷",
    defaultCurrency: "EUR",
    defaultLanguage: "English",
    postalCodePlaceholder: "e.g. 75001",
    postalCodeRequired: false,
  },
  {
    code: "IT",
    name: "Italy",
    flag: "🇮🇹",
    defaultCurrency: "EUR",
    defaultLanguage: "English",
    postalCodePlaceholder: "e.g. 00100",
    postalCodeRequired: false,
  },
];

export const SUPPORTED_LANGUAGES = [
  { code: "English", label: "English", native: "English" },
  { code: "Bengali", label: "Bengali", native: "বাংলা" },
  { code: "Arabic", label: "Arabic", native: "العربية" },
];

export const SUPPORTED_CURRENCIES = [
  { code: "BDT", symbol: "৳", name: "BDT - Bangladeshi Taka" },
  { code: "USD", symbol: "$", name: "USD - US Dollar" },
  { code: "EUR", symbol: "€", name: "EUR - Euro" },
  { code: "GBP", symbol: "£", name: "GBP - British Pound" },
  { code: "AED", symbol: "د.إ", name: "AED - UAE Dirham" },
];

export interface UserPreferences {
  country: string;
  countryCode: string;
  flag: string;
  postalCode: string;
  language: string;
  currency: string;
  currencySymbol: string;
  lastUpdated: number;
}

const STORAGE_KEY = "ayaan_user_preferences";

const DEFAULT_PREFERENCES: UserPreferences = {
  country: "Bangladesh",
  countryCode: "BD",
  flag: "🇧🇩",
  postalCode: "",
  language: "English",
  currency: "BDT",
  currencySymbol: "৳",
  lastUpdated: Date.now(),
};

interface PreferencesContextType {
  preferences: UserPreferences;
  isLoaded: boolean;
  updateLocation: (countryCode: string, postalCode?: string) => void;
  updateLanguageCurrency: (language: string, currency: string) => void;
  updateAllPreferences: (newPrefs: Partial<UserPreferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

function detectBrowserCountry(): CountryInfo {
  try {
    if (typeof window === "undefined") return SUPPORTED_COUNTRIES[0];

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const locale = (navigator.language || "").toLowerCase();

    // 1. Check TimeZone signals
    if (timeZone.includes("Dhaka")) return SUPPORTED_COUNTRIES.find(c => c.code === "BD")!;
    if (timeZone.includes("New_York") || timeZone.includes("Los_Angeles") || timeZone.includes("Chicago") || timeZone.includes("Denver")) {
      return SUPPORTED_COUNTRIES.find(c => c.code === "US")!;
    }
    if (timeZone.includes("London")) return SUPPORTED_COUNTRIES.find(c => c.code === "GB")!;
    if (timeZone.includes("Dubai")) return SUPPORTED_COUNTRIES.find(c => c.code === "AE")!;
    if (timeZone.includes("Riyadh")) return SUPPORTED_COUNTRIES.find(c => c.code === "SA")!;
    if (timeZone.includes("Toronto") || timeZone.includes("Vancouver")) return SUPPORTED_COUNTRIES.find(c => c.code === "CA")!;
    if (timeZone.includes("Sydney") || timeZone.includes("Melbourne")) return SUPPORTED_COUNTRIES.find(c => c.code === "AU")!;
    if (timeZone.includes("Berlin")) return SUPPORTED_COUNTRIES.find(c => c.code === "DE")!;
    if (timeZone.includes("Paris")) return SUPPORTED_COUNTRIES.find(c => c.code === "FR")!;
    if (timeZone.includes("Rome")) return SUPPORTED_COUNTRIES.find(c => c.code === "IT")!;

    // 2. Check Locale signals
    if (locale.includes("bn") || locale.includes("bd")) return SUPPORTED_COUNTRIES.find(c => c.code === "BD")!;
    if (locale.includes("en-gb")) return SUPPORTED_COUNTRIES.find(c => c.code === "GB")!;
    if (locale.includes("en-us")) return SUPPORTED_COUNTRIES.find(c => c.code === "US")!;
    if (locale.includes("ar")) return SUPPORTED_COUNTRIES.find(c => c.code === "AE")!;

    // Default fallback
    return SUPPORTED_COUNTRIES[0];
  } catch {
    return SUPPORTED_COUNTRIES[0];
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Priority 1: Check localStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.countryCode) {
          setPreferences({
            ...DEFAULT_PREFERENCES,
            ...parsed,
          });
          setIsLoaded(true);
          return;
        }
      }
    } catch {
      // ignore JSON parse or localStorage failure
    }

    // Priority 2: Non-intrusive Browser / Location signal detection
    const detected = detectBrowserCountry();
    const currObj = SUPPORTED_CURRENCIES.find(c => c.code === detected.defaultCurrency) || SUPPORTED_CURRENCIES[0];

    const detectedPrefs: UserPreferences = {
      country: detected.name,
      countryCode: detected.code,
      flag: detected.flag,
      postalCode: "",
      language: detected.defaultLanguage,
      currency: detected.defaultCurrency,
      currencySymbol: currObj.symbol,
      lastUpdated: Date.now(),
    };

    setPreferences(detectedPrefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(detectedPrefs));
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  const updateLocation = (countryCode: string, postalCode = "") => {
    const countryObj = SUPPORTED_COUNTRIES.find(c => c.code === countryCode) || SUPPORTED_COUNTRIES[0];
    
    // Automatically pair smart default currency if user hadn't explicitly customized it
    const currObj = SUPPORTED_CURRENCIES.find(c => c.code === countryObj.defaultCurrency) || SUPPORTED_CURRENCIES[0];

    setPreferences(prev => {
      const updated: UserPreferences = {
        ...prev,
        country: countryObj.name,
        countryCode: countryObj.code,
        flag: countryObj.flag,
        postalCode: postalCode.trim(),
        currency: countryObj.defaultCurrency,
        currencySymbol: currObj.symbol,
        lastUpdated: Date.now(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const updateLanguageCurrency = (language: string, currency: string) => {
    const currObj = SUPPORTED_CURRENCIES.find(c => c.code === currency) || SUPPORTED_CURRENCIES[0];
    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

    setPreferences(prev => {
      const updated: UserPreferences = {
        ...prev,
        language: langObj.code,
        currency: currObj.code,
        currencySymbol: currObj.symbol,
        lastUpdated: Date.now(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const updateAllPreferences = (newPrefs: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const updated: UserPreferences = {
        ...prev,
        ...newPrefs,
        lastUpdated: Date.now(),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        isLoaded,
        updateLocation,
        updateLanguageCurrency,
        updateAllPreferences,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
