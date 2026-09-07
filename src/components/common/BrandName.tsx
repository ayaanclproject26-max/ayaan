"use client";

import React from "react";

export interface BrandNameProps {
  className?: string;
  orangeClassName?: string;
  as?: React.ElementType;
}

/**
 * Official Brand Name Component for AYAAN CLOTHING
 * 
 * Visual Rule:
 * - First 'A' in AYAAN is Orange (#EA580C / text-brand-orange)
 * - First 'C' in CLOTHING is Orange (#EA580C / text-brand-orange)
 * - Remaining letters inherit parent/theme text color
 */
export default function BrandName({
  className = "",
  orangeClassName = "text-[#EA580C]",
  as: Component = "span",
}: BrandNameProps) {
  return (
    <Component className={`font-brand inline-flex items-baseline select-none ${className}`} aria-label="Ayaan Clothing">
      <span className={orangeClassName}>A</span>
      <span>YAAN</span>
      <span className="inline-block w-[0.3em]" />
      <span className={orangeClassName}>C</span>
      <span>LOTHING</span>
    </Component>
  );
}
