const NB = [
  ["Taxes &amp; duties included. Free delivery.", "Avgifter og toll inkludert. Gratis levering."],
  ["Crafted through generations", "Skapt gjennom generasjoner"],
  ["Shop women's", "Handle dame"],
  ["Shop men's", "Handle herre"],
  ["Fourth generation shoemaker", "Fjerde generasjon skomaker"],
  ["Read the Evensen story", "Les historien om Evensen"],
  ["Designed in Oslo", "Designet i Oslo"],
  ["Handcrafted in Portugal", "Håndlaget i Portugal"],
  ["Premium materials", "Førsteklasses materialer"],
  ["Built to last, and to be recycled", "Laget for å vare og gjenvinnes"],
  ["Shop now", "Handle nå"],
  ["Flagship store in Oslo", "Flaggskipbutikk i Oslo"],
  ["Get directions", "Finn veien"],
  ["Get in touch", "Ta kontakt"],
  ["Autumn / Winter", "Høst / vinter"],
  ["Made for colder days", "Laget for kaldere dager"],
  ["Explore boots", "Se boots"],
  ["Explore women’s shoes", "Se damesko"],
  ["Explore men’s shoes", "Se herresko"],
  ["Shoes for every season", "Sko for alle sesonger"],
  ["All collections", "Alle kolleksjoner"],
  ["Women", "Dame"],
  ["Men", "Herre"],
  ["New arrivals", "Nyheter"],
  ["Sneakers", "Sneakers"],
  ["Loafers", "Loafers"],
  ["Boots", "Boots"],
  ["All shoes", "Alle sko"],
  ["All shoes (Unisex)", "Alle sko"],
  ["Spring &amp; summer", "Vår og sommer"],
  ["Discover", "Oppdag"],
  ["Gift card", "Gavekort"],
  ["Shoe care", "Skopleie"],
  ["20% Recycle", "20 % resirkulering"],
  ["Our story", "Vår historie"],
  ["Our Story", "Vår historie"],
  ["Our philosophy", "Vår filosofi"],
  ["Our Philosophy", "Vår filosofi"],
  ["Materials &amp; production", "Materialer og produksjon"],
  ["Materials", "Materialer"],
  ["Journal", "Journal"],
  ["Shop", "Handle"],
  ["About", "Om oss"],
  ["Join", "Bli med"],
  ["Search", "Søk"],
  ["Close search", "Lukk søk"],
  ["Close", "Lukk"],
  ["Search shoes, styles, materials", "Søk etter sko, stiler og materialer"],
  ["View all", "Se alle"],
  ["Start typing to search the live catalog.", "Skriv for å søke i den oppdaterte katalogen."],
  ["Your bag", "Handlekurven din"],
  ["Edit bag &amp; quantities ↗", "Rediger handlekurv og antall ↗"],
  ["Check out", "Gå til kassen"],
  ["Take care of your shoes", "Ta vare på skoene dine"],
  ["Size", "Størrelse"],
  ["Add to cart", "Legg i handlekurv"],
  ["Choose", "Velg"],
  ["Add", "Legg til"],
  ["Select your size", "Velg størrelse"],
  ["Choose an option", "Velg et alternativ"],
  ["Sold out", "Utsolgt"],
  ["Check availability", "Sjekk tilgjengelighet"],
  ["Notify me when my size is back", "Varsle meg når størrelsen er tilbake"],
  ["Email address", "E-postadresse"],
  ["Notify me", "Varsle meg"],
  ["One notification for this item and size. Requests expire after 180 days. ", "Én varsling for dette produktet og størrelsen. Forespørsler utløper etter 180 dager. "],
  ["Privacy policy", "Personvernerklæring"],
  ["Free delivery · Taxes &amp; duties included", "Gratis levering · Avgifter og toll inkludert"],
  ["Free returns within 30 days · Free exchanges ↗", "Gratis retur innen 30 dager · Gratis bytte ↗"],
  ["You may also like", "Du vil kanskje også like"],
  ["Shipping &amp; Delivery", "Frakt og levering"],
  ["Returns &amp; Exchanges", "Retur og bytte"],
  ["Details", "Detaljer"],
  ["Features", "Egenskaper"],
  ["Materials &amp; care", "Materialer og pleie"],
  ["Care guide ↗", "Pleieguide ↗"],
  ["Continue shopping", "Fortsett å handle"],
  ["Page not found", "Siden ble ikke funnet"],
  ["The page may have moved, or the product is no longer published.", "Siden kan ha blitt flyttet, eller produktet er ikke lenger publisert."],
  ["We’ll be right back", "Vi er snart tilbake"],
  ["We could not load the live catalog. Please try again shortly.", "Vi klarte ikke å laste katalogen. Prøv igjen om litt."],
  ["Our collections", "Våre kolleksjoner"],
  ["No collections are published yet.", "Ingen kolleksjoner er publisert ennå."],
  ["Filter", "Filtrer"],
  ["Filters", "Filtre"],
  ["Clear all", "Nullstill alle"],
  ["Close filters", "Lukk filtre"],
  ["Include sold-out sizes", "Ta med utsolgte størrelser"],
  ["Apply filters", "Bruk filtre"],
  ["items", "produkter"],
  ["No products match those filters. Try another size or clear the filters.", "Ingen produkter passer filtrene. Prøv en annen størrelse eller nullstill filtrene."],
  ["Search products", "Søk etter produkter"],
  ["Order summary", "Ordreoversikt"],
  ["Subtotal", "Delsum"],
  ["Secure checkout", "Sikker betaling"],
  ["Order confirmed", "Ordre bekreftet"],
  ["Thank you.", "Takk."],
  ["Your order has been received. Confirmation and delivery details will be sent to the email used at checkout.", "Vi har mottatt bestillingen din. Bekreftelse og leveringsdetaljer sendes til e-postadressen du brukte i kassen."],
  ["Contact us", "Kontakt oss"],
  ["Returns", "Retur"],
  ["Terms and conditions", "Vilkår"],
  ["Size guide", "Størrelsesguide"],
  ["Newsletter", "Nyhetsbrev"],
  ["Sign up", "Meld deg på"],
  ["By signing up, you agree to receive emails from New Movements. You can unsubscribe at any time. ", "Når du melder deg på, samtykker du til å motta e-post fra New Movements. Du kan melde deg av når som helst. "],
  ["Continue reading →", "Les videre →"],
  ["Read more...", "Les mer ..."],
];

