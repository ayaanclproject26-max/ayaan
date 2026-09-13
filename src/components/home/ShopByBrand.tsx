
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { brandService, BrandModel } from "@/services/brand.service";
import BrandTile from "@/components/common/BrandTile";
import { Tag } from "lucide-react";
import { getBrandLogoUrl } from "@/lib/brand-logos";
import HorizontalCarousel from "@/components/common/HorizontalCarousel";

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  sort_order?: number;
}

export default function ShopByBrand() {
  const router = useRouter();
  const [brandList, setBrandList] = useState<Brand[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const brandsData = await brandService.getBrands();

        if (brandsData && brandsData.length > 0) {
          const formatted: Brand[] = brandsData.map((b: BrandModel) => ({
            id: String(b.slug || b.id),
            name: b.name,
            slug: b.slug,
            logo: b.logo_url || b.logo || `/brands/${b.slug}.png`,
            sort_order: b.sort_order,
          }));
          setBrandList(formatted);
        }
      } catch (err) {
        console.error("Failed to load storefront brands:", err);
      }
    }
    load();
  }, []);

  const handleBrandClick = (brand: Brand) => {
    router.push(`/search?brand=${encodeURIComponent(brand.name)}&filterOpen=true`);
  };

  return (
    <section id="brands" className="py-12 sm:py-16 bg-background border-t border-border/60 scroll-mt-20">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 2xl:px-12">
        
        {/* Section Heading & Subtitle */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-fluid-h2 font-display font-bold uppercase tracking-tight text-foreground">
              SHOP BY BRAND
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground font-sans mt-1.5 sm:mt-2">
              Select one or multiple brands to explore authentic wholesale &amp; retail apparel
            </p>
          </div>
        </div>

        {/* Brand Grid: True 1:1 Squares with consistent responsive columns */}
        <HorizontalCarousel trackClassName="gap-3 sm:gap-4 lg:gap-4.5 pb-4 pt-1">
          {brandList.map((brand) => (
            <div key={brand.id} className="w-[calc(50%-6px)] sm:w-[calc(33.33%-11px)] md:w-[calc(25%-12px)] lg:w-[calc(16.666%-15px)] xl:w-[calc(12.5%-16px)] 2xl:w-[calc(10%-17px)] shrink-0 snap-start">
              <BrandTile
                brand={brand}
                isSelected={false}
                onClick={() => handleBrandClick(brand)}
                size="md"
              />
            </div>
          ))}
        </HorizontalCarousel>
      </div>
    </section>
  );
}

function BrandLogo({ brand }: { brand: Brand }) {
  const [imgError, setImgError] = useState(false);
  const logoSrc = getBrandLogoUrl(brand.name, brand.logo) || brand.logo;

  if (imgError || !logoSrc) {
    // Rule 19: Strictly no initials like A, N, B, L
    return (
      <span className="text-stone-300 dark:text-stone-600" aria-hidden="true">
        <Tag size={13} strokeWidth={1.5} />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoSrc}
      alt={`${brand.name} logo`}
      className="max-h-7 sm:max-h-8 max-w-[85%] object-contain transition-transform duration-300 group-hover:scale-105"
      loading="lazy"
      onError={() => setImgError(true)}
    />
  );
}
