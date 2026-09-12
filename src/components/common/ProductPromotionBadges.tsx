"use client";

import React from "react";
import { getNormalizedPromotion } from "@/lib/product-promotions";

export interface ProductPromotionBadgesProps {
  product?: any;
  isNew?: boolean;
  isHot?: boolean;
  size?: "card" | "detail" | "modal";
  variant?: "card" | "detail" | "modal";
  className?: string;
}

export default function ProductPromotionBadges({
  product,
  isNew: propIsNew,
  isHot: propIsHot,
  size,
  variant,
  className = "",
}: ProductPromotionBadgesProps) {
  const promo = product ? getNormalizedPromotion(product) : { isNew: false, isHot: false };
  
  const isNew = propIsNew !== undefined ? Boolean(propIsNew) : promo.isNew;
  const isHot = propIsHot !== undefined ? Boolean(propIsHot) : promo.isHot;
  const activeVariant = size || variant || "card";

  // Status-only badges: Render only if NEW or HOT is active
  if (!isNew && !isHot) {
    return null;
  }

  if (activeVariant === "detail") {
    return (
      <div
        role="status"
        aria-label="Product promotional status"
        className={`absolute top-3.5 left-3.5 sm:top-4 sm:left-4 flex flex-col gap-1.5 z-10 pointer-events-none select-none ${className}`}
      >
        {isNew && (
          <span
            aria-label="New product"
            className="text-[0.625rem] sm:text-[0.6875rem] font-sans font-bold uppercase py-0.5 px-2 sm:px-2.5 bg-background/90 text-primary tracking-[0.08em] backdrop-blur-sm rounded-md shadow-xs border border-border/40 leading-normal inline-block w-fit"
          >
            NEW
          </span>
        )}
        {isHot && (
          <span
            aria-label="Hot product"
            className="text-[0.625rem] sm:text-[0.6875rem] font-sans font-bold uppercase py-0.5 px-2 sm:px-2.5 bg-rose-500/90 text-white tracking-[0.08em] backdrop-blur-sm rounded-md shadow-xs leading-normal inline-block w-fit"
          >
            HOT
          </span>
        )}
      </div>
    );
  }

  if (activeVariant === "modal") {
    return (
      <div
        role="status"
        aria-label="Product promotional status"
        className={`absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none select-none ${className}`}
      >
        {isNew && (
          <span
            aria-label="New product"
            className="text-[0.625rem] font-sans font-bold uppercase py-0.5 px-2 bg-background/90 text-primary tracking-[0.08em] backdrop-blur-sm rounded-md shadow-xs border border-border/40 leading-normal inline-block w-fit"
          >
            NEW
          </span>
        )}
        {isHot && (
          <span
            aria-label="Hot product"
            className="text-[0.625rem] font-sans font-bold uppercase py-0.5 px-2 bg-rose-500/90 text-white tracking-[0.08em] backdrop-blur-sm rounded-md shadow-xs leading-normal inline-block w-fit"
          >
            HOT
          </span>
        )}
      </div>
    );
  }

  // Default "card" variant (Compact product cards across all customer-facing surfaces)
  return (
    <div
      role="status"
      aria-label="Product promotional status"
      className={`absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10 pointer-events-none select-none ${className}`}
    >
      {isNew && (
        <span
          aria-label="New product"
          className="text-[0.5625rem] sm:text-[0.625rem] font-sans font-bold uppercase py-0.5 px-2 bg-background/90 text-primary tracking-[0.08em] backdrop-blur-sm rounded-md shadow-xs border border-border/40 leading-normal inline-block w-fit"
        >
          NEW
        </span>
      )}
      {isHot && (
        <span
          aria-label="Hot product"
          className="text-[0.5625rem] sm:text-[0.625rem] font-sans font-bold uppercase py-0.5 px-2 bg-rose-500/90 text-white tracking-[0.08em] backdrop-blur-sm rounded-md shadow-xs leading-normal inline-block w-fit"
        >
          HOT
        </span>
      )}
    </div>
  );
}

export { ProductPromotionBadges as PromotionBadges };

