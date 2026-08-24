export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number;
  categoryId: string;
  images: string[];
  isNew?: boolean;
  isHot?: boolean;
  isLimitedTimeOffer?: boolean;
  promotionType?: "limited-time" | "featured" | "clearance" | string;
  sizes: string[];
  sku?: string;
  moq?: number;
  quantityStep?: number;
  availableStock?: number;
  brand?: string;
  colours?: number;
  color?: string;
  description?: string;
  createdAt?: string;
  addedAt?: string;
  publishedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
}

export type HeroCtaAction = "featured-products" | "category" | "product" | "url";

export interface HeroPromotion {
  id: string | number;
  title: string;
  subtitle: string;
  description?: string;
  eyebrow?: string;
  image: string;
  buttonText: string;
  buttonAction: HeroCtaAction;
  buttonTarget?: string;
  active: boolean;
  sortOrder: number;
  startAt?: string;
  endAt?: string;
}

export type SecondaryBannerType = "new-arrivals" | "limited-time-offer";

export interface HeroSecondaryBanner {
  id: string | number;
  type: SecondaryBannerType;
  title: string;
  subtitle?: string;
  image: string;
  targetType: "featured-products" | "category" | "product" | "url";
  target?: string;
  active: boolean;
  productId?: string;
}

export interface ProductPromotion {
  id: string;
  productId: string;
  type: "limited-time" | "featured" | "clearance";
  active: boolean;
  startAt?: string;
  endAt?: string;
  priority?: number;
  customTitle?: string;
  customSubtitle?: string;
  customImage?: string;
}
