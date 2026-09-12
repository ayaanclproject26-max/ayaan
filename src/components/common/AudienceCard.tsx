"use client";

import React from "react";
import { LayoutGrid, Check, LucideIcon } from "lucide-react";
import {
  IconMen,
  IconWomen,
  IconBoys,
  IconGirls,
  IconUnisex,
  IconProps,
} from "./AudienceIcons";

export type AudienceIconComponent = React.ComponentType<IconProps> | LucideIcon;

export interface AudienceOption {
  id: "MEN" | "WOMEN" | "BOYS" | "GIRLS" | "UNISEX" | string;
  name: "MEN" | "WOMEN" | "BOYS" | "GIRLS" | "UNISEX" | string;
  icon: AudienceIconComponent;
}

/**
 * Authoritative 5 Core Audience groups with unified human line-style icon family:
 * - MEN   -> IconMen (Adult male silhouette)
 * - WOMEN -> IconWomen (Distinct adult female silhouette)
 * - BOYS  -> IconBoys (Young male child line icon, paired with Girls)
 * - GIRLS -> IconGirls (Young female child line icon, paired with Boys)
 * - UNISEX-> IconUnisex (Dual-person line icon)
 */
export const AUDIENCE_OPTIONS: AudienceOption[] = [
  {
    id: "MEN",
    name: "MEN",
    icon: IconMen,
  },
  {
    id: "WOMEN",
    name: "WOMEN",
    icon: IconWomen,
  },
  {
    id: "BOYS",
    name: "BOYS",
    icon: IconBoys,
  },
  {
    id: "GIRLS",
    name: "GIRLS",
    icon: IconGirls,
  },
  {
    id: "UNISEX",
    name: "UNISEX",
    icon: IconUnisex,
  },
];

export interface AudienceTileProps {
  id: string;
  name: string;
  icon: AudienceIconComponent;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Clean, compact, icon-based Audience Tile:
 * - Surface: warm/neutral surface matching Trust tiles with subtle 1px border
 * - Icon: prominent line-style UI icon (~36–40px mobile, ~42–46px tablet, ~46–50px desktop visual footprint)
 * - Label: Manrope bold uppercase (13–15px) tightly paired with icon (5–8px gap)
 * - Centering: Icon + label centered as one unified visual group
 * - Active: subtle active border emphasis with checkmark badge
 */
export function AudienceTile({
  name,
  icon: Icon,
  isActive = false,
  onClick,
  className = "",
}: AudienceTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={`Explore ${name} collection`}
      className={`group relative flex flex-col items-center justify-center gap-[3px] sm:gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 lg:px-3 lg:py-1.5 rounded-2xl border transition-all duration-200 ease-out motion-reduce:transition-none cursor-pointer select-none text-center w-full min-h-[76px] sm:min-h-[80px] lg:min-h-[88px] xl:min-h-[92px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 active:translate-y-0 active:scale-[0.99] ${
        isActive
          ? "border-primary ring-1.5 ring-primary/40 bg-primary/[0.06] dark:bg-primary/[0.12] text-primary shadow-xs font-bold hover:bg-primary/[0.10] hover:-translate-y-[2px] hover:shadow-[0_6px_16px_rgba(15,23,42,0.12)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.4)]"
          : "border-slate-900/25 dark:border-white/25 bg-card/90 dark:bg-card/60 shadow-2xs hover:border-slate-900/70 dark:hover:border-white/70 hover:bg-secondary/60 dark:hover:bg-secondary/50 text-foreground/90 hover:text-foreground hover:shadow-[0_6px_16px_rgba(15,23,42,0.09)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.35)] hover:-translate-y-[2.5px]"
      } ${className}`}
    >
      {/* Icon (prominent line-style UI artwork ~48–64px, visually stable without scaling) */}
      <Icon
        className={`w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 shrink-0 transition-colors duration-150 ${
          isActive
            ? "text-primary"
            : "text-foreground/85 group-hover:text-foreground"
        }`}
        strokeWidth={1.4}
        aria-hidden="true"
      />

      {/* Label (tight 3–5px gap beneath icon, bold uppercase, identical typography across all 6 tiles) */}
      <span className="font-display font-bold text-[0.8125rem] sm:text-[0.875rem] lg:text-[0.875rem] xl:text-[0.9375rem] uppercase tracking-wider leading-tight text-center max-w-full px-0.5 text-foreground/85 group-hover:text-foreground transition-colors duration-150">
        {name}
      </span>

      {/* Active Checkmark Badge */}
      {isActive && (
        <span
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[8.5px] font-bold shadow-xs animate-in zoom-in-75"
          aria-hidden="true"
        >
          <Check size={10} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

export interface AudienceTilesProps {
  selectedAudiences: string[];
  onToggle: (audienceName: string) => void;
  isAllCategoriesOpen?: boolean;
  onToggleAllCategories?: () => void;
  className?: string;
}

/**
 * Unified Responsive 6-Tile Audience Grid:
 * - Desktop (lg:): All 6 tiles in 1 single row (MEN, WOMEN, BOYS, GIRLS, UNISEX, ALL CATEGORIES)
 * - Tablet (sm:): 3 cols x 2 rows (6 balanced tiles)
 * - Mobile (<sm:): 2 cols x 3 rows (6 balanced tiles)
 */
export function AudienceTiles({
  selectedAudiences,
  onToggle,
  isAllCategoriesOpen = false,
  onToggleAllCategories,
  className = "",
}: AudienceTilesProps) {
  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 lg:gap-3 xl:gap-3.5 ${className}`}
      role="group"
      aria-label="Audience and Category navigation"
    >
      {AUDIENCE_OPTIONS.map((audience) => {
        const isSelected = selectedAudiences.includes(audience.name.toUpperCase());
        return (
          <AudienceTile
            key={audience.id}
            id={audience.id}
            name={audience.name}
            icon={audience.icon}
            isActive={isSelected}
            onClick={() => onToggle(audience.name)}
          />
        );
      })}

      {/* 6th Tile: ALL CATEGORIES (Exact same tile design, icon + centered label) */}
      {onToggleAllCategories && (
        <AudienceTile
          id="ALL_CATEGORIES"
          name="ALL CATEGORIES"
          icon={LayoutGrid}
          isActive={isAllCategoriesOpen}
          onClick={onToggleAllCategories}
          className={isAllCategoriesOpen ? "border-primary" : ""}
        />
      )}
    </div>
  );
}

// Retain AudienceCard export alias for backward compatibility
export const AudienceCard = AudienceTile;
