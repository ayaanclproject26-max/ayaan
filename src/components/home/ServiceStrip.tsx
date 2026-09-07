"use client";

import { useState, useRef, useEffect } from "react";
import { ShieldCheck, Globe2, Factory, Package, ChevronDown, ChevronUp } from "lucide-react";

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "VERIFIED STOCK",
    text: "Audited availability",
  },
  {
    icon: Globe2,
    title: "GLOBAL SHIPPING",
    text: "Air & sea worldwide",
  },
  {
    icon: Factory,
    title: "FACTORY DIRECT",
    text: "Direct manufacturer sourcing",
  },
  {
    icon: Package,
    title: "EXPORT READY",
    text: "Export-standard packing",
  },
];

export default function ServiceStrip() {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleExpandAboutUs = () => {
      setIsMobileExpanded(true);
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    };
    window.addEventListener("expand-about-us", handleExpandAboutUs);
    return () => window.removeEventListener("expand-about-us", handleExpandAboutUs);
  }, []);

  return (
    <section
      id="built-for-international-buyers"
      className="w-full bg-background py-2"
      ref={sectionRef}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="bg-white dark:bg-[#0f172a] border border-border/60 rounded-2xl shadow-xs overflow-hidden">
          
          {/* ── MOBILE VIEW (md:hidden) — Compact Collapsible Strip ── */}
          <div className="md:hidden">
            {/* Mobile Header Row / Accordion Trigger */}
            <button
              type="button"
              onClick={() => setIsMobileExpanded((prev) => !prev)}
              aria-expanded={isMobileExpanded}
              aria-controls="mobile-service-strip-body"
              aria-label={isMobileExpanded ? "Collapse Built for International Buyers section" : "Expand Built for International Buyers section"}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 text-left hover:bg-secondary/20 active:bg-secondary/30 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset cursor-pointer group"
            >
              {/* Left: Leading Icon + Section Title */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary shrink-0" aria-hidden="true">
                  <Globe2 size={14} strokeWidth={2} />
                </span>
                <span className="text-xs font-display font-bold uppercase tracking-tight text-foreground truncate">
                  Built for International Buyers
                </span>
              </div>

              {/* Right: 4 Compact Feature Icons + Expand/Collapse Chevron */}
              <div className="flex items-center gap-2 shrink-0">
                <div 
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/70 text-muted-foreground border border-border/40" 
                  aria-hidden="true"
                  title="Verified Stock, Global Shipping, Factory Direct, Export Ready"
                >
                  <ShieldCheck size={12} strokeWidth={2} />
                  <Globe2 size={12} strokeWidth={2} />
                  <Factory size={12} strokeWidth={2} />
                  <Package size={12} strokeWidth={2} />
                </div>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-200 shrink-0" aria-hidden="true">
                  {isMobileExpanded ? (
                    <ChevronUp size={16} strokeWidth={2.25} />
                  ) : (
                    <ChevronDown size={16} strokeWidth={2.25} />
                  )}
                </span>
              </div>
            </button>

            {/* Mobile Expanded Cards — Horizontal Flex Layout */}
            <div
              id="mobile-service-strip-body"
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                isMobileExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
              }`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-border/40 px-3.5 pt-3 pb-3.5 sm:px-4 sm:pt-3.5 sm:pb-4 bg-secondary/15">
                  <p className="text-[0.68rem] font-sans text-muted-foreground mb-2.5 leading-none">
                    140+ Countries · Factory Direct · Export Ready
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    {BENEFITS.map(({ icon: Icon, title, text }) => (
                      <div
                        key={title}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl bg-background border border-border/50 shadow-2xs min-w-0"
                      >
                        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-secondary/60 border border-border/40 text-primary shadow-xs shrink-0" aria-hidden="true">
                          <Icon size={16} strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-display font-bold uppercase tracking-wide text-foreground leading-tight truncate">
                            {title}
                          </p>
                          <p className="text-[0.68rem] sm:text-xs font-sans text-muted-foreground mt-0.5 leading-snug truncate">
                            {text}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── DESKTOP VIEW (hidden md:block) — Always Expanded, Horizontal Cards ── */}
          <div className="hidden md:block p-5 sm:p-6">
            {/* Desktop Header */}
            <div className="mb-3.5">
              <h2 className="text-sm sm:text-base font-display font-bold uppercase tracking-tight text-foreground leading-tight">
                Built for International Buyers
              </h2>
              <p className="text-xs sm:text-sm font-sans text-muted-foreground mt-0.5 leading-none">
                140+ Countries · Factory Direct · Export Ready
              </p>
            </div>

            {/* 4 Feature Cards — Horizontal Layout */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-3.5">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="flex items-center gap-3 p-3 lg:p-3.5 rounded-xl bg-secondary/30 border border-border/40 hover:bg-secondary/50 transition-colors duration-150 min-w-0"
                >
                  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-background border border-border/50 text-primary shadow-xs shrink-0" aria-hidden="true">
                    <Icon size={19} strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-display font-bold uppercase tracking-wide text-foreground leading-tight truncate">
                      {title}
                    </p>
                    <p className="text-[0.72rem] sm:text-xs font-sans text-muted-foreground mt-0.5 leading-snug truncate">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
