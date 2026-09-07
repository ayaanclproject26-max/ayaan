import { Metadata } from "next";
import { getProductBySlugOrId } from "@/lib/services/products";
import ProductDetailView from "./ProductDetailView";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ayaan-clothing.vercel.app";

  try {
    const product = await getProductBySlugOrId(slug);
    if (!product) {
      return {
        title: "Product Not Found | Ayaan Clothing",
        description: "The requested apparel catalog item could not be found.",
      };
    }

    const title = `${product.name} | ${product.brand} Wholesale & Retail`;
    const description =
      product.shortDescription ||
      product.description ||
      `Direct export wholesale ${product.name} by ${product.brand}. Premium grade apparel sourcing with fast global delivery.`;
    const image = product.images?.[0] || "/all_brand.jpeg";

    return {
      title,
      description,
      alternates: {
        canonical: `${siteUrl}/products/${product.slug}`,
      },
      openGraph: {
        title,
        description,
        url: `${siteUrl}/products/${product.slug}`,
        siteName: "Ayaan Clothing",
        images: [
          {
            url: image,
            width: 800,
            height: 1000,
            alt: product.name,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: "Product Detail | Ayaan Clothing",
      description: "Direct wholesale apparel sourcing and retail fashion.",
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ayaan-clothing.vercel.app";

  let product = null;
  try {
    product = await getProductBySlugOrId(slug);
  } catch (err) {
    console.warn("Server product fetch notice:", err);
  }

  // Schema.org Product structured data
  const jsonLdProduct = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        image: product.images || [`${siteUrl}/all_brand.jpeg`],
        description: product.description || product.shortDescription,
        sku: product.sku,
        brand: {
          "@type": "Brand",
          name: product.brand || "Ayaan",
        },
        offers: {
          "@type": "Offer",
          url: `${siteUrl}/products/${product.slug}`,
          priceCurrency: "USD",
          price: product.wholesalePrice,
          priceValidUntil: "2027-12-31",
          itemCondition: "https://schema.org/NewCondition",
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          seller: {
            "@type": "Organization",
            name: "Ayaan Clothing",
          },
        },
      }
    : null;

  const jsonLdBreadcrumb = product
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Catalog",
            item: `${siteUrl}/search`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: product.brand || "Brand",
            item: `${siteUrl}/search?brand=${encodeURIComponent(product.brand)}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: product.name,
            item: `${siteUrl}/products/${product.slug}`,
          },
        ],
      }
    : null;

  return (
    <>
      {jsonLdProduct && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProduct) }}
        />
      )}
      {jsonLdBreadcrumb && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
        />
      )}
      <ProductDetailView initialProduct={product} slug={slug} />
    </>
  );
}
