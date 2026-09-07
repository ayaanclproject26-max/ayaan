"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

interface CustomerAccountHeroProps {
  /** Total order count for the CTA label */
  orderCount?: number;
}

export function CustomerAccountHero({ orderCount = 0 }: CustomerAccountHeroProps) {
  const { user } = useAuth();

  const displayName =
    user?.name ||
    (user?.email ? user.email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "");

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0b1329] via-[#0f1d40] to-[#1a2b58] text-white shadow-lg">
      {/* Content */}
      <div className="relative z-10 px-6 py-6 sm:px-8 sm:py-7 lg:px-8 lg:py-8 max-w-xl">
        {/* Label */}
        <p className="text-[0.6875rem] sm:text-xs uppercase tracking-widest text-amber-400 font-bold mb-1.5">
          Customer Dashboard
        </p>

        {/* Greeting */}
        <h1 className="text-xl sm:text-2xl lg:text-[1.625rem] font-bold font-display tracking-tight text-white leading-tight">
          Hello, {displayName}
        </h1>

        {/* Supporting copy */}
        <p className="mt-1.5 text-sm text-white/70 leading-relaxed max-w-sm">
          Manage your account, orders, payments, and shipments.
        </p>

        {/* CTAs */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <Link
            href="/profile/orders"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-900 font-bold text-xs uppercase tracking-wider transition-all duration-150 active:scale-95 shadow-sm"
          >
            <span>View All Orders ({orderCount})</span>
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/#categories"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/5 text-white font-semibold text-xs uppercase tracking-wider transition-all duration-150 active:scale-95"
          >
            Browse Catalog
          </Link>
        </div>
      </div>

      {/* Decorative graphic — clipped inside the card */}
      <div
        className="pointer-events-none absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-[0.07] sm:opacity-[0.09]"
        aria-hidden="true"
      >
        <ShoppingBag
          size={160}
          strokeWidth={1}
          className="text-white"
        />
      </div>
    </div>
  );
}
