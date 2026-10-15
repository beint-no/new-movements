import { isNorwegian, translateProductTitle } from "./locales.mjs";

export const isFootwearProduct = (product) => (product.variants || []).some((variant) =>
  (variant.options || []).some((option) => /size/i.test(option.name) && /^\d+(?:\.\d+)?$/.test(option.value)));

const NORWEGIAN_META_TITLES = new Map([
  ["Women’s & Men’s Shoes", "Dame- og herresko"],
  ["Shoe Collections", "Skokolleksjoner"],
  ["Our Shoemaking Story", "Historien om skomakertradisjonen vår"],
  ["Circular Shoes & Our Philosophy", "Sirkulære sko og vår filosofi"],
  ["Shoe Recycling Programme", "Resirkulering av sko"],
  ["Shoe Materials & Care", "Skopleie og materialer"],
  ["Shoe Care Guide", "Skopleieguide"],
  ["Shoe Design, Craft & Circularity Stories", "Historier om skodesign, håndverk og sirkularitet"],
  ["Your Shopping Bag", "Handlekurven din"],
  ["Search Shoes", "Søk etter sko"],
  ["Women’s Shoe Search", "Søk etter damesko"],
  ["Men’s Shoe Search", "Søk etter herresko"],
  ["Thank You for Your Order", "Takk for bestillingen"],
  ["Shoe Size Guide – EU, US & UK", "Størrelsesguide for sko – EU, US og UK"],
  ["Page Not Found", "Siden ble ikke funnet"],
  ["Shoe Store Temporarily Unavailable", "Skobutikken er midlertidig utilgjengelig"],
  ["Contact Our Oslo Shoe Store", "Kontakt skobutikken vår i Oslo"],
  ["Shoe Returns & Exchanges", "Retur og bytte av sko"],
  ["Gift Card Help", "Hjelp med gavekort"],
  ["Join Our Community", "Bli med i fellesskapet vårt"],
  ["Career Opportunities", "Jobbmuligheter"],
  ["Shoe Warranty Policy", "Garantivilkår for sko"],
  ["Delivery & Shipping Policy", "Leverings- og fraktvilkår"],
  ["Privacy Policy", "Personvernerklæring"],
  ["Refund Policy", "Refusjon og retur"],
  ["Terms & Conditions", "Vilkår og betingelser"],
  ["Our Shoes in Finansavisen", "New Movements i Finansavisen"],
  ["Circular Shoe Research with SINTEF", "Sirkulær skoforskning med SINTEF"],
  ["Zen Sneakers: Design & Materials", "Zen-sneakers: design og materialer"],
  ["NM Loafer: A Modern Classic", "NM Loafer: en moderne klassiker"],
  ["Our Flagship Shoe Store in Oslo", "New Movements’ flaggskipbutikk i Oslo"],
  ["A Shoemaker’s Update from Martin Evensen", "En oppdatering fra skomaker Martin Evensen"],
  ["Introducing the Allrounder Sneaker", "Møt Allrounder-sneakeren"],
  ["Circular Shoe Design & Recycling", "Sirkulært skodesign og resirkulering"],
  ["Sneakers, Materials & Everyday Style", "Sneakers, materialer og hverdagsstil"],
]);

export function localizeMetaTitle(title, locale) {
  if (!isNorwegian(locale)) return title;
  const value = String(title || "").replace(/\s*\|\s*New Movements\s*$/i, "");
  return NORWEGIAN_META_TITLES.get(value) || translateProductTitle(value, locale);
}

// Use the published product name and colour: imported SEO titles may be truncated,
// repeated across colours, or describe an earlier version of the material.
export function productMetaTitle(product, view = "", locale = "en") {
  const name = product.title.trim();
  const footwear = isFootwearProduct(product);
  const category = /\b(?:shoe|sneaker|boot|loafer|sandal)s?\b/i.test(name) || /gift card|insole/i.test(name) ? ""
    : !footwear ? " for Shoes"
    : /^(?:allrounder|classic|original|zen)\b/i.test(name) ? " Sneakers" : " Shoes";
  const audience = footwear && view === "women" ? (isNorwegian(locale) ? "Dame" : "Women's ") : footwear && view === "men" ? (isNorwegian(locale) ? "Herre" : "Men's ") : "";
  if (isNorwegian(locale)) {
    const norwegianCategory = !category ? "" : category === " for Shoes" ? " for sko" : category === " Sneakers" ? " sneakers" : " sko";
    return `${audience ? `${audience} ` : ""}${name}${norwegianCategory}`.trim();
  }
  return `${audience}${name}${category}`;
}

export function collectionMetaTitle(title, view = "", locale = "en") {
  if (isNorwegian(locale)) {
    const normalized = String(title || "").trim();
    if (/^(?:women|dame)$/i.test(normalized)) return "Damesko";
    if (/^(?:men|herre)$/i.test(normalized)) return "Herresko";
    return translateProductTitle(normalized, locale);
  }
  let label = title.replace(/^(women|men)$/i, (gender) => `${gender.toLowerCase() === "women" ? "Women's" : "Men's"} Shoes`);
  if (!/\b(?:shoe|sneaker|boot|loafer|sandal|gift card)s?\b/i.test(label)) {
    label += /^(?:allrounder|classic|original|zen)\b/i.test(label) ? " Sneakers" : " Shoes";
  }
  const audience = view === "women" ? "Women's" : view === "men" ? "Men's" : "";
  return audience && !label.startsWith(audience) && !/gift card|shoe care/i.test(label) ? `${audience} ${label}` : label;
}

export function metaDescription(text, limit = 160) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  const excerpt = clean.slice(0, limit - 1);
  const sentence = excerpt.match(/^.*[.!?](?=\s|$)/)?.[0];
  if (sentence && sentence.length >= 40) return sentence;
  return `${excerpt.slice(0, excerpt.lastIndexOf(" ")).replace(/[,;:–—-]+$/, "")}…`;
}
