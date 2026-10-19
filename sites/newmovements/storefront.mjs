import { searchProducts } from "../../packages/reai-site-client/search.mjs";
export { renderCheckoutPage } from "./checkout.mjs";
import { STORE_SCRIPT, STORE_STYLE, FAVICON_SVG, FAVICON_ICO, TOUCH_ICON } from "./dist/assets.mjs";
import { renderPaymentMarks, renderSocialLinks } from "./footer-icons.mjs";
import { CART_UPSELL_HANDLES, sortProductSizes, VIEWS, selectedView, productView, productsForView, isProductShot, viewUrl } from "./merchandising.mjs";
import { FEATURED_REVIEWS, GOOGLE_REVIEW_COUNT, GOOGLE_REVIEWS_URL } from "./reviews.mjs";
import { isFootwearProduct, productMetaTitle, collectionMetaTitle, localizeMetaTitle, metaDescription, curatedMetaTitle, curatedMetaDescription } from "./metadata.mjs";
import { canonicalPath } from "./routes.mjs";
import { renderSizeGuide, renderSizeGuideDialog, sizeChartForProduct, sizeGuideUrl } from "./size-guide.mjs";
import { renderCompactLegalFooter } from "../../packages/reai-cloudflare-storefront/footer.mjs";
import { filterCollection, parseCollectionFilters } from "../../packages/reai-site-client/filtering.mjs";
import { isGerman, isNorwegian, localizeStorefront as localizeData, translator } from "./locales.mjs";
import { CONTENT_PAGES, JOURNAL_ENTRIES, JOURNAL_PAGE, MATERIALS_PAGE, STORY_PAGE } from "./content.mjs";
import * as norwegian from "./content.nb.mjs";
import * as german from "./content.de.mjs";
import { optimizeEditorialImages } from "./editorial-images.mjs";

export const SITE_ORIGIN = "https://newmovements.com";
export const HANDLE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export { STORE_SCRIPT, STORE_STYLE };
export const localizeStorefront = (store, context = {}) => localizeData(store, context.locale || store?.locale);
// Long-form copy is written per locale in content.mjs / content.nb.mjs. A missing Norwegian
// field falls back to English rather than hiding the section.
const copyFor = (english, nb, locale, de) => (isGerman(locale) ? { ...english, ...de } : isNorwegian(locale) ? { ...english, ...nb } : english);
const BRAND_LOGO = "/brand-assets/logo.png";
const HOME_HERO_IMAGES = [
  "/brand-assets/hero-women.jpg",
  "/brand-assets/hero-men.jpg",
];
const COMMUNITY_IMAGE = "/brand-assets/community-center.jpg";
const DIRECTIONS_URL = "https://maps.app.goo.gl/JyTiyQNqa8r14vX38";

const NAV_HINTS = [
  ["new", "New arrivals"], ["sneaker", "Sneakers"], ["loafer", "Loafers"],
  ["boot", "Boots"], ["spring", "Spring & summer"], ["winter", "Autumn & winter"],
];
const NON_INDEXABLE_PATHS = new Set(["/cart", "/search", "/checkout", "/order/complete", "/404.html"]);
const STATIC_PATHS = [
  "/", "/collections", "/cart", "/search", "/pages/evensen-story", "/pages/our-philosophy",
  "/pages/recycle", "/pages/materials", "/pages/contact-us", "/pages/returns",
  "/pages/shoe-care", "/pages/gift-cards",
  "/pages/size-guide", "/pages/terms-and-conditions", "/policies/privacy-policy",
  "/pages/join", "/pages/career-opportunities", "/pages/warranty-policy",
  "/policies/refund-policy", "/policies/shipping-policy", "/order/complete", "/blogs/news",
  "/blogs/news/an-update-from-our-founder-and-designer", "/blogs/news/opening-of-our-flagship-store",
  "/blogs/news/the-nm-loafer-a-modern-classic-reimagined",
  "/blogs/news/product-story-zen-mindful-design-for-modern-movement",
  "/blogs/news/shaping-the-future-of-footwear-together-with-sintef",
  "/blogs/news/finansavisen-wrote-about-us", "/blogs/news/new-movements-sneakers-and-fashion", "/blogs/news/allrounder", "/blogs/news/circularity",
];

export const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#39;");

export const stripHtml = (value = "") => String(value)
  .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/\s+/g, " ").trim();

// Creating ICU formatters for every product/variant is expensive in a Worker.
const moneyFormatters = new Map();
export const formatMoney = (value, currency = "NOK") => {
  const digits = Number(value) % 1 ? 2 : 0;
  const key = `${currency}:${digits}`;
  if (!moneyFormatters.has(key)) moneyFormatters.set(key, new Intl.NumberFormat("en-NO", {
    style: "currency", currency, currencyDisplay: "code", maximumFractionDigits: digits,
  }));
  return moneyFormatters.get(key).format(Number(value));
};
const plainFormatters = [0, 2].map((digits) => new Intl.NumberFormat("nb-NO", { maximumFractionDigits: digits }));

export const imageCandidates = (image) => {
  if (!image) return [];
  const candidates = [...(image.renditions || []), image].filter((item) => item?.url && Number(item.width) > 0);
  return [...new Map(candidates.map((item) => [Number(item.width), item])).values()]
    .sort((left, right) => Number(left.width) - Number(right.width));
};

export const imageUrl = (image, preferredWidth = 960) => {
  const candidates = imageCandidates(image);
  return candidates.find((item) => Number(item.width) >= preferredWidth)?.url || candidates.at(-1)?.url || image?.url || "";
};

// ReAI delivers alt text per locale; this only describes an image that has none yet.
const IMAGE_VIEW_HINTS = [
  [/(?:^|[-_])side2?(?:[-_.]|$)/i, "side view", "sett fra siden", "Seitenansicht"],
  [/(?:^|[-_])front(?:[-_.]|$)/i, "front view", "sett forfra", "Vorderansicht"],
  [/(?:^|[-_])back(?:[-_.]|$)/i, "rear view", "sett bakfra", "Rückansicht"],
  [/(?:^|[-_])top(?:[-_.]|$)/i, "top view", "sett ovenfra", "Ansicht von oben"],
  [/(?:^|[-_])detail|close[-_]?up/i, "detail view", "detaljbilde", "Detailansicht"],
  [/(?:^|[-_])model|on[-_]?foot|lifestyle/i, "lifestyle view", "brukt i hverdagen", "Im Alltag getragen"],
];

export const imageAltText = (image, productTitle, index = 0, locale = "") => {
  if (image?.alt?.trim()) return image.alt.trim();
  const t = translator(locale);
  const source = String(image?.filename || image?.url || "").split("?")[0].split("/").pop() || "";
  const view = IMAGE_VIEW_HINTS.find(([pattern]) => pattern.test(source));
  const hint = view ? t(view[1], view[2], view[3]) : t(`product image ${index + 1}`, `produktbilde ${index + 1}`, "Produktbild " + (index + 1) + "");
  return `${productTitle} – ${hint}`;
};

export const responsiveImage = (image, { alt = "", width = 960, sizes = "100vw", loading, priority = false } = {}) => {
  const candidates = imageCandidates(image);
  const src = imageUrl(image, width);
  if (!src) return "";
  const srcset = candidates.map((item) => `${item.url} ${item.width}w`).join(", ");
  const intrinsicWidth = Number(image.width) > 0 ? ` width="${Number(image.width)}"` : "";
  const intrinsicHeight = Number(image.height) > 0 ? ` height="${Number(image.height)}"` : "";
  return `<picture>${srcset ? `<source type="image/avif" srcset="${escapeHtml(srcset)}" sizes="${escapeHtml(sizes)}">` : ""}<img src="${escapeHtml(src)}"${srcset ? ` srcset="${escapeHtml(srcset)}" sizes="${escapeHtml(sizes)}"` : ""} alt="${escapeHtml(alt)}"${intrinsicWidth}${intrinsicHeight}${loading ? ` loading="${loading}"` : ""}${priority ? ' fetchpriority="high"' : ""} decoding="async"></picture>`;
};

const imageSrcset = (image) => imageCandidates(image).map((item) => `${item.url} ${item.width}w`).join(", ");

export const priceRange = (variants = [], currency = "NOK", includeCurrency = true) => {
  const values = variants.map((variant) => Number(variant.price)).filter(Number.isFinite);
  const formatPrice = (value) => includeCurrency
    ? formatMoney(value, currency)
    : plainFormatters[Number(value) % 1 ? 1 : 0].format(Number(value));
  if (!values.length) return formatPrice(0);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  return minimum === maximum ? formatPrice(minimum) : `${formatPrice(minimum)} – ${formatPrice(maximum)}`;
};

export function matchRoute(pathname) {
  const path = pathname === "/index.html" ? "/" : pathname;
  if (path === "/checkout") return { type: "checkout" };
  if (path === "/") return { type: "home" };
  if (path === "/sitemap.xml") return { type: "sitemap" };
  const staticPath = path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  if (STATIC_PATHS.includes(staticPath)) return { type: "page", handle: staticPath, canonicalPath: staticPath, needsSlash: path.endsWith("/") };
  const product = path.match(/^\/products\/([^/]+)\/?$/);
  if (product) return { type: "product", handle: product[1], canonicalPath: `/products/${product[1]}`, needsSlash: path.endsWith("/"), valid: HANDLE.test(product[1]) };
  const collection = path.match(/^\/collections\/([^/]+)\/?$/);
  if (collection) return { type: "collection", handle: collection[1], canonicalPath: `/collections/${collection[1]}`, needsSlash: path.endsWith("/"), valid: collection[1] === "all" || HANDLE.test(collection[1]) };
  return null;
}

export const collectionByHandle = (store, handle) => (store?.collections || []).find((item) => item.handle === handle) || null;
export const productByHandle = (store, handle) => (store?.products || []).find((item) => item.handle === handle) || null;
export const publishedCollections = (store) => store?.collections || [];

function collectionProducts(store, collection) {
  return (collection?.products || []).map((member) => productByHandle(store, member.handle) || member).filter((item) => item?.handle);
}

function featuredCollections(store) {
  const collections = publishedCollections(store);
  const used = new Set();
  return NAV_HINTS.map(([needle, label]) => {
    const collection = collections.find((item) => !used.has(item.handle) && (item.handle.includes(needle) || item.title.toLowerCase().includes(needle)));
    if (collection) used.add(collection.handle);
    return collection ? { ...collection, label } : null;
  }).filter(Boolean);
}

function nav(store, view = "") {
  const t = translator(store?.locale);
  return [
    ["women", t("Women", "Dame", "Damen")], ["men", t("Men", "Herre", "Herren")],
    ["new-in", t("New arrivals", "Nyheter", "Neu eingetroffen")],
    ["sneakers", "Sneakers"],
    ["loafers-low-tops", "Loafers"],
    ["boots", "Boots"],
  ].map(([handle, label]) => `<a href="${viewUrl(`/collections/${handle}`, Object.hasOwn(VIEWS, handle) ? "" : view)}">${label}</a>`).join("");
}

function cartUpsells(store) {
  const t = translator(store?.locale);
  const products = CART_UPSELL_HANDLES.map((handle) => (store.products || []).find((product) => product.handle === handle))
    .filter((product) => product?.variants?.length === 1 && product.variants[0].price != null && Number.isFinite(Number(product.variants[0].price)));
  if (!products.length) return "";
  const rows = products.map((product) => {
    const variant = product.variants[0];
    const selection = {
      product: { id: product.id, handle: product.handle, title: product.title, url: `/products/${product.handle}`, image: imageUrl(product.images?.[0], 320) },
      variant: { id: variant.id, price: variant.price },
    };
    return `<label class="cart-upsell" data-cart-upsell-row><input type="checkbox" disabled data-cart-upsell="${escapeHtml(JSON.stringify(selection))}" aria-label="${escapeHtml(t(`Include ${product.title} in your bag`, `Legg ${product.title} i handlekurven`, "Füge " + (product.title) + " deiner Tasche hinzu"))}">${responsiveImage(product.images?.[0], { alt: product.title, width: 320, sizes: "80px", loading: "lazy" })}<span><span class="cart-upsell-title">${escapeHtml(product.title)}</span><span class="cart-upsell-price">${formatMoney(variant.price, store.currency || "NOK")}</span></span></label>`;
  }).join("");
  return `<section class="cart-upsells" data-cart-upsells hidden aria-labelledby="cart-upsells-heading"><h3 id="cart-upsells-heading">${t("Take care of your shoes", "Ta vare på skoene dine", "Pflege deine Schuhe")}</h3>${rows}<p class="cart-upsell-status" data-cart-upsell-status role="status"></p></section>`;
}

