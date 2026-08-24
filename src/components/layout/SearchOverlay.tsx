"use client";

import { useEffect } from "react";
import { Clock, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import productsData from "@/data/products.json";
import { Product } from "@/types";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const RECENT_SEARCHES = ["Sweater", "T-Shirt", "Hoodie"];
const TRENDING_SEARCHES = ["Oversized T-Shirt", "Denim Jacket", "Summer Collection", "Linen Shirt"];

export default function SearchOverlay({ isOpen, onClose, searchQuery, setSearchQuery }: SearchOverlayProps) {
  const allProducts = productsData as Product[];
  
  // If there's a search query, filter products. Otherwise show trending (mix of hot/new)
  const displayProducts = searchQuery.trim() !== ""
    ? allProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.categoryId.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : allProducts.filter(p => p.isHot || p.isNew).slice(0, 6);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-40 transition-opacity duration-300" 
        onClick={onClose} 
      />

      {/* Overlay Panel positioned directly below the header */}
      <div className="fixed top-[6.75rem] lg:top-[4.25rem] left-0 right-0 mx-auto w-full max-w-5xl z-[45] bg-white rounded-b-2xl lg:rounded-2xl lg:mt-4 shadow-2xl transition-transform duration-300 transform-gpu overflow-hidden max-h-[calc(100vh-7rem)] lg:max-h-[calc(100vh-6rem)] flex flex-col">
        
        {/* Scrollable Content */}
        <div className="flex flex-col lg:flex-row h-full overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 gap-8 lg:gap-12 pb-12 w-full">
          
          {/* Left Panel: Search Information */}
          <div className="w-full lg:w-1/3 flex-shrink-0 flex flex-col gap-8">
            
            {/* Recent Searches */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[0.65rem] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Recent Searches</h3>
                <button className="text-[0.65rem] sm:text-xs font-bold text-slate-900 hover:text-slate-500 transition-colors uppercase tracking-wider">
                  Clear
                </button>
              </div>
              <ul className="flex flex-col gap-1">
                {RECENT_SEARCHES.map((term) => (
                  <li key={term}>
                    <button 
                      onClick={() => setSearchQuery(term)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Clock size={16} className="text-slate-400" />
                        <span className="text-[0.875rem] font-medium text-slate-800">{term}</span>
                      </div>
                      <ArrowRight size={16} className="text-slate-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trending Search */}
            <div>
              <h3 className="text-[0.65rem] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Trending Search</h3>
              <ul className="flex flex-col gap-1">
                {TRENDING_SEARCHES.map((term) => (
                  <li key={term}>
                    <button 
                      onClick={() => setSearchQuery(term)}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 transition-colors group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <TrendingUp size={16} className="text-slate-400" />
                        <span className="text-[0.875rem] font-medium text-slate-800">{term}</span>
                      </div>
                      <ArrowRight size={16} className="text-slate-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Right Panel: Trending / Search Results */}
          <div className="w-full lg:w-2/3">
            <h3 className="text-[0.65rem] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-5">
              {searchQuery.trim() !== "" ? "Search Results" : "Trending Products"}
            </h3>
            
            {displayProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
                {displayProducts.map((product) => (
                  <Link 
                    key={product.id}
                    href={`#product-${product.slug}`}
                    onClick={onClose}
                    className="group flex flex-col gap-3"
                  >
                    <div className="relative aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden">
                      <img 
                        src={product.images[0]} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {(product.isNew || product.isHot) && (
                        <div className="absolute top-2 left-2 flex gap-1">
                          {product.isNew && <span className="text-[0.6rem] font-bold uppercase py-0.5 px-1.5 bg-white text-slate-900 tracking-widest rounded-sm shadow-sm">New</span>}
                          {!product.isNew && product.isHot && <span className="text-[0.6rem] font-bold uppercase py-0.5 px-1.5 bg-red-500 text-white tracking-widest rounded-sm shadow-sm">Hot</span>}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-[0.8125rem] font-semibold text-slate-900 group-hover:text-slate-600 transition-colors line-clamp-1">{product.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[0.8125rem] font-bold text-slate-900">${product.price.toFixed(2)}</span>
                        {product.oldPrice && (
                          <span className="text-[0.7rem] text-slate-400 line-through">${product.oldPrice.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="w-full h-40 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
                <span className="text-sm font-medium text-slate-500">No products found for "{searchQuery}"</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
