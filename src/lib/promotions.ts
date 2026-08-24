import { HeroPromotion, HeroSecondaryBanner, ProductPromotion, Product } from "@/types";
import productsData from "@/data/products.json";

/**
 * Default static seed data for hero main carousel promotions.
 */
export const DEFAULT_HERO_PROMOTIONS: HeroPromotion[] = [
  {
    id: "promo-summer-collection",
    title: "SUMMER COLLECTION",
    subtitle: "Stay Cool. Look Sharp.",
    description: "New seasonal styles at exclusive prices.",
    eyebrow: "SUMMER COLLECTION",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=1600",
    buttonText: "SHOP NOW",
    buttonAction: "featured-products",
    buttonTarget: "#featured",
    active: true,
    sortOrder: 1,
  },
  {
    id: "promo-premium-essentials",
    title: "PREMIUM ESSENTIALS",
    subtitle: "Elevate Your Basics.",
    description: "High-quality cotton tees and classic denim.",
    eyebrow: "PREMIUM ESSENTIALS",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1600",
    buttonText: "DISCOVER",
    buttonAction: "featured-products",
    buttonTarget: "#featured",
    active: true,
    sortOrder: 2,
  },
];

/**
 * Default admin-configured product promotions.
 */
export const DEFAULT_PRODUCT_PROMOTIONS: ProductPromotion[] = [
  {
    id: "promo-lto-001",
    productId: "prd0001",
    type: "limited-time",
    active: true,
    priority: 1,
    customTitle: "LIMITED TIME OFFER",
    customImage: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=800",
  },
];

/**
 * Default secondary banners for New Arrivals and Limited Time Offer.
 * Clean: No subtitles below the headings.
 */
export const DEFAULT_SECONDARY_BANNERS: HeroSecondaryBanner[] = [
  {
    id: "banner-new-arrivals",
    type: "new-arrivals",
    title: "NEW ARRIVALS",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=800",
    targetType: "featured-products",
    target: "#featured",
    active: true,
  },
  {
    id: "banner-limited-time",
    type: "limited-time-offer",
    title: "LIMITED TIME OFFER",
    image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=800",
    targetType: "featured-products",
    target: "#featured",
    active: true,
  },
];

/**
 * Checks if a promotion is currently valid based on active status and optional start/end dates.
 */
export function isPromotionValid(
  promo: { active: boolean; startAt?: string; endAt?: string }
): boolean {
  if (!promo.active) return false;
  const now = Date.now();

  if (promo.startAt) {
    const startTime = new Date(promo.startAt).getTime();
    if (!isNaN(startTime) && now < startTime) return false;
  }

  if (promo.endAt) {
    const endTime = new Date(promo.endAt).getTime();
    if (!isNaN(endTime) && now > endTime) return false;
  }

  return true;
}

/**
 * Query function to retrieve active hero promotions sorted by display order.
 */
export function getHeroPromotions(): HeroPromotion[] {
  const activePromos = DEFAULT_HERO_PROMOTIONS
    .filter(isPromotionValid)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return activePromos.length > 0 ? activePromos : DEFAULT_HERO_PROMOTIONS;
}

/**
 * Query function to retrieve newest products sorted by creation/addition timestamp.
 * Uses real product timestamp (createdAt / addedAt / publishedAt) or isNew flag.
 */
export function getNewArrivals(limit = 16): Product[] {
  const allProducts = productsData as Product[];

  const hasDateFields = allProducts.some((p) => p.createdAt || p.addedAt || p.publishedAt);

  if (hasDateFields) {
    return [...allProducts]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.addedAt || a.publishedAt || 0).getTime();
        const dateB = new Date(b.createdAt || b.addedAt || b.publishedAt || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, limit);
  }

  const newProducts = allProducts.filter((p) => p.isNew);
  return (newProducts.length > 0 ? newProducts : allProducts).slice(0, limit);
}

/**
 * Query function to retrieve the New Arrivals banner presentation data.
 */
export function getNewArrivalsBanner(): HeroSecondaryBanner {
  const customBanner = DEFAULT_SECONDARY_BANNERS.find((b) => b.type === "new-arrivals" && b.active);
  if (customBanner) return customBanner;

  return {
    id: "banner-new-arrivals-fallback",
    type: "new-arrivals",
    title: "NEW ARRIVALS",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=800",
    targetType: "featured-products",
    target: "#featured",
    active: true,
  };
}

/**
 * Shared query function for Best Deals and Limited Time Offers.
 * Ensures consistent product data across Featured Products and Hero banner.
 */
export function getLimitedTimeOffers(limit = 16): Product[] {
  const allProducts = productsData as Product[];

  // 1. Check admin-selected promotions list
  const validAdminPromotions = DEFAULT_PRODUCT_PROMOTIONS
    .filter((p) => p.type === "limited-time" && isPromotionValid(p))
    .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));

  if (validAdminPromotions.length > 0) {
    const promoProductIds = new Set(validAdminPromotions.map((p) => p.productId));
    const matchedProducts = allProducts.filter((p) => promoProductIds.has(p.id));
    if (matchedProducts.length > 0) {
      return matchedProducts.slice(0, limit);
    }
  }

  // 2. Check explicit product flag (isLimitedTimeOffer / isHot / promotionType)
  const explicitOffers = allProducts.filter(
    (p) => p.isLimitedTimeOffer || p.isHot || p.promotionType === "limited-time"
  );
  if (explicitOffers.length > 0) {
    return explicitOffers.slice(0, limit);
  }

  // Fallback: Hot products
  return allProducts.filter((p) => p.isHot).slice(0, limit);
}

/**
 * Shared alias for Best Deals to guarantee identical data source as Limited Time Offers.
 */
export function getBestDeals(limit = 16): Product[] {
  return getLimitedTimeOffers(limit);
}

/**
 * Query function to retrieve the Limited Time Offer banner presentation data.
 */
export function getLimitedTimeOfferBanner(): HeroSecondaryBanner {
  const customBanner = DEFAULT_SECONDARY_BANNERS.find((b) => b.type === "limited-time-offer" && b.active);
  if (customBanner) return customBanner;

  return {
    id: "banner-limited-time-fallback",
    type: "limited-time-offer",
    title: "LIMITED TIME OFFER",
    image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=800",
    targetType: "featured-products",
    target: "#featured",
    active: true,
  };
}

/**
 * Smooth action handler for CTA button and promotional banner clicks.
 */
export function handlePromotionalClick(
  e: React.MouseEvent,
  action: "featured-products" | "category" | "product" | "url",
  target?: string
) {
  if (action === "featured-products" || target === "#featured") {
    e.preventDefault();
    const featuredEl = document.getElementById("featured");
    if (featuredEl) {
      featuredEl.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.hash = "featured";
    }
    return;
  }

  if (action === "category" && target) {
    e.preventDefault();
    const cleanId = target.startsWith("#") ? target.substring(1) : target;
    const catEl = document.getElementById(cleanId);
    if (catEl) {
      catEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return;
  }
}