// Country names are shown in the shopper's language, and both the display names and the
// resolved labels are cached because a Worker renders the selector on every page.
const regionNames = new Map();
const regionLabels = new Map();
const countryNames = (language) => {
  if (!regionNames.has(language)) regionNames.set(language, new Intl.DisplayNames([language], { type: 'region' }));
  if (!regionLabels.has(language)) regionLabels.set(language, new Map());
  const labels = regionLabels.get(language);
  return { of(code) {
    if (!labels.has(code)) labels.set(code, regionNames.get(language).of(code));
    return labels.get(code);
  } };
};
function countrySelector(store) {
  const t = translator(store?.locale);
  const language = isGerman(store?.locale) ? 'de' : isNorwegian(store?.locale) ? 'nb' : 'en';
  const names = countryNames(language);
  const countries = (store.markets || [{ handle: 'default', currency: 'NOK', countries: ['NO'] }])
    .flatMap((market) => (market.countries?.length ? market.countries : ['NO']).map((code) => ({ code, name: names.of(code), currency: market.currency })))
    .sort((a, b) => a.name.localeCompare(b.name, language));
  const current = countries.find((country) => country.code === store.countryCode) || countries[0];
  const returnTo = `<input type="hidden" name="returnTo" value="${escapeHtml(store.marketReturnTo || '/')}" data-country-return>`;
  return `<div class="country-switcher"><form class="market-selector country-fallback" action="/reai/market" method="post" data-market-form>${returnTo}<label class="sr-only" for="store-country">${t('Delivery country and currency', 'Leveringsland og valuta', "Lieferland und Währung")}</label><select id="store-country" name="country" data-market-select>${countries.map((country) => `<option value="${country.code}"${country === current ? ' selected' : ''}>${escapeHtml(country.name)} · ${country.currency}</option>`).join('')}</select><noscript><button type="submit">${t('Change', 'Endre', "Ändern")}</button></noscript></form><button type="button" data-country-open hidden aria-label="${t('Delivery country', 'Leveringsland', "Lieferland")}: ${escapeHtml(current.name)} · ${current.currency}" aria-haspopup="dialog" aria-controls="country-dialog"><span class="country-name">${escapeHtml(current.name)}</span><span class="country-code">${current.code}</span><span class="country-currency"> · ${current.currency}</span><span aria-hidden="true">⌄</span></button><dialog id="country-dialog" class="country-dialog" aria-labelledby="country-dialog-title"><header><h2 id="country-dialog-title">${t('Delivery country', 'Leveringsland', "Lieferland")}</h2><button type="button" data-country-close aria-label="${t('Close country selector', 'Lukk landvelgeren', "Länderauswahl schließen")}">×</button></header><p>${t("Prices and checkout use your country's currency.", 'Priser og betaling vises i valutaen til landet ditt.', "Preise und Checkout verwenden die Währung deines Landes.")}</p><label class="sr-only" for="country-search">${t('Search countries', 'Søk etter land', "Länder suchen")}</label><input id="country-search" type="search" placeholder="${t('Search countries', 'Søk etter land', "Länder suchen")}" autocomplete="off" data-country-search><form action="/reai/market" method="post" data-market-form>${returnTo}<div class="country-options">${countries.map((country) => `<button type="submit" name="country" value="${country.code}" data-country-option data-search="${escapeHtml(`${country.name} ${country.code} ${country.currency}`.toLowerCase())}"${country === current ? ' aria-current="true"' : ''}><span>${escapeHtml(country.name)}</span><span>${country.currency}${country === current ? ' ✓' : ''}</span></button>`).join('')}</div></form><p data-country-empty hidden>${t('No countries found.', 'Fant ingen land.', "Keine Länder gefunden.")}</p></dialog></div>`;
}

function languageSwitcher(store, t) {
  const current = store.locale || "en";
  const url = new URL(store.marketReturnTo || "/", SITE_ORIGIN);
  const path = url.pathname.replace(/^\/(?:nb|de)(?=\/|$)/, "") || "/";
  url.searchParams.set("market", store.marketHandle || "default");
  if (store.countryCode) url.searchParams.set("country", store.countryCode);
  const links = [["en", "", "English"], ["nb-NO", "/nb", "Norsk"], ["de", "/de", "Deutsch"]].map(([locale, prefix, label]) => {
    const target = new URL(url);
    target.pathname = prefix + path;
    return '<a href="' + escapeHtml(target.href) + '" lang="' + locale + '" hreflang="' + locale + '"' + (current === locale ? ' aria-current="page"' : '') + '>' + label + '</a>';
  }).join("");
  return '<nav class="compact-legal-links" aria-label="' + t("Language", "Språk", "Sprache") + '">' + links + '</nav>';
}

function chrome(store, active = "") {
  store ||= {};
  const t = translator(store.locale);
  const shopUrl = (handle) => viewUrl(`/collections/${handle}`, ["women", "men", "gift-card", "shoe-care"].includes(handle) ? "" : active);
  const legal = renderCompactLegalFooter({
    owner: "New Movements – Oslo",
    refundHref: "/policies/refund-policy",
    privacyHref: "/policies/privacy-policy",
    termsHref: "/pages/terms-and-conditions",
    locale: store.locale || "en",
  });
  return {
    header: `<a class="skip-link" href="#main">${t("Skip to content", "Hopp til innhold", "Zum Inhalt springen")}</a><div class="announcement"><span aria-hidden="true">‹</span><span>${t("Taxes &amp; duties included. Free delivery.", "Avgifter og toll inkludert. Gratis levering.", "Gratis Versand · Steuern &amp; Zoll inklusive.")}</span><span aria-hidden="true">›</span></div><header class="site-header"><div class="site-nav"><div class="mobile-header-start"><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span><span class="sr-only">${t("Menu", "Meny", "Menü")}</span></button><button type="button" data-search-open aria-label="${t("Search", "Søk", "Suche")}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg></button></div><nav class="desktop-nav" aria-label="${t("Primary", "Hovedmeny", "Primär")}"><button type="button" data-mega-toggle aria-expanded="false" aria-controls="mega-menu">${t("Shop", "Handle", "Shop")}</button><a href="/pages/evensen-story" data-about-toggle aria-expanded="false" aria-controls="about-menu">${t("About", "Om oss", "Über uns")}</a><a href="/pages/join">${t("Join", "Bli med", "Anmelden")}</a></nav><a class="wordmark" href="/" aria-label="${t("New Movements home", "New Movements – hjem", "New Movements Startseite")}"><img src="${BRAND_LOGO}" alt="New Movements – Oslo" width="400" height="72"></a><nav class="utility-nav" aria-label="${t("Store utilities", "Butikkvalg", "Shop-Funktionen")}">${countrySelector(store)}<button type="button" data-search-open aria-label="${t("Search", "Søk", "Suche")}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg></button><a class="account-link" href="/pages/contact-us" aria-label="${t("Account and customer service", "Konto og kundeservice", "Konto und Kundenservice")}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="3.5"></circle><path d="M5.5 21c.5-5 2.6-7.5 6.5-7.5s6 2.5 6.5 7.5"></path></svg></a><button type="button" data-cart-open aria-label="${t("Shopping bag", "Handlekurv", "Einkaufstasche")}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 13H6L5 8Z"></path><path d="M9 8V6a3 3 0 0 1 6 0v2"></path></svg><span class="cart-badge" data-cart-count>0</span></button></nav></div><div class="mega-menu" id="mega-menu" data-mega-menu data-open="false" aria-hidden="true"><div><p>${t("Style", "Stil", "Style")}</p><a href="/collections">${t("All collections", "Alle kolleksjoner", "Alle Kollektionen")}</a><a href="/collections/women">${t("Women", "Dame", "Damen")}</a><a href="/collections/men">${t("Men", "Herre", "Herren")}</a><a href="${shopUrl("new-in")}">${t("New arrivals", "Nyheter", "Neu eingetroffen")}</a><a href="${shopUrl("sneakers")}">Sneakers</a><a href="${shopUrl("loafers-low-tops")}">Loafers</a><a href="${shopUrl("boots")}">Boots</a><a href="${shopUrl("all")}">${t("All shoes (Unisex)", "Alle sko (unisex)", "Alle Schuhe (Unisex)")}</a></div><div><p>${t("Season", "Sesong", "Saison")}</p><a href="${shopUrl("spring-summer")}">${t("Spring &amp; summer", "Vår og sommer", "Frühling &amp; Sommer")}</a><a href="${shopUrl("autumn-winter")}">${t("Autumn &amp; winter", "Høst og vinter", "Herbst &amp; Winter")}</a></div><div><p>${t("Discover", "Oppdag", "Entdecken")}</p><a href="/pages/gift-cards">${t("Gift card", "Gavekort", "Geschenkkarte")}</a><a href="${shopUrl("shoe-care")}">${t("Shoe care", "Skopleie", "Schuhpflege")}</a><a href="/pages/recycle">${t("20% Recycle", "20 % resirkulering", "20% Recycling")}</a></div><div><p>${t("About", "Om oss", "Über uns")}</p><a href="/pages/evensen-story">${t("Our story", "Vår historie", "Unsere Geschichte")}</a><a href="/pages/our-philosophy">${t("Our philosophy", "Vår filosofi", "Unsere Philosophie")}</a><a href="/pages/materials">${t("Materials &amp; production", "Materialer og produksjon", "Materialien &amp; Produktion")}</a><a href="/blogs/news">Journal</a></div></div><div class="about-menu" id="about-menu" data-about-menu data-open="false" aria-hidden="true"><nav aria-label="${t("About", "Om oss", "Über uns")}"><a href="/pages/evensen-story">${t("Our story", "Vår historie", "Unsere Geschichte")}</a><a href="/pages/our-philosophy">${t("Our philosophy", "Vår filosofi", "Unsere Philosophie")}</a><a href="/pages/recycle">${t("20% Recycle", "20 % resirkulering", "20% Recycling")}</a><a href="/pages/materials">${t("Materials", "Materialer", "Materialien")}</a><a href="/blogs/news">Journal</a></nav></div><nav class="mobile-nav" id="mobile-nav" data-mobile-nav>${nav(store, active)}<a href="${shopUrl("all")}">${t("All shoes", "Alle sko", "Alle Schuhe")}</a><a href="/pages/evensen-story">${t("Our story", "Vår historie", "Unsere Geschichte")}</a><a href="/pages/materials">${t("Materials", "Materialer", "Materialien")}</a><a href="/blogs/news">Journal</a></nav></header><div class="mega-menu-backdrop" data-mega-backdrop aria-hidden="true"></div><div class="drawer-backdrop" data-drawer-backdrop hidden></div><dialog class="store-drawer search-drawer" aria-label="${t("Search", "Søk", "Suche")}" data-search-drawer><header><h2>${t("Search", "Søk", "Suche")}</h2><button type="button" data-drawer-close aria-label="${t("Close search", "Lukk søk", "Suche schließen")}">${t("Close", "Lukk", "Schließen")}</button></header><form role="search" data-predictive-search><label class="sr-only" for="predictive-query">${t("Search products", "Søk etter produkter", "Produkte suchen")}</label><input id="predictive-query" name="q" type="search" autocomplete="off" placeholder="${t("Search shoes, styles, materials", "Søk etter sko, stiler og materialer", "Schuhe, Styles, Materialien suchen")}"><button type="submit">${t("View all", "Se alle", "Alle ansehen")}</button></form><p data-predictive-status role="status" aria-live="polite">${t("Start typing to search the live catalog.", "Skriv for å søke i den oppdaterte katalogen.", "Beginne zu tippen, um den Live-Katalog zu durchsuchen.")}</p><div class="predictive-results" data-predictive-results></div></dialog><dialog class="store-drawer cart-drawer" aria-label="${t("Shopping bag", "Handlekurv", "Einkaufstasche")}" data-cart-drawer><header><h2>${t("Your bag", "Handlekurven din", "Deine Tasche")}</h2><button type="button" data-drawer-close aria-label="${t("Close bag", "Lukk handlekurven", "Tasche schließen")}">${t("Close", "Lukk", "Schließen")}</button></header><div class="cart-drawer-content"><div data-drawer-cart-items></div><a class="bag-edit-link" href="/cart">${t("Edit bag &amp; quantities ↗", "Rediger handlekurv og antall ↗", "Tasche &amp; Mengen bearbeiten ↗")}</a>${cartUpsells(store)}</div><footer><p><span>${t("Subtotal", "Delsum", "Zwischensumme")}</span><strong data-drawer-subtotal>${escapeHtml(store.currency || "NOK")} 0</strong></p><button type="button" data-checkout-start disabled>${t("Check out", "Gå til kassen", "Zur Kasse")}</button><p class="checkout-reassurance">${t("Free delivery · Taxes &amp; duties included", "Gratis levering · Avgifter og toll inkludert", "Kostenlose Lieferung · Steuern &amp; Abgaben inbegriffen")}<br><a href="/pages/returns">${t("Free returns within 30 days", "Gratis retur innen 30 dager", "Kostenlose Rückgabe innerhalb von 30 Tagen")}</a></p><p class="checkout-error" data-checkout-error role="alert" hidden></p></footer></dialog>`,
    footer: `<footer class="site-footer"><div class="footer-grid"><div><a class="footer-wordmark" href="/"><img src="${BRAND_LOGO}" alt="New Movements – Oslo" width="400" height="72"></a>${languageSwitcher(store, t)}</div><div><h2>${t("About", "Om oss", "Über uns")}</h2><a href="/pages/contact-us">${t("Contact us", "Kontakt oss", "Kontaktiere uns")}</a><a href="/pages/recycle">${t("Recycle", "Resirkulering", "Recycling")}</a><a href="/pages/career-opportunities">${t("Careers", "Jobb hos oss", "Karriere")}</a><a href="/pages/returns">${t("Returns", "Retur", "Rückgabe")}</a><a href="/policies/privacy-policy">${t("Privacy policy", "Personvernerklæring", "Datenschutzerklärung")}</a><a href="/pages/terms-and-conditions">${t("Terms and conditions", "Vilkår og betingelser", "Allgemeine Geschäftsbedingungen")}</a><a href="/pages/size-guide">${t("Size guide", "Størrelsesguide", "Größenratgeber")}</a></div><div><h2>${t("Learn", "Lær mer", "Mehr erfahren")}</h2><a href="/pages/evensen-story">${t("Our story", "Vår historie", "Unsere Geschichte")}</a><a href="/pages/our-philosophy">${t("Our philosophy", "Vår filosofi", "Unsere Philosophie")}</a><a href="/pages/materials">${t("Materials", "Materialer", "Materialien")}</a><a href="/blogs/news">Journal</a></div><div><h2>${t("Shop", "Handle", "Shop")}</h2><a href="/collections">${t("All collections", "Alle kolleksjoner", "Alle Kollektionen")}</a>${nav(store, active)}<a href="${shopUrl("all")}">${t("All shoes", "Alle sko", "Alle Schuhe")}</a></div><div class="footer-story"><h2>${t("Our Story", "Vår historie", "Unsere Geschichte")}</h2><p>${t("New Movements builds on a family tradition that started in 1916, when Johnny Evensen set out to create quality products that could withstand the Nordic seasons and last for generations.", "New Movements bygger på en familietradisjon som begynte i 1916, da Johnny Evensen satte seg fore å lage kvalitetsprodukter som tålte de nordiske årstidene og kunne vare i generasjoner.", "New Movements baut auf einer Familientradition auf, die 1916 begann, als Johnny Evensen sich zum Ziel setzte, Qualitätsprodukte zu schaffen, die den nordischen Jahreszeiten standhalten und Generationen überdauern können.")}</p><a href="/pages/evensen-story">${t("Continue reading →", "Les videre →", "Weiterlesen →")}</a></div></div><section class="newsletter" aria-labelledby="newsletter-heading"><h2 id="newsletter-heading">${t("Join the community. Sign up for 5% off and updates on drops, products &amp; events.", "Bli med i fellesskapet. Meld deg på og få 5 % rabatt og nyheter om slipp, produkter og arrangementer.", "Werde Teil der Community. Melde dich an und erhalte 5% Rabatt sowie Updates zu Drops, Produkten &amp; Events.")}</h2><form data-newsletter-form action="/reai/newsletter/subscribe" method="post"><input type="hidden" name="consent" value="true"><input type="hidden" name="welcomeDiscount" value="true"><label class="sr-only" for="newsletter-email">${t("Email address", "E-postadresse", "E-Mail-Adresse")}</label><div><input id="newsletter-email" name="email" type="email" autocomplete="email" maxlength="254" placeholder="${t("Email address", "E-postadresse", "E-Mail-Adresse")}" required><button type="submit">${t("Sign up", "Meld deg på", "Anmelden")}</button></div><p class="newsletter-consent">${t("By signing up, you agree to receive emails from New Movements. You can unsubscribe at any time.", "Når du melder deg på, samtykker du til å motta e-post fra New Movements. Du kan melde deg av når som helst.", "Mit deiner Anmeldung erklärst du dich damit einverstanden, E-Mails von New Movements zu erhalten. Du kannst dich jederzeit abmelden.")} <a href="/policies/privacy-policy">${t("Privacy policy", "Personvernerklæring", "Datenschutzerklärung")}</a></p><p data-newsletter-status role="status" hidden></p></form></section><div class="footer-utilities">${renderPaymentMarks(!store.countryCode || store.countryCode === "NO")}${renderSocialLinks()}</div>${legal}</footer><dialog class="quick-add-modal" data-quick-add-dialog aria-labelledby="quick-add-title"><button class="quick-add-close" type="button" aria-label="${t("Close quick add", "Lukk hurtigkjøp", "Quick Add schließen")}" data-quick-add-close>×</button><div class="quick-add-layout"><div class="quick-add-media" data-quick-add-media></div><form class="quick-add-details" data-quick-add-form><a id="quick-add-title" class="quick-add-title" data-quick-add-title></a><p class="quick-add-price" data-quick-add-price></p><fieldset class="quick-add-sizes"><legend>${t("Size", "Størrelse", "Größe")}</legend><div data-quick-add-sizes></div></fieldset><p class="quick-add-status" data-quick-add-status aria-live="polite"></p><button class="quick-add-submit" type="submit" disabled data-quick-add-submit>${t("Add to cart", "Legg i handlekurv", "In den Warenkorb")}</button></form></div></dialog><div class="toast" role="status" aria-live="polite" data-cart-toast hidden></div>`,
  };
}

