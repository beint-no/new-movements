export const isFootwearProduct = (product) => (product.variants || []).some((variant) =>
  (variant.options || []).some((option) => /size/i.test(option.name) && /^\d+(?:\.\d+)?$/.test(option.value)));

// Use the published product name and colour: imported SEO titles may be truncated,
// repeated across colours, or describe an earlier version of the material.
export function productMetaTitle(product, view = "") {
  const name = product.title.trim();
  const footwear = isFootwearProduct(product);
  const category = /\b(?:shoe|sneaker|boot|loafer|sandal)s?\b/i.test(name) || /gift card|insole/i.test(name) ? ""
    : !footwear ? " for Shoes"
    : /^(?:allrounder|classic|original|zen)\b/i.test(name) ? " Sneakers" : " Shoes";
  const audience = footwear && view === "women" ? "Women's " : footwear && view === "men" ? "Men's " : "";
  return `${audience}${name}${category}`;
}

export function collectionMetaTitle(title, view = "") {
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
