"use client";

import React, { useRef, useState, useEffect, useCallback, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalCarouselProps {
  children: ReactNode;
  /**
   * Optional class name to apply to the track (e.g. gap, padding).
   */
  trackClassName?: string;
  /**
   * If true, enables autoplay when overflow exists. Default is true.
   */
  autoplay?: boolean;
  /**
   * Time in milliseconds between automatic slides. Default is 4000.
   */
  autoplayInterval?: number;
}

export default function HorizontalCarousel({
  children,
  trackClassName = "",
  autoplay = true,
  autoplayInterval = 4000,
}: HorizontalCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);

  // Drag states
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const isDraggingActual = useRef(false);

  // 1. Evaluate scroll boundaries and overflow
  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    
    setIsOverflowing(scrollWidth > clientWidth + 2); // 2px buffer for rounding
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
  }, []);

  // 2. Setup ResizeObserver and Scroll listener
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    checkScroll();
    
    const observer = new ResizeObserver(() => checkScroll());
    observer.observe(el);
    
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    
    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  // 3. Autoplay logic
  useEffect(() => {
    if (!autoplay || !isOverflowing || isInteracting || isDragging) return;
    
    // Check for reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    const timer = setInterval(() => {
      if (!scrollRef.current) return;
      const el = scrollRef.current;
      
      // If we can scroll right, move by roughly the width of one visible item or a percentage
      if (canScrollRight) {
        // Find the width of a single child if possible, or just scroll by a fixed proportion
        const firstChild = el.firstElementChild as HTMLElement;
        const slideAmount = firstChild ? firstChild.clientWidth + parseInt(window.getComputedStyle(el).gap || '0') : 300;
        
        el.scrollBy({ left: slideAmount, behavior: "smooth" });
      } else {
        // Reached the end, loop back to start smoothly
        el.scrollTo({ left: 0, behavior: "smooth" });
      }
    }, autoplayInterval);

    return () => clearInterval(timer);
  }, [autoplay, isOverflowing, isInteracting, isDragging, canScrollRight, autoplayInterval]);

  // 4. Drag to scroll logic for desktop
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return; // Touch handles native swipe
    setIsDragging(true);
    isDraggingActual.current = false;
    startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
    scrollLeftStart.current = scrollRef.current?.scrollLeft || 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault(); // Prevent default text selection
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; // Scroll-fast multiplier
    if (Math.abs(walk) > 10) {
      isDraggingActual.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handlePointerUpOrLeave = () => {
    setIsDragging(false);
  };

  // Prevent click events from firing if we were actually dragging
  const handleCaptureClick = (e: React.MouseEvent) => {
    if (isDraggingActual.current) {
      e.stopPropagation();
      e.preventDefault();
      isDraggingActual.current = false;
    }
  };

  // 5. Arrow Navigation
  const handleNext = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const firstChild = el.firstElementChild as HTMLElement;
    const slideAmount = firstChild ? firstChild.clientWidth + parseInt(window.getComputedStyle(el).gap || '0') : 300;
    el.scrollBy({ left: slideAmount, behavior: "smooth" });
  };

  const handlePrev = () => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const firstChild = el.firstElementChild as HTMLElement;
    const slideAmount = firstChild ? firstChild.clientWidth + parseInt(window.getComputedStyle(el).gap || '0') : 300;
    el.scrollBy({ left: -slideAmount, behavior: "smooth" });
  };

  return (
    <div 
      className="relative w-full group"
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => {
        setIsInteracting(false);
        setIsDragging(false);
      }}
      onTouchStart={() => setIsInteracting(true)}
      onTouchEnd={() => setIsInteracting(false)}
    >
      {/* Scrollable Track */}
      <div
        ref={scrollRef}
        className={`flex flex-nowrap overflow-x-auto snap-x snap-mandatory no-scrollbar select-none cursor-grab active:cursor-grabbing ${trackClassName}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrLeave}
        onPointerCancel={handlePointerUpOrLeave}
        onClickCapture={handleCaptureClick}
        style={{ scrollBehavior: isDragging ? "auto" : "smooth" }} // Disable smooth scroll while dragging
      >
        {children}
      </div>

      {/* Navigation Arrows (Only show if overflowing) */}
      {isOverflowing && (
        <>
          {/* Left Arrow */}
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 sm:-translate-x-5 z-10 transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button
              onClick={handlePrev}
              aria-label="Previous items"
              className="w-10 h-10 rounded-full bg-background border border-border shadow-md flex items-center justify-center text-foreground hover:bg-secondary hover:-translate-x-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft size={20} className="mr-0.5" />
            </button>
          </div>

          {/* Right Arrow */}
          <div className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 sm:translate-x-5 z-10 transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button
              onClick={handleNext}
              aria-label="Next items"
              className="w-10 h-10 rounded-full bg-background border border-border shadow-md flex items-center justify-center text-foreground hover:bg-secondary hover:translate-x-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronRight size={20} className="ml-0.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