const replacements = NB.slice().sort((a, b) => b[0].length - a[0].length);

export function isNorwegian(locale = "") {
  return /^(?:nb|no|nn)(?:-|$)/i.test(String(locale));
}

export function translateStorefrontHtml(html, locale) {
  if (!isNorwegian(locale)) return html;
  return replacements.reduce((value, [from, to]) => value.replaceAll(from, to), html);
}

const PRODUCT_WORDS = new Map([
  ["White", "Hvit"], ["Black", "Sort"], ["Grey", "Grå"], ["Gray", "Grå"],
  ["Olive", "Oliven"], ["Brown", "Brun"], ["Blue", "Blå"], ["Green", "Grønn"],
  ["Orange", "Oransje"], ["Pink", "Rosa"], ["Forest", "Skoggrønn"], ["Nordic", "Nordisk"],
  ["Dark", "Mørk"], ["Full", "Hel"], ["Natural", "Natur"], ["Sand", "Sand"],
  ["Camel", "Kamel"], ["Burgundy", "Burgunder"], ["Earth", "Jord"], ["Turquoise", "Turkis"],
  ["Wool", "Ull"], ["Leather", "Skinn"], ["Technical", "Tekstil"], ["Textile", "Tekstil"],
  ["Nubuck", "Nubuck"], ["Smooth", "Glatt"], ["Beige", "Beige"], ["Gold", "Gull"],
  ["Certified", "Sertifisert"], ["Shoe", "Sko"], ["Shoes", "Sko"], ["Care", "Pleie"],
  ["Insole", "Såle"], ["Insoles", "Såler"], ["Spray", "Spray"], ["Cleaner", "Rengjøring"],
  ["Wax", "Voks"], ["Boots", "Boots"], ["Boot", "Boots"], ["Sneaker", "Sneakers"],
  ["Sandals", "Sandaler"], ["Sandal", "Sandal"], ["Loafer", "Loafer"], ["Low", "Lav"],
]);

