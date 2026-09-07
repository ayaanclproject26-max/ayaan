"use client";

import React from "react";
import { getNormalizedPromotion } from "@/lib/product-promotions";

export interface ProductPromotionBadgesProps {
  product: any;
  variant?: "card" | "detail" | "modal";
  className?: string;
}

export default function ProductPromotionBadges({
  product,
  variant = "card",
  className = "",
}: ProductPromotionBadgesProps) {
  const promo = getNormalizedPromotion(product);

  if (!promo.hasPromotions) {
    return null;
  }

  if (variant === "detail") {
    return (
      <div className={`absolute top-3.5 left-3.5 sm:top-4 sm:left-4 flex flex-col gap-1.5 z-10 pointer-events-none select-none ${className}`}>
        {promo.isHot && (
          <span className="px-2.5 sm:px-3 py-1 rounded-md text-[0.6875rem] sm:text-xs font-sans font-bold uppercase tracking-wider bg-rose-500 text-white shadow-xs backdrop-blur-sm leading-tight">
            HOT SALE
          </span>
        )}
        {promo.isNew && (
          <span className="px-2.5 sm:px-3 py-1 rounded-md text-[0.6875rem] sm:text-xs font-sans font-bold uppercase tracking-wider bg-background/95 text-primary border border-primary/20 backdrop-blur-md shadow-xs leading-tight">
            NEW ARRIVAL
          </span>
        )}
        {promo.discountPercent !== null && promo.discountPercent >= 5 && (
          <span className="px-2.5 sm:px-3 py-1 rounded-md text-[0.6875rem] sm:text-xs font-sans font-bold uppercase tracking-wider bg-[#111827]/90 dark:bg-stone-900/90 text-white backdrop-blur-md shadow-xs leading-tight">
            -{promo.discountPercent}%
          </span>
        )}
      </div>
    );
  }

  if (variant === "modal") {
    return (
      <div className={`absolute top-3 left-3 flex flex-col gap-1 z-10 pointer-events-none select-none ${className}`}>
        {promo.isNew && (
          <span className="bg-background/90 text-primary text-[0.625rem] font-sans font-bold uppercase py-0.5 px-2 tracking-[0.08em] rounded-md backdrop-blur-sm shadow-xs border border-border/40 leading-normal">
            NEW
          </span>
        )}
        {promo.isHot && (
          <span className="bg-rose-500/90 text-white text-[0.625rem] font-sans font-bold uppercase py-0.5 px-2 tracking-[0.08em] rounded-md backdrop-blur-sm shadow-xs leading-normal">
            HOT
          </span>
        )}
        {promo.discountPercent !== null && promo.discountPercent >= 5 && (
          <span className="bg-[#111827]/85 dark:bg-stone-900/90 text-white text-[0.625rem] font-sans font-bold uppercase py-0.5 px-2 tracking-[0.08em] rounded-md backdrop-blur-sm shadow-xs leading-normal">
            -{promo.discountPercent}%
          </span>
        )}
      </div>
    );
  }

  // Default "card" variant (Compact product cards across all customer-facing surfaces)
  return (
    <div className={`absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none select-none ${className}`}>
      {promo.isNew && (
        <span className="text-[0.5625rem] sm:text-[0.625rem] font-sans font-bold uppercase py-0.5 px-2 bg-background/90 text-primary tracking-[0.08em] backdrop-blur-sm rounded-md shadow-xs border border-border/40 leading-normal">
          NEW
        </span>
      )}
      {promo.isHot && (
        <span className="text-[0.5625rem] sm:text-[0.625rem] font-sans font-bold uppercase py-0.5 px-2 bg-rose-500/90 text-white tracking-[0.08em] backdrop-blur-sm rounded-md shadow-xs leading-normal">
          HOT
        </span>
      )}
      {promo.discountPercent !== null && promo.discountPercent >= 5 && (
        <span className="text-[0.5625rem] sm:text-[0.625rem] font-sans font-bold uppercase py-0.5 px-2 bg-[#111827]/85 dark:bg-stone-900/90 text-white tracking-[0.08em] backdrop-blur-sm rounded-md shadow-xs leading-normal">
          -{promo.discountPercent}%
        </span>
      )}
    </div>
  );
}