function documentHtml({ title, description, path, body, store, schema = "", image = "", type = "website", view = "", noindex = false, localizeTitle = true }) {
  title = `${localizeTitle ? localizeMetaTitle(title, store?.locale) : title} | New Movements`;
  description = metaDescription(description);
  const { header, footer } = chrome(store, view);
  const prefix = store?.pathPrefix || "";
  const publicPath = `${prefix}${path === "/" ? "/" : path}`;
  const canonicalUrl = new URL(publicPath, SITE_ORIGIN);
  if (store?.marketHandle && store.marketHandle !== "default") canonicalUrl.searchParams.set("market", store.marketHandle);
  const canonical = canonicalUrl.href;
  const robots = (noindex || NON_INDEXABLE_PATHS.has(path)) ? '<meta name="robots" content="noindex,follow">' : "";
  const alternateLinks = (store?.localeRoutes || []).map((route) => {
    const href = new URL(`${route.pathPrefix || ""}${path === "/" ? "/" : path}`, SITE_ORIGIN).href;
    return `<link rel="alternate" hreflang="${escapeHtml(route.locale)}" href="${escapeHtml(href)}">`;
  }).join("");
  const html = `<!doctype html><html lang="${escapeHtml(isGerman(store?.locale) ? "de" : isNorwegian(store?.locale) ? "nb" : "en")}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="theme-color" content="#ffffff">${robots}<link rel="canonical" href="${escapeHtml(canonical)}">${alternateLinks}<link rel="icon" href="${FAVICON_ICO}" sizes="16x16 32x32 48x48"><link rel="icon" href="${FAVICON_SVG}" type="image/svg+xml"><link rel="apple-touch-icon" href="${TOUCH_ICON}" sizes="180x180"><link rel="preconnect" href="https://app.reai.no" crossorigin><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:type" content="${type}">${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ""}<link rel="preload" href="/brand-assets/instrument-sans-regular.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="${STORE_STYLE}"><script type="module" src="${STORE_SCRIPT}"></script>${schema}</head><body data-view="${view}" data-market="${escapeHtml(store?.marketHandle || "default")}" data-currency="${escapeHtml(store?.currency || "NOK")}" data-path-prefix="${escapeHtml(prefix)}">${header}<main id="main">${body}</main>${footer}</body></html>`;
  // Renderers intentionally keep canonical paths and assets root-relative. The
  // shared locale router owns the public prefix, so apply it once at the
  // document boundary and keep component code locale-agnostic.
  const optimized = optimizeEditorialImages(html);
  const localized = prefix ? optimized.replace(/\b(href|action)="\/(?!\/)([^"]*)"/g, (attribute, name, path) =>
    /^(?:assets\/|brand-assets\/|favicon\.ico(?:\?|$)|apple-touch-icon\.png(?:\?|$))/.test(path)
      ? attribute : `${name}="${prefix}/${path}"`) : optimized;
  return localized;
}

function productCard(product, currency = "NOK", priority = false, includeCurrency = true, locale = "") {
  const t = translator(locale);
  product = sortProductSizes(product);
  const selectedUrl = new URL(viewUrl(`/products/${product.handle}`, product.view), SITE_ORIGIN);
  if (product.selectedVariantId) selectedUrl.searchParams.set("variant", product.selectedVariantId);
  const productUrl = selectedUrl.pathname + selectedUrl.search;
  const images = shoppingImages(product).slice(0, 3);
  const image = images[0];
  const slides = images.map((entry, index) => {
    const image = responsiveImage(entry, { alt: imageAltText(entry, product.title, index, locale), width: 640, sizes: "(max-width: 700px) 50vw, 25vw", loading: priority && index === 0 ? undefined : "lazy", priority: priority && index === 0 });
    // Opacity-hidden images still download. Templates keep alternate card
    // photos inert until the shopper hovers or uses the carousel controls.
    return `<span class="product-slide${isProductShot(entry) ? " product-shot" : ""}${index === 0 ? " is-active" : ""}" data-card-slide aria-hidden="${index === 0 ? "false" : "true"}">${index ? `<template data-card-image>${image}</template>` : image}</span>`;
  }).join("");
  const hasCarousel = images.length > 1;
  const carouselControls = hasCarousel ? `<button class="product-carousel-control product-carousel-control--previous" type="button" aria-label="${t("Previous image", "Forrige bilde", "Vorheriges Bild")}" data-card-previous><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"></path></svg></button><button class="product-carousel-control product-carousel-control--next" type="button" aria-label="${t("Next image", "Neste bilde", "Nächstes Bild")}" data-card-next><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"></path></svg></button>` : "";
  const hasSize = (product.variants || []).some((variant) => (variant.options || []).some((option) => option.name.toLowerCase().includes("size")));
  const actionLabel = hasSize ? t("Choose", "Velg", "Wählen") : t("Add", "Legg til", "Hinzufügen");
  const modalProduct = {
    id: product.id,
    handle: product.handle,
    url: productUrl,
    title: product.title,
    image: imageUrl(image, 960),
    images: images.map((entry) => imageUrl(entry, 960)),
    imageAlt: imageAltText(image, product.title, 0, locale),
    imageAlts: images.map((entry, index) => imageAltText(entry, product.title, index, locale)),
    currency,
    selectedVariantId: product.selectedVariantId,
    variants: (product.variants || []).map((variant) => ({
      id: variant.id,
      price: Number(variant.price),
      available: variant.available !== false && (variant.inventoryQuantity === undefined || Number(variant.inventoryQuantity) > 0),
      label: variant.options?.find((option) => option.name.toLowerCase().includes("size"))?.value || variant.options?.map((option) => option.value).join(" / ") || t("One size", "Én størrelse", "Einheitsgröße"),
    })),
  };
  const productJson = JSON.stringify(modalProduct).replaceAll("<", "\\u003c").replaceAll("\u2028", "\\u2028").replaceAll("\u2029", "\\u2029");
  return `<article class="product-card"><div class="product-media" data-card-carousel><a class="product-slides" href="${escapeHtml(productUrl)}" aria-label="${escapeHtml(product.title)}">${slides}</a>${carouselControls}<button class="card-quick-add" type="button" aria-label="${actionLabel} ${escapeHtml(product.title)}" data-card-quick-add><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8Z"></path><path d="M9 8V6a3 3 0 0 1 6 0v2"></path><path d="M12 11v6M9 14h6"></path></svg><span>${actionLabel}</span></button></div><div class="product-card-copy"><h3><a href="${escapeHtml(productUrl)}">${escapeHtml(product.title)}</a></h3><p>${priceRange(product.variants, currency, includeCurrency)}</p></div><script type="application/json" data-card-product>${productJson}</script></article>`;
}

function productGrid(products, currency, limit, { className = "", includeCurrency = true, priorityCards = 2, locale = "" } = {}) {
  const entries = typeof limit === "number" ? products.slice(0, limit) : products;
  if (!entries.length) return `<p class="empty-state">${translator(locale)("No published products are available yet.", "Ingen produkter er publisert ennå.", "Es sind noch keine veröffentlichten Produkte verfügbar.")}</p>`;
  return `<div class="product-grid${className ? ` ${className}` : ""}">${entries.map((item, index) => productCard(item, currency, index < priorityCards, includeCurrency, locale)).join("")}</div>`;
}

function findCollection(store, needles) {
  return publishedCollections(store).find((item) => needles.some((needle) => item.handle.includes(needle) || item.title.toLowerCase().includes(needle)));
}

const optionCollator = new Intl.Collator(undefined, { numeric: true });
function facetValues(products, optionName) {
  return [...new Set(products.flatMap((product) => (product.variants || []).flatMap((variant) => variant.options || []))
    .filter((option) => option.name.toLowerCase().includes(optionName))
    .map((option) => option.value).filter(Boolean))]
    .sort(optionCollator.compare);
}

