"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShoppingCart, User, Globe, Menu } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { usePreferences } from "@/lib/PreferencesContext";
import SearchOverlay from "./SearchOverlay";
import AuthModal, { AuthView } from "@/components/auth/AuthModal";
import LocationModal from "./LocationModal";
import LanguageCurrencyModal from "./LanguageCurrencyModal";

const NAV_LINKS = [
  { label: "NEW ARRIVALS", href: "#new-arrivals" },
  { label: "HOT SALES", href: "#hot-sales", special: "hot" },
  { label: "TESTIMONIALS", href: "#testimonials" },
  { label: "BRAND TRUST", href: "#brand-trust" },
];

export default function Header() {
  const { totalItems, setIsCartOpen } = useCart();
  const { preferences, isLoaded } = usePreferences();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthView>("signin");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openSignIn = () => {
    setAuthModalView("signin");
    setIsAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const openSignUp = () => {
    setAuthModalView("signup");
    setIsAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header 
        className={`sticky top-0 z-50 w-full backdrop-blur-md transition-all duration-200 border-b ${
          isScrolled ? "bg-slate-900/95 border-slate-900 shadow-sm" : "bg-slate-900 border-white/10"
        }`}
      >
        {/* DESKTOP HEADER */}
        <div className="hidden lg:flex mx-auto max-w-[1400px] px-4 sm:px-6 h-16 sm:h-[4.25rem] items-center gap-6 xl:gap-8 text-white w-full">
          
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0 press-feedback" aria-label="Ayaan Home">
            <img src="/logo.png" alt="Ayaan Logo" className="h-8 sm:h-9 w-auto" />
          </Link>

          {/* Search Bar */}
          <div className={`flex w-full max-w-[45%] mx-auto items-center rounded-full px-4 h-10 border transition-all duration-200 cursor-text ${isSearchOpen ? 'bg-white/[0.15] border-white/40 shadow-lg ring-2 ring-white/20' : 'bg-white/[0.08] border-white/15 hover:bg-white/[0.12] hover:border-white/30 focus-within:border-white/40 focus-within:bg-white/[0.15]'}`}>
            <Search size={18} className={`mr-3 shrink-0 transition-colors ${isSearchOpen ? 'text-white' : 'text-white/50'}`} />
            <input 
              type="text"
              className="bg-transparent border-none outline-none w-full text-[0.875rem] focus:ring-0 text-white placeholder:text-white/50"
              placeholder="Search products, brands, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchOpen(true)}
            />
          </div>

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
              <img src="/logo.png" alt="Ayaan Logo" className="h-7 sm:h-8 w-auto" />
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
          {/* Mobile Search */}
          <div className={`flex w-full items-center rounded-full px-4 h-10 border transition-all duration-200 cursor-text ${isSearchOpen ? 'bg-white/[0.15] border-white/40 shadow-lg ring-2 ring-white/20' : 'bg-white/[0.08] border-white/15 hover:bg-white/[0.12] hover:border-white/30 focus-within:border-white/40 focus-within:bg-white/[0.15]'}`}>
             <Search size={16} className={`mr-3 shrink-0 transition-colors ${isSearchOpen ? 'text-white' : 'text-white/50'}`} />
             <input 
               type="text"
               className="bg-transparent border-none outline-none w-full text-[0.8125rem] focus:ring-0 text-white placeholder:text-white/50"
               placeholder="Search products, brands..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               onFocus={() => setIsSearchOpen(true)}
             />
          </div>
        </div>

      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900 text-white z-[100] transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link href="/" className="flex items-center" onClick={() => setIsMobileMenuOpen(false)}>
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
              className="flex items-center gap-3 text-white/85 hover:text-white transition-colors text-left" 
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsLocationOpen(true);
              }}
            >
              <span className="text-xl leading-none">{preferences.flag}</span>
              <span className="font-medium text-sm">
                Deliver to: {preferences.countryCode} ({preferences.country})
              </span>
            </button>
            
            <button 
              type="button"
              className="flex items-center gap-3 text-white/85 hover:text-white transition-colors text-left" 
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsLanguageOpen(true);
              }}
            >
              <Globe size={20} strokeWidth={1.5} />
              <span className="font-medium text-sm">
                {preferences.language} - {preferences.currency} ({preferences.currencySymbol})
              </span>
            </button>
            
            <button 
              type="button"
              className="flex items-center gap-3 text-white/85 hover:text-white transition-colors text-left" 
              onClick={openSignIn}
            >
              <User size={20} strokeWidth={1.5} />
              <span className="font-medium text-sm">Sign in</span>
            </button>
            
            <button 
              type="button"
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase tracking-wider py-3.5 rounded-xl mt-4 transition-colors text-sm text-center shadow-lg"
              onClick={openSignUp}
            >
              Create account
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
