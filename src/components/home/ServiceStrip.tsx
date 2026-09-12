"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Globe2, Factory, Package } from "lucide-react";

export interface TrustFeature {
  id: string;
  icon: typeof ShieldCheck;
  title: string;
  mobileLabel: string;
  text: string;
}

export const TRUST_FEATURES: TrustFeature[] = [
  {
    id: "stock",
    icon: ShieldCheck,
    title: "VERIFIED STOCK",
    mobileLabel: "STOCK",
    text: "Audited availability",
  },
  {
    id: "shipping",
    icon: Globe2,
    title: "GLOBAL SHIPPING",
    mobileLabel: "SHIPPING",
    text: "Air & sea worldwide",
  },
  {
    id: "factory",
    icon: Factory,
    title: "FACTORY DIRECT",
    mobileLabel: "FACTORY",
    text: "Direct manufacturer sourcing",
  },
  {
    id: "export",
    icon: Package,
    title: "EXPORT READY",
    mobileLabel: "EXPORT",
    text: "Export-standard packing",
  },
];

export default function ServiceStrip() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Single authoritative state: null = all collapsed; 0..3 = expanded feature index
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleExpandAboutUs = () => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    window.addEventListener("expand-about-us", handleExpandAboutUs);
    return () => window.removeEventListener("expand-about-us", handleExpandAboutUs);
  }, []);

  // Close expanded feature on click outside or Escape key
  useEffect(() => {
    if (expandedIndex === null) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpandedIndex(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExpandedIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [expandedIndex]);

  const handleToggle = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      id="built-for-international-buyers"
      className="w-full bg-transparent py-1.5 sm:py-2"
      ref={sectionRef}
      aria-label="Key Value and Trust Features"
    >
      <div ref={containerRef} className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 2xl:px-12">
        {/* ── MOBILE VIEW (md:hidden) — Single-Border Inline Expanding Tile Interaction ── */}
        <div className="md:hidden py-1">
          <div 
            className="flex items-center justify-between gap-1.5 sm:gap-2 max-w-md mx-auto w-full"
            role="region"
            aria-label="Trust Features Overview"
          >
            {TRUST_FEATURES.map(({ icon: Icon, title, mobileLabel, text }, index) => {
              const isExpanded = expandedIndex === index;
              const hasAnyExpanded = expandedIndex !== null;

              if (isExpanded) {
                // EXPANDED TILE: Single border, horizontal layout with icon directly inside tile + full title + description
                return (
                  <button
                    key={title}
                    type="button"
                    onClick={() => handleToggle(index)}
                    aria-expanded={true}
                    aria-label={`${title}: ${text}. Tap to collapse.`}
                    className="flex-[1_1_auto] min-w-0 min-h-[66px] sm:min-h-[72px] flex items-center gap-2.5 sm:gap-3 px-3 sm:px-3.5 py-2.5 rounded-xl sm:rounded-2xl border border-primary/40 bg-primary/[0.04] dark:bg-white/[0.04] text-left transition-all duration-250 ease-out motion-reduce:transition-none cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 active:scale-[0.99]"
                  >
                    {/* Icon directly inside tile (no inner circle/container) */}
                    <Icon 
                      className="w-6 h-6 text-primary shrink-0" 
                      strokeWidth={1.8} 
                      aria-hidden="true" 
                    />

                    {/* Text Block: Title + Description */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] sm:text-[13.5px] font-display font-bold uppercase tracking-tight text-foreground leading-tight truncate">
                        {title}
                      </p>
                      <p className="text-[10.5px] sm:text-[11.5px] font-sans text-muted-foreground mt-0.5 leading-snug truncate">
                        {text}
                      </p>
                    </div>
                  </button>
                );
              }

              // COLLAPSED TILE: Single border, vertical layout with icon directly inside tile + short label
              return (
                <button
                  key={title}
                  type="button"
                  onClick={() => handleToggle(index)}
                  aria-expanded={false}
                  aria-label={`${title}: ${text}. Tap to expand details.`}
                  className={`flex flex-col items-center justify-center gap-1.5 py-2.5 sm:py-3 px-1.5 rounded-xl sm:rounded-2xl border border-slate-900/15 dark:border-white/15 bg-transparent hover:border-slate-900/30 dark:hover:border-white/30 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] min-h-[66px] sm:min-h-[72px] cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 active:scale-95 transition-all duration-200 ease-out motion-reduce:transition-none ${
                    hasAnyExpanded
                      ? "shrink-0 w-[48px] sm:w-[52px]"
                      : "flex-1 min-w-0"
                  }`}
                >
                  {/* Icon directly inside tile (no inner circle/container) */}
                  <Icon 
                    className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-primary shrink-0 transition-transform duration-150 group-hover:scale-105" 
                    strokeWidth={1.8} 
                    aria-hidden="true" 
                  />

                  {/* Short Mobile Label */}
                  <span className="text-[10px] sm:text-[10.5px] font-display font-semibold uppercase tracking-wider text-foreground/80 group-hover:text-foreground truncate max-w-full">
                    {mobileLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── DESKTOP & TABLET VIEW (hidden md:grid) — 4 Thin Dark-Bordered Outlined Pills in One Row ── */}
        <div className="hidden md:grid md:grid-cols-4 gap-3 lg:gap-3.5 xl:gap-4.5">
          {TRUST_FEATURES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex items-center gap-2.5 lg:gap-3 xl:gap-3.5 px-3.5 py-2 lg:px-4 lg:py-2.5 xl:px-4.5 xl:py-2.5 rounded-full border border-slate-900/15 dark:border-white/15 bg-transparent hover:border-slate-900/30 dark:hover:border-white/30 hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-all duration-150 min-w-0 min-h-[64px] lg:min-h-[68px] xl:min-h-[72px]"
            >
              {/* Outlined / Light Icon Container (~40–44px) */}
              <div
                className="flex items-center justify-center w-10 h-10 lg:w-10.5 lg:h-10.5 xl:w-11 xl:h-11 rounded-full bg-primary/[0.04] dark:bg-white/[0.06] border border-primary/15 dark:border-white/15 text-primary shrink-0"
                aria-hidden="true"
              >
                <Icon className="w-5 h-5 xl:w-5.5 xl:h-5.5 text-primary" strokeWidth={1.8} />
              </div>

              {/* Text Block */}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] md:text-[13.5px] lg:text-[15px] xl:text-[16.5px] 2xl:text-[17px] font-display font-bold uppercase tracking-tight text-foreground leading-tight truncate">
                  {title}
                </p>
                <p className="text-[10.5px] md:text-[11px] lg:text-[12px] xl:text-[13px] 2xl:text-[13.5px] font-sans text-muted-foreground mt-0.5 leading-snug truncate">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}




