import { MetadataRoute } from "next";
import { getProducts } from "@/lib/services/products";


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ayaan-clothing.vercel.app";
  const now = new Date();

  // Static Public Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/rfq`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Category search routes
  const categories = [
    "tops",
    "bottoms",
    "outerwear",
    "hoodies",
    "t-shirts",
    "pants",
    "jackets",
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/search?category=${encodeURIComponent(cat)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Audience search routes
  const audiences = ["MEN", "WOMEN", "BOYS", "GIRLS", "UNISEX"];
  const audienceRoutes: MetadataRoute.Sitemap = audiences.map((aud) => ({
    url: `${baseUrl}/search?audience=${encodeURIComponent(aud)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Dynamic Product Pages
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getProducts();
    if (products && Array.isArray(products)) {
      productRoutes = products.map((p) => ({
        url: `${baseUrl}/products/${p.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      }));
    }
  } catch (err) {
    console.warn("Sitemap product fetch notice:", err);
  }


  return [...staticRoutes, ...categoryRoutes, ...audienceRoutes, ...productRoutes];
}
