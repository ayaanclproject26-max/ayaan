"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  ShoppingCart, 
  User, 
  Globe, 
  Menu
} from "lucide-react";
import LocationModal from "./LocationModal";
import LanguageCurrencyModal from "./LanguageCurrencyModal";
import AuthModal from "../auth/AuthModal";
import SearchOverlay from "./SearchOverlay";
import { useCart } from "@/lib/CartContext";
import { usePreferences } from "@/lib/PreferencesContext";

const NAV_LINKS = [
  { label: "ALL", href: "#categories" },
  { label: "SWEATERS", href: "#hot-sales" },
  { label: "T-SHIRTS", href: "#categories" },
  { label: "HOODIES", href: "#categories" },
  { label: "TROUSERS", href: "#categories" },
  { label: "PANTS", href: "#categories" },
  { label: "SHORTS", href: "#categories" },
  { label: "SHIRTS", href: "#categories" },
  { label: "BEACHWEAR", href: "#categories" },
  { label: "SOCKS", href: "#categories" },
  { label: "BLOUSE", href: "#categories" },
  { label: "TANK TOP", href: "#categories" },
  { label: "TOPS", href: "#categories" },
  { label: "SPORTS", href: "#categories" },
  { label: "TOWELS", href: "#hot-sales" },
  { label: "HOT SALES", href: "#hot-sales", special: "hot" },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExecuted, setIsSearchExecuted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Modals state
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<"signin" | "signup">("signin");

  // Contexts
  const { totalItems, setIsCartOpen } = useCart();
  const { preferences } = usePreferences();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openSignIn = () => {
    setAuthModalView("signin");
    setIsAuthModalOpen(true);
  };

  // Search execution handler
  const handleExecuteSearch = (queryToSearch?: string) => {
    const q = (queryToSearch !== undefined ? queryToSearch : searchQuery).trim();
    if (q) {
      setIsSearchOpen(true);
      setIsSearchExecuted(true);

      // Save to localStorage recent searches
      try {
        const saved = localStorage.getItem("ayaan_recent_searches");
        const list: string[] = saved ? JSON.parse(saved) : ["Sweater", "T-Shirt", "Hoodie"];
        const updated = [q, ...list.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(0, 6);
        localStorage.setItem("ayaan_recent_searches", JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteSearch();
  };

  return (
    <>
      <header 
        className={`sticky top-0 z-50 transition-all duration-300 w-full ${
          isScrolled 
            ? "bg-[#0b1329]/95 backdrop-blur-md shadow-md border-b border-white/10" 
            : "bg-[#0b1329] border-b border-white/10"
        }`}
      >
        {/* DESKTOP HEADER */}
        <div className="hidden lg:flex mx-auto max-w-[1400px] px-4 sm:px-6 h-16 sm:h-[4.25rem] items-center gap-6 xl:gap-8 text-white w-full">
          
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0 press-feedback" aria-label="Ayaan Home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Ayaan Logo" className="h-8 sm:h-9 w-auto brightness-0 invert" />
          </Link>

          {/* Search Bar with Right-Side Pill Button and Active Glow */}
          <form 
            onSubmit={handleSearchSubmit}
            className={`flex w-full max-w-[45%] mx-auto items-center rounded-full pl-4 pr-1.5 h-10 border transition-all duration-200 cursor-text ${
              isSearchOpen 
                ? "bg-white/[0.15] border-white/40 shadow-lg ring-2 ring-white/20" 
                : "bg-white/[0.08] border-white/15 hover:bg-white/[0.12] hover:border-white/30 focus-within:border-white/40 focus-within:bg-white/[0.15]"
            }`}
          >
            <input 
              type="text"
              className="bg-transparent border-none outline-none w-full text-[0.875rem] focus:ring-0 text-white placeholder:text-white/50 pr-2"
              placeholder="Search products, brands, and more..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) {
                  setIsSearchExecuted(false);
                }
              }}
              onFocus={() => setIsSearchOpen(true)}
            />
            {/* Right-Side Search Pill Button */}
            <button 
              type="submit"
              className="shrink-0 h-7 px-3.5 rounded-full bg-white text-[#0b1329] hover:bg-white/90 active:scale-95 font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all duration-150 cursor-pointer"
              aria-label="Search"
              title="Search products"
            >
              <Search size={14} strokeWidth={2.5} />
            </button>
          </form>

          {/* Desktop Utilities */}
          <div className="flex items-center gap-6 xl:gap-8 shrink-0">
            
            {/* Deliver To */}
            <button 
              type="button"
              className="flex items-center gap-2 text-white/85 hover:text-white cursor-pointer transition-colors press-feedback focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1"
              onClick={() => setIsLocationOpen(true)}
              aria-label={`Deliver to ${preferences.country}`}
            >
              <span className="text-xl leading-none">{preferences.flag}</span>
              <div className="flex flex-col leading-none justify-center text-left">
                <span className="text-[0.6rem] text-white/50 mb-0.5 uppercase tracking-wide">Deliver to:</span>
                <span className="font-bold tracking-wide text-sm truncate max-w-[90px]">
                  {preferences.countryCode}
                </span>
              </div>
            </button>

            {/* Language / Currency */}
            <button 
              type="button"
              className="flex items-center gap-2 text-white/85 hover:text-white cursor-pointer transition-colors press-feedback focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg p-1"
              onClick={() => setIsLanguageOpen(true)}
              aria-label={`Language and Currency: ${preferences.language}-${preferences.currency}`}
            >
              <Globe size={20} strokeWidth={1.5} />
              <span className="font-bold tracking-wide text-sm">
                {preferences.language}-{preferences.currency}
              </span>
            </button>

            {/* Cart */}
            <button 
              type="button"
              className="relative flex items-center justify-center h-10 w-10 rounded-full border border-white/20 hover:bg-white/10 transition-colors press-feedback focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" 
              aria-label="Shopping Cart"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingCart size={18} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 text-[0.6rem] font-bold w-[1.125rem] h-[1.125rem] flex items-center justify-center rounded-full shadow-sm">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Account */}
            <button 
              type="button"
              className="flex items-center justify-center h-10 w-10 rounded-full border border-white/20 hover:bg-white/10 transition-colors press-feedback focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" 
              aria-label="Account / Sign In"
              onClick={openSignIn}
            >
              <User size={18} strokeWidth={1.5} />
            </button>

          </div>
        </div>

        {/* MOBILE HEADER */}
        <div className="lg:hidden flex flex-col w-full px-4 sm:px-6 py-3 gap-3 text-white">
          <div className="flex items-center justify-between w-full">
            <button 
              type="button"
              className="flex items-center justify-center h-10 w-10 -ml-2 rounded-full hover:bg-white/10 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none" 
              aria-label="Menu"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>
            <Link href="/" className="flex items-center" aria-label="Ayaan Home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Ayaan Logo" className="h-7 sm:h-8 w-auto brightness-0 invert" />
            </Link>
            <button 
              type="button"
              className="relative flex items-center justify-center text-white/85 hover:text-white press-feedback focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => setIsCartOpen(true)}
              aria-label="Shopping Cart"
            >
              <ShoppingCart size={20} strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-amber-500 text-slate-900 text-[0.6rem] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-slate-900">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
          
          {/* Mobile Search Bar with Right-Side Search Pill Button */}
          <form 
            onSubmit={handleSearchSubmit}
            className={`flex w-full items-center rounded-full pl-4 pr-1.5 h-10 border transition-all duration-200 cursor-text ${
              isSearchOpen 
                ? "bg-white/[0.15] border-white/40 shadow-lg ring-2 ring-white/20" 
                : "bg-white/[0.08] border-white/15 hover:bg-white/[0.12] hover:border-white/30 focus-within:border-white/40 focus-within:bg-white/[0.15]"
            }`}
          >
            <input 
              type="text"
              className="bg-transparent border-none outline-none w-full text-[0.8125rem] focus:ring-0 text-white placeholder:text-white/50 pr-2"
              placeholder="Search products, brands, and more..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim()) {
                  setIsSearchExecuted(false);
                }
              }}
              onFocus={() => setIsSearchOpen(true)}
            />
            {/* Right-Side Search Pill Button */}
            <button 
              type="submit"
              className="shrink-0 h-7 px-3.5 rounded-full bg-white text-[#0b1329] hover:bg-white/90 active:scale-95 font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all duration-150 cursor-pointer"
              aria-label="Search"
              title="Search products"
            >
              <Search size={14} strokeWidth={2.5} />
            </button>
          </form>
        </div>

      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-[#0b1329] text-white z-[100] transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link href="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Ayaan Logo" className="h-8 w-auto brightness-0 invert" />
          </Link>
          <button 
            type="button"
            className="p-2 -mr-2 rounded-full hover:bg-white/10 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <div className="w-6 h-6 flex items-center justify-center relative">
              <span className="absolute w-5 h-0.5 bg-white rotate-45" />
              <span className="absolute w-5 h-0.5 bg-white -rotate-45" />
            </div>
          </button>
        </div>
        <nav className="flex flex-col p-4 overflow-y-auto max-h-[calc(100vh-64px)]">
          {/* Main Nav Links */}
          <div className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <a 
                key={link.label} 
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`py-4 text-base font-bold uppercase tracking-widest border-b border-white/10 ${
                  link.special === "hot" ? "text-red-400" : "text-white"
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Mobile Utilities */}
          <div className="mt-8 flex flex-col gap-5 pt-4">
            <h3 className="text-xs text-white/50 uppercase tracking-widest font-bold mb-2">Settings & Account</h3>
            
            <button 
              type="button"
              className="flex items-center justify-between py-2 text-white/90"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsLocationOpen(true);
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{preferences.flag}</span>
                <span className="font-semibold text-sm">Deliver to: {preferences.country}</span>
              </div>
              <span className="text-xs text-white/50 uppercase font-bold tracking-wider">Change</span>
            </button>

            <button 
              type="button"
              className="flex items-center justify-between py-2 text-white/90"
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsLanguageOpen(true);
              }}
            >
              <div className="flex items-center gap-3">
                <Globe size={18} strokeWidth={1.5} />
                <span className="font-semibold text-sm">Currency: {preferences.currency} ({preferences.currencySymbol})</span>
              </div>
              <span className="text-xs text-white/50 uppercase font-bold tracking-wider">Change</span>
            </button>

            <button 
              type="button"
              className="flex items-center justify-between py-2 text-white/90"
              onClick={() => {
                setIsMobileMenuOpen(false);
                openSignIn();
              }}
            >
              <div className="flex items-center gap-3">
                <User size={18} strokeWidth={1.5} />
                <span className="font-semibold text-sm">Sign In / Register</span>
              </div>
              <span className="text-xs text-white/50 uppercase font-bold tracking-wider">Account</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Search Overlay */}
      <SearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchExecuted={isSearchExecuted}
        setIsSearchExecuted={setIsSearchExecuted}
        onExecuteSearch={handleExecuteSearch}
      />

      {/* Auth Modal (Sign In / Create Account) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialView={authModalView}
      />

      {/* Location Modal ("Specify your location") */}
      <LocationModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        onOpenSignIn={openSignIn}
      />

      {/* Language & Currency Modal ("Set language and currency") */}
      <LanguageCurrencyModal
        isOpen={isLanguageOpen}
        onClose={() => setIsLanguageOpen(false)}
      />
    </>
  );
}