const COLOR_SWATCHES = {
  beige: "#ead8ab", black: "#000000", blue: "#0d5dcc", brown: "#955731",
  gray: "#8e8e8e", grey: "#8e8e8e", green: "#08a73d", navy: "#30238f",
  olive: "#6f7040", orange: "#ff8200", pink: "#f6b8c6", turquoise: "#43a9aa",
  white: "#ffffff",
  // Norwegian labels, because a swatch is matched on the displayed colour name.
  svart: "#000000", blå: "#0d5dcc", brun: "#955731", grå: "#8e8e8e", grønn: "#08a73d",
  marineblå: "#30238f", oliven: "#6f7040", olivengrønn: "#6f7040", oransje: "#ff8200",
  rosa: "#f6b8c6", turkis: "#43a9aa", hvit: "#ffffff", sølv: "#c0c0c0", gul: "#f5c542",
};
// The review excerpts stay in the language the customer wrote them in; everything around
// them is localized.
function renderReviews(locale = "") {
  const t = translator(locale);
  const reviewDate = isNorwegian(locale) || isGerman(locale)
    ? new Intl.DateTimeFormat(isGerman(locale) ? "de-DE" : "nb-NO", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const stars = `<span class="review-stars" aria-label="${t("5 out of 5 stars", "5 av 5 stjerner", "5 von 5 Sternen")}"><span aria-hidden="true">★★★★★</span></span>`;
  const cards = FEATURED_REVIEWS.map((review) => `<li><a class="review-card" href="${GOOGLE_REVIEWS_URL}" target="_blank" rel="noopener noreferrer external" aria-label="${t(`Read ${escapeHtml(review.name)}’s review and all reviews on Google (opens in a new tab)`, `Les anmeldelsen fra ${escapeHtml(review.name)} og alle anmeldelsene på Google (åpnes i ny fane)`, "Lies die Bewertung von " + (escapeHtml(review.name)) + " und alle Bewertungen auf Google (öffnet in einem neuen Tab)")}"><header><div><strong>${escapeHtml(review.name)}</strong><time datetime="${review.date}">${reviewDate ? reviewDate.format(new Date(review.date)) : review.label}</time></div><svg class="review-google" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.73-.06-1.42-.19-2.09H12v3.96h5.92c-.26 1.28-1.03 2.37-2.17 3.1v2.58h3.52c2.06-1.9 3.29-4.7 3.29-7.55Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.52-2.58c-.98.66-2.23 1.06-3.76 1.06-2.87 0-5.3-1.94-6.17-4.54H2.2v2.66A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.83 14.28A6.6 6.6 0 0 1 5.48 12c0-.79.14-1.55.35-2.28V7.06H2.2A11 11 0 0 0 1 12c0 1.78.43 3.46 1.2 4.94l3.63-2.66Z"/><path fill="#EA4335" d="M12 5.18c1.62 0 3.07.56 4.21 1.65l3.16-3.16C17.46 1.89 14.97 1 12 1a11 11 0 0 0-9.8 6.06l3.63 2.66C6.7 7.12 9.13 5.18 12 5.18Z"/></svg></header>${stars}<blockquote>${escapeHtml(review.excerpt)}</blockquote></a></li>`).join("");
  return `<section class="review-strip" id="reviews" aria-label="${t("Featured Google reviews", "Utvalgte Google-anmeldelser", "Ausgewählte Google-Bewertungen")}"><a class="review-summary" href="${GOOGLE_REVIEWS_URL}" target="_blank" rel="noopener noreferrer external" aria-label="${t("Read all New Movements reviews on Google (opens in a new tab)", "Les alle anmeldelsene av New Movements på Google (åpnes i ny fane)", "Lies alle New Movements Bewertungen auf Google (öffnet in einem neuen Tab)")}"><strong>New Movements</strong>${stars}<span>${GOOGLE_REVIEW_COUNT} ${t("Google Reviews", "Google-anmeldelser", "Google Bewertungen")}</span><small>${t("Read all reviews ↗", "Les alle anmeldelsene ↗", "Alle Bewertungen lesen ↗")}</small></a><ul class="review-cards" tabindex="0" aria-label="${t("Featured reviews; scroll to see more", "Utvalgte anmeldelser – bla for å se mer", "Ausgewählte Bewertungen; scrolle, um mehr zu sehen")}">${cards}</ul></section>`;
}

const AUTUMN_WINTER_HANDLES = ["cloud-boot-macchiato-brown", "cloud-boot-black", "cloud-boot-camel-brown", "flow-boot-macchiato-brown", "space-boot-macchiato-brown", "low-cloud-macchiato-brown", "norwegian-sneaker-leather-forest-green", "norwegian-sneaker-leather-full-black", "norwegian-sneaker-technical-smooth-forest-wool", "zipper-boot-black"];
const seasonalProducts = (store) => AUTUMN_WINTER_HANDLES.map((handle) => productByHandle(store, handle)).filter(Boolean);
export const homeAvailabilityVariants = (store) => seasonalProducts(store).flatMap((product) => product.variants || []);

export function renderHomePage(store, context = {}) {
  const t = translator(store?.locale);
  const currency = store.currency || "NOK";
  const stock = context.availability || {};
  const products = seasonalProducts(store).filter((product) => product.variants.some((variant) => stock[variant.id] === true)).map((product, index) => {
    const preferredView = index % 2 ? "men" : "women";
    const composed = productView(product, preferredView);
    return composed?.variants.some((variant) => stock[variant.id] === true) ? { ...composed, view: preferredView } : product;
  });
  const sneakers = collectionByHandle(store, "sneakers") || findCollection(store, ["sneaker"]);
  const loafers = collectionByHandle(store, "loafers-low-tops") || findCollection(store, ["loafer", "low-hiker"]);
  const hero = `<section class="home-hero"><div class="season-hero-copy"><h1>${t("Crafted through generations", "Skapt gjennom generasjoner", "Über Generationen gefertigt")}</h1><p>Oslo 1916</p></div><a class="home-hero-panel home-hero-panel--women" href="/collections/women"><img src="${HOME_HERO_IMAGES[0]}" alt="${t("New Movements brown footwear styled in Oslo", "Brune sko fra New Movements stylet i Oslo", "Braunes Schuhwerk von New Movements in Oslo gestylt")}" width="1116" height="1626" fetchpriority="high"><span>${t("Shop women's", "Handle dame", "Damenschuhe shoppen")}</span></a><a class="home-hero-panel home-hero-panel--men" href="/collections/men"><img src="${HOME_HERO_IMAGES[1]}" alt="${t("Brown New Movements shoe worn outdoors", "Brun New Movements-sko brukt utendørs", "Brauner New Movements Schuh im Freien getragen")}" width="1195" height="1465" fetchpriority="high"><span>${t("Shop men's", "Handle herre", "Herrenschuhe shoppen")}</span></a></section>`;
  const promises = `<section class="promise-grid"><a href="/pages/evensen-story"><strong>${t("Fourth generation shoemaker", "Fjerde generasjon skomaker", "Schuhmacher in vierter Generation")}</strong><span>${t("Read the Evensen story", "Les historien om Evensen", "Lies die Geschichte der Evensens")}</span></a><a href="/pages/our-philosophy"><strong>${t("Designed in Oslo", "Designet i Oslo", "In Oslo entworfen")}</strong><span>${t("Handcrafted in Portugal", "Håndlaget i Portugal", "Handgefertigt in Portugal")}</span></a><a href="/pages/materials"><strong>${t("Premium materials", "Førsteklasses materialer", "Hochwertige Materialien")}</strong><span>${t("Built to last, and to be recycled", "Laget for å vare og for å gjenvinnes", "Gemacht, um lange zu halten und recycelt zu werden")}</span></a></section>`;
  const categoryCards = [[sneakers, "Sneakers"], [loafers, t("Low Hikers & Loafers", "Low hikers og loafers", "Low Hikers & Loafer")]].filter(([collection]) => Boolean(collection)).map(([collection, label]) => {
    const product = collectionProducts(store, collection).find((item) => item.images?.[0]);
    const sizes = facetValues(collectionProducts(store, collection), "size").map(Number).filter(Number.isFinite);
    const sizeLabel = sizes.length ? `<small>${t("Sizes", "Størrelse", "Größen")} ${Math.min(...sizes)}–${Math.max(...sizes)}</small>` : "";
    return `<a class="category-card" href="/collections/${escapeHtml(collection.handle)}">${product ? responsiveImage(product.images[0], { alt: product.images[0].alt || label, width: 960, sizes: "(max-width: 900px) 100vw, 50vw", loading: "lazy" }) : ""}<span>${sizeLabel}<strong>${escapeHtml(label)}</strong><em>${t("Shop now", "Handle nå", "Jetzt shoppen")}</em></span></a>`;
  }).join("");
  const community = `<section class="community"><img src="${COMMUNITY_IMAGE}" alt="${t("New Movements Community Center storefront at Steen & Strøm in Oslo", "Fasaden til New Movements Community Center på Steen & Strøm i Oslo", "New Movements Community Center Storefront bei Steen & Strøm in Oslo")}" width="1440" height="1000" loading="lazy"><div><p class="eyebrow">NM Community Center</p><h2>${t("Flagship store in Oslo", "Flaggskipbutikk i Oslo", "Flagship-Store in Oslo")}</h2><p>${t("Visit our NM Community Center in Steen & Strøm, Scandinavia's oldest department store, to experience our products and be part of the journey towards a circular future.", "Besøk NM Community Center på Steen & Strøm, Skandinavias eldste varehus, for å oppleve produktene våre og bli en del av reisen mot en sirkulær fremtid.", "Besuche unser NM Community Center bei Steen &amp; Strøm, Skandinaviens ältestem Kaufhaus, um unsere Produkte zu erleben und Teil der Reise in eine zirkuläre Zukunft zu sein.")}</p><p>${t("We're looking forward to welcoming you!", "Vi gleder oss til å se deg!", "Wir freuen uns darauf, dich willkommen zu heißen!")}</p><nav><a href="${DIRECTIONS_URL}" rel="external">⌖ ${t("Get directions", "Finn veien", "Route planen")}</a><a href="/pages/contact-us">◌ ${t("Get in touch", "Ta kontakt", "Kontakt aufnehmen")}</a></nav></div></section>${renderReviews(store?.locale)}`;
  const body = `${hero}${promises}${products.length ? `<section class="catalog-section"><header class="season-products-header"><div><p class="eyebrow">${t("Autumn / Winter", "Høst / vinter", "Herbst / Winter")}</p><h2>${t("Made for colder days", "Laget for kaldere dager", "Gemacht für kältere Tage")}</h2></div><a href="/collections/boots">${t("Explore boots", "Se boots", "Boots entdecken")} <span aria-hidden="true">→</span></a></header>${productGrid(products, currency, 6, { className: "home-product-strip", priorityCards: 0, locale: store?.locale })}</section>` : `<section class="season-shop-links"><h2>${t("Shoes for every season", "Sko for alle sesonger", "Schuhe für jede Saison")}</h2><a href="/collections/women">${t("Explore women’s shoes", "Se damesko", "Damenschuhe entdecken")}</a><a href="/collections/men">${t("Explore men’s shoes", "Se herresko", "Herrenschuhe entdecken")}</a></section>`}${categoryCards ? `<section class="category-grid">${categoryCards}</section>` : ""}${community}`;
  return documentHtml({ title: t("Women’s & Men’s Shoes", "Dame- og herresko", "Damen- & Herrenschuhe"), localizeTitle: false, description: t("Unisex shoes designed in Oslo and handcrafted in Portugal for a circular future.", "Unisex-sko designet i Oslo og håndlaget i Portugal for en sirkulær fremtid.", "Unisex-Schuhe, in Oslo entworfen und in Portugal handgefertigt für eine zirkuläre Zukunft."), path: "/", body, store, image: HOME_HERO_IMAGES[0] });
}

export function renderStoryPage(store) {
  const t = translator(store?.locale);
  const copy = copyFor(STORY_PAGE, norwegian.STORY_PAGE, store?.locale, german.STORY_PAGE);
  const arrivals = findCollection(store, ["new-arrival", "new"]);
  const preferredHandles = ["allrounder-y-white", "allrounder-y-full-black", "allrounder-y-black-nordic-grey", "allrounder-y-smooth-forest", "allrounder-y-beige-smooth-forest", "allrounder-y-beige-sand"];
  const preferredProducts = preferredHandles.map((handle) => productByHandle(store, handle)).filter(Boolean);
  const products = preferredProducts.length >= 4 ? preferredProducts : (collectionProducts(store, arrivals).length ? collectionProducts(store, arrivals) : (store.products || []));
  const storyImage = (src, alt) => `<figure class="story-image"><img src="${src}" alt="${escapeHtml(alt)}" width="672" loading="lazy" decoding="async"></figure>`;
  const story = copy.article(storyImage);
  const rail = `<section class="story-products" aria-labelledby="story-products-title"><header><h2 id="story-products-title">${escapeHtml(copy.railHeading)}</h2><a href="${arrivals ? `/collections/${arrivals.handle}` : "/collections/all"}">${t("View all", "Se alle", "Alle ansehen")}</a></header>${productGrid(products, store.currency || "NOK", 8, { className: "story-product-rail", includeCurrency: false, priorityCards: 0, locale: store?.locale })}</section>`;
  return documentHtml({ title: copy.title, localizeTitle: false, description: copy.description, path: "/pages/evensen-story", body: `${story}${rail}`, store, image: products[0]?.images?.[0]?.url || "" });
}

function renderMaterialsPage(store) {
  const t = translator(store?.locale);
  const copy = copyFor(MATERIALS_PAGE, norwegian.MATERIALS_PAGE, store?.locale, german.MATERIALS_PAGE);
  const currency = store.currency || "NOK";
  const careCollection = collectionByHandle(store, "shoe-care") || collectionByHandle(store, "shoe-care-1") || findCollection(store, ["shoe care"]);
  const preferredCareHandles = [
    "fiber-protector-impregnering-500ml",
    "organotex-shoe-cleaner",
    "organotex-waterproofing-spray",
    "organotex-leather-wax",
    "norwegian-wool-insole",
  ];
  const preferredCareProducts = preferredCareHandles.map((handle) => productByHandle(store, handle)).filter(Boolean);
  const careProducts = preferredCareProducts.length >= 4 ? preferredCareProducts : collectionProducts(store, careCollection);
  const arrivals = findCollection(store, ["new-arrival", "new"]);
  const preferredHandles = ["allrounder-y-white", "allrounder-y-full-black", "allrounder-y-black-nordic-grey", "allrounder-y-smooth-forest", "allrounder-y-beige-smooth-forest"];
  const preferredArrivals = preferredHandles.map((handle) => productByHandle(store, handle)).filter(Boolean);
  const arrivalProducts = preferredArrivals.length >= 4 ? preferredArrivals : (collectionProducts(store, arrivals).length ? collectionProducts(store, arrivals) : (store.products || []));
  const guide = copy.guide;
  const careRail = `<section class="story-products materials-products" aria-labelledby="care-products-title"><header><h2 id="care-products-title">${escapeHtml(copy.careHeading)}</h2></header>${productGrid(careProducts, currency, 8, { className: "story-product-rail", includeCurrency: false, priorityCards: 0, locale: store?.locale })}</section>`;
  const arrivalsRail = `<section class="story-products materials-products" aria-labelledby="materials-arrivals-title"><header><h2 id="materials-arrivals-title">${escapeHtml(copy.railHeading)}</h2><a href="${arrivals ? `/collections/${arrivals.handle}` : "/collections/all"}">${t("View all", "Se alle", "Alle ansehen")}</a></header>${productGrid(arrivalProducts, currency, 8, { className: "story-product-rail", includeCurrency: false, priorityCards: 0, locale: store?.locale })}</section>`;
  return documentHtml({ title: copy.title, localizeTitle: false, description: copy.description, path: "/pages/materials", body: `${guide}${careRail}${arrivalsRail}`, store, image: "/brand-assets/materials-recycled-rubber.webp" });
}


// The journal keeps its English dates, slugs and images; the Norwegian entry supplies the
// title, summary, alt text, date label and article body.
const journalEntry = (entry, locale) => copyFor(entry, norwegian.JOURNAL_ENTRIES[entry.slug], locale, german.JOURNAL_ENTRIES.find(item => item.slug === entry.slug));

function renderJournalPage(store) {
  const t = translator(store?.locale);
  const copy = copyFor(JOURNAL_PAGE, norwegian.JOURNAL_PAGE, store?.locale, german.JOURNAL_PAGE);
  const cards = JOURNAL_ENTRIES.filter((item) => !item.archived).map((item) => journalEntry(item, store?.locale)).map((entry, index) => `<article class="journal-card journal-card--${index + 1}"><a class="journal-card-media" href="/blogs/news/${entry.slug}"><img src="${entry.image}" alt="${escapeHtml(entry.imageAlt)}" width="${entry.width}" height="${entry.height}" ${index < 3 ? "" : 'loading="lazy" '}decoding="async"></a><div class="journal-card-copy"><h2><a href="/blogs/news/${entry.slug}">${escapeHtml(entry.title)}</a></h2><p class="journal-meta"><time datetime="${entry.isoDate}">${entry.date}</time><span aria-hidden="true">|</span>${entry.author}</p><p>${entry.summary}</p><a class="journal-read-more" href="/blogs/news/${entry.slug}">${t("Read more...", "Les mer ...", "Mehr lesen...")}</a></div></article>`).join("");
  return documentHtml({ title: copy.title, localizeTitle: false, description: copy.description, path: "/blogs/news", store, body: `<section class="journal-page"><header><h1>${escapeHtml(copy.heading)}</h1></header><div class="journal-grid">${cards}</div></section>`, image: JOURNAL_ENTRIES[0].image });
}

function renderJournalArticle(store, source) {
  const t = translator(store?.locale);
  const entry = journalEntry(source, store?.locale);
  const path = `/blogs/news/${entry.slug}`;
  const body = `<article class="journal-article journal-article--${entry.slug}"><header><h1>${escapeHtml(entry.title)}</h1><time datetime="${entry.isoDate}">${entry.date}</time></header><div class="journal-article-content">${entry.copy}</div><footer><a href="/collections/all">${t("Shop now", "Handle nå", "Jetzt shoppen")}</a><a href="/collections/sneakers">${t("Shop sneakers", "Handle sneakers", "Sneaker shoppen")}</a><a href="/pages/size-guide">${t("Find your size", "Finn størrelsen din", "Finde deine Größe")}</a></footer></article>`;
  return documentHtml({ title: entry.metaTitle, localizeTitle: false, description: entry.summary, path, store, body, type: "article", image: entry.image });
}

function renderUtilityPage(store, path, context = {}) {
  const t = translator(store?.locale);
  if (path === "/cart") return documentHtml({ title: t("Your Shopping Bag", "Handlekurven din", "Deine Einkaufstasche"), localizeTitle: false, description: t("Review your New Movements bag and continue to secure checkout.", "Se over handlekurven din og gå videre til sikker betaling.", "Prüfe deine New Movements Tasche und fahre mit dem sicheren Checkout fort."), path, store, body: `<header class="collection-header"><h1>${t("Your bag", "Handlekurven din", "Deine Tasche")}</h1></header><section class="cart-layout" data-cart-root><div class="cart-items" data-cart-items></div><aside class="cart-summary"><h2>${t("Order summary", "Ordreoversikt", "Bestellübersicht")}</h2><p><span>${t("Subtotal", "Delsum", "Zwischensumme")}</span><strong data-cart-subtotal>${escapeHtml(store.currency || "NOK")} 0</strong></p><p>${t("Taxes and duties included. Free delivery. Choose your delivery service in checkout.", "Avgifter og toll inkludert. Gratis levering. Du velger leveringsmåte i kassen.", "Steuern und Abgaben inbegriffen. Kostenlose Lieferung. Wähle deinen Lieferdienst im Checkout.")}</p><p class="checkout-error" data-checkout-error hidden tabindex="-1"></p><button type="button" data-checkout-start disabled>${t("Secure checkout", "Sikker betaling", "Sicherer Checkout")}</button><p class="checkout-reassurance"><a href="/pages/returns">${t("Free returns within 30 days", "Gratis retur innen 30 dager", "Kostenlose Rückgabe innerhalb von 30 Tagen")}</a></p></aside></section>` });
  if (path === "/search") {
    const view = selectedView(context);
    const query = (context.url?.searchParams.get("q") || "").trim().slice(0, 200);
    const products = query ? searchProducts(catalogProductsForRequest(store.products || [], { ...context, collections: store.collections }), query) : [];
    const status = query
      ? t(`${products.length} result${products.length === 1 ? "" : "s"} for “${query}”`, `${products.length} treff for «${query}»`, "" + (products.length) + " Ergebnis" + (products.length === 1 ? "" : "se") + " für „" + (query) + "“")
      : t("Enter a product name, style or material.", "Skriv inn et produktnavn, en stil eller et materiale.", "Gib einen Produktnamen, Style oder ein Material ein.");
    const searchTitle = view
      ? t(`${view === "women" ? "Women’s" : "Men’s"} Shoe Search`, view === "women" ? "Søk etter damesko" : "Søk etter herresko", (view === "women" ? "Damen" : "Herren") + " Schuhsuche")
      : t("Search Shoes", "Søk etter sko", "Schuhe suchen");
    return documentHtml({ title: searchTitle, localizeTitle: false, description: t("Search the live New Movements footwear catalog.", "Søk i den oppdaterte skokatalogen til New Movements.", "Durchsuche den Live-Katalog für Schuhwerk von New Movements."), path, store, view,
      body: `<section class="static-page search-page"><h1>${t("Search", "Søk", "Suche")}</h1>${viewSelector(path, view, { query, locale: store?.locale })}<form class="search-form" role="search" action="/search" method="get" data-search-form><label class="sr-only" for="search-input">${t("Search products", "Søk etter produkter", "Produkte suchen")}</label><input id="search-input" name="q" type="search" value="${escapeHtml(query)}" maxlength="200" autocomplete="off" placeholder="${t("Search shoes, styles, materials", "Søk etter sko, stiler og materialer", "Schuhe, Styles, Materialien suchen")}">${view ? `<input type="hidden" name="view" value="${view}">` : ""}<button type="submit">${t("Search", "Søk", "Suche")}</button></form><p class="search-status" data-search-status>${escapeHtml(status)}</p><div data-search-results>${query && products.length ? productGrid(products, store.currency || "NOK", undefined, { locale: store?.locale }) : ""}</div></section>` });
  }
  if (path === "/order/complete") return documentHtml({ title: t("Thank You for Your Order", "Takk for bestillingen", "Danke für deine Bestellung"), localizeTitle: false, description: t("Your New Movements order has been received.", "Vi har mottatt bestillingen din.", "Deine New Movements Bestellung ist eingegangen."), path, store, body: `<section class="message-page" data-order-complete><p class="eyebrow">${t("Order confirmed", "Ordre bekreftet", "Bestellung bestätigt")}</p><h1>${t("Thank you.", "Takk.", "Danke.")}</h1><p>${t("Your order has been received. Confirmation and delivery details will be sent to the email used at checkout.", "Vi har mottatt bestillingen din. Bekreftelse og leveringsdetaljer sendes til e-postadressen du brukte i kassen.", "Deine Bestellung ist eingegangen. Bestätigung und Lieferdetails werden an die im Checkout verwendete E-Mail-Adresse gesendet.")}</p><a class="outline-button" href="/collections/all">${t("Continue shopping", "Fortsett å handle", "Weiter einkaufen")}</a></section>` });
  return null;
}

function renderContentPage(store, handle, page) {
  const t = translator(store?.locale);
  const philosophy = handle === "/pages/our-philosophy";
  const recycle = handle === "/pages/recycle";
  // The philosophy page breaks after its introduction, which ends at the first heading
  // in every language.
  const introEnd = philosophy ? page.copy.indexOf("<h2>") : -1;
  const intro = introEnd > -1 ? page.copy.slice(0, introEnd) : page.copy;
  const remainder = introEnd > -1 ? page.copy.slice(introEnd) : "";
  const body = philosophy
    ? `<section class="static-page static-page--about"><div class="static-reading"><p class="eyebrow">${t("About", "Om oss", "Über uns")}</p><h1>${t("About", "Om oss", "Über uns")}</h1><div class="static-copy static-copy--intro">${intro}</div><figure class="static-feature-image"><img src="/brand-assets/about-history.jpg" alt="${t("New Movements history and community", "New Movements’ historie og fellesskap", "Geschichte und Community von New Movements")}" width="1200" loading="lazy" decoding="async"></figure><div class="static-copy">${remainder}</div></div></section>`
    : recycle
      ? `<section class="static-page static-page--recycle"><div class="static-reading static-reading--recycle"><h1>${page.heading}</h1><div class="static-copy">${page.copy}</div></div></section>`
      : `<section class="static-page${handle === "/pages/contact-us" ? " static-page--contact" : ""}"><p class="eyebrow">${page.eyebrow}</p><h1>${page.heading}</h1><div class="static-copy">${page.copy}</div></section>`;
  return documentHtml({ title: page.title, localizeTitle: false, description: stripHtml(page.copy), path: handle, store, body });
}

export function renderPage(store, handle, context = {}) {
  const t = translator(store?.locale);
  if (handle === "/pages/size-guide") return documentHtml({ title: t("Shoe Size Guide – EU, US & UK", "Størrelsesguide for sko – EU, US og UK", "Schuhgrößenratgeber – EU, US & UK"), localizeTitle: false, description: t("Find your New Movements size with style-specific EU, US and UK charts, measuring advice and help from our Oslo team.", "Finn størrelsen din i New Movements med egne tabeller for EU, US og UK, råd om måling og hjelp fra teamet i Oslo.", "Finde deine New Movements Größe mit style-spezifischen EU-, US- und UK-Tabellen, Messtipps und Hilfe von unserem Team in Oslo."), path: handle, store, body: `<section class="size-guide-page">${renderSizeGuide({ ...context, locale: store?.locale })}</section>` });
  if (handle === "/collections") return renderCollectionsPage(store, context);
  if (handle === "/pages/evensen-story" || handle === "evensen-story") return renderStoryPage(store);
  if (handle === "/pages/materials") return renderMaterialsPage(store);
  if (handle === "/blogs/news") return renderJournalPage(store);
  if (handle.startsWith("/blogs/news/")) {
    const entry = JOURNAL_ENTRIES.find((item) => `/blogs/news/${item.slug}` === handle);
    return entry ? renderJournalArticle(store, entry) : null;
  }
  const utility = renderUtilityPage(store, handle, context);
  if (utility) return utility;
  const page = CONTENT_PAGES[handle];
  if (page) return renderContentPage(store, handle, copyFor(page, norwegian.CONTENT_PAGES[handle], store?.locale, german.CONTENT_PAGES[handle]));
  return null;
}

// The merchandising views keep canonical keys; only their labels are localized.
const viewLabel = (key, t) => (key === "women" ? t("Women", "Dame", "Damen") : t("Men", "Herre", "Herren"));

function viewSelector(path, view, { collection = false, query = "", locale = "" } = {}) {
  const t = translator(locale);
  const pathFor = (key) => collection && ["women", "men"].some((name) => path === `/collections/${name}`)
    ? `/collections/${key || "all"}` : viewUrl(path, key);
  const href = (key) => escapeHtml(`${pathFor(key)}${query ? `${pathFor(key).includes("?") ? "&" : "?"}q=${encodeURIComponent(query)}` : ""}`);
  return `<nav class="merchandising-views" aria-label="${t("Shop by size", "Handle etter størrelse", "Nach Größe shoppen")}"><a href="${href("")}"${!view ? ' aria-current="page"' : ""}>${t("All sizes", "Alle størrelser", "Alle Größen")}</a>${Object.keys(VIEWS).map((key) => `<a href="${href(key)}"${view === key ? ' aria-current="page"' : ""}>${viewLabel(key, t)}</a>`).join("")}</nav>`;
}

// `label` is the canonical facet name the filtering package reports; `labelNb` is what the
// Norwegian storefront shows.
const COLLECTION_FACETS = [
  { key: "availability", label: "Availability", labelNb: "Tilgjengelighet", labelDe: "Verfügbarkeit", parameter: "filter.v.availability", kind: "availability" },
  { key: "size", label: "Size", labelNb: "Størrelse", labelDe: "Größe", parameter: "filter.v.option.size", kind: "option", optionName: "Size" },
  { key: "product-type", label: "Product type", labelNb: "Produkttype", labelDe: "Produkttyp", parameter: "filter.p.product_type", kind: "product", productField: "productType" },
  { key: "color", label: "Color", labelNb: "Farge", labelDe: "Farbe", parameter: "filter.v.t.shopify.color-pattern", kind: "attribute", attributeKey: "color" },
  { key: "footwear-material", label: "Material", labelNb: "Materiale", labelDe: "Material", parameter: "filter.v.t.shopify.footwear-material", kind: "attribute", attributeKey: "footwear-material" },
  { key: "shoe-features", label: "Shoe features", labelNb: "Egenskaper", labelDe: "Eigenschaften", parameter: "filter.v.t.shopify.shoe-features", kind: "attribute", attributeKey: "shoe-features" },
];
const facetLabel = (facet, t) => t(facet.label, facet.labelNb, facet.labelDe);

function collectionSourceProducts(store, handle, context) {
  const view = selectedView(context, Object.hasOwn(VIEWS, handle) ? handle : "");
  const collection = handle === "all" ? null : collectionByHandle(store, handle);
  const source = handle === "all" ? store.products || [] : collectionProducts(store, collection);
  return productsForView(source, view);
}

export function collectionAvailabilityVariants(store, handle, context = {}) {
  if (!context.url?.searchParams.has("filter.v.availability") && !context.url?.searchParams.has("filter.v.option.size")) return [];
  const variants = collectionSourceProducts(store, handle, context).flatMap((product) => product.variants || []);
  return [...new Map(variants.map((variant) => [variant.id, variant])).values()];
}

// The availability facet reports English labels with stable ids, so its display label comes
// from the id rather than the delivered text.
const facetValueLabel = (facet, value, t) => (facet.key === "availability"
  ? (value.inputValue === "1" ? t("In stock", "På lager", "Auf Lager") : t("Out of stock", "Utsolgt", "Nicht auf Lager"))
  : value.label);

function structuredFilterGroup(facet, t) {
  const colors = facet.key === "color";
  const options = facet.values.map((value) => {
    const count = value.count === null ? "" : `<small class="facet-count">${value.count}</small>`;
    const swatchColor = COLOR_SWATCHES[value.label.toLowerCase()] || value.colors.find((color) => /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(color)) || "#ddd";
    const swatch = colors ? `<span class="color-swatch" style="--swatch:${swatchColor}" aria-hidden="true"></span>` : "";
    return `<label${colors ? ' class="color-option"' : ""}><input type="checkbox" name="${escapeHtml(facet.parameter)}" value="${escapeHtml(value.inputValue)}"${value.selected ? " checked" : ""}${value.count === 0 && !value.selected ? " disabled" : ""}>${swatch}<span>${escapeHtml(facetValueLabel(facet, value, t))}</span>${count}</label>`;
  }).join("");
  return `<details name="collection-facet"${facet.values.some((value) => value.selected) ? " open" : ""}><summary>${escapeHtml(facetLabel(facet, t))}</summary><div class="facet-options${colors ? " color-options" : ""}">${options}</div></details>`;
}

export function renderCollectionsPage(store, context = {}) {
  const t = translator(store?.locale);
  const view = selectedView(context);
  const cards = publishedCollections(store).filter((collection) => collection.handle !== "shoe-care-1" && collectionProducts(store, collection).length).map((collection) => {
    const products = collectionProducts(store, collection);
    const image = products[0]?.images?.[0];
    const title = collection.handle === "women" ? t("Women’s Shoes", "Damesko", "Damenschuhe") : collection.handle === "men" ? t("Men’s Shoes", "Herresko", "Herrenschuhe") : collection.title;
    const picture = collection.imageUrl
      ? `<img src="${escapeHtml(collection.imageUrl)}" alt="${escapeHtml(t(`${title} collection`, `Kolleksjonen ${title}`, "" + (title) + " Kollektion"))}" width="640" height="800" loading="lazy" decoding="async">`
      : responsiveImage(image, { alt: imageAltText(image, title, 0, store?.locale), width: 640, sizes: "(max-width: 700px) 50vw, 25vw", loading: "lazy" });
    return `<a class="collection-tile" href="${viewUrl(`/collections/${collection.handle}`, Object.hasOwn(VIEWS, collection.handle) ? "" : view)}"><div class="product-media">${picture || '<span class="collection-tile-empty">New Movements</span>'}</div><h2>${escapeHtml(title)}</h2><p>${products.length} ${t(products.length === 1 ? "product" : "products", products.length === 1 ? "produkt" : "produkter", products.length === 1 ? "Produkt" : "Produkte")}</p></a>`;
  }).join("");
  return documentHtml({ title: t("Shoe Collections", "Skokolleksjoner", "Schuhkollektionen"), localizeTitle: false, description: t("Explore New Movements shoe collections: sneakers, boots, loafers and shoe care, designed in Oslo.", "Se skokolleksjonene til New Movements: sneakers, boots, loafers og skopleie, designet i Oslo.", "Entdecke die Schuhkollektionen von New Movements: Sneaker, Boots, Loafer und Schuhpflege, entworfen in Oslo."), path: "/collections", body: `<section class="catalog-section collection-directory"><header><h1>${t("Our collections", "Våre kolleksjoner", "Unsere Kollektionen")}</h1></header><div class="collection-directory-grid">${cards || `<p>${t("No collections are published yet.", "Ingen kolleksjoner er publisert ennå.", "Es sind noch keine Kollektionen veröffentlicht.")}</p>`}</div></section>`, store, view });
}

export function renderCollectionPage(store, handle, context = {}) {
  const locale = context.locale || store?.locale;
  const t = translator(locale);
  const view = selectedView(context, Object.hasOwn(VIEWS, handle) ? handle : "");
  const collection = handle === "all" ? null : collectionByHandle(store, handle);
  if (handle !== "all" && !collection) return null;
  const sourceProducts = collectionSourceProducts(store, handle, context);
  const parameters = context.url?.searchParams || new URLSearchParams();
  const request = parseCollectionFilters(parameters, COLLECTION_FACETS);
  const selectedSizes = request.values.get("size") || [];
  const availableInSize = selectedSizes.length && parameters.get("include_sold_out") !== "1" && !parameters.has("filter.v.availability");
  if (availableInSize) request.values.set("availability", ["1"]);
  const { products: matchedProducts, facets, warnings } = filterCollection(sourceProducts, COLLECTION_FACETS, request, context.availability || {});
  const products = matchedProducts.map((product) => ({ ...product, selectedVariantId: selectedSizes.length === 1 ? product.variants.find((variant) => variant.options?.some((option) => option.name.toLowerCase() === "size" && option.value === selectedSizes[0]))?.id : undefined }));
  // The women and men collections are their own view, so their curated metadata still describes the
  // page; a view applied on top of another collection is a filtered variant and keeps generated copy.
  const ownView = !view || Object.hasOwn(VIEWS, handle);
  const curatedTitle = ownView ? curatedMetaTitle(collection) : "";
  // The page heading is the collection's own name. A size view names its audience instead,
  // because "Women" and "Sneakers" alone would not say which shoes are listed.
  const heading = view
    ? collectionMetaTitle(collection?.title || "All Shoes", view, locale)
    : collection?.title || t("All Shoes", "Alle sko", "Alle Schuhe");
  const title = curatedTitle || heading;
  const curatedDescription = ownView ? curatedMetaDescription(collection) : "";
  const description = curatedDescription || (view
    ? t(`Shop ${title.toLowerCase()} in EU sizes ${VIEWS[view].minSize}–${VIEWS[view].maxSize}. Unisex styles designed in Oslo and handcrafted in Portugal.`,
      `Handle ${title.toLowerCase()} i EU-størrelse ${VIEWS[view].minSize}–${VIEWS[view].maxSize}. Unisex-modeller designet i Oslo og håndlaget i Portugal.`, "Shoppe " + (title.toLowerCase()) + " in EU-Größen " + (VIEWS[view].minSize) + "–" + (VIEWS[view].maxSize) + ". Unisex-Styles, in Oslo entworfen und in Portugal handgefertigt.")
    : stripHtml(collection?.description) || t("Shop unisex shoes designed in Oslo and handcrafted in Portugal. Explore sneakers, boots and loafers from New Movements.", "Handle unisex-sko designet i Oslo og håndlaget i Portugal. Se sneakers, boots og loafers fra New Movements.", "Shoppe Unisex-Schuhe, die in Oslo entworfen und in Portugal handgefertigt werden. Entdecke Sneaker, Boots und Loafer von New Movements."));
  const maxPrice = Math.ceil(Math.max(0, ...sourceProducts.flatMap((product) => (product.variants || []).map((variant) => Number(variant.price) || 0))));
  const highestPrice = plainFormatters[0].format(maxPrice);
  const priceFacet = maxPrice ? `<details name="collection-facet"><summary>${t("Price", "Pris", "Preis")}</summary><div class="price-filter"><div class="price-fields"><label><span>${escapeHtml(store.currency || "NOK")}</span><input type="number" min="0" value="${request.minimum ?? ""}" step="any" inputmode="decimal" aria-label="${t("Minimum price", "Laveste pris", "Mindestpreis")}" name="filter.v.price.gte" placeholder="0"></label><span>${t("to", "til", "bis")}</span><label><span>${escapeHtml(store.currency || "NOK")}</span><input type="number" min="0" value="${request.maximum ?? ""}" step="any" inputmode="decimal" aria-label="${t("Maximum price", "Høyeste pris", "Höchstpreis")}" name="filter.v.price.lte" placeholder="${maxPrice}"></label></div><p>${t("The highest price is", "Høyeste pris er", "Der höchste Preis ist")} ${highestPrice}</p></div></details>` : "";
  const sortOptions = [
    ["manual", t("Featured", "Anbefalt", "Empfohlen")],
    ["title-ascending", t("Alphabetically, A-Z", "Alfabetisk, A–Å", "Alphabetisch, A-Z")],
    ["title-descending", t("Alphabetically, Z-A", "Alfabetisk, Å–A", "Alphabetisch, Z-A")],
    ["price-ascending", t("Price, low to high", "Pris, lav til høy", "Preis, aufsteigend")],
    ["price-descending", t("Price, high to low", "Pris, høy til lav", "Preis, absteigend")],
  ];
  const sort = sortOptions.some(([value]) => value === request.sort) ? request.sort : "manual";
  const sortMenu = `<details class="catalog-sort" data-sort-menu><summary>${t("Sort", "Sorter", "Sortieren")}</summary><div class="catalog-sort-options" role="listbox" aria-label="${t("Sort products", "Sorter produkter", "Produkte sortieren")}">${sortOptions.map(([value, label]) => `<button type="submit" form="collection-filter-form" name="sort_by" value="${value}" role="option" aria-selected="${value === sort}" data-collection-sort><svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4.75 10.75 2.94 3.84L15.25 5.75"></path></svg><span>${label}</span></button>`).join("")}</div></details>`;
  const linkForParameters = (query) => `/collections/${handle}${query.size ? `?${query}` : ""}`;
  const clearParameters = new URLSearchParams(parameters);
  [...clearParameters.keys()].filter((key) => key.startsWith("filter.")).forEach((key) => clearParameters.delete(key));
  clearParameters.delete("include_sold_out");
  const clearUrl = linkForParameters(clearParameters);
  const chips = facets.filter((facet) => !(availableInSize && facet.key === "availability")).flatMap((facet) => facet.values.filter((value) => value.selected).map((value) => {
    const query = new URLSearchParams(parameters);
    const removed = value.inputValue.split(",");
    const remaining = query.getAll(facet.parameter).flatMap((item) => item.split(",")).filter((item) => !removed.includes(item));
    query.delete(facet.parameter);
    remaining.forEach((item) => query.append(facet.parameter, item));
    return `<a class="active-filter-chip" data-remove-filter href="${escapeHtml(linkForParameters(query))}" aria-label="${escapeHtml(`${t("Remove", "Fjern", "Entfernen")} ${facetLabel(facet, t)}: ${facetValueLabel(facet, value, t)}`)}">${escapeHtml(facetValueLabel(facet, value, t))} <span aria-hidden="true">×</span></a>`;
  }));
  if (request.minimum !== undefined || request.maximum !== undefined) {
    const query = new URLSearchParams(parameters);
    query.delete("filter.v.price.gte"); query.delete("filter.v.price.lte");
    chips.push(`<a class="active-filter-chip" data-remove-filter href="${escapeHtml(linkForParameters(query))}" aria-label="${t("Remove price filter", "Fjern prisfilteret", "Preisfilter entfernen")}">${escapeHtml(request.minimum ?? 0)}–${escapeHtml(request.maximum ?? maxPrice)} ${escapeHtml(store.currency || "NOK")} <span aria-hidden="true">×</span></a>`);
  }
  const hasFilters = chips.length > 0;
  const filterNotice = {
    "invalid-price": t("Enter a valid price of zero or more.", "Oppgi en gyldig pris på null eller mer.", "Gib einen gültigen Preis von null oder mehr ein."),
    "stock-unchecked": t("Some live stock could not be checked. Retry or clear the availability filter.", "Vi klarte ikke å sjekke all lagerstatus. Prøv igjen, eller fjern filteret for tilgjengelighet.", "Einige Live-Bestände konnten nicht geprüft werden. Versuche es erneut oder entferne den Verfügbarkeitsfilter."),
    "sort-unavailable": t("This sort order is not available. Showing featured order.", "Denne sorteringen er ikke tilgjengelig. Viser anbefalt rekkefølge.", "Diese Sortierreihenfolge ist nicht verfügbar. Es wird die empfohlene Reihenfolge angezeigt."),
  };
  const notices = warnings.map((warning) => `<p class="collection-filter-notice" role="status">${escapeHtml(filterNotice[warning] || warning)} <a data-clear-filters href="${escapeHtml(clearUrl)}">${t("Clear filters", "Nullstill filtrene", "Filter löschen")}</a></p>`).join("");
  const active = hasFilters ? `<div class="active-filter-summary">${chips.join("")}<a data-clear-filters href="${escapeHtml(clearUrl)}">${t("Clear all", "Nullstill alle", "Alle löschen")}</a></div>` : "";
  const body = `<header class="collection-header"><h1>${escapeHtml(heading)}</h1>${viewSelector(`/collections/${handle}`, view, { collection: true, locale })}${view ? `<p class="size-view-note">EU ${VIEWS[view].minSize}–${VIEWS[view].maxSize}</p>` : ""}<p class="collection-help">${t("Looking for the right fit?", "Leter du etter riktig størrelse?", "Suchst du die richtige Passform?")} <a href="/pages/size-guide">${t("Read our size guide ↗", "Les størrelsesguiden vår ↗", "Lies unseren Größenratgeber ↗")}</a></p></header><p class="sr-only" data-filter-status role="status" aria-live="polite"></p><section class="collection-layout"><div class="catalog-toolbar"><button type="button" data-mobile-filter aria-expanded="false" aria-controls="collection-filters">${t("Filter", "Filtrer", "Filter")}</button><aside id="collection-filters" class="collection-filters" data-filters><form id="collection-filter-form" method="get" action="/collections/${handle}" data-collection-filter-form>${view && !Object.hasOwn(VIEWS, handle) ? `<input type="hidden" name="view" value="${view}">` : ""}<input type="hidden" name="sort_by" value="${sort}"><div class="filter-heading"><strong>${t("Filters", "Filtre", "Filter")}</strong><span><a data-clear-filters href="${escapeHtml(clearUrl)}">${t("Clear all", "Nullstill alle", "Alle löschen")}</a><button type="button" data-close-filters>${t("Close", "Lukk", "Schließen")}</button></span></div>${selectedSizes.length ? `<label class="include-sold-out"><input type="checkbox" name="include_sold_out" value="1"${parameters.get("include_sold_out") === "1" ? " checked" : ""}>${t("Include sold-out sizes", "Ta med utsolgte størrelser", "Ausverkaufte Größen einschließen")}</label>` : ""}${facets.filter((facet) => !selectedSizes.length && facet.key === "availability").map((facet) => structuredFilterGroup(facet, t)).join("")}${priceFacet}${facets.filter((facet) => facet.key !== "availability").map((facet) => structuredFilterGroup(facet, t)).join("")}<noscript><button class="apply-collection-filters" type="submit">${t("Apply filters", "Bruk filtre", "Filter anwenden")}</button></noscript></form></aside><span class="catalog-count"><b data-filter-count>${products.length}</b> ${t("items", "produkter", "Artikel")}</span>${sortMenu}</div>${notices}${active}<div data-collection-grid>${products.length ? productGrid(products, store.currency || "NOK", undefined, { locale }) : `<p class="empty-state" data-filter-empty>${t("No products match those filters. Try another size or clear the filters.", "Ingen produkter passer med filtrene. Prøv en annen størrelse, eller nullstill filtrene.", "Keine Produkte passen zu diesen Filtern. Versuche eine andere Größe oder lösche die Filter.")}</p>`}</div></section>`;
  const indexableParameters = new Set(["market"]);
  const hasNonCanonicalQuery = [...parameters.keys()].some((key) => !indexableParameters.has(key));
  return documentHtml({ title, description, path: `/collections/${handle}`, body, store, view, noindex: hasNonCanonicalQuery, image: products[0]?.images?.[0]?.url || "", localizeTitle: !curatedTitle });
}

function safeDescription(value) {
  const text = stripHtml(value);
  return text ? `<p>${escapeHtml(text)}</p>` : "";
}

function productSchema(product, availability, currency, market = "default", countries = ["NO"], pathPrefix = "") {
  const publicUrl = (path) => `${SITE_ORIGIN}${pathPrefix}${path}`;
  const productUrl = publicUrl(`/products/${product.handle}`);
  const returnPolicy = {
    "@type": "MerchantReturnPolicy",
    applicableCountry: countries,
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 30,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/FreeReturn",
    merchantReturnLink: publicUrl("/pages/returns"),
  };
  const offers = (product.variants || []).flatMap((variant) => {
    const price = Number(variant.price);
    if (!Number.isFinite(price) || price < 0 || !variant.id) return [];
    const variantUrl = `${productUrl}?${market !== "default" ? `market=${encodeURIComponent(market)}&` : ""}variant=${encodeURIComponent(variant.id)}`;
    const size = variant.options?.find((option) => /size/i.test(option.name))?.value;
    return [{
      "@type": "Offer",
      url: variantUrl,
      price,
      priceCurrency: currency,
      ...(variant.sku ? { sku: variant.sku } : {}),
      ...(availability[variant.id] == null ? {} : {
        availability: availability[variant.id] ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      }),
      itemCondition: "https://schema.org/NewCondition",
      name: [product.title, size].filter(Boolean).join(" · "),
      ...(size ? { size } : {}),
      ...(productColor(product) ? { color: productColor(product) } : {}),
      hasMerchantReturnPolicy: returnPolicy,
    }];
  });
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    url: productUrl,
    name: product.title,
    image: (product.images || []).map((item) => item.url).filter(Boolean),
    description: stripHtml(product.description || product.seoDescription || ""),
    brand: { "@type": "Brand", name: product.brand || "New Movements" },
    ...(product.productType ? { category: product.productType } : {}),
    offers,
  };
  return `<script type="application/ld+json">${JSON.stringify(schema).replaceAll("<", "\\u003c")}</script>`;
}

