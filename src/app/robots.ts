import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ayaan-clothing.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/search",
          "/products/",
          "/rfq",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/profile",
          "/profile/*",
          "/dashboard",
          "/dashboard/*",
          "/cart",
          "/checkout",
          "/login",
          "/signup",
          "/api/*",
          "/_next/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
