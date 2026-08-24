"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Package, 
  Tag, 
  Layers, 
  FileText, 
  FileCheck, 
  Store, 
  Menu, 
  X, 
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Products Catalog", href: "/admin/products", icon: Package },
  { label: "Brands Directory", href: "/admin/brands", icon: Tag },
  { label: "Category Taxonomy", href: "/admin/categories", icon: Layers },
  { label: "B2B RFQs & Inquiries", href: "/admin/rfq", icon: FileText },
  { label: "Commercial Quotations", href: "/admin/quotations", icon: FileCheck },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-secondary/30 text-foreground flex flex-col">
      
      {/* Top Admin Bar */}
      <header className="sticky top-0 z-40 bg-card border-b border-border/80 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-secondary text-foreground"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href="/admin/products" className="flex items-center gap-2">
            <span className="font-display font-bold text-lg uppercase tracking-wider text-foreground">
              AYAAN
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              B2B Admin
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={15} className="text-emerald-500" />
            <span className="font-medium">Admin Mode Active</span>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border text-xs font-bold uppercase tracking-wider hover:bg-secondary transition-colors"
          >
            <Store size={13} />
            <span>Storefront</span>
          </Link>
        </div>
      </header>

      {/* Main Admin Workspace (Sidebar + Content) */}
      <div className="flex-1 flex w-full max-w-[1720px] mx-auto">
        
        {/* Desktop Left Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r border-border/80 bg-card p-4 space-y-6 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 block mb-2">
              Management Suite
            </span>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                      isActive
                        ? "bg-foreground text-background shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-border/60">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-3 block mb-2">
              Quick Shortcuts
            </span>
            <div className="space-y-1">
              <Link
                href="/admin/products/new"
                className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <span>+ Add New Product</span>
                <ChevronRight size={13} />
              </Link>
              <Link
                href="/admin/rfq"
                className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <span>Review Pending RFQs</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-ink/50 backdrop-blur-xs flex">
            <div className="w-64 bg-card h-full p-4 space-y-6 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="font-bold text-sm uppercase text-foreground">Admin Menu</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="space-y-1 flex-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                        isActive
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {children}
        </main>

      </div>

    </div>
  );
}
