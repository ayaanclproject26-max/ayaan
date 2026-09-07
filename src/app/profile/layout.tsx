"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { ChevronRight, Home } from "lucide-react";
import { CustomerAccountSidebar } from "@/components/account/CustomerAccountSidebar";
import { CustomerAccountMobileNav } from "@/components/account/CustomerAccountMobileNav";

function getBreadcrumbLabel(pathname: string): string {
  if (pathname === "/profile") return "Overview";
  if (pathname.startsWith("/profile/orders/")) return "Order Details";
  if (pathname.startsWith("/profile/orders")) return "Orders";
  if (pathname.startsWith("/profile/addresses")) return "Addresses";
  if (pathname.startsWith("/profile/documents")) return "Documents";
  return "Account";
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const crumbLabel = getBreadcrumbLabel(pathname);
  const isOverview = pathname === "/profile";

  return (
    <div className="bg-slate-50/70 dark:bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-5 sm:mb-6"
        >
          <Link
            href="/"
            className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
          >
            <Home size={13} />
            <span>Home</span>
          </Link>
          <ChevronRight size={11} className="text-slate-300 dark:text-slate-600" />
          {isOverview ? (
            <span className="text-slate-900 dark:text-white font-semibold">Account</span>
          ) : (
            <>
              <Link
                href="/profile"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Account
              </Link>
              <ChevronRight size={11} className="text-slate-300 dark:text-slate-600" />
              <span className="text-slate-900 dark:text-white font-semibold">
                {crumbLabel}
              </span>
            </>
          )}
        </nav>

        {/* Mobile nav (shown on < lg) */}
        <div className="mb-5 sm:mb-6">
          <CustomerAccountMobileNav />
        </div>

        {/* Main layout — explicit sidebar width */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-7 items-start">
          {/* Desktop sidebar */}
          <CustomerAccountSidebar />

          {/* Content workspace */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>

      </div>
    </div>
  );
}