export function renderProductPage(store, product, availability = {}, context = {}) {
  const locale = context.locale || store?.locale;
  const t = translator(locale);
  const sourceProduct = product;
  const footwear = isFootwearProduct(product);
  const requestedView = selectedView(context);
  const composed = productView(product, requestedView);
  const view = composed ? requestedView : "";
  product = composed || product;
  const productUrl = viewUrl(`/products/${product.handle}`, view);
  const currency = store.currency || product.currency || "NOK";
  const variants = product.variants || [];
  const images = product.images || [];
  const first = variants[0];
  const initialVariant = variants.find((variant) => variant.id === context.url?.searchParams.get("variant")) || (footwear && variants.length > 1 ? null : variants.find((variant) => availability[variant.id] === true) || first);
  const initialSize = initialVariant?.options?.find((option) => /size/i.test(option.name))?.value || "";
  const options = (footwear && variants.length > 1 ? `<option value=""${initialVariant ? "" : " selected"}>${t("Select your size", "Velg størrelse", "Wähle deine Größe")}</option>` : "") + variants.map((variant) => {
    const label = variant.options?.map((item) => item.value).filter(Boolean).join(" / ") || variant.sku || t("Default", "Standard", "Standard");
    return `<option value="${escapeHtml(variant.id)}" data-label="${escapeHtml(label)}" data-price="${escapeHtml(variant.price)}" data-available="${availability[variant.id] === true ? "true" : availability[variant.id] === false ? "false" : "unknown"}"${variant.id === initialVariant?.id ? " selected" : ""}>${escapeHtml(label)}${availability[variant.id] === true ? "" : availability[variant.id] === false ? t(" — Sold out", " — utsolgt", " — Ausverkauft") : t(" — Check availability", " — sjekk tilgjengelighet", " — Verfügbarkeit prüfen")}</option>`;
  }).join("");
  const unavailableVariants = variants.filter((variant) => availability[variant.id] === false);
  const notifyForm = unavailableVariants.length ? `<details class="stock-notification" data-stock-notification${availability[initialVariant?.id] === false ? " open" : ""}><summary>${t("Notify me when my size is back", "Varsle meg når størrelsen er tilbake", "Benachrichtige mich, wenn meine Größe wieder da ist")}</summary><form method="post" action="/reai/stock/subscribe" data-stock-form><label>${t("Size", "Størrelse", "Größe")}<select name="variantId" required>${unavailableVariants.map((variant) => `<option value="${escapeHtml(variant.id)}"${variant.id === initialVariant?.id ? " selected" : ""}>${escapeHtml(variant.options?.map((option) => option.value).join(" / ") || variant.sku)}</option>`).join("")}</select></label><label>${t("Email address", "E-postadresse", "E-Mail-Adresse")}<input type="email" name="email" autocomplete="email" maxlength="254" required></label><label class="stock-consent"><input type="checkbox" name="consent" value="true" checked required><span>${t("Email me once when this size is back in stock. This doesn’t sign me up for the newsletter.", "Send meg én e-post når denne størrelsen er tilbake på lager. Det melder meg ikke på nyhetsbrevet.", "Sende mir einmalig eine E-Mail, wenn diese Größe wieder auf Lager ist. Dadurch melde ich mich nicht für den Newsletter an.")}</span></label><input type="hidden" name="returnTo" value="${escapeHtml(productUrl)}"><button type="submit">${t("Notify me", "Varsle meg", "Benachrichtige mich")}</button><p class="stock-status" data-stock-status role="status" aria-live="polite">${context.url?.searchParams.get("notification") === "requested" ? t("You’re on the list. We’ll email you once when this size is available.", "Du står på listen. Vi sender deg én e-post når størrelsen er tilgjengelig.", "Du stehst auf der Liste. Wir senden dir einmalig eine E-Mail, sobald diese Größe verfügbar ist.") : ""}</p><small>${t("One notification for this item and size. Requests expire after 180 days.", "Én varsling for dette produktet og denne størrelsen. Forespørsler utløper etter 180 dager.", "Eine Benachrichtigung für diesen Artikel und diese Größe. Anfragen verfallen nach 180 Tagen.")} <a href="/policies/privacy-policy">${t("Privacy policy", "Personvernerklæring", "Datenschutzerklärung")}</a></small></form></details>` : "";
  const gallery = images.length ? `<section class="product-gallery${images.length > 1 ? " has-thumbs" : ""}"><button type="button" class="product-main" data-gallery-main data-zoom-open aria-label="${t("Enlarge product image", "Vis produktbildet større", "Produktbild vergrößern")}">${responsiveImage(images[0], { alt: imageAltText(images[0], product.title, 0, locale), width: 1280, sizes: "(max-width: 900px) 100vw, (min-width: 1450px) 780px, 54vw", priority: true })}</button>${images.length > 1 ? `<div class="product-thumbs">${images.map((image, index) => `<button type="button" data-gallery-url="${escapeHtml(imageUrl(image, 1280))}" data-gallery-srcset="${escapeHtml(imageSrcset(image))}" data-gallery-alt="${escapeHtml(imageAltText(image, product.title, index, locale))}" aria-label="${t(`Show image ${index + 1}`, `Vis bilde ${index + 1}`, "Bild " + (index + 1) + " anzeigen")}" aria-current="${index === 0}">${responsiveImage(image, { alt: "", width: 320, sizes: "96px", loading: "lazy" })}</button>`).join("")}</div>` : ""}</section>` : '<section class="product-gallery product-placeholder">New Movements</section>';
  const family = productFamily(product);
  const colorProducts = (store.products || []).filter((item) => item.handle !== product.handle && productFamily(item) === family && productView(item, view));
  const colorSwatches = [product, ...colorProducts].map((item) => `<a class="product-color-swatch${item.handle === product.handle ? " is-selected" : ""}" data-color-link data-color-variants="${escapeHtml(JSON.stringify(item.variants.map((variant) => ({ id: variant.id, options: variant.options }))))}" href="${escapeHtml(colorProductUrl(item, view, initialVariant))}" aria-label="${escapeHtml(item.title)}"${item.handle === product.handle ? ' aria-current="page"' : ""}>${shoppingImages(productView(item, view))[0] ? responsiveImage(shoppingImages(productView(item, view))[0], { alt: "", width: 160, sizes: "88px", loading: "lazy" }) : ""}</a>`).join("");
  const sizeButtons = variants.map((item) => {
    const size = item.options?.find((option) => /size/i.test(option.name))?.value || item.options?.[0]?.value || item.sku || "Default";
    const inStock = availability[item.id] === true;
    return `<button type="button" class="product-size-button${item.id === initialVariant?.id ? " is-selected" : ""}${availability[item.id] === false ? " is-sold-out" : ""}" data-variant-choice="${escapeHtml(item.id)}" data-price="${escapeHtml(item.price)}" data-available="${inStock}"${inStock ? "" : ' aria-label="' + escapeHtml(availability[item.id] === false ? t(`EU ${size} — Sold out. Get notified when available.`, `EU ${size} – utsolgt. Få varsel når den er tilbake.`, "EU " + (size) + " — Ausverkauft. Benachrichtige mich, wenn verfügbar.") : t(`EU ${size} — Live availability could not be checked.`, `EU ${size} – vi klarte ikke å sjekke lagerstatus.`, "EU " + (size) + " — Live-Verfügbarkeit konnte nicht geprüft werden.")) + '"'} aria-pressed="${item.id === initialVariant?.id}">${escapeHtml(/^\d+(?:\.\d+)?$/.test(String(size)) ? `EU ${size}` : size)}</button>`;
  }).join("");
  const recommendations = recommendationCandidates(store, product, view).flatMap((item) => {
    const matching = initialSize ? item.variants.filter((variant) => variant.options?.some((option) => option.name.toLowerCase() === "size" && option.value === initialSize)) : item.variants;
    const stocked = matching.filter((variant) => availability[variant.id] === true);
    return stocked.length ? [{ ...item, variants: item.variants.map((variant) => ({ ...variant, available: availability[variant.id] === true })), view, selectedVariantId: initialSize ? stocked[0].id : undefined }] : [];
  }).slice(0, 4);
  const promises = footwear ? `<section class="product-promises"><div><strong>${t("Four generations of shoemakers", "Fire generasjoner skomakere", "Vier Generationen von Schuhmachern")}</strong><span>${t("since 1916", "siden 1916", "seit 1916")}</span></div><div><strong>${t("Designed in Norway", "Designet i Norge", "In Norwegen entworfen")}</strong><span>${t("Handcrafted in Portugal", "Håndlaget i Portugal", "Handgefertigt in Portugal")}</span></div><div><strong>${t("Premium Materials", "Førsteklasses materialer", "Hochwertige Materialien")}</strong><span>${t("Built to last, and to be recycled", "Laget for å vare og for å gjenvinnes", "Gemacht, um lange zu halten und recycelt zu werden")}</span></div></section>` : "";
  const parentCollections = publishedCollections(store).filter((item) => item.handle !== "all" && (item.products || []).some((member) => member.handle === product.handle));
  // Collection memberships are parallel, not ancestors. Show one relevant
  // route back, preferring the audience the shopper explicitly selected.
  const parentCollection = parentCollections.find((item) => item.handle === view) || parentCollections[0];
  const breadcrumbs = `<nav class="breadcrumbs" aria-label="${t("Breadcrumb", "Brødsmulesti", "Breadcrumb")}"><ol><li><a href="/collections">${t("Shop", "Handle", "Shop")}</a></li>${parentCollection ? `<li><a href="/collections/${escapeHtml(parentCollection.handle)}">${escapeHtml(parentCollection.title)}</a></li>` : ""}<li class="breadcrumb-current"><span aria-current="page">${escapeHtml(product.title)}</span></li></ol></nav>`;
  const body = `<section class="product-layout">${gallery}<div class="product-details">${breadcrumbs}<div class="product-heading"><h1>${escapeHtml(product.title)}</h1><p class="product-price" data-product-price>${priceRange(variants, currency)}</p></div>${viewSelector(`/products/${product.handle}`, view, { locale })}${view ? `<p class="size-view-note">EU ${VIEWS[view].minSize}–${VIEWS[view].maxSize}</p>` : ""}${colorSwatches ? `<div class="product-color-picker"><span>${t("Color", "Farge", "Farbe")}: ${escapeHtml(productColor(product))}</span><div class="product-color-grid">${colorSwatches}</div></div>` : ""}<div class="product-size-picker"><div class="product-size-heading"><span>${footwear ? t("Select size · EU", "Velg størrelse · EU", "Größe auswählen · EU") : t("Choose an option", "Velg et alternativ", "Wähle eine Option")}</span>${footwear ? `<a class="size-guide-link" href="${escapeHtml(sizeGuideUrl(sizeChartForProduct(sourceProduct), view, initialSize))}"${sizeChartForProduct(sourceProduct) ? " data-size-guide-open" : ""}>${t("Size guide ↗", "Størrelsesguide ↗", "Größenratgeber ↗")}</a>` : ""}</div><div class="product-size-grid">${sizeButtons}</div><select class="variant-fallback" aria-label="${t("Size / variant", "Størrelse / variant", "Größe / Variante")}" data-product-variant>${options}</select><p class="product-size-status" data-size-status role="status" aria-live="polite"></p></div><div class="purchase-row"><label>${t("Quantity", "Antall", "Menge")}<input type="number" value="1" min="1" max="20" inputmode="numeric" data-quantity></label><button type="button" data-add-to-cart data-id="${escapeHtml(product.id)}" data-handle="${escapeHtml(product.handle)}" data-title="${escapeHtml(product.title)}" data-url="${escapeHtml(productUrl)}" data-image="${escapeHtml(imageUrl(images[0], 480))}" data-image-alt="${escapeHtml(imageAltText(images[0], product.title, 0, locale))}" data-variant="${escapeHtml(initialVariant?.id || "")}" data-price="${escapeHtml(initialVariant?.price ?? "")}"${availability[initialVariant?.id] === true ? "" : " disabled"}>${!initialVariant ? t("Select your size", "Velg størrelse", "Wähle deine Größe") : availability[initialVariant?.id] === true ? t("Add to cart", "Legg i handlekurv", "In den Warenkorb") : availability[initialVariant?.id] === false ? t("Sold out", "Utsolgt", "Ausverkauft") : t("Check availability", "Sjekk tilgjengelighet", "Verfügbarkeit prüfen")}</button></div><div class="purchase-assurance"><p>${t("Free delivery · Taxes &amp; duties included", "Gratis levering · Avgifter og toll inkludert", "Kostenlose Lieferung · Steuern &amp; Abgaben inbegriffen")}</p><a href="/pages/returns">${t("Free returns within 30 days · Free exchanges ↗", "Gratis retur innen 30 dager · Gratis bytte ↗", "Kostenlose Rückgabe innerhalb von 30 Tagen · Kostenloser Umtausch ↗")}</a><a class="brand-review-link" href="${GOOGLE_REVIEWS_URL}" target="_blank" rel="noopener">${t("Read our customer reviews on Google ↗", "Les kundeanmeldelsene våre på Google ↗", "Lies unsere Kundenbewertungen auf Google ↗")}</a></div>${notifyForm}<div class="product-accordions"><details open><summary>${t("Details", "Detaljer", "Details")}</summary>${safeDescription(product.description || product.seoDescription)}</details>${footwear ? productFacts(product, t) : ""}<details><summary>${t("Shipping &amp; Delivery", "Frakt og levering", "Versand &amp; Lieferung")}</summary><p>${t("Free delivery with PostNord or Bring in Norway, Sweden and Denmark, and DHL Express for all other supported destinations. Taxes and duties are included, with no import charges on delivery. Choose your delivery country in the store header to see the available options in checkout.", "Gratis levering med PostNord eller Bring i Norge, Sverige og Danmark, og DHL Express til alle andre land vi sender til. Avgifter og toll er inkludert, og du betaler ingen importavgifter ved levering. Velg leveringsland øverst i butikken for å se alternativene i kassen.", "Kostenlose Lieferung mit PostNord oder Bring in Norwegen, Schweden und Dänemark sowie DHL Express für alle anderen unterstützten Zielorte. Steuern und Abgaben sind inbegriffen, ohne Einfuhrkosten bei der Lieferung. Wähle dein Lieferland im Store-Header, um die verfügbaren Optionen im Checkout zu sehen.")}</p></details><details><summary>${t("Returns &amp; Exchanges", "Retur og bytte", "Rückgabe &amp; Umtausch")}</summary><p><a href="/pages/returns">${t("Read our returns &amp; exchanges policy ↗", "Les vilkårene for retur og bytte ↗", "Lies unsere Richtlinie zu Rückgabe &amp; Umtausch ↗")}</a></p></details></div></div></section>${recommendations.length ? `<section class="recommendations"><header><h2>${t("You may also like", "Du vil kanskje også like", "Das könnte dir auch gefallen")}</h2></header>${productGrid(recommendations, currency, 4, { priorityCards: 0, locale })}</section>` : ""}${promises}${footwear ? renderSizeGuideDialog(locale) : ""}<dialog class="product-zoom" data-product-zoom aria-label="${t("Product image", "Produktbilde", "Produktbild")}"><button type="button" data-zoom-close aria-label="${t("Close enlarged image", "Lukk det store bildet", "Vergrößertes Bild schließen")}">${t("Close", "Lukk", "Schließen")} ×</button><img alt=""></dialog><div class="mobile-purchase" data-mobile-purchase><span>${escapeHtml(product.title)}</span><button type="button" data-mobile-purchase-action>${t("Choose size", "Velg størrelse", "Größe wählen")}</button></div>`;
  const curatedTitle = view ? "" : curatedMetaTitle(product);
  return documentHtml({ title: curatedTitle || productMetaTitle(product, view, locale), localizeTitle: !curatedTitle, description: curatedMetaDescription(product) || stripHtml(product.description) || product.title, path: `/products/${product.handle}`, body, store, view, noindex: Boolean(view), schema: productSchema(sourceProduct, availability, currency, store.marketHandle, store.markets?.flatMap((market) => market.countries || []), context.pathPrefix || store?.pathPrefix || ""), image: images[0]?.url || "", type: "product" });
}

