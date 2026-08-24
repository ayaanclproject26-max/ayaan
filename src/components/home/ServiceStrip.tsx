"use client";

import { useState, useRef, useEffect } from "react";
import {
  ShieldCheck,
  Globe2,
  Sparkles,
  Handshake,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Building2,
  Truck,
  Award,
} from "lucide-react";

const FEATURES = [
  {
    title: "VERIFIED BRANDED STOCK",
    icon: ShieldCheck,
    description: "100% authentic surplus & production-overrun inventory verified with original supplier invoices.",
  },
  {
    title: "WORLDWIDE EXPORT DELIVERY",
    icon: Globe2,
    description: "Door-to-port and air/sea freight logistics covering 80+ countries with custom clearance clearance support.",
  },
  {
    title: "CONSISTENT GRADING",
    icon: Sparkles,
    description: "Strict A-grade quality control protocols and standardized batch inspections before dispatch.",
  },
  {
    title: "TRANSPARENT MOQS",
    icon: Handshake,
    description: "Flexible wholesale tiers and transparent minimum order quantities tailored for small & enterprise buyers.",
  },
  {
    title: "EXPORT-READY PACKING",
    icon: PackageCheck,
    description: "Heavy-duty carton packing, barcode labelling, and moisture-sealed protection for long-haul shipping.",
  },
];

export default function ServiceStrip() {
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Listen for global expand event (e.g. from footer About Us click)
  useEffect(() => {
    const handleExpandAboutUs = () => {
      setIsExpanded(true);
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    };

    window.addEventListener("expand-about-us", handleExpandAboutUs);
    return () => window.removeEventListener("expand-about-us", handleExpandAboutUs);
  }, []);

  return (
    <section id="built-for-international-buyers" className="w-full bg-background pt-2 pb-2" ref={sectionRef}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Main Card Container */}
        <div className="bg-white border border-border/40 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300">
          
          {/* Header Row with Title & Expand Toggle */}
          <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-border/20 flex items-center justify-between bg-[#fbfbfa]">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-primary hidden sm:inline-block" />
              <h2 className="text-xs sm:text-sm font-display font-bold uppercase tracking-wider text-foreground">
                BUILT FOR INTERNATIONAL BUYERS
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 text-[0.6875rem] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-expanded={isExpanded}
            >
              <span>{isExpanded ? "Show Less" : "About Ayaan & Capabilities"}</span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* 5 Core Feature Strip */}
          <div className="flex w-full justify-between overflow-x-auto no-scrollbar md:grid md:grid-cols-5 md:divide-x md:divide-border/25 px-2 md:px-0 bg-white">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="relative flex items-center justify-center md:justify-start gap-2.5 flex-1 min-w-max py-3.5 md:py-4 px-3 md:px-5 cursor-pointer md:cursor-default hover:bg-secondary/30 transition-colors"
                  onClick={() => setActiveTooltip(activeTooltip === index ? null : index)}
                >
                  <Icon size={18} className="text-muted-foreground shrink-0 md:w-[18px] md:h-[18px] transition-colors duration-200" strokeWidth={1.5} />
                  
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

          {/* Expandable About Us Details Section */}
          <div
            className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${
              isExpanded ? "grid-rows-[1fr] opacity-100 border-t border-border/30" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden bg-[#faf9f6]">
              <div className="p-5 sm:p-8 space-y-6">
                
                {/* Company Story & Mission */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 space-y-3">
                    <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
                      Who We Are
                    </span>
                    <h3 className="text-xl sm:text-2xl font-display font-bold uppercase tracking-tight text-foreground">
                      Pioneering Authentic Ready-Made Garments Export
                    </h3>
                    <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                      Founded in Dhaka, Bangladesh—the world&apos;s second-largest apparel manufacturing hub—Ayaan Clothing bridges the gap between premier manufacturing facilities and international retail & wholesale buyers across North America, Europe, the Middle East, and Asia-Pacific.
                    </p>
                    <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed">
                      We specialize in sourcing, quality auditing, and worldwide distribution of verified brand-name apparel, luxury seasonal knitwear, and certified organic textiles with full export documentation and competitive factory-direct pricing.
                    </p>
                  </div>

                  <div className="lg:col-span-5 bg-white border border-border/60 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-sm">
                    <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
                      Export Guarantee
                    </span>
                    <ul className="space-y-2.5 text-xs text-foreground/85">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>BGMEA Registered:</strong> Full institutional compliance with standard international commercial trade practices.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Multi-Currency Settlement:</strong> Invoicing available in USD, EUR, GBP, BDT, and major regional currencies.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Inspection & Audits:</strong> Pre-shipment batch inspection reports provided for all commercial orders.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* 3 Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/40">
                  <div className="flex gap-3 items-start p-3 bg-white rounded-lg border border-border/40">
                    <Truck size={20} className="text-foreground shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Global Freight</h4>
                      <p className="text-[0.6875rem] text-muted-foreground mt-0.5">Air cargo dispatch within 48h and optimized container sea freight.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start p-3 bg-white rounded-lg border border-border/40">
                    <Award size={20} className="text-foreground shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">A-Grade Standards</h4>
                      <p className="text-[0.6875rem] text-muted-foreground mt-0.5">Zero tolerance for defectives, accurate size charts & fabric specs.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start p-3 bg-white rounded-lg border border-border/40">
                    <ShieldCheck size={20} className="text-foreground shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Buyer Protection</h4>
                      <p className="text-[0.6875rem] text-muted-foreground mt-0.5">Escrow, Letter of Credit (L/C), and secure digital B2B payments.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
