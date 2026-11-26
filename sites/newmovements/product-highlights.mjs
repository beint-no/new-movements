// Key benefits shown as badges under the product name and on product cards.
//
// Models opt in by their ReAI product type, and each badge is shown only when the
// product's own ReAI attributes back it up, so the site never claims more than
// the catalogue says. ReAI's shared taxonomy has no "wool lining" or "rubber sole"
// feature, so those read the footwear materials. Add a model here only after
// confirming that its wool is the lining and its rubber is the outsole.
// The merchant confirmed (2026-11-26) that every boot model except Moss is
// waterproof, wool-lined and has a rubber sole.
const BOOT_HIGHLIGHTS = Object.freeze(["waterproof", "wool-lining", "rubber-sole"]);
export const HIGHLIGHT_MODELS = Object.freeze({
  "Cloud Boot": BOOT_HIGHLIGHTS,
  "Low Cloud": BOOT_HIGHLIGHTS,
  "Flow Boot": BOOT_HIGHLIGHTS,
  "Space Boot": BOOT_HIGHLIGHTS,
  "High Space Boot": BOOT_HIGHLIGHTS,
  "Zipper Boot": BOOT_HIGHLIGHTS,
});

const ICONS = {
  "waterproof": '<path d="M12 3.5s5.5 6 5.5 10.2a5.5 5.5 0 0 1-11 0C6.5 9.5 12 3.5 12 3.5Z"/><path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5"/>',
  "wool-lining": '<circle cx="12" cy="12" r="7.5"/><path d="M6 9.5c3.5-1 8.5-.5 12 2M5.5 13c4-1 9-.3 12.5 2.2M8 18c1.5-2.5 5-4 9-3.5"/>',
  "rubber-sole": '<path d="M3.5 13.5h10.5c2.8 0 5.2-1.2 6.5-3.2l.5 3.2v2.8H3.5Z"/><path d="M6 16.3v1.6M9 16.3v1.6M12 16.3v1.6M15 16.3v1.6M18 16.3v1.6"/>',
};

const LABELS = {
  "waterproof": ["Waterproof", "Vanntett", "Wasserdicht"],
  "wool-lining": ["Wool lining", "Ullfôr", "Wollfutter"],
  "rubber-sole": ["Rubber sole", "Gummisåle", "Gummisohle"],
};

// Taxonomy value ids stay the same in every language; labels are localized.
const hasTaxonomyValue = (product, key, id) =>
  (product.attributes?.find((attribute) => attribute.key === key)?.values || [])
    .some((value) => (value.taxonomyValues || []).some((taxonomyValue) => taxonomyValue.id === id));

const BACKED_BY = {
  "waterproof": (product) => hasTaxonomyValue(product, "shoe-features", "gid://shopify/TaxonomyValue/22940"),
  "wool-lining": (product) => hasTaxonomyValue(product, "footwear-material", "gid://shopify/TaxonomyValue/17020"),
  "rubber-sole": (product) => hasTaxonomyValue(product, "footwear-material", "gid://shopify/TaxonomyValue/17014"),
};

/** Returns the highlight keys this product earns, in display order. */
export function productHighlights(product) {
  const keys = HIGHLIGHT_MODELS[product?.productType] || [];
  return keys.filter((key) => BACKED_BY[key]?.(product));
}

const label = (key, t) => t(...LABELS[key]);

/** Badges under the product name on the product page. */
export function renderProductHighlights(product, t, escapeHtml) {
  const keys = productHighlights(product);
  if (!keys.length) return "";
  return `<ul class="product-highlights" aria-label="${escapeHtml(t("Key features", "Viktige egenskaper", "Wichtige Eigenschaften"))}">${keys.map((key) => `<li><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[key]}</svg><span>${escapeHtml(label(key, t))}</span></li>`).join("")}</ul>`;
}

/** One quiet line on product cards in collections and rails. */
export function renderCardHighlights(product, t, escapeHtml) {
  const keys = productHighlights(product);
  return keys.length ? `<p class="card-highlights">${keys.map((key) => escapeHtml(label(key, t))).join(" · ")}</p>` : "";
}
