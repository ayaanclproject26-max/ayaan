"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { TRANSLATIONS, LanguageCode } from "./translations";

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  defaultLanguage: LanguageCode;
  postalCodePlaceholder?: string;
  postalCodeRequired?: boolean;
}

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    defaultLanguage: "English",
    postalCodePlaceholder: "e.g. 90210 or 10001",
    postalCodeRequired: false,
  },
  {
    code: "BD",
    name: "Bangladesh",
    flag: "🇧🇩",
    defaultLanguage: "English",
    postalCodePlaceholder: "e.g. 1212 or 1000",
    postalCodeRequired: false,
  },
  {
    code: "GB",
    name: "United Kingdom",
    flag: "🇬🇧",
    defaultLanguage: "English",
    postalCodePlaceholder: "e.g. SW1A 1AA",
    postalCodeRequired: false,
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    flag: "🇦🇪",
    defaultLanguage: "English",
    postalCodePlaceholder: "e.g. Dubai / Abu Dhabi",
    postalCodeRequired: false,
  },
  {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    defaultLanguage: "English",
    postalCodePlaceholder: "e.g. M5V 2T6",
    postalCodeRequired: false,
  },
  {
    code: "SA",
    name: "Saudi Arabia",
    flag: "🇸🇦",
    defaultLanguage: "Arabic",
    postalCodePlaceholder: "e.g. 11564",
    postalCodeRequired: false,
  },
  {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    defaultLanguage: "English",
    postalCodePlaceholder: "e.g. 2000",
    postalCodeRequired: false,
  },
  {
    code: "DE",
    name: "Germany",
    flag: "🇩🇪",
    defaultLanguage: "English",
    postalCodePlaceholder: "e.g. 10115",
    postalCodeRequired: false,
  },
  {
    code: "FR",
    name: "France",
    flag: "🇫🇷",
    defaultLanguage: "English",
    postalCodePlaceholder: "e.g. 75001",
    postalCodeRequired: false,
  },
  {
    code: "IT",
    name: "Italy",
    flag: "🇮🇹",
    defaultLanguage: "English",
    postalCodePlaceholder: "e.g. 00100",
    postalCodeRequired: false,
  },
];

export const SUPPORTED_LANGUAGES: { code: LanguageCode; label: string; native: string }[] = [
  { code: "English", label: "English", native: "English" },
  { code: "Bengali", label: "Bengali", native: "বাংলা" },
  { code: "Arabic", label: "Arabic", native: "العربية" },
];

export interface UserPreferences {
  country: string;
  countryCode: string;
  flag: string;
  postalCode: string;
  language: LanguageCode;
  currency: "USD";
  currencySymbol: "$";
  lastUpdated: number;
}

const STORAGE_KEY = "ayaan_user_preferences";

const DEFAULT_PREFERENCES: UserPreferences = {
  country: "United States",
  countryCode: "US",
  flag: "🇺🇸",
  postalCode: "",
  language: "English",
  currency: "USD",
  currencySymbol: "$",
  lastUpdated: Date.now(),
};

interface PreferencesContextType {
  preferences: UserPreferences;
  isLoaded: boolean;
  updateLocation: (countryCode: string, postalCode?: string) => void;
  updateLanguage: (language: LanguageCode) => void;
  updateLanguageCurrency: (language: string, currency?: string) => void;
  updateAllPreferences: (newPrefs: Partial<UserPreferences>) => void;
  t: (key: string) => string;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

function detectBrowserCountry(): CountryInfo {
  try {
    if (typeof window === "undefined") return SUPPORTED_COUNTRIES[0];

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const locale = (navigator.language || "").toLowerCase();

    if (timeZone.includes("Dhaka")) return SUPPORTED_COUNTRIES.find(c => c.code === "BD")!;
    if (timeZone.includes("London")) return SUPPORTED_COUNTRIES.find(c => c.code === "GB")!;
    if (timeZone.includes("Dubai")) return SUPPORTED_COUNTRIES.find(c => c.code === "AE")!;
    if (timeZone.includes("Riyadh")) return SUPPORTED_COUNTRIES.find(c => c.code === "SA")!;
    if (timeZone.includes("Toronto") || timeZone.includes("Vancouver")) return SUPPORTED_COUNTRIES.find(c => c.code === "CA")!;
    if (timeZone.includes("Sydney") || timeZone.includes("Melbourne")) return SUPPORTED_COUNTRIES.find(c => c.code === "AU")!;
    if (timeZone.includes("Berlin")) return SUPPORTED_COUNTRIES.find(c => c.code === "DE")!;
    if (timeZone.includes("Paris")) return SUPPORTED_COUNTRIES.find(c => c.code === "FR")!;
    if (timeZone.includes("Rome")) return SUPPORTED_COUNTRIES.find(c => c.code === "IT")!;

    if (locale.includes("bn") || locale.includes("bd")) return SUPPORTED_COUNTRIES.find(c => c.code === "BD")!;
    if (locale.includes("en-gb")) return SUPPORTED_COUNTRIES.find(c => c.code === "GB")!;
    if (locale.includes("ar")) return SUPPORTED_COUNTRIES.find(c => c.code === "AE")!;

    return SUPPORTED_COUNTRIES[0];
  } catch {
    return SUPPORTED_COUNTRIES[0];
  }
}

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.countryCode) {
          setPreferences({
            ...DEFAULT_PREFERENCES,
            ...parsed,
            currency: "USD",
            currencySymbol: "$",
          });
          setIsLoaded(true);
          return;
        }
      }
    } catch {
      // ignore JSON parse or localStorage failure
    }

    const detected = detectBrowserCountry();
    const detectedPrefs: UserPreferences = {
      country: detected.name,
      countryCode: detected.code,
      flag: detected.flag,
      postalCode: "",
      language: detected.defaultLanguage,
      currency: "USD",
      currencySymbol: "$",
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

    setPreferences(prev => {
      const updated: UserPreferences = {
        ...prev,
        country: countryObj.name,
        countryCode: countryObj.code,
        flag: countryObj.flag,
        postalCode: postalCode.trim(),
        currency: "USD",
        currencySymbol: "$",
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

  const updateLanguage = (language: LanguageCode) => {
    const langObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

    setPreferences(prev => {
      const updated: UserPreferences = {
        ...prev,
        language: langObj.code,
        currency: "USD",
        currencySymbol: "$",
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

  // Backwards compatible method name
  const updateLanguageCurrency = (language: string, _currency?: string) => {
    updateLanguage(language as LanguageCode);
  };

  const updateAllPreferences = (newPrefs: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const updated: UserPreferences = {
        ...prev,
        ...newPrefs,
        currency: "USD",
        currencySymbol: "$",
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

  const t = useCallback((key: string): string => {
    const lang = preferences.language || "English";
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.English;
    return dict[key] || TRANSLATIONS.English[key] || key;
  }, [preferences.language]);

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        isLoaded,
        updateLocation,
        updateLanguage,
        updateLanguageCurrency,
        updateAllPreferences,
        t,
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