const COLLECTION_NAMES = new Map([
  ["Accessories", "Tilbehør"],
  ["Allrounder E sneaker", "Allrounder E-sneakers"],
  ["Allrounder S sneaker", "Allrounder S-sneakers"],
  ["Allrounder series", "Allrounder-serien"],
  ["Allrounder Sneakers", "Allrounder-sneakers"],
  ["Apparel", "Klær"],
  ["Archive", "Arkiv"],
  ["Autumn & Winter", "Høst og vinter"],
  ["Classic Sneakers", "Klassiske sneakers"],
  ["Cloud Boots", "Cloud boots"],
  ["Circular Collection", "Den sirkulære kolleksjonen"],
  ["Footwear", "Fottøy"],
  ["Flow Boots", "Flow boots"],
  ["Gift Card", "Gavekort"],
  ["Lav Hikers & Loafers", "Lave hikers og loafers"],
  ["Men", "Herre"],
  ["New Arrivals", "Nyheter"],
  ["Norwegian Sneakers", "Norske sneakers"],
  ["Original sneaker", "Original-sneakers"],
  ["Shoe Care", "Skopleie"],
  ["Sko Pleie", "Skopleie"],
  ["Skinn shoes", "Skinnsko"],
  ["Space Boots", "Space boots"],
  ["Spring & Summer", "Vår og sommer"],
  ["Technical Textile Shoes", "Tekstilsko"],
  ["Tekstil Tekstil Sko", "Tekstilsko"],
  ["Top picks", "Utvalgte favoritter"],
  ["Water-resistant shoes", "Vannavvisende sko"],
  ["Waterproof shoes", "Vanntette sko"],
  ["White sneakers", "Hvite sneakers"],
  ["Women", "Dame"],
  ["Women & Men New Arrivals", "Nyheter for dame og herre"],
  ["Wool lined shoes", "Ullfôrede sko"],
  ["Zen sneaker", "Zen-sneakers"],
  ["Zipper Boots", "Boots med glidelås"],
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

export function translateCollectionTitle(title, locale) {
  if (title == null || !isNorwegian(locale)) return title;
  return COLLECTION_NAMES.get(String(title)) || translateProductTitle(title, locale);
}

export function localizeStorefront(store, locale) {
  if (!isNorwegian(locale) || !store) return store;
  return {
    ...store,
    products: (store.products || []).map((product) => ({
      ...product,
      title: translateProductTitle(product.title, locale),
      productType: translateProductTitle(product.productType, locale),
      material: translateProductTitle(product.material, locale),
      variants: (product.variants || []).map((variant) => ({
        ...variant,
        options: (variant.options || []).map((option) => ({
          ...option,
          name: OPTION_NAMES.get(option.name) || option.name,
          value: translateProductTitle(option.value, locale),
        })),
      })),
      attributes: (product.attributes || []).map((attribute) => ({
        ...attribute,
        label: translateProductTitle(attribute.label, locale),
        values: (attribute.values || []).map((value) => ({
          ...value,
          label: translateProductTitle(value.label, locale),
        })),
      })),
    })),
    collections: (store.collections || []).map((collection) => ({
      ...collection,
      title: translateCollectionTitle(collection.title, locale),
    })),
  };
}

