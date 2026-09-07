"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";

export interface AudienceImageOption {
  id: "MEN" | "WOMEN" | "BOYS" | "GIRLS" | "UNISEX" | string;
  name: "MEN" | "WOMEN" | "BOYS" | "GIRLS" | "UNISEX" | string;
  slug: string;
  image: string;
  description: string;
}

/**
 * Authoritative 5 Core Audience groups with restored original photographic assets:
 * - MEN: High quality men's tailored essentials
 * - WOMEN: Elegant contemporary women's wear
 * - BOYS: Durable streetwear & knitwear for boys
 * - GIRLS: EXACT URL https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&q=80&w=800
 * - UNISEX: Modern gender-neutral apparel
 */
export const AUDIENCE_IMAGE_OPTIONS: AudienceImageOption[] = [
  {
    id: "MEN",
    name: "MEN",
    slug: "men",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=800",
    description: "Modern essentials and statement pieces for men.",
  },
  {
    id: "WOMEN",
    name: "WOMEN",
    slug: "women",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800",
    description: "Elegant and contemporary fashion for women.",
  },
  {
    id: "BOYS",
    name: "BOYS",
    slug: "boys",
    image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=800",
    description: "Trendy and durable apparel crafted for boys.",
  },
  {
    id: "GIRLS",
    name: "GIRLS",
    slug: "girls",
    image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&q=80&w=800",
    description: "Vibrant and stylish fashion collection for girls.",
  },
  {
    id: "UNISEX",
    name: "UNISEX",
    slug: "unisex",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800",
    description: "Gender-neutral fashion for everyone.",
  },
];

export interface AudienceCardProps {
  audience: AudienceImageOption;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Editorial Image-Based Audience Card for the Landing Page / Homepage:
 * - Photographic background with object-cover
 * - Subtle gradient overlay to keep text legible without dimming the photo
 * - Clear Manrope typography with uppercase styling
 * - Active checkmark badge & ring indicator
 * - Smooth hover zoom without displacing neighboring cards
 */
export function AudienceCard({
  audience,
  isActive = false,
  onClick,
  className = "",
}: AudienceCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      aria-label={`Explore ${audience.name} collection`}
      className={`group relative w-full aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden bg-secondary text-left border transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
        isActive
          ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md"
          : "border-border/60 hover:border-foreground/40 hover:shadow-md"
      } ${className}`}
    >
      {/* Background Image */}
      {!imgError ? (
        <img
          src={audience.image}
          alt={`${audience.name} Fashion Collection`}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4">
          <span className="text-white/30 text-xl font-display font-bold uppercase tracking-wider text-center">
            {audience.name}
          </span>
        </div>
      )}

      {/* Subtle Gradient Overlay */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
          isActive
            ? "bg-gradient-to-t from-black/80 via-black/35 to-black/15"
            : "bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 group-hover:via-black/30"
        }`}
      />

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-3.5 sm:p-4 text-white pointer-events-none">
        <h3 className="font-display font-bold text-sm sm:text-base lg:text-lg uppercase tracking-wider text-white drop-shadow-xs leading-tight">
          {audience.name}
        </h3>
        <span className="text-[10px] sm:text-xs font-sans font-medium uppercase tracking-widest text-white/80 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
          {isActive ? "Selected ✓" : "Explore →"}
        </span>
      </div>

      {/* Active Checkmark Badge */}
      {isActive && (
        <span
          className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-md ring-2 ring-background"
          aria-hidden="true"
        >
          <Check size={13} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

export interface AudienceTilesProps {
  selectedAudiences: string[];
  onToggle: (audienceName: string) => void;
  className?: string;
}

/**
 * Responsive Grid of 5 Image-Based Audience Cards:
 * - Desktop: 5 columns in ONE single row (MEN, WOMEN, BOYS, GIRLS, UNISEX)
 * - Tablet: 3 columns
 * - Mobile: 2 columns with 5th tile (UNISEX) centered / spanning 2 columns
 */
export function AudienceTiles({
  selectedAudiences,
  onToggle,
  className = "",
}: AudienceTilesProps) {
  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 ${className}`}
      role="group"
      aria-label="Audience collection options"
    >
      {AUDIENCE_IMAGE_OPTIONS.map((audience, index) => {
        const isSelected = selectedAudiences.includes(audience.name.toUpperCase());
        const isLastOnMobile = index === AUDIENCE_IMAGE_OPTIONS.length - 1;

        return (
          <div
            key={audience.id}
            className={isLastOnMobile ? "col-span-2 sm:col-span-1" : "col-span-1"}
          >
            <AudienceCard
              audience={audience}
              isActive={isSelected}
              onClick={() => onToggle(audience.name)}
            />
          </div>
        );
      })}
    </div>
  );
}
