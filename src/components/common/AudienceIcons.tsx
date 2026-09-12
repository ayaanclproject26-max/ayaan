"use client";

import React from "react";

export type IconProps = React.HTMLAttributes<HTMLElement> & {
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Authoritative Audience Icons:
 * - Exact User-Supplied PNG Artwork:
 *     MEN   -> /audience-icons/men.png
 *     WOMEN -> /audience-icons/women.png
 *     BOYS  -> /audience-icons/boys.png
 *     GIRLS -> /audience-icons/girls.png
 * - Matching Two-Person Illustrative Vector:
 *     UNISEX-> IconUnisex (Two-Person Human Bust Line Art matching the 4 supplied artworks)
 * - Optical Normalization: precise CSS scale factors to harmonize visible prominence
 *   across different transparent canvas margins without altering the source artwork.
 */

/** MEN — Exact user-supplied businessman artwork (96.9% visible height in canvas) */
export function IconMen({
  size,
  className = "",
  style,
  ...props
}: IconProps) {
  const sizeStyle = size !== undefined ? (typeof size === "number" ? `${size}px` : size) : undefined;
  return (
    <img
      src="/audience-icons/men.png"
      alt=""
      width={typeof size === "number" ? size : undefined}
      height={typeof size === "number" ? size : undefined}
      className={`object-contain select-none pointer-events-none scale-100 ${className}`}
      style={{
        ...(sizeStyle ? { width: sizeStyle, height: sizeStyle } : {}),
        ...style,
      }}
      aria-hidden="true"
      loading="eager"
      decoding="async"
      {...props}
    />
  );
}

/** WOMEN — Exact user-supplied woman artwork (optically scaled 1.11x to normalize for transparent canvas margin) */
export function IconWomen({
  size,
  className = "",
  style,
  ...props
}: IconProps) {
  const sizeStyle = size !== undefined ? (typeof size === "number" ? `${size}px` : size) : undefined;
  return (
    <img
      src="/audience-icons/women.png"
      alt=""
      width={typeof size === "number" ? size : undefined}
      height={typeof size === "number" ? size : undefined}
      className={`object-contain select-none pointer-events-none scale-[1.11] ${className}`}
      style={{
        ...(sizeStyle ? { width: sizeStyle, height: sizeStyle } : {}),
        ...style,
      }}
      aria-hidden="true"
      loading="eager"
      decoding="async"
      {...props}
    />
  );
}

/** BOYS — Exact user-supplied boy artwork (optically scaled 1.02x to normalize for 4.7% transparent canvas margin) */
export function IconBoys({
  size,
  className = "",
  style,
  ...props
}: IconProps) {
  const sizeStyle = size !== undefined ? (typeof size === "number" ? `${size}px` : size) : undefined;
  return (
    <img
      src="/audience-icons/boys.png"
      alt=""
      width={typeof size === "number" ? size : undefined}
      height={typeof size === "number" ? size : undefined}
      className={`object-contain select-none pointer-events-none scale-[1.02] ${className}`}
      style={{
        ...(sizeStyle ? { width: sizeStyle, height: sizeStyle } : {}),
        ...style,
      }}
      aria-hidden="true"
      loading="eager"
      decoding="async"
      {...props}
    />
  );
}

/** GIRLS — Exact user-supplied girl artwork (optically scaled 1.13x to normalize for transparent canvas margin) */
export function IconGirls({
  size,
  className = "",
  style,
  ...props
}: IconProps) {
  const sizeStyle = size !== undefined ? (typeof size === "number" ? `${size}px` : size) : undefined;
  return (
    <img
      src="/audience-icons/girls.png"
      alt=""
      width={typeof size === "number" ? size : undefined}
      height={typeof size === "number" ? size : undefined}
      className={`object-contain select-none pointer-events-none scale-[1.13] ${className}`}
      style={{
        ...(sizeStyle ? { width: sizeStyle, height: sizeStyle } : {}),
        ...style,
      }}
      aria-hidden="true"
      loading="eager"
      decoding="async"
      {...props}
    />
  );
}

/** UNISEX — Exact user-supplied two-person human bust artwork (optically scaled 1.12x to balance with single busts) */
export function IconUnisex({
  size,
  className = "",
  style,
  ...props
}: IconProps) {
  const sizeStyle = size !== undefined ? (typeof size === "number" ? `${size}px` : size) : undefined;
  return (
    <img
      src="/audience-icons/unisex.png"
      alt=""
      width={typeof size === "number" ? size : undefined}
      height={typeof size === "number" ? size : undefined}
      className={`object-contain select-none pointer-events-none scale-[1.12] ${className}`}
      style={{
        ...(sizeStyle ? { width: sizeStyle, height: sizeStyle } : {}),
        ...style,
      }}
      aria-hidden="true"
      loading="eager"
      decoding="async"
      {...props}
    />
  );
}

/** Centralized Audience Configuration */
export interface AudienceItemConfig {
  id: "MEN" | "WOMEN" | "BOYS" | "GIRLS" | "UNISEX" | string;
  name: "MEN" | "WOMEN" | "BOYS" | "GIRLS" | "UNISEX" | string;
  label: "MEN" | "WOMEN" | "BOYS" | "GIRLS" | "UNISEX" | string;
  icon: React.ComponentType<IconProps>;
  iconSrc?: string;
}

export const AUDIENCE_ITEMS: AudienceItemConfig[] = [
  { id: "MEN", name: "MEN", label: "MEN", icon: IconMen, iconSrc: "/audience-icons/men.png" },
  { id: "WOMEN", name: "WOMEN", label: "WOMEN", icon: IconWomen, iconSrc: "/audience-icons/women.png" },
  { id: "BOYS", name: "BOYS", label: "BOYS", icon: IconBoys, iconSrc: "/audience-icons/boys.png" },
  { id: "GIRLS", name: "GIRLS", label: "GIRLS", icon: IconGirls, iconSrc: "/audience-icons/girls.png" },
  { id: "UNISEX", name: "UNISEX", label: "UNISEX", icon: IconUnisex, iconSrc: "/audience-icons/unisex.png" },
];



