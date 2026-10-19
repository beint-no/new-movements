import { isGerman, isNorwegian, translateProductTitle } from "./locales.mjs";

export const isFootwearProduct = (product) => (product.variants || []).some((variant) =>
  (variant.options || []).some((option) => /size/i.test(option.name) && /^\d+(?:\.\d+)?$/.test(option.value)));

// Static pages and the journal carry their own Norwegian titles in `content.nb.mjs`, so this
// is only the fallback for catalog titles that ReAI has no translation for.
export function localizeMetaTitle(title, locale) {
  if (!isNorwegian(locale)) return title;
  return translateProductTitle(String(title || "").replace(/\s*\|\s*New Movements\s*$/i, ""), locale);
}

// Curated ReAI metadata wins when it exists; it is already written per locale, so it is
// used verbatim apart from the brand suffix this storefront appends to every title.
export function curatedMetaTitle(entity) {
  return String(entity?.seoTitle || "").replace(/\s*\|\s*New Movements\b.*$/i, "").trim();
}

export function curatedMetaDescription(entity) {
  return String(entity?.seoDescription || "").trim();
}

// Without curated metadata, fall back to the published product name and colour: imported SEO
// titles may be truncated, repeated across colours, or describe an earlier version of the material.
export function productMetaTitle(product, view = "", locale = "en") {
  const name = product.title.trim();
  const footwear = isFootwearProduct(product);
  const category = /\b(?:shoe|sneaker|boot|loafer|sandal)s?\b/i.test(name) || /gift card|insole/i.test(name) ? ""
    : !footwear ? " for Shoes"
    : /^(?:allrounder|classic|original|zen)\b/i.test(name) ? " Sneakers" : " Shoes";
  const audience = footwear && view === "women" ? (isNorwegian(locale) ? "Dame" : "Women's ") : footwear && view === "men" ? (isNorwegian(locale) ? "Herre" : "Men's ") : "";
  if (isGerman(locale)) {
    const prefix = footwear && view === "women" ? "Damen " : footwear && view === "men" ? "Herren " : "";
    const suffix = !category ? "" : !footwear ? " für Schuhe" : category === " Sneakers" ? " Sneaker" : " Schuhe";
    return (prefix + name + suffix).trim();
  }
  if (isNorwegian(locale)) {
    const norwegianCategory = !category ? "" : category === " for Shoes" ? " for sko" : category === " Sneakers" ? " sneakers" : " sko";
    return `${audience ? `${audience} ` : ""}${name}${norwegianCategory}`.trim();
  }
  return `${audience}${name}${category}`;
}

export function collectionMetaTitle(title, view = "", locale = "en") {
  if (isGerman(locale)) {
    const label = String(title || "").trim();
    if (/^(women|damen)$/i.test(label)) return "Damenschuhe";
    if (/^(men|herren)$/i.test(label)) return "Herrenschuhe";
    return label;
  }
  if (isNorwegian(locale)) {
    const normalized = String(title || "").trim();
    if (/^(?:women|dame)$/i.test(normalized)) return "Damesko";
    if (/^(?:men|herre)$/i.test(normalized)) return "Herresko";
    if (/^all shoes$/i.test(normalized)) return "Alle sko";
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