export function renderMessagePage(store, { title, heading, text }) {
  const t = translator(store?.locale);
  return documentHtml({ title, localizeTitle: false, description: text, path: "/404.html", store, body: `<section class="message-page"><p class="eyebrow">New Movements</p><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(text)}</p><a class="outline-button" href="/collections/all">${t("Continue shopping", "Fortsett å handle", "Weiter einkaufen")}</a></section>` });
}

export const renderNotFoundPage = (store) => {
  const t = translator(store?.locale);
  return renderMessagePage(store, { title: t("Page Not Found", "Siden ble ikke funnet", "Seite nicht gefunden"), heading: t("Page not found", "Siden ble ikke funnet", "Seite nicht gefunden"), text: t("The page may have moved, or the product is no longer published.", "Siden kan ha blitt flyttet, eller produktet er ikke lenger publisert.", "Die Seite wurde möglicherweise verschoben oder das Produkt ist nicht mehr veröffentlicht.") });
};
export const renderUnavailablePage = (store) => {
  const t = translator(store?.locale);
  return renderMessagePage(store, { title: t("Shoe Store Temporarily Unavailable", "Skobutikken er midlertidig utilgjengelig", "Shoe Store vorübergehend nicht verfügbar"), heading: t("We’ll be right back", "Vi er snart tilbake", "Wir sind gleich zurück"), text: t("We could not load the live catalog. Please try again shortly.", "Vi klarte ikke å laste katalogen. Prøv igjen om litt.", "Wir konnten den Live-Katalog nicht laden. Bitte versuche es in Kürze erneut.") });
};

