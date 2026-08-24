"use client";

import { useState, useRef, useEffect } from "react";
import { ShieldCheck, Globe2, Sparkles, Handshake, PackageCheck } from "lucide-react";

const FEATURES = [
  {
    title: "VERIFIED BRANDED STOCK",
    icon: ShieldCheck,
  },
  {
    title: "WORLDWIDE EXPORT DELIVERY",
    icon: Globe2,
  },
  {
    title: "CONSISTENT GRADING",
    icon: Sparkles,
  },
  {
    title: "TRANSPARENT MOQS",
    icon: Handshake,
  },
  {
    title: "EXPORT-READY PACKING",
    icon: PackageCheck,
  },
];

export default function ServiceStrip() {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveTooltip(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <section className="w-full bg-background" ref={containerRef}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="bg-white border border-border/40 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          {/* Mobile: Icons only with Tooltip | Desktop: Grid with Text */}
          <div className="flex w-full justify-between overflow-x-auto no-scrollbar md:grid md:grid-cols-5 md:divide-x md:divide-border/25 px-2 md:px-0">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="relative flex items-center justify-center md:justify-start gap-2.5 flex-1 min-w-max py-3.5 md:py-4 px-3 md:px-5 cursor-pointer md:cursor-default"
                  onClick={() => setActiveTooltip(activeTooltip === index ? null : index)}
                >
                  <Icon size={20} className="text-muted-foreground shrink-0 md:w-[18px] md:h-[18px] transition-colors duration-200" style={{ color: activeTooltip === index ? 'var(--foreground)' : undefined }} strokeWidth={1.5} />
                  
                  {/* Desktop Text */}
                  <span className="hidden md:block text-[0.75rem] font-bold uppercase tracking-wider text-foreground leading-tight">
                    {feature.title}
                  </span>

                  {/* Mobile Tooltip */}
                  <div 
                    className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-max max-w-[200px] bg-[#111827] text-white px-2.5 py-1.5 rounded-lg shadow-lg text-[9px] font-bold tracking-wider uppercase text-center transition-all duration-200 z-10 md:hidden ${
                      activeTooltip === index 
                        ? "opacity-100 translate-y-0 visible" 
                        : "opacity-0 translate-y-2 invisible"
                    }`}
                  >
                    {feature.title}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-[#111827]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
