"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HeroPromotion, HeroSecondaryBanner } from "@/types";
import {
  getHeroPromotions,
  getNewArrivalsBanner,
  getLimitedTimeOfferBanner,
  handlePromotionalClick,
} from "@/lib/promotions";

interface HeroProps {
  initialPromotions?: HeroPromotion[];
  initialNewArrivalsBanner?: HeroSecondaryBanner;
  initialLimitedTimeBanner?: HeroSecondaryBanner;
}

export default function Hero({
  initialPromotions,
  initialNewArrivalsBanner,
  initialLimitedTimeBanner,
}: HeroProps) {
  // Query layer consumption: uses provided props or falls back to promotional query service
  const slides = useMemo(
    () => initialPromotions ?? getHeroPromotions(),
    [initialPromotions]
  );
  const newArrivalsBanner = useMemo(
    () => initialNewArrivalsBanner ?? getNewArrivalsBanner(),
    [initialNewArrivalsBanner]
  );
  const limitedTimeBanner = useMemo(
    () => initialLimitedTimeBanner ?? getLimitedTimeOfferBanner(),
    [initialLimitedTimeBanner]
  );

  const slideCount = slides.length;
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    if (slideCount <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 5000);
    return () => clearInterval(timer);
  }, [slideCount]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slideCount);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slideCount) % slideCount);

  return (
    <section id="hero" className="w-full bg-background pt-4 sm:pt-5 pb-0">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Hero Wrapper: Strict height control on desktop */}
        <div className="w-full lg:aspect-[3/1]">
          {/* Hero Grid */}
          <div className="w-full lg:h-full grid grid-cols-1 lg:grid-cols-10 gap-4 sm:gap-5">
            
            {/* Main Banner (Carousel) */}
            <div className="relative w-full lg:h-full min-h-0 lg:col-span-7 aspect-[2/1] lg:aspect-auto rounded-2xl overflow-hidden bg-secondary group">
              {slides.map((banner, idx) => (
                <div 
                  key={banner.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    idx === currentSlide ? "opacity-100 z-10 visible" : "opacity-0 z-0 invisible pointer-events-none"
                  }`}
                >
                  <img 
                    src={banner.image} 
                    alt={banner.title} 
                    className="w-full h-full object-cover block"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-ink/55 via-ink/15 to-transparent" />
                  
                  <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-10 md:p-14 text-white max-w-2xl">
                    <span className="text-[0.625rem] sm:text-xs font-bold tracking-[0.2em] uppercase mb-2 sm:mb-3 opacity-90">
                      {banner.eyebrow || banner.title}
                    </span>
                    <h2 className="text-3xl sm:text-5xl md:text-6xl font-display leading-[1.1] tracking-tight mb-3 sm:mb-4 drop-shadow-sm">
                      {banner.subtitle}
                    </h2>
                    {banner.description && (
                      <p className="text-sm sm:text-lg opacity-90 mb-5 sm:mb-7 max-w-sm md:max-w-md leading-relaxed hidden sm:block drop-shadow-sm">
                        {banner.description}
                      </p>
                    )}
                    <div>
                      <Link 
                        href={banner.buttonTarget || "#featured"}
                        onClick={(e) => handlePromotionalClick(e, banner.buttonAction, banner.buttonTarget)}
                      >
                        <button className="inline-flex items-center justify-center bg-[#111827] text-white hover:bg-[#1f2937] border border-white/20 px-7 sm:px-10 py-3 sm:py-3.5 text-[0.6875rem] sm:text-sm uppercase tracking-[0.15em] font-bold rounded-lg transition-all duration-200 press-feedback focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                          {banner.buttonText}
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}

              {/* Carousel Controls */}
              {slides.length > 1 && (
                <div className="hidden sm:flex absolute bottom-5 right-5 z-20 items-center gap-2.5">
                  <button 
                    onClick={prevSlide}
                    className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-white/25 transition-colors"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    onClick={nextSlide}
                    className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-white/25 transition-colors"
                    aria-label="Next slide"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
              
              {/* Dots */}
              {slides.length > 1 && (
                <div className="absolute bottom-5 sm:bottom-6 left-6 sm:left-10 md:left-14 z-20 flex items-center gap-2">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentSlide ? "w-7 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Side Column */}
            <div className="w-full lg:h-full min-h-0 lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-4 sm:gap-5">
              
              {/* Top Side Banner: New Arrivals */}
              <Link 
                href={newArrivalsBanner.target || "#featured"} 
                onClick={(e) => handlePromotionalClick(e, newArrivalsBanner.targetType, newArrivalsBanner.target)}
                className="relative w-full lg:h-full min-h-0 rounded-2xl overflow-hidden bg-secondary group aspect-[1.7/1] lg:aspect-auto"
              >
                <img 
                  src={newArrivalsBanner.image} 
                  alt={newArrivalsBanner.title} 
                  className="w-full h-full object-cover block transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[#111827]/30 group-hover:bg-[#111827]/40 transition-colors duration-300" />
                <div className="absolute inset-0 p-4 sm:p-5 lg:p-6 flex flex-col justify-end text-white">
                  <h3 className="text-sm sm:text-xl lg:text-2xl font-display font-semibold tracking-tight mb-1 leading-tight">
                    {newArrivalsBanner.title}
                  </h3>
                  {newArrivalsBanner.subtitle && (
                    <p className="text-[0.625rem] sm:text-sm opacity-90 max-w-[90%] hidden sm:block">
                      {newArrivalsBanner.subtitle}
                    </p>
                  )}
                </div>
              </Link>

              {/* Bottom Side Banner: Limited Time Offer */}
              <Link 
                href={limitedTimeBanner.target || "#featured"} 
                onClick={(e) => handlePromotionalClick(e, limitedTimeBanner.targetType, limitedTimeBanner.target)}
                className="relative w-full lg:h-full min-h-0 rounded-2xl overflow-hidden bg-secondary group aspect-[1.7/1] lg:aspect-auto"
              >
                <img 
                  src={limitedTimeBanner.image} 
                  alt={limitedTimeBanner.title} 
                  className="w-full h-full object-cover block transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-[#111827]/30 group-hover:bg-[#111827]/40 transition-colors duration-300" />
                <div className="absolute inset-0 p-4 sm:p-5 lg:p-6 flex flex-col justify-end text-white">
                  <h3 className="text-sm sm:text-xl lg:text-2xl font-display font-semibold tracking-tight mb-1 leading-tight">
                    {limitedTimeBanner.title}
                  </h3>
                  {limitedTimeBanner.subtitle && (
                    <p className="text-[0.625rem] sm:text-sm opacity-90 max-w-[90%] hidden sm:block">
                      {limitedTimeBanner.subtitle}
                    </p>
                  )}
                </div>
              </Link>

            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
