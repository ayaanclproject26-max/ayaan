"use client";

import React, { useState } from "react";
import { getBrandLogoUrl, BRAND_LOGO_MAP } from "@/lib/brand-logos";

export { getBrandLogoUrl, BRAND_LOGO_MAP };

export interface ProductBrandLogoOverlayProps {
  brandName?: string;
  brandLogo?: string;
  size?: "card" | "detail" | "modal" | "thumb";
  className?: string;
}

export default function ProductBrandLogoOverlay({
  brandName,
  brandLogo,
  size = "card",
  className = "",
}: ProductBrandLogoOverlayProps) {
  const [hasError, setHasError] = useState(false);

  if (!brandName && !brandLogo) {
    return null;
  }

  if (hasError) {
    return null; // Strict invariant: never show letter fallback, initial, or broken icon
  }

  const logoUrl = getBrandLogoUrl(brandName, brandLogo);
  if (!logoUrl) {
    return null;
  }

  // Dimension classes based on size variant — Strictly 1:1 TRUE SQUARE containers (aspect-ratio: 1 / 1)
  let containerDimensions = "w-9 h-9 sm:w-10 sm:h-10 rounded-xl p-1.5";
  let imageDimensions = "max-w-[85%] max-h-[85%]";

  if (size === "detail") {
    containerDimensions = "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl p-2 sm:p-2.5";
    imageDimensions = "max-w-[85%] max-h-[85%]";
  } else if (size === "modal") {
    containerDimensions = "w-10 h-10 sm:w-11 sm:h-11 rounded-xl p-1.5 sm:p-2";
    imageDimensions = "max-w-[85%] max-h-[85%]";
  } else if (size === "thumb") {
    containerDimensions = "w-7 h-7 rounded-lg p-1";
    imageDimensions = "max-w-[85%] max-h-[85%]";
  }

  return (
    <div
      style={{ aspectRatio: "1 / 1" }}
      className={`absolute top-2.5 right-2.5 z-20 aspect-square ${containerDimensions} bg-white/95 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-center shadow-xs border border-border/70 dark:border-white/15 overflow-hidden pointer-events-none transition-transform select-none ${className}`}
      title={brandName || "Brand logo"}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={brandName ? `${brandName} logo` : "Brand logo"}
        className={`w-auto h-auto ${imageDimensions} object-contain`}
        onError={() => setHasError(true)}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
