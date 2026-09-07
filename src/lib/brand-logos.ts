/**
 * Global Brand Logo Dictionary & Resolution Utilities
 * Maps brand names and slugs to verified static logo assets.
 */

export const BRAND_LOGO_MAP: Record<string, string> = {
  "ayaan": "/logo.png",
  "ayaan clothing": "/logo.png",
  "ayc": "/logo.png",
  "nike": "/brands/nike.svg",
  "adidas": "/brands/adidas.svg",
  "under armour": "/brands/under-armour.svg",
  "under-armour": "/brands/under-armour.svg",
  "new balance": "/brands/new-balance.svg",
  "new-balance": "/brands/new-balance.svg",
  "levi's": "/brands/levis.png",
  "levis": "/brands/levis.png",
  "hugo boss": "/brands/hugo-boss.png",
  "hugo-boss": "/brands/hugo-boss.png",
  "boss": "/brands/hugo-boss.png",
  "walmart": "/brands/walmart.png",
  "uniqlo": "/brands/uniqlo.png",
  "ralph lauren": "/brands/ralph-lauren.png",
  "ralph-lauren": "/brands/ralph-lauren.png",
  "polo ralph lauren": "/brands/ralph-lauren.png",
  "puma": "/brands/puma.png",
  "calvin klein": "/brands/calvin-klein.png",
  "calvin-klein": "/brands/calvin-klein.png",
  "ck": "/brands/calvin-klein.png",
  "decathlon": "/brands/decathlon.png",
  "zara": "/brands/zara.png",
  "u.s. polo assn.": "/brands/us-polo-assn.png",
  "u.s. polo assn": "/brands/us-polo-assn.png",
  "us polo assn": "/brands/us-polo-assn.png",
  "us-polo-assn": "/brands/us-polo-assn.png",
  "tommy hilfiger": "/brands/tommy-hilfiger.png",
  "tommy-hilfiger": "/brands/tommy-hilfiger.png",
  "armani exchange": "/brands/armani-exchange.png",
  "armani-exchange": "/brands/armani-exchange.png",
  "a|x": "/brands/armani-exchange.png",
  "united colors of benetton": "/brands/united-colors-of-benetton.png",
  "united-colors-of-benetton": "/brands/united-colors-of-benetton.png",
  "benetton": "/brands/united-colors-of-benetton.png",
  "banana republic": "/brands/banana-republic.png",
  "banana-republic": "/brands/banana-republic.png",
  "5.11": "/brands/5-11.png",
  "5-11": "/brands/5-11.png",
  "jack wolfskin": "/brands/jack-wolfskin.png",
  "jack-wolfskin": "/brands/jack-wolfskin.png",
  "diesel": "/brands/diesel.png",
  "fila": "/brands/fila.png",
  "m&s": "/brands/m-and-s.png",
  "m-and-s": "/brands/m-and-s.png",
  "marks & spencer": "/brands/m-and-s.png",
  "esmara": "/brands/esmara.png",
  "timberland": "/brands/timberland.png",
  "g-star raw": "/brands/g-star-raw.png",
  "g-star-raw": "/brands/g-star-raw.png",
  "g star raw": "/brands/g-star-raw.png",
  "mango": "/brands/mango.png",
  "next": "/brands/next.png",
  "esprit": "/brands/esprit.png",
  "patagonia": "/brands/patagonia.png",
  "lee": "/brands/lee.png",
  "guess": "/brands/guess.png",
  "h&m": "/brands/hm.png",
  "hm": "/brands/hm.png",
  "ovs": "/brands/ovs.png",
  "the north face": "/brands/the-north-face.png",
  "the-north-face": "/brands/the-north-face.png",
  "north face": "/brands/the-north-face.png",
  "columbia": "/brands/columbia.png",
  "jack & jones": "/brands/jack-and-jones.png",
  "jack-and-jones": "/brands/jack-and-jones.png",
  "jack and jones": "/brands/jack-and-jones.png",
  "primark": "/brands/primark.png",
  "arc'teryx": "/brands/arcteryx.png",
  "arcteryx": "/brands/arcteryx.png",
  "carhartt": "/brands/carhartt.png",
  "kappa": "/brands/kappa.png",
  "pvh": "/brands/pvh.png",
  "salomon": "/brands/salomon.png",
};

/**
 * Resolves the authentic brand logo asset path for a given brand name and explicit logo.
 */
export function getBrandLogoUrl(brandName?: string, explicitLogo?: string): string | null {
  if (explicitLogo && explicitLogo.trim() !== "" && !explicitLogo.includes("placeholder")) {
    return explicitLogo;
  }
  if (!brandName) return null;
  const key = brandName.toLowerCase().trim();
  if (BRAND_LOGO_MAP[key]) {
    return BRAND_LOGO_MAP[key];
  }
  const slug = key.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (BRAND_LOGO_MAP[slug]) {
    return BRAND_LOGO_MAP[slug];
  }
  return null;
}
