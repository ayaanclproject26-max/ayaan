import { Product } from "@/types";

export interface AudienceCategory {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

export const AUDIENCE_CATEGORIES: AudienceCategory[] = [
  { id: "MEN", name: "MEN", slug: "men", categoryId: "c_men" },
  { id: "WOMEN", name: "WOMEN", slug: "women", categoryId: "c_women" },
  { id: "BOYS", name: "BOYS", slug: "boys", categoryId: "c_boys" },
  { id: "GIRLS", name: "GIRLS", slug: "girls", categoryId: "c_girls" },
  { id: "UNISEX", name: "UNISEX", slug: "unisex", categoryId: "c_unisex" },
];

export const PRODUCT_CATEGORIES = [
  "ALL",
  "Sweaters",
  "T-Shirts",
  "Hoodies",
  "Trousers",
  "Pants",
  "Shorts",
  "Shirts",
  "Beachwear",
  "Socks",
  "Blouse",
  "Tank Top",
  "Tops",
  "Sports",
  "Towels",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/**
 * Extracts all detailed product categories matching a given product.
 */
export function getProductCategories(product: Product): string[] {
  const name = (product.name || "").toLowerCase();
  const sku = (product.sku || "").toLowerCase();
  const cats: string[] = [];

  if (
    name.includes("sweater") ||
    name.includes("cardigan") ||
    name.includes("knit") ||
    name.includes("pullover") ||
    name.includes("turtleneck") ||
    sku.includes("-swt-")
  ) {
    cats.push("Sweaters");
  }
  if (
    name.includes("t-shirt") ||
    name.includes("tee") ||
    name.includes("graphic t-shirt") ||
    sku.includes("-tsh-")
  ) {
    cats.push("T-Shirts");
  }
  if (
    name.includes("hoodie") ||
    name.includes("sweatshirt") ||
    name.includes("fleece") ||
    sku.includes("-hd-")
  ) {
    cats.push("Hoodies");
  }
  if (
    name.includes("trouser") ||
    name.includes("chino") ||
    name.includes("sweatpants") ||
    name.includes("jogger") ||
    name.includes("leggings") ||
    name.includes("tights") ||
    sku.includes("-trs-")
  ) {
    cats.push("Trousers");
  }
  if (
    name.includes("pants") ||
    name.includes("jeans") ||
    name.includes("denim") ||
    name.includes("overalls") ||
    sku.includes("-jns-") ||
    sku.includes("-trs-")
  ) {
    cats.push("Pants");
  }
  if (
    name.includes("short") ||
    name.includes("trunks") ||
    name.includes("board shorts") ||
    sku.includes("-sho-")
  ) {
    cats.push("Shorts");
  }
  if (
    name.includes("shirt") ||
    name.includes("polo") ||
    name.includes("button-down") ||
    name.includes("henley") ||
    name.includes("oxford") ||
    sku.includes("-sht-") ||
    sku.includes("-pol-")
  ) {
    cats.push("Shirts");
  }
  if (
    name.includes("swim") ||
    name.includes("swimsuit") ||
    name.includes("bikini") ||
    name.includes("beach") ||
    name.includes("trunks") ||
    name.includes("board shorts") ||
    sku.includes("-swm-")
  ) {
    cats.push("Beachwear");
  }
  if (name.includes("sock") || sku.includes("-sck-")) {
    cats.push("Socks");
  }
  if (name.includes("blouse") || name.includes("camisole") || name.includes("silk") || name.includes("satin")) {
    cats.push("Blouse");
  }
  if (name.includes("tank") || name.includes("tank top") || name.includes("camisole")) {
    cats.push("Tank Top");
  }
  if (
    name.includes("top") ||
    name.includes("tee") ||
    name.includes("t-shirt") ||
    name.includes("shirt") ||
    name.includes("blouse") ||
    name.includes("tank") ||
    name.includes("polo") ||
    name.includes("camisole") ||
    sku.includes("-tsh-") ||
    sku.includes("-sht-")
  ) {
    cats.push("Tops");
  }
  if (
    name.includes("sport") ||
    name.includes("running") ||
    name.includes("training") ||
    name.includes("performance") ||
    name.includes("athletic") ||
    name.includes("gym") ||
    name.includes("yoga") ||
    name.includes("compression") ||
    name.includes("jogger") ||
    name.includes("sweatpants") ||
    name.includes("visor") ||
    product.brand === "Nike" ||
    product.brand === "Adidas" ||
    product.brand === "Puma" ||
    product.brand === "Under Armour" ||
    product.brand === "2XU" ||
    product.brand === "Gymshark"
  ) {
    cats.push("Sports");
  }
  if (name.includes("towel") || sku.includes("-twl-")) {
    cats.push("Towels");
  }

  return cats;
}

/**
 * Filter products across brand, audience, and product categories using:
 * (Brand 1 OR Brand 2) AND (Audience 1 OR Audience 2) AND (Category 1 OR Category 2)
 */
export function filterProducts({
  products,
  brandIds = [],
  audienceIds = [],
  categoryNames = ["ALL"],
}: {
  products: Product[];
  brandIds?: string[];
  audienceIds?: string[];
  categoryNames?: string[];
}): Product[] {
  return products.filter((product) => {
    // 1. Brand match (OR inside group)
    const brandOk =
      brandIds.length === 0 ||
      brandIds.some((bId) => {
        if (!product.brand) return false;
        const pBrand = product.brand.toLowerCase().trim();
        const b = bId.toLowerCase().trim();
        return (
          pBrand === b ||
          pBrand.replace(/['’.\s-]/g, "") === b.replace(/['’.\s-]/g, "") ||
          pBrand.includes(b) ||
          b.includes(pBrand)
        );
      });

    // 2. Audience match (OR inside group)
    const audienceOk =
      audienceIds.length === 0 ||
      audienceIds.some((audId) => {
        const match = AUDIENCE_CATEGORIES.find(
          (a) => a.id === audId || a.slug === audId || a.categoryId === audId
        );
        return match ? product.categoryId === match.categoryId : false;
      });

    // 3. Category match (OR inside group, ALL = true)
    const isAll = categoryNames.length === 0 || categoryNames.includes("ALL");
    const productCats = getProductCategories(product);
    const categoryOk =
      isAll || categoryNames.some((cat) => productCats.includes(cat));

    return brandOk && audienceOk && categoryOk;
  });
}
