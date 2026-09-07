"use client";

import React from "react";
import { User, Users, Smile, Sparkles, LucideIcon } from "lucide-react";

export interface AudienceOption {
  id: "MEN" | "WOMEN" | "BOYS" | "GIRLS" | "UNISEX" | string;
  label: "MEN" | "WOMEN" | "BOYS" | "GIRLS" | "UNISEX" | string;
  icon: LucideIcon;
}

/**
 * Authoritative 5 Core Audience groups and their fixed icons:
 * MEN   -> User
 * WOMEN -> User
 * BOYS  -> Smile
 * GIRLS -> Sparkles
 * UNISEX-> Users
 */
export const AUDIENCE_OPTIONS: AudienceOption[] = [
  { id: "MEN", label: "MEN", icon: User },
  { id: "WOMEN", label: "WOMEN", icon: User },
  { id: "BOYS", label: "BOYS", icon: Smile },
  { id: "GIRLS", label: "GIRLS", icon: Sparkles },
  { id: "UNISEX", label: "UNISEX", icon: Users },
];

export interface AudiencePillProps {
  audience: AudienceOption;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  size?: "default" | "compact";
}

/**
 * Compact horizontal pill component for Audience selection:
 * - Text on the LEFT
 * - Icon on the FAR RIGHT
 * - Vertically centered
 * - Pill height ~44-52px matching Product Category button styling
 */
export function AudiencePill({
  audience,
  isSelected = false,
  onClick,
  className = "",
  size = "default",
}: AudiencePillProps) {
  const Icon = audience.icon;
  const isCompact = size === "compact";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={`Filter by ${audience.label}`}
      className={`group relative flex items-center justify-between gap-2.5 rounded-xl border transition-all duration-200 cursor-pointer select-none text-left ${
        isCompact
          ? "h-11 px-3.5 py-2 text-xs"
          : "h-11 sm:h-12 px-4 py-2.5 text-xs sm:text-sm"
      } ${
        isSelected
          ? "border-primary bg-primary/[0.08] ring-1 ring-primary/30 shadow-xs text-foreground font-bold"
          : "border-border/80 bg-card hover:bg-secondary/70 hover:border-foreground/30 text-foreground/80 hover:text-foreground shadow-2xs"
      } ${className}`}
    >
      {/* Text on LEFT */}
      <span className="font-display font-bold uppercase tracking-wider truncate">
        {audience.label}
      </span>

      {/* Icon on FAR RIGHT */}
      <Icon
        size={isCompact ? 17 : 19}
        className={`shrink-0 transition-colors duration-200 ${
          isSelected
            ? "text-primary"
            : "text-muted-foreground group-hover:text-foreground"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}

export interface AudienceSelectorProps {
  selectedAudiences: string[];
  onToggle: (audienceId: string) => void;
  layout?: "row" | "grid";
  className?: string;
}

/**
 * Reusable Audience Selector:
 * - layout="row": Compact horizontal row on desktop (5 cols) and 2-col on mobile
 * - layout="grid": 2-column layout (ideal for search sidebar/drawer) with centered UNISEX pill
 */
export function AudienceSelector({
  selectedAudiences,
  onToggle,
  layout = "row",
  className = "",
}: AudienceSelectorProps) {
  if (layout === "grid") {
    return (
      <div className={`grid grid-cols-2 gap-2 ${className}`}>
        {AUDIENCE_OPTIONS.slice(0, 4).map((aud) => (
          <AudiencePill
            key={aud.id}
            audience={aud}
            isSelected={selectedAudiences.includes(aud.id)}
            onClick={() => onToggle(aud.id)}
            size="compact"
          />
        ))}

        {/* UNISEX centered in 2-column layout without being oversized */}
        <div className="col-span-2 flex justify-center">
          <AudiencePill
            audience={AUDIENCE_OPTIONS[4]}
            isSelected={selectedAudiences.includes(AUDIENCE_OPTIONS[4].id)}
            onClick={() => onToggle(AUDIENCE_OPTIONS[4].id)}
            size="compact"
            className="w-[calc(50%-0.25rem)]"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 ${className}`}
    >
      {AUDIENCE_OPTIONS.map((aud) => (
        <AudiencePill
          key={aud.id}
          audience={aud}
          isSelected={selectedAudiences.includes(aud.id)}
          onClick={() => onToggle(aud.id)}
        />
      ))}
    </div>
  );
}
