import { HeroPromotion, HeroSecondaryBanner, ProductPromotion, Product } from "@/types";
import productsData from "@/data/products.json";

/**
 * Default static seed data for hero main carousel promotions.
 * When a real database or API is connected later, this will be replaced by
 * database queries (e.g. `SELECT * FROM hero_promotions WHERE active = true ORDER BY sort_order ASC`).
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
 * In a future database, this table/collection tracks admin-selected promotions,
 * active status, and optional start/end expiration timestamps.
 */
export const DEFAULT_PRODUCT_PROMOTIONS: ProductPromotion[] = [
  {
    id: "promo-lto-001",
    productId: "prd0001",
    type: "limited-time",
    active: true,
    priority: 1,
    customTitle: "LIMITED TIME OFFER",
    customSubtitle: "Special prices on selected products.",
    customImage: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=800",
  },
];

/**
 * Default secondary banners for New Arrivals and Limited Time Offer.
 */
export const DEFAULT_SECONDARY_BANNERS: HeroSecondaryBanner[] = [
  {
    id: "banner-new-arrivals",
    type: "new-arrivals",
    title: "NEW ARRIVALS",
    subtitle: "Fresh styles just landed.",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=800",
    targetType: "featured-products",
    target: "#featured",
    active: true,
  },
  {
    id: "banner-limited-time",
    type: "limited-time-offer",
    title: "LIMITED TIME OFFER",
    subtitle: "Special prices on selected products.",
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
 * Future DB replacement: `await db.promotions.findMany({ where: { active: true } })`
 */
export function getHeroPromotions(): HeroPromotion[] {
  // Filter active and non-expired promotions, sorted by sortOrder
  const activePromos = DEFAULT_HERO_PROMOTIONS
    .filter(isPromotionValid)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return activePromos.length > 0 ? activePromos : DEFAULT_HERO_PROMOTIONS;
}

/**
 * Query function to retrieve newest products sorted by creation/addition timestamp.
 * In the future DB, sorts by `createdAt` / `addedAt` descending.
 * Fallback: Uses `isNew` boolean flag or top products.
 */
export function getNewArrivals(limit = 16): Product[] {
  const allProducts = productsData as Product[];

  // If products have real date timestamps in future DB schema, sort by date
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

  // Fallback: Products marked with isNew flag
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
    subtitle: "Fresh styles just landed.",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=800",
    targetType: "featured-products",
    target: "#featured",
    active: true,
  };
}

/**
 * Query function to retrieve admin-selected Limited Time Offer products.
 * Future DB replacement:
 * Queries promotions table where `type = 'limited-time'` AND `active = true` AND not expired,
 * then joins with the products table.
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

  // 2. Check explicit product flag (isLimitedTimeOffer / promotionType)
  const explicitOffers = allProducts.filter(
    (p) => p.isLimitedTimeOffer || p.promotionType === "limited-time"
  );
  if (explicitOffers.length > 0) {
    return explicitOffers.slice(0, limit);
  }

  // Fallback: Hot products
  return allProducts.filter((p) => p.isHot).slice(0, limit);
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
    subtitle: "Special prices on selected products.",
    image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=800",
    targetType: "featured-products",
    target: "#featured",
    active: true,
  };
}

/**
 * Smooth action handler for CTA button and promotional banner clicks.
 * Handles scrolling to '#featured' without page reloads or broken routes.
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
