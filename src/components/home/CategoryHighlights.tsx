"use client";

import { useState } from "react";
import Link from "next/link";
import categoriesData from "@/data/categories.json";

const detailedCategories = [
  { id: "all", name: "ALL", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=800" },
  { id: "sweaters", name: "Sweaters", image: "https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?auto=format&fit=crop&q=80&w=800" },
  { id: "t-shirts", name: "T-Shirts", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800" },
  { id: "hoodies", name: "Hoodies", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800" },
  { id: "trousers", name: "Trousers", image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=800" },
  { id: "pants", name: "Pants", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800" },
  { id: "shorts", name: "Shorts", image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=800" },
  { id: "shirts", name: "Shirts", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=800" },
  { id: "beachwear", name: "Beachwear", image: "https://images.pexels.com/photos/103123/pexels-photo-103123.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { id: "socks", name: "Socks", image: "https://images.unsplash.com/photo-1582966772680-860e372bb558?auto=format&fit=crop&q=80&w=800" },
  { id: "blouse", name: "Blouse", image: "https://images.unsplash.com/photo-1589465885857-44edb59bbff2?auto=format&fit=crop&q=80&w=800" },
  { id: "tank-top", name: "Tank Top", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=800" },
  { id: "tops", name: "Tops", image: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&q=80&w=800" },
  { id: "sports", name: "Sports", image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=800" },
  { id: "towels", name: "Towels", image: "https://images.pexels.com/photos/4207892/pexels-photo-4207892.jpeg?auto=compress&cs=tinysrgb&w=800" },
];

export default function CategoryHighlights() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section id="categories" className="py-10 sm:py-12 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 md:mb-8 text-center md:text-left">
          <h2 className="text-fluid-h2 font-display uppercase tracking-tight">SHOP BY CATEGORY</h2>
        </div>
        
        {/* Primary Categories (5 in a single row on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {categoriesData.map((category) => (
            <CategoryCard key={category.id} category={category} variant="primary" />
          ))}
        </div>

        {/* Action Button */}
        <div className="mt-6 sm:mt-8 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-6 py-2.5 sm:px-8 sm:py-3 border border-foreground text-foreground text-sm font-semibold uppercase tracking-wider rounded-full hover:bg-foreground hover:text-background transition-colors duration-300"
          >
            {isExpanded ? "SHOW LESS" : "ALL CATEGORIES"}
          </button>
        </div>

        {/* Expanded Detailed Categories */}
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${
            isExpanded ? "grid-rows-[1fr] opacity-100 mt-6 sm:mt-8" : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
              {detailedCategories.map((category, index) => (
                <CategoryCard 
                  key={category.id} 
                  category={{ ...category, slug: category.id }} 
                  variant="compact"
                  isActive={index === 0} // ALL is visually active by default
                />
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

export function CategoryCard({ 
  category, 
  variant = "primary",
  isActive = false
}: { 
  category: { name: string; slug: string; image: string; [key: string]: any };
  variant?: "primary" | "compact";
  isActive?: boolean;
}) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link 
      href={`#category-${category.slug}`}
      className={`group relative rounded-xl overflow-hidden bg-secondary ${
        variant === "primary" ? "aspect-[4/3]" : "aspect-[4/5]"
      } ${
        isActive ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
      }`}
    >
      {!imgError ? (
        <img 
          src={category.image} 
          alt={category.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
          <span className="text-white/20 text-xl md:text-2xl font-display font-bold uppercase text-center px-2">{category.name}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-[#111827]/30 group-hover:bg-[#111827]/45 transition-colors duration-500" />
      <div className={`absolute inset-0 flex flex-col justify-end text-white ${variant === "primary" ? "p-4 sm:p-5" : "p-3 sm:p-4"}`}>
        <h3 className={`${variant === "primary" ? "text-base sm:text-lg lg:text-xl font-bold font-display" : "text-sm sm:text-base leading-tight"} font-medium tracking-wide mb-1 uppercase`}>
          {category.name}
        </h3>
        {variant === "primary" && (
          <span className="text-xs sm:text-sm font-medium tracking-widest uppercase opacity-0 transform translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            Discover
          </span>
        )}
      </div>
    </Link>
  );
}
