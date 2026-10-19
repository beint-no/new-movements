// Interface copy is written in both languages where it is rendered, with `translator`.
// Replacing English phrases in the finished document is not an option: it produced
// "Herreu" from "Menu" and "Materialeer" from "Materials", it could not reach long-form
// page copy, and it left half-translated sentences such as "Oppdag the design".
export function isNorwegian(locale = "") {
  return /^(?:nb|no|nn)(?:-|$)/i.test(String(locale));
}

export function isGerman(locale = "") {
  return /^de(?:-|$)/i.test(String(locale));
}

export function translator(locale) {
  const norwegian = isNorwegian(locale);
  return (en, nb, de) => (isGerman(locale) && de !== undefined ? de : norwegian && nb !== undefined ? nb : en);
}

// Catalog taxonomy comes from ReAI in English only: categories, attributes, option names
// and product types are one shared, machine-readable vocabulary. The storefront owns their
// Norwegian display labels, as whole labels first and single words as a fallback.
const TAXONOMY_LABELS = new Map([
  ["Color", "Farge"], ["Colour", "Farge"], ["Pattern", "Mønster"],
  ["Footwear material", "Materiale"], ["Shoe features", "Egenskaper"],
  ["Olive Green", "Olivengrønn"], ["Camel Brown", "Kamelbrun"], ["Macchiato Brown", "Macchiatobrun"],
  ["Grape Grey", "Drueblå"], ["Mustard Yellow", "Sennepsgul"], ["Night Blue", "Nattblå"],
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

const GERMAN_LABELS = new Map([["Color","Farbe"],["Colour","Farbe"],["Pattern","Muster"],["Footwear material","Material"],["Shoe features","Eigenschaften"],["Olive Green","Olivgrün"],["Camel Brown","Kamelbraun"],["Macchiato Brown","Macchiatobraun"],["Grape Grey","Traubengrau"],["Mustard Yellow","Senfgelb"],["Night Blue","Nachtblau"],["Navy","Marineblau"],["Silver","Silber"],["Yellow","Gelb"],["Gold","Gold"],["Rubberized textile","Gummiertes Textil"],["Technical textile","Technisches Textil"],["Suede","Veloursleder"],["Synthetic","Synthetik"],["Rubber","Gummi"],["Breathable design","Atmungsaktives Design"],["Vegan friendly","Veganfreundlich"],["Recycled materials","Recycelte Materialien"],["Slip resistant","Rutschfest"],["Sustainable sourcing","Nachhaltige Beschaffung"],["Waterproof","Wasserdicht"],["Water resistant","Wasserabweisend"],["Eco friendly","Umweltfreundlich"],["Cushioned","Gedämpft"],["Lightweight","Leicht"],["Insulated","Isoliert"],["Shoe Care","Schuhpflege"],["Shoe Accessories","Schuhzubehör"],["Sneaker","Sneaker"],["Shoes","Schuhe"],["Shoe","Schuh"],["White","Weiß"],["Black","Schwarz"],["Grey","Grau"],["Gray","Grau"],["Olive","Olive"],["Brown","Braun"],["Blue","Blau"],["Green","Grün"],["Orange","Orange"],["Pink","Rosa"],["Forest","Waldgrün"],["Nordic","Nordisch"],["Dark","Dunkel"],["Full","Ganz"],["Natural","Natur"],["Sand","Sand"],["Camel","Kamel"],["Burgundy","Burgunder"],["Earth","Erde"],["Turquoise","Türkis"],["Wool","Wolle"],["Leather","Leder"],["Technical","Technisch"],["Textile","Textil"],["Nubuck","Nubuk"],["Smooth","Glatt"],["Beige","Beige"],["Certified","Zertifiziert"],["Care","Pflege"],["Insole","Einlegesohle"],["Insoles","Einlegesohlen"],["Spray","Spray"],["Cleaner","Reiniger"],["Wax","Wachs"],["Boots","Boots"],["Boot","Boot"],["Sandals","Sandalen"],["Sandal","Sandale"],["Loafer","Loafer"],["Low","Niedrig"],["Size","Größe"],["Material","Material"]]);

export function translateProductTitle(title, locale) {
  if (title == null) return title;
  if (isGerman(locale)) return String(title).replace(/\b[A-Za-z]+\b/g, word => GERMAN_LABELS.get(word) || word);
  if (!isNorwegian(locale)) return title;
  return String(title).replace(/\b[A-Za-z]+\b/g, (word) => PRODUCT_WORDS.get(word) || word);
}

export function taxonomyLabel(label, locale) {
  if (label == null) return label;
  if (isGerman(locale)) return GERMAN_LABELS.get(String(label).trim()) || translateProductTitle(label, locale);
  if (!isNorwegian(locale)) return label;
  return TAXONOMY_LABELS.get(String(label).trim()) || translateProductTitle(label, locale);
}

export function localizeStorefront(store, locale) {
  if ((!isNorwegian(locale) && !isGerman(locale)) || !store) return store;
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
          displayName: isGerman(locale) ? GERMAN_LABELS.get(option.name) || option.name : OPTION_NAMES.get(option.name) || option.name,
          value: taxonomyLabel(option.value, locale),
        })),
      })),
      attributes: (product.attributes || []).map((attribute) => ({
        ...attribute,
        displayName: taxonomyLabel(attribute.name, locale),
        values: (attribute.values || []).map((value) => ({
          ...value,
          label: taxonomyLabel(value.label, locale),
          // Filter facets label themselves from the taxonomy value when a product carries one,
          // so its name needs the same treatment. The ids that drive filtering are untouched.
          taxonomyValues: (value.taxonomyValues || []).map((taxonomyValue) => ({
            ...taxonomyValue,
            name: taxonomyLabel(taxonomyValue.name, locale),
          })),
        })),
      })),
    })),
    collections: store.collections || [],
  };
}
