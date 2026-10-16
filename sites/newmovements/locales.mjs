// Interface copy is written in both languages where it is rendered, with `translator`.
// Replacing English phrases in the finished document is not an option: it produced
// "Herreu" from "Menu" and "Materialeer" from "Materials", it could not reach long-form
// page copy, and it left half-translated sentences such as "Oppdag the design".
export function isNorwegian(locale = "") {
  return /^(?:nb|no|nn)(?:-|$)/i.test(String(locale));
}

export function translator(locale) {
  const norwegian = isNorwegian(locale);
  return (en, nb) => (norwegian && nb !== undefined ? nb : en);
}

// Catalog taxonomy comes from ReAI in English only: categories, attributes, option names
// and product types are one shared, machine-readable vocabulary. The storefront owns their
// Norwegian display labels, as whole labels first and single words as a fallback.
const TAXONOMY_LABELS = new Map([
  ["Color", "Farge"], ["Colour", "Farge"], ["Pattern", "Mønster"],
  ["Footwear material", "Materiale"], ["Shoe features", "Egenskaper"],
  ["Olive Green", "Olivengrønn"], ["Camel Brown", "Kamelbrun"], ["Macchiato Brown", "Macchiatobrun"],
  ["Navy", "Marineblå"], ["Silver", "Sølv"], ["Yellow", "Gul"], ["Gold", "Gull"],
  ["Rubberized textile", "Gummiert tekstil"], ["Technical textile", "Teknisk tekstil"],
  ["Suede", "Semsket skinn"], ["Synthetic", "Syntetisk"], ["Rubber", "Gummi"],
  ["Breathable design", "Pustende design"], ["Vegan friendly", "Veganvennlig"],
  ["Recycled materials", "Resirkulerte materialer"], ["Slip resistant", "Sklisikker"],
  ["Sustainable sourcing", "Bærekraftige råvarer"], ["Waterproof", "Vanntett"],
  ["Water resistant", "Vannavvisende"], ["Eco friendly", "Miljøvennlig"],
  ["Cushioned", "Dempet"], ["Lightweight", "Lett"], ["Insulated", "Isolert"],
  ["Shoe Care", "Skopleie"], ["Shoe Accessories", "Skotilbehør"], ["Sneaker", "Sneakers"],
  ["Shoes", "Sko"], ["Shoe", "Sko"],
]);

const PRODUCT_WORDS = new Map([
  ["White", "Hvit"], ["Black", "Svart"], ["Grey", "Grå"], ["Gray", "Grå"],
  ["Olive", "Oliven"], ["Brown", "Brun"], ["Blue", "Blå"], ["Green", "Grønn"],
  ["Orange", "Oransje"], ["Pink", "Rosa"], ["Forest", "Skoggrønn"], ["Nordic", "Nordisk"],
  ["Dark", "Mørk"], ["Full", "Hel"], ["Natural", "Natur"], ["Sand", "Sand"],
  ["Camel", "Kamel"], ["Burgundy", "Burgunder"], ["Earth", "Jord"], ["Turquoise", "Turkis"],
  ["Wool", "Ull"], ["Leather", "Skinn"], ["Technical", "Teknisk"], ["Textile", "Tekstil"],
  ["Nubuck", "Nubuck"], ["Smooth", "Glatt"], ["Beige", "Beige"], ["Gold", "Gull"],
  ["Certified", "Sertifisert"], ["Shoe", "Sko"], ["Shoes", "Sko"], ["Care", "Pleie"],
  ["Insole", "Såle"], ["Insoles", "Såler"], ["Spray", "Spray"], ["Cleaner", "Rengjøring"],
  ["Wax", "Voks"], ["Boots", "Boots"], ["Boot", "Boots"], ["Sneaker", "Sneakers"],
  ["Sandals", "Sandaler"], ["Sandal", "Sandal"], ["Loafer", "Loafer"], ["Low", "Lav"],
]);

const OPTION_NAMES = new Map([
  ["Size", "Størrelse"],
  ["Color", "Farge"],
  ["Colour", "Farge"],
  ["Material", "Materiale"],
]);

export function translateProductTitle(title, locale) {
  if (title == null || !isNorwegian(locale)) return title;
  return String(title).replace(/\b[A-Za-z]+\b/g, (word) => PRODUCT_WORDS.get(word) || word);
}

export function taxonomyLabel(label, locale) {
  if (label == null || !isNorwegian(locale)) return label;
  return TAXONOMY_LABELS.get(String(label).trim()) || translateProductTitle(label, locale);
}

export function localizeStorefront(store, locale) {
  if (!isNorwegian(locale) || !store) return store;
  return {
    ...store,
    products: (store.products || []).map((product) => ({
      ...product,
      // Names, descriptions and alt text are translated in ReAI and delivered per locale;
      // only the shared taxonomy labels below are localized here.
      // Keep canonical taxonomy values stable for filtering, search and API
      // consumers. Display labels are localized separately.
      displayProductType: taxonomyLabel(product.productType, locale),
      displayMaterial: taxonomyLabel(product.material, locale),
      variants: (product.variants || []).map((variant) => ({
        ...variant,
        options: (variant.options || []).map((option) => ({
          ...option,
          // Keep canonical option names for filtering, variant matching, and
          // cart payloads. Consumers can use displayName for localized UI.
          displayName: OPTION_NAMES.get(option.name) || option.name,
          value: taxonomyLabel(option.value, locale),
        })),
      })),
      attributes: (product.attributes || []).map((attribute) => ({
        ...attribute,
        displayName: taxonomyLabel(attribute.name, locale),
        values: (attribute.values || []).map((value) => ({
          ...value,
          label: taxonomyLabel(value.label, locale),
        })),
      })),
    })),
    collections: store.collections || [],
  };
}
