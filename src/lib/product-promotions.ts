/**
 * Normalized Product Promotion Domain Logic
 * Single Source of Truth for promotional flags across all components.
 */

export interface ProductPromotionState {
  isNew: boolean;
  isHot: boolean;
  isLimitedDeal: boolean;
  discountPercent: number | null;
  hasPromotions: boolean;
}

export function getNormalizedPromotion(product: any): ProductPromotionState {
  if (!product) {
    return {
      isNew: false,
      isHot: false,
      isLimitedDeal: false,
      discountPercent: null,
      hasPromotions: false,
    };
  }

  const isNew = Boolean(product.isNew ?? product.is_new ?? false);
  const isHot = Boolean(product.isHot ?? product.is_hot ?? false);
  const isLimitedDeal = Boolean(product.isLimitedTimeOffer ?? product.isLimitedDeal ?? product.is_limited_deal ?? false);

  // Compute discount percentage from various product representations
  let discountPercent: number | null = null;

  if (typeof product.discount === "number" && product.discount > 0) {
    discountPercent = Math.round(product.discount);
  } else if (typeof product.discountPercentage === "number" && product.discountPercentage > 0) {
    discountPercent = Math.round(product.discountPercentage);
  } else if (typeof product.discount_percent === "number" && product.discount_percent > 0) {
    discountPercent = Math.round(product.discount_percent);
  } else {
    // Check oldPrice vs price
    const currentPrice = Number(product.price ?? product.wholesalePrice ?? 0);
    const regularPrice = Number(product.oldPrice ?? product.msrpPrice ?? product.compare_at_price_cents ? product.compare_at_price_cents / 100 : 0);

    if (regularPrice > currentPrice && currentPrice > 0) {
      const calc = Math.round(((regularPrice - currentPrice) / regularPrice) * 100);
      if (calc >= 5) {
        discountPercent = calc;
      }
    }
  }

  const hasPromotions = isNew || isHot || isLimitedDeal || (discountPercent !== null && discountPercent > 0);

  return {
    isNew,
    isHot,
    isLimitedDeal,
    discountPercent,
    hasPromotions,
  };
}