export function renderSitemap(store) {
  const paths = [...STATIC_PATHS, "/collections/all", ...publishedCollections(store).map((item) => `/collections/${item.handle}`), ...(store.products || []).map((item) => `/products/${item.handle}`)];
  const prefix = store?.pathPrefix || "";
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(paths.map(canonicalPath))].filter((path) => !NON_INDEXABLE_PATHS.has(path)).map((path) => `  <url><loc>${SITE_ORIGIN}${prefix}${path === "/" ? "/" : path}</loc></url>`).join("\n")}\n</urlset>\n`;
}

export const catalogProductsForRequest = (products, context) => {
  const membership = new Map();
  for (const collection of context.collections || []) {
    for (const member of collection.products || []) {
      const titles = membership.get(member.handle) || [];
      titles.push(collection.title);
      membership.set(member.handle, titles);
    }
  }
  return productsForView(products, selectedView(context)).map((product) => ({
    ...product, searchTerms: (membership.get(product.handle) || []).join(" "),
  }));
};

function shoppingImages(product) {
  const images = (product.images || []).filter((image) => image?.url);
  return [...images.filter(isProductShot), ...images.filter((image) => !isProductShot(image))];
}
export const searchImage = (product) => shoppingImages(product)[0];

function productFamily(product) {
  return ((!/^(shoes?|footwear|sneakers?|boots?|loafers?)$/i.test(product.productType || "") && product.productType) || product.title.replace(/\s*\([^)]*\)\s*$/, "")).trim().toLowerCase();
}
function productColor(product) {
  return product.attributes?.find((attribute) => attribute.key === "color")?.values.map((value) => value.label).join(" / ") || product.title.match(/\(([^)]+)\)\s*$/)?.[1] || product.title;
}
function colorProductUrl(product, view, selected) {
  const url = new URL(viewUrl(`/products/${product.handle}`, view), SITE_ORIGIN);
  const match = selected?.options?.length && product.variants.find((variant) => selected.options.every((option) => variant.options?.some((entry) => entry.name === option.name && entry.value === option.value)));
  if (match) url.searchParams.set("variant", match.id);
  return url.pathname + url.search;
}
function productFacts(product, t) {
  const values = (key) => product.attributes?.find((attribute) => attribute.key === key)?.values.map((value) => value.label) || [];
  const features = values("shoe-features").filter((value) => !/unisex/i.test(value));
  const materials = values("footwear-material");
  const material = materials.join(" / ") || product.material || "";
  const delicate = /suede|nubuck/i.test(material);
  const leather = /leather/i.test(material);
  const care = delicate
    ? t("Allow to dry naturally, then use a soft suede brush. Test any care product on a hidden area first.", "La skoene tørke naturlig, og bruk deretter en myk semsket børste. Test alltid pleieprodukter på et skjult område først.", "Natürlich trocknen lassen und dann eine weiche Wildlederbürste verwenden. Teste jedes Pflegeprodukt zuerst an einer unauffälligen Stelle.")
    : leather
      ? t("Wipe gently with a damp cloth and allow to dry naturally. Use a suitable leather conditioner, tested on a hidden area first.", "Tørk forsiktig av med en fuktig klut, og la skoene tørke naturlig. Bruk en egnet lærbalsam, testet på et skjult område først.", "Vorsichtig mit einem feuchten Tuch abwischen und natürlich trocknen lassen. Verwende eine geeignete Lederpflege, die du zuerst an einer unauffälligen Stelle testest.")
      : t("Remove loose dirt with a soft brush. Clean gently and let your shoes dry naturally away from direct heat.", "Fjern løst smuss med en myk børste. Rengjør forsiktig, og la skoene tørke naturlig uten direkte varme.", "Loseren Schmutz mit einer weichen Bürste entfernen. Sanft reinigen und deine Schuhe natürlich trocknen lassen, fern von direkter Hitze.");
  return `${features.length ? `<details><summary>${t("Features", "Egenskaper", "Eigenschaften")}</summary><ul>${features.map((value) => `<li>${escapeHtml(value)}</li>`).join("")}</ul></details>` : ""}<details><summary>${t("Materials &amp; care", "Materialer og pleie", "Materialien &amp; Pflege")}</summary>${material ? `<p>${escapeHtml(material)}</p>` : ""}<p>${care}</p><a href="/pages/shoe-care">${t("Care guide ↗", "Pleieguide ↗", "Pflegeguide ↗")}</a></details>`;
}

function recommendationCandidates(store, product, view) {
  return (store.products || []).map((item) => productView(item, view)).filter(Boolean)
    .filter((item) => item.handle !== product.handle && productFamily(item) !== productFamily(product) && isFootwearProduct(item) === isFootwearProduct(product))
    .sort((left, right) => Number(right.category?.id === product.category?.id) - Number(left.category?.id === product.category?.id)).slice(0, 8);
}
export function productAvailabilityVariants(store, product, context) {
  const selected = product.variants.find((variant) => variant.id === context.url?.searchParams.get("variant"));
  const size = selected?.options?.find((option) => option.name.toLowerCase() === "size")?.value;
  const alternatives = recommendationCandidates(store, product, selectedView(context));
  return [...product.variants, ...alternatives.flatMap((item) => item.variants.filter((variant) => !size || variant.options?.some((option) => option.name.toLowerCase() === "size" && option.value === size)))];
}
