import { canonicalPath } from "./routes.mjs";
import { renderCompactLegalFooter } from "../../packages/reai-cloudflare-storefront/footer.mjs";

export const SITE_ORIGIN = "https://newmovements.com";
export const HANDLE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const STORE_SCRIPT = "/assets/store.js?v=12";
export const STORE_STYLE = "/assets/store.css?v=25";
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
const VIRTUAL_COLLECTIONS = [
  ["new-in", "New in", []], ["leather-footwear", "Leather footwear", ["leather"]],
  ["technical-textile-shoes", "Technical textile shoes", ["textile", "mesh"]],
  ["circular-collection", "Circular collection", ["circular", "recycled"]],
  ["women", "Women", []], ["men", "Men", []], ["gift-card", "Gift card", ["gift card"]],
  ["sandals", "Sandals", ["sandal"]], ["classic", "Classics", ["classic", "original"]],
  ["footwear", "Footwear", []], ["allrounder", "Allrounder", ["allrounder"]],
  ["original", "Original", ["original"]], ["allrounder-y", "Allrounder Y", ["allrounder y"]],
  ["norwegian-sneaker", "Norwegian Sneaker", ["norwegian sneaker"]], ["allrounder-s", "Allrounder S", ["allrounder s"]],
  ["allrounder-series", "Allrounder Series", ["allrounder"]], ["wool-lined", "Wool lined", ["wool"]],
  ["allrounder-e-sneaker", "Allrounder E", ["allrounder e"]], ["zen-sneaker", "Zen Sneaker", ["zen"]],
  ["autumn-winter", "Autumn / Winter", ["boot", "wool", "winter", "moss", "cloud", "flow"]],
  ["spring-summer", "Spring / Summer", ["sandal", "loafer", "sneaker", "zen"]],
  ["cloud-boot", "Cloud Boot", ["cloud"]], ["waterproof", "Waterproof", ["waterproof"]],
  ["water-resistant", "Water resistant", ["water resistant"]], ["flow-boot", "Flow Boot", ["flow"]],
  ["zipper-boot", "Zipper Boot", ["zipper"]], ["boots", "Boots", ["boot"]],
  ["nm-loafer", "NM Loafer", ["loafer"]], ["archive", "Archive", []],
  ["shoe-care", "Shoe care", ["care", "brush", "spray", "wax"]], ["shoe-care-1", "Shoe care", ["care", "brush", "spray", "wax"]],
  ["moss", "Moss", ["moss"]], ["white-sneakers", "White sneakers", ["white"]],
  ["top-picks", "Top picks", []], ["loafers-low-tops", "Loafers & low tops", ["loafer", "low top"]],
  ["sneakers", "Sneakers", ["sneaker", "allrounder", "zen", "original"]], ["space-boots", "Space Boots", ["space"]],
].map(([handle, title, terms]) => ({ handle, title, terms }));
const STATIC_PATHS = [
  "/", "/cart", "/search", "/pages/evensen-story", "/pages/our-philosophy",
  "/pages/recycle", "/pages/materials", "/pages/contact-us", "/pages/returns",
  "/pages/shoe-care",
  "/pages/size-guide", "/pages/terms-and-conditions", "/policies/privacy-policy",
  "/pages/join", "/pages/career-opportunities", "/pages/warranty-policy",
  "/policies/refund-policy", "/policies/shipping-policy", "/order/complete", "/blogs/news",
  "/blogs/news/new-movements-sneakers-and-fashion",
  "/blogs/news/an-update-from-our-founder-and-designer", "/blogs/news/opening-of-our-flagship-store",
  "/blogs/news/the-nm-loafer-a-modern-classic-reimagined",
  "/blogs/news/product-story-zen-mindful-design-for-modern-movement",
  "/blogs/news/shaping-the-future-of-footwear-together-with-sintef",
  "/blogs/news/finansavisen-wrote-about-us", "/blogs/news/afterwork-at-new-movements",
];

export const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#39;");

export const stripHtml = (value = "") => String(value)
  .replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ").replace(/&nbsp;|&amp;/g, " ").replace(/\s+/g, " ").trim();

export const formatMoney = (value, currency = "NOK") => new Intl.NumberFormat("en-NO", {
  style: "currency", currency, currencyDisplay: "code", maximumFractionDigits: Number(value) % 1 ? 2 : 0,
}).format(Number(value));

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
    : new Intl.NumberFormat("nb-NO", { maximumFractionDigits: Number(value) % 1 ? 2 : 0 }).format(Number(value));
  if (!values.length) return formatPrice(0);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  return minimum === maximum ? formatPrice(minimum) : `${formatPrice(minimum)} – ${formatPrice(maximum)}`;
};

export function matchRoute(pathname) {
  const path = pathname === "/index.html" ? "/" : pathname;
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

function virtualCollection(store, handle) {
  const definition = VIRTUAL_COLLECTIONS.find((item) => item.handle === handle);
  if (!definition) return null;
  const products = (store?.products || []).filter((product) => {
    if (!definition.terms.length) return true;
    const text = `${product.title} ${product.brand || ""} ${stripHtml(product.description || "")} ${(product.variants || []).flatMap((variant) => variant.options || []).map((option) => option.value).join(" ")}`.toLowerCase();
    return definition.terms.some((term) => text.includes(term));
  });
  return { ...definition, description: `Explore ${definition.title.toLowerCase()} from New Movements.`, products, virtual: true };
}

export const collectionByHandle = (store, handle) => (store?.collections || []).find((item) => item.handle === handle) || virtualCollection(store, handle);
export const productByHandle = (store, handle) => (store?.products || []).find((item) => item.handle === handle) || null;
export const publishedCollections = (store) => {
  const native = (store?.collections || []).filter((item) => item.products?.length);
  const handles = new Set(native.map((item) => item.handle));
  return [...native, ...VIRTUAL_COLLECTIONS.filter((item) => !handles.has(item.handle)).map((item) => virtualCollection(store, item.handle)).filter((item) => item?.products?.length)];
};

function collectionProducts(store, collection) {
  if (collection?.virtual) return collection.products || [];
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

function nav(store) {
  return [
    ["new-in", "New arrivals"],
    ["sneakers", "Sneakers"],
    ["loafers-low-tops", "Loafers"],
    ["boots", "Boots"],
  ].map(([handle, label]) => `<a href="/collections/${handle}">${label}</a>`).join("");
}

function chrome(store, active = "") {
  const legal = renderCompactLegalFooter({
    owner: "New Movements – Oslo",
    refundHref: "/policies/refund-policy",
    privacyHref: "/policies/privacy-policy",
    termsHref: "/pages/terms-and-conditions",
    locale: "en",
  });
  return {
    header: `<a class="skip-link" href="#main">Skip to content</a><div class="announcement"><span aria-hidden="true">‹</span><span>Taxes &amp; Duties included.</span><span aria-hidden="true">›</span></div><header class="site-header"><div class="site-nav"><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span><span class="sr-only">Menu</span></button><nav class="desktop-nav" aria-label="Primary"><button type="button" data-mega-toggle aria-expanded="false" aria-controls="mega-menu">Shop</button><a href="/pages/evensen-story" data-about-toggle aria-expanded="false" aria-controls="about-menu">About</a><a href="/pages/join">Join</a></nav><a class="wordmark" href="/" aria-label="New Movements home"><img src="${BRAND_LOGO}" alt="New Movements – Oslo" width="400" height="72"></a><nav class="utility-nav" aria-label="Store utilities"><span class="currency-label">${escapeHtml(store.currency || "NOK")}⌄</span><button type="button" data-search-open aria-label="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg></button><a class="account-link" href="/pages/contact-us" aria-label="Account and customer service"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="3.5"></circle><path d="M5.5 21c.5-5 2.6-7.5 6.5-7.5s6 2.5 6.5 7.5"></path></svg></a><button type="button" data-cart-open aria-label="Shopping bag"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 13H6L5 8Z"></path><path d="M9 8V6a3 3 0 0 1 6 0v2"></path></svg><span class="cart-badge" data-cart-count>0</span></button></nav></div><div class="mega-menu" id="mega-menu" data-mega-menu data-open="false" aria-hidden="true"><div><p>Style</p><a href="/collections/new-in">New arrivals</a><a href="/collections/sneakers">Sneakers</a><a href="/collections/loafers-low-tops">Loafers</a><a href="/collections/boots">Boots</a><a href="/collections/all">All shoes (Unisex)</a></div><div><p>Season</p><a href="/collections/spring-summer">Spring &amp; summer</a><a href="/collections/autumn-winter">Autumn &amp; winter</a></div><div><p>Discover</p><a href="/collections/gift-card">Gift card</a><a href="/collections/shoe-care">Shoe care</a><a href="/pages/recycle">20% Recycle</a></div><div><p>About</p><a href="/pages/evensen-story">Our story</a><a href="/pages/our-philosophy">Our philosophy</a><a href="/pages/materials">Materials &amp; production</a><a href="/blogs/news">Journal</a></div></div><div class="about-menu" id="about-menu" data-about-menu data-open="false" aria-hidden="true"><nav aria-label="About"><a href="/pages/evensen-story">Our Story</a><a href="/pages/our-philosophy">Our Philosophy</a><a href="/pages/recycle">20% Recycle</a><a href="/pages/materials">Materials</a><a href="/blogs/news">Journal</a></nav></div><nav class="mobile-nav" id="mobile-nav" data-mobile-nav>${nav(store)}<a href="/collections/all">All shoes</a><a href="/pages/evensen-story">Our story</a><a href="/pages/materials">Materials</a><a href="/blogs/news">Journal</a></nav></header><div class="mega-menu-backdrop" data-mega-backdrop aria-hidden="true"></div><div class="drawer-backdrop" data-drawer-backdrop hidden></div><aside class="store-drawer search-drawer" aria-label="Search" aria-hidden="true" data-search-drawer><header><h2>Search</h2><button type="button" data-drawer-close aria-label="Close search">Close</button></header><form role="search" data-predictive-search><label class="sr-only" for="predictive-query">Search products</label><input id="predictive-query" name="q" type="search" autocomplete="off" placeholder="Search shoes, styles, materials"><button type="submit">View all</button></form><p data-predictive-status>Start typing to search the live catalog.</p><div class="predictive-results" data-predictive-results></div></aside><aside class="store-drawer cart-drawer" aria-label="Shopping bag" aria-hidden="true" data-cart-drawer><header><h2>Your bag</h2><button type="button" data-drawer-close aria-label="Close bag">Close</button></header><div data-drawer-cart-items></div><footer><p><span>Subtotal</span><strong data-drawer-subtotal>NOK 0</strong></p><a href="/cart">View bag</a></footer></aside>`,
    footer: `<footer class="site-footer"><div class="footer-grid"><div><a class="footer-wordmark" href="/"><img src="${BRAND_LOGO}" alt="New Movements – Oslo" width="400" height="72"></a></div><div><h2>About</h2><a href="/pages/contact-us">Contact us</a><a href="/pages/recycle">Recycle</a><a href="/pages/career-opportunities">Careers</a><a href="/pages/returns">Returns</a><a href="/policies/privacy-policy">Privacy policy</a><a href="/pages/terms-and-conditions">Terms and conditions</a><a href="/pages/size-guide">Size guide</a></div><div><h2>Learn</h2><a href="/pages/evensen-story">Our story</a><a href="/pages/our-philosophy">Our philosophy</a><a href="/pages/materials">Materials</a><a href="/blogs/news">Journal</a></div><div><h2>Shop</h2>${nav(store)}<a href="/collections/all">All shoes</a></div><div class="footer-story"><h2>Our Story</h2><p>New Movements builds on a family tradition that started in 1916, when Johnny Evensen set out to create quality products that could withstand the Nordic seasons and last for generations.</p><a href="/pages/evensen-story">Continue reading →</a></div></div><section class="newsletter"><p>Join the community.</p><form data-newsletter><label for="newsletter-email">Subscribe for exclusive updates on drops, products &amp; events.</label><div><input id="newsletter-email" type="email" autocomplete="email" placeholder="Email"><button type="submit">Sign up</button></div><small data-newsletter-status></small></form></section><div class="footer-utilities"><div class="payment-methods" aria-label="Accepted payment methods"><span>AMEX</span><span>Apple Pay</span><span>Mastercard</span><span>Visa</span></div><nav aria-label="Social media"><a href="https://www.facebook.com/newmovements" rel="external">Facebook</a><a href="https://www.instagram.com/newmovements" rel="external">Instagram</a><a href="https://www.linkedin.com/company/newmovements" rel="external">LinkedIn</a></nav></div>${legal}</footer><div class="toast" role="status" aria-live="polite" data-cart-toast hidden></div>`,
  };
}

function documentHtml({ title, description, path, body, store, schema = "", image = "", type = "website" }) {
  const { header, footer } = chrome(store);
  const canonical = `${SITE_ORIGIN}${path}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="theme-color" content="#ffffff"><link rel="canonical" href="${escapeHtml(canonical)}"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://app.reai.no" crossorigin><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:type" content="${type}">${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ""}<link rel="stylesheet" href="${STORE_STYLE}"><script type="module" src="${STORE_SCRIPT}"></script>${schema}</head><body>${header}<main id="main">${body}</main>${footer}</body></html>`;
}

function productCard(product, currency = "NOK", priority = false, includeCurrency = true) {
  const image = product.images?.[0];
  const minimumPrice = Math.min(...(product.variants || []).map((variant) => Number(variant.price)).filter(Number.isFinite));
  const optionValues = (product.variants || []).flatMap((variant) => variant.options || []).map((option) => option.value).join(" ").toLowerCase();
  const searchText = `${product.title} ${product.brand || ""} ${product.description || ""} ${optionValues}`.toLowerCase();
  const type = productType(product.title).toLowerCase();
  const availability = (product.variants || []).some((variant) => variant.available === true || variant.available === undefined || Number(variant.inventoryQuantity) > 0) ? "in-stock" : "out-of-stock";
  return `<article class="product-card" data-product-title="${escapeHtml(product.title.toLowerCase())}" data-product-price="${Number.isFinite(minimumPrice) ? minimumPrice : 0}" data-product-options="${escapeHtml(optionValues)}" data-product-search="${escapeHtml(searchText)}" data-product-type="${escapeHtml(type)}" data-product-availability="${availability}"><a class="product-media" href="/products/${escapeHtml(product.handle)}">${responsiveImage(image, { alt: image?.alt || product.title, width: 640, sizes: "(max-width: 700px) 50vw, 25vw", loading: priority ? undefined : "lazy", priority })}<span class="card-action">Choose</span></a><div class="product-card-copy"><h3><a href="/products/${escapeHtml(product.handle)}">${escapeHtml(product.title)}</a></h3><p>${priceRange(product.variants, currency, includeCurrency)}</p></div></article>`;
}

function productType(title) {
  const name = title.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const families = [
    "High Flow Boot", "High Space Boot", "Low Cloud Boot", "Norwegian Sneaker",
    "Original Nubuck", "Allrounder E", "Allrounder S", "Allrounder Y",
    "Cloud Boot", "Flow Boot", "Space Boot", "Zipper Boot", "Allrounder",
    "Classic", "Loafer", "Moss", "Original", "Zen",
  ];
  if (/gift card/i.test(name)) return "Gift Cards";
  if (/spray|cleaner|wax|waterproof|insole/i.test(name)) return "Shoe Accessories";
  return families.find((family) => name.toLowerCase().startsWith(family.toLowerCase())) || name;
}

function productGrid(products, currency, limit, className = "", includeCurrency = true) {
  const entries = typeof limit === "number" ? products.slice(0, limit) : products;
  if (!entries.length) return '<p class="empty-state">No published products are available yet.</p>';
  return `<div class="product-grid${className ? ` ${className}` : ""}">${entries.map((item, index) => productCard(item, currency, index < 2, includeCurrency)).join("")}</div>`;
}

function findCollection(store, needles) {
  return publishedCollections(store).find((item) => needles.some((needle) => item.handle.includes(needle) || item.title.toLowerCase().includes(needle)));
}

function facetValues(products, optionName) {
  return [...new Set(products.flatMap((product) => (product.variants || []).flatMap((variant) => variant.options || []))
    .filter((option) => option.name.toLowerCase().includes(optionName))
    .map((option) => option.value).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
}

function filterGroup(name, values) {
  if (!values.length) return "";
  return `<details name="collection-facet"><summary>${escapeHtml(name)}</summary><div class="facet-options">${values.map((value) => `<label><input type="checkbox" value="${escapeHtml(value.toLowerCase())}" data-facet="${escapeHtml(name.toLowerCase())}"><span>${escapeHtml(value)}</span></label>`).join("")}</div></details>`;
}

const COLOR_SWATCHES = {
  beige: "#ead8ab", black: "#000000", blue: "#0d5dcc", brown: "#955731",
  gray: "#8e8e8e", grey: "#8e8e8e", green: "#08a73d", navy: "#30238f",
  olive: "#6f7040", orange: "#ff8200", pink: "#f6b8c6", turquoise: "#43a9aa",
  white: "#ffffff",
};
const COLOR_ORDER = ["beige", "black", "blue", "brown", "gray", "grey", "green", "navy", "orange", "olive", "pink", "turquoise", "white"];

function colorFilterGroup(values) {
  if (!values.length) return "";
  const order = new Map(COLOR_ORDER.map((value, index) => [value, index]));
  const sorted = [...values].sort((left, right) => {
    const leftRank = order.get(left.toLowerCase()) ?? COLOR_ORDER.length;
    const rightRank = order.get(right.toLowerCase()) ?? COLOR_ORDER.length;
    return leftRank - rightRank || left.localeCompare(right);
  });
  const options = sorted.map((value) => {
    const key = value.toLowerCase();
    const label = key === "grey" ? "Gray" : value;
    const swatch = COLOR_SWATCHES[key] || "#d8d8d8";
    return `<label class="color-option"><input type="checkbox" value="${escapeHtml(key)}" data-facet="color" aria-label="${escapeHtml(label)}"><span class="color-swatch" style="--swatch-color:${swatch}" aria-hidden="true"></span><span>${escapeHtml(label)}</span></label>`;
  }).join("");
  return `<details class="color-facet" name="collection-facet"><summary>Color</summary><div class="facet-options color-options">${options}</div></details>`;
}

export function renderHomePage(store) {
  const currency = store.currency || "NOK";
  const arrivals = findCollection(store, ["new-arrival", "new"]);
  const preferredHandles = ["allrounder-y-white", "allrounder-y-full-black", "allrounder-y-black-nordic-grey", "allrounder-y-smooth-forest", "allrounder-y-beige-smooth-forest", "allrounder-y-beige-sand"];
  const preferredProducts = preferredHandles.map((handle) => productByHandle(store, handle)).filter(Boolean);
  const products = preferredProducts.length >= 5 ? preferredProducts : (collectionProducts(store, arrivals).length ? collectionProducts(store, arrivals) : (store.products || []));
  const sneakers = collectionByHandle(store, "sneakers") || findCollection(store, ["sneaker"]);
  const loafers = collectionByHandle(store, "loafers-low-tops") || findCollection(store, ["loafer", "low-hiker"]);
  const hero = `<section class="home-hero"><a class="home-hero-panel" href="/collections/women"><img src="${HOME_HERO_IMAGES[0]}" alt="New Movements brown footwear styled in Oslo" width="1920" height="1800" fetchpriority="high"><span>Shop women's</span></a><a class="home-hero-panel" href="/collections/men"><img src="${HOME_HERO_IMAGES[1]}" alt="Brown New Movements shoe worn outdoors" width="1920" height="1800" fetchpriority="high"><span>Shop men's</span></a></section>`;
  const promises = `<section class="promise-grid"><a href="/pages/evensen-story"><strong>Fourth generation shoemaker</strong><span>Read the Evensen story</span></a><a href="/pages/our-philosophy"><strong>Designed in Oslo</strong><span>Hand-crafted in Portugal</span></a><a href="/pages/materials"><strong>Premium materials</strong><span>Built to last, and to be recycled</span></a></section>`;
  const categoryCards = [[sneakers, "Sneakers"], [loafers, "Low Hikers & Loafers"]].filter(([collection]) => Boolean(collection)).map(([collection, label]) => {
    const product = collectionProducts(store, collection).find((item) => item.images?.[0]);
    return `<a class="category-card" href="/collections/${escapeHtml(collection.handle)}">${product ? responsiveImage(product.images[0], { alt: product.images[0].alt || label, width: 960, sizes: "(max-width: 760px) 100vw, 50vw", loading: "lazy" }) : ""}<span><small>Sizes 35–47</small><strong>${escapeHtml(label)}</strong><em>Shop now</em></span></a>`;
  }).join("");
  const community = `<section class="community"><img src="${COMMUNITY_IMAGE}" alt="New Movements Community Center storefront at Steen & Strøm in Oslo" width="1440" height="1000" loading="lazy"><div><p class="eyebrow">NM Community Center</p><h2>Flagship store in Oslo</h2><p>Visit our NM Community Center in Steen & Strøm, Scandinavia's oldest department store, to experience our products and be part of the journey towards a circular future.</p><p>We're looking forward to welcoming you!</p><nav><a href="${DIRECTIONS_URL}" rel="external">⌖ Get directions</a><a href="/pages/contact-us">◌ Get in touch</a></nav></div></section><section class="review-strip"><div><strong>New Movements</strong><span>★★★★★</span><small>65 Google Reviews</small></div><a href="https://www.google.com/search?q=New+Movements+Oslo+reviews" rel="external"><strong>Our customers say it best.</strong><span>Read reviews on Google →</span></a></section>`;
  const body = `${hero}${promises}<section class="catalog-section"><header><h1>Women & Men New Arrivals</h1><a href="${arrivals ? `/collections/${arrivals.handle}` : "/collections/all"}">View all</a></header>${productGrid(products, currency, 6, "home-product-strip")}</section>${categoryCards ? `<section class="category-grid">${categoryCards}</section>` : ""}${community}`;
  return documentHtml({ title: "New Movements – Oslo", description: "Unisex footwear designed in Oslo and handcrafted in Portugal for a circular future.", path: "/", body, store, image: HOME_HERO_IMAGES[0] });
}

export function renderStoryPage(store) {
  const arrivals = findCollection(store, ["new-arrival", "new"]);
  const preferredHandles = ["allrounder-y-white", "allrounder-y-full-black", "allrounder-y-black-nordic-grey", "allrounder-y-smooth-forest", "allrounder-y-beige-smooth-forest", "allrounder-y-beige-sand"];
  const preferredProducts = preferredHandles.map((handle) => productByHandle(store, handle)).filter(Boolean);
  const products = preferredProducts.length >= 4 ? preferredProducts : (collectionProducts(store, arrivals).length ? collectionProducts(store, arrivals) : (store.products || []));
  const storyImage = (src, alt) => `<figure class="story-image"><img src="${src}" alt="${escapeHtml(alt)}" width="672" loading="lazy" decoding="async"></figure>`;
  const story = `<article class="story-copy"><h1>Our Story</h1><p>Evensen builds on a family tradition that started in 1916, when Johnny Evensen set out to create quality products that could withstand the Nordic seasons and last for generations. These values became the foundation for a family tradition of heritage craftsmanship.</p><p>Today, they form the basis of our commitment to our design philosophy and European production, with repair and recycling services. A product is only as good as the materials and people behind it.</p>${storyImage("/brand-assets/story-johnny.jpg", "Johnny Evensen, first generation shoemaker")}<p>That’s why our fabrics and production choices lead each decision, with price following. Our products are worn, tested, and improved in real conditions—from cities to fjords—to meet the highest standards, for you.</p><section><h2>Johnny Evensen</h2><p>Master shoemaker Nils Jonny Evensen was born in 1893 in Oslo. He served his apprenticeship under royal court shoemaker H. A. Solberg in Oslo. Further education included a pattern-making course in Germany and study stays in Leipzig and Nuremberg. He worked in Denmark until 1916. Many will still remember the shoemaker in the small house built by Peder Dahl next to Øiestad’s house on Osloveien, also known as Grytebua. The workshop, called Askim Shoe Repair Workshop, was run by Rolf Evensen and his father, and remained in operation well into the years after the war. In addition to ordinary repair work and the production of new footwear, they also stitched football boots.</p><p class="story-source">— Original text from Askim museum, Norway</p></section>${storyImage("/brand-assets/story-rolf.jpg", "Rolf Johnny Evensen, second generation shoemaker")}<section><h2>Rolf Johnny Evensen</h2><p>Born in 1918 in Stavern. Apprenticed under his father and qualified as a shoemaker. He served as foreman at Norrøna Skofabrikk outside Hamar until retirement. In 1936, he crafted bespoke football boots called “Even Spesial,” tailored to each individual player.</p><p>Proverbs sometimes receive confirmation in the most surprising ways. “Necessity teaches a naked woman to spin,” goes an old proverb, but Rolf Evensen could testify that necessity also teaches shoeless people to shoe themselves. During the war, people brought old handbags, suitcases, and similar items to be converted into footwear whenever possible. A suitcase on one’s feet was preferable to the paper or fish-skin shoes of the time. In 1954, Rolf Evensen left the business, while Evensen senior continued for a while longer in the old premises.</p><p class="story-source">— Original text from Askim museum, Norway</p></section>${storyImage("/brand-assets/story-knut.jpg", "Knut Evensen, third generation shoemaker")}<section class="story-generation story-generation--brief"><h2>Knut Evensen</h2><p>Born in 1954 in Hamar. He followed in his father’s footsteps, made moccasins, and worked in his father’s factory.</p></section>${storyImage("/brand-assets/story-martin.jpg", "Martin Evensen, founder of New Movements")}<section class="story-generation story-generation--brief"><h2>Martin Evensen</h2><p>Born in 1990 in Oslo. He studied retail and shoe design at the Academy of Art University in San Francisco. In 2017, Martin Evensen, fourth-generation cobbler and founder of New Movements, chose to take that legacy in a new direction: one defined by circularity, innovation, and a modern understanding of what responsible craftsmanship looks like.</p></section></article>`;
  const rail = `<section class="story-products" aria-labelledby="story-products-title"><header><h2 id="story-products-title">Fresh of the truck</h2><a href="${arrivals ? `/collections/${arrivals.handle}` : "/collections/all"}">View all</a></header>${productGrid(products, store.currency || "NOK", 8, "story-product-rail", false)}</section>`;
  return documentHtml({ title: "Our Story – New Movements – Oslo", description: "Four generations of Norwegian shoemaking, from Johnny Evensen in 1916 to New Movements today.", path: "/pages/evensen-story", body: `${story}${rail}`, store, image: products[0]?.images?.[0]?.url || "" });
}

function renderMaterialsPage(store) {
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
  const guide = `<section class="materials-page"><article class="materials-guide"><h1 class="sr-only">Shoe Care</h1><p>At New Movements, we create products that improve lives through comfort and conscientious design. Our commitment to quality is rooted in our heritage, inspired by Rolf Evensen, who repurposed suitcases into durable footwear during wartime shortages. Today, we honor that legacy by using premium, circular materials that are built to last and designed to be renewed.</p><p>Caring for your shoes is a vital part of closing the loop. By maintaining your materials, you extend their journey and reduce environmental impact.</p><figure><img src="/brand-assets/materials-recycled-rubber.webp" alt="Recycled rubber granules prepared for New Movements footwear" width="4032" height="3024" loading="eager" decoding="async"></figure><h2>Master Your Materials</h2><p>Every material we select requires specific attention to maintain its performance and aesthetic.</p><h3>Smooth Gold-Certified Leather</h3><p>Sourced from LWG Gold-rated tanneries, this Italian leather is thick, soft, and durable. Leather needs hydration to stay flexible. Regularly apply a high-quality leather wax to prevent drying or cracking. Finish with a protection spray to shield against water and stains.</p><h3>Suede &amp; Nubuck</h3><p>These materials offer luxury softness and breathability but are naturally porous. Use a specialized suede brush to gently remove surface dirt and restore the texture. Frequent application of protection spray is essential to maintain water resistance.</p><h3>Technical Textiles &amp; Vegan Materials</h3><p>Engineered for performance using recycled PET bottles and organic materials. These are low-maintenance and can be spot-cleaned with a damp cloth. A light coat of protection spray helps the fabric repel dirt and liquids.</p><h3>Technical Suede &amp; Nubuck</h3><p>Specialty Spanish materials engineered for everyday durability. Simply wipe with a soft, dry cloth to remove dust. Occasional protection spray enhances their inherent water resistance.</p><h3>Polished &amp; Rubberised Surfaces</h3><p>From high-shine Polido leather to weather-ready rubberised uppers. Use a soft buffing cloth for polished finishes and a damp cloth to remove mud or salt from rubberised surfaces.</p><figure><img src="/brand-assets/materials-craft.webp" alt="A New Movements craftsperson working with footwear materials" width="2715" height="4066" loading="lazy" decoding="async"></figure><h2>Expert Tips for the Perfect Journey</h2><p><strong>The Heat Secret:</strong> Our pure rubber outsoles may feel firm initially. Your body heat naturally softens the rubber as you walk, increasing flexibility and comfort with every step.</p><p><strong>Supportive Lacing:</strong> Always tighten your laces from the bottom up. For extra heel security, use the very top lace hole to “lock” your foot in place.</p><p><strong>Professional Maintenance:</strong> You are always welcome at our flagship store for a conversation and a <strong>free shoeshine</strong> to keep your pair in top condition.</p><h2>Closing the Loop</h2><p>New Movements is never on sale because we believe in the lasting value of our products. When your shoes finally reach the end of their life, return them to any New Movements store. We will ensure the materials are repurposed, and you will receive a <strong>20% discount</strong> on your next pair to keep the movement going.</p></article></section>`;
  const careRail = `<section class="story-products materials-products" aria-labelledby="care-products-title"><header><h2 id="care-products-title">Shoe Care</h2></header>${productGrid(careProducts, currency, 8, "story-product-rail", false)}</section>`;
  const arrivalsRail = `<section class="story-products materials-products" aria-labelledby="materials-arrivals-title"><header><h2 id="materials-arrivals-title">Fresh of the truck</h2><a href="${arrivals ? `/collections/${arrivals.handle}` : "/collections/all"}">View all</a></header>${productGrid(arrivalProducts, currency, 8, "story-product-rail", false)}</section>`;
  return documentHtml({ title: "Shoe Care – New Movements – Oslo", description: "Care guidance for New Movements leather, suede, technical textiles and rubberised footwear.", path: "/pages/materials", body: `${guide}${careRail}${arrivalsRail}`, store, image: "/brand-assets/materials-recycled-rubber.webp" });
}

const CONTENT_PAGES = {
  "/pages/our-philosophy": { title: "Our philosophy", eyebrow: "Our philosophy", heading: "Why we exist", copy: `<p>Founded in 2017 in Oslo, Norway, by fourth-generation shoemaker Martin Evensen, New Movements has grown to become a premium leader in size-based, circular footwear. Rooted in a deep respect for nature, European craftsmanship, and family heritage, New Movements combines innovation with tradition to create refined shoes of exceptional quality.</p><p>Circularity has always been part of New Movements’ DNA — from its first shoe to launching the world’s first shoe recycling program. Today, New Movements continues its journey toward a new standard of responsible premium craftsmanship, shaping the modern wardrobe with purpose, precision, and quiet confidence.</p><h2>The problem</h2><p>Every year, the world produces around 25 billion pairs of shoes, and a staggering 95% of these end up in landfills. This not only wastes valuable materials but also contributes significantly to global pollution and resource depletion.</p><h2>Our mission</h2><p>New Movements was founded by Martin Evensen with a clear goal: to revolutionize the footwear industry by creating the perfect circular shoe. We aim to end the cycle of waste by ensuring that every pair of shoes we produce can be fully recycled, reducing environmental impact and paving the way for a more sustainable future.</p><h2>Let’s move</h2><p>To step into our shoes is to see what it’s like to buy into the circular economy. Because something happens when we begin to internalize the new movements we start, however small they are. Little drops create ripples that become waves. New Movements sets people on their own paths to nurturing and healing our planet, and inspires them to start new movements of their own.</p><h2>What we do</h2><h3>Move people</h3><p>New Movements is not just a company that makes shoes. We’re a group of people with a calling to create a business that lives in harmony with the planet – and believe in challenging others to follow suit. We are doing this through the shoes we make. This is our movement to make the world a better place.</p><h3>Design philosophy</h3><p>Our approach goes beyond aesthetics. We believe in marrying innovation with purpose, creating shoes that are not only stylish and comfortable but also designed to last and, eventually, to be recycled. This philosophy guides every decision we make, from selecting materials to designing our supply chain.</p><h3>Ethical manufacturing</h3><p>We are committed to ethical production practices. This means choosing manufacturing partners who provide fair wages, safe working conditions, and respect for their workers. Our production sites in Portugal and Spain exemplify our commitment to ethical standards, showcasing the possibility of responsible manufacturing within the fashion industry.</p><h3>Circular materials</h3><p>Every component of our shoes is chosen with the environment in mind. We prioritize organic, recycled, and recyclable materials, constantly pushing the boundaries of what’s possible to increase the sustainability of our products.</p><h2>How we do it</h2><h3>Innovation and R&amp;D</h3><p>We're at the forefront of material technology and circular design. In collaboration with leading research institutions like SINTEF, we're developing new materials and production methods that could redefine sustainability in footwear. Our projects aim to create shoes that can go from shoe-to-shoe-to-shoe in a closed-loop system.</p><h3>Recycling Program</h3><p>Our Recycling Program embodies our commitment to circularity. You can return your worn-out New Movements shoes for recycling and receive a 20% discount on your next purchase. This initiative not only gives materials a new life but also we hope encourages you to participate in the circular economy.</p><h3>Community and Education</h3><p>We believe in the power of community and knowledge. Through our website, social media, and NM Store events, we educate people about the importance of circular design, conscious living, and the impact of our choices. We invite you to join us in making a difference, one shoe at a time.</p>` },
  "/pages/recycle": { title: "Recycle - Embracing circularity for a sustainable future in fashion", eyebrow: "20% recycle", heading: "Why We Recycle", copy: `<p>The fashion and footwear industries contribute significantly to global waste, with over 22 billion pairs of shoes discarded annually, 90% of which end up in landfills. These shoes are largely non-recyclable, leading to massive carbon emissions and environmental degradation. At New Movements, we challenge this norm by embracing circularity as the cornerstone of a sustainable future in fashion.</p><h2>What happens to your returned shoes</h2><p>Through our NM Recycling Program, launched in 2020, we have simplified the process for you to return your worn-out shoes. Each returned pair is sent back to our manufacturers where crucial materials are carefully separated, processed, and repurposed. The extent of recyclability varies with each shoe model, reflecting our ongoing efforts to enhance material recovery and reduce waste.</p><h2>How you can return shoes</h2><p>Participating in our recycling initiative is straightforward. Simply follow the detailed instructions provided in this section to send your shoes back to us. In recognition of your contribution to sustainability, you will receive a 20% discount on your next purchase. This process not only gives your shoes a new life but also helps us collectively reduce the environmental footprint, moving closer to our goal of a fully circular value chain.</p><p>Returning your worn-out shoes help you understand the full lifecycle of each pair. Learn more about the significant environmental impact your actions help create, and see how each shoe is transformed into a new beginning. Join us in our recycling efforts and witness the collective achievements of our groundbreaking initiatives. Together, we can redefine the future of footwear.</p><p>If you wish to recycle your worn out New Movements shoes (and we hope you do), visit our <a href="https://maps.app.goo.gl/TheZsfUEc8qxNy2j8" rel="external">NM Community Center</a> at Steen &amp; Strøm in Oslo, any of our resellers (preferably where you purchased them), or email us at <a href="mailto:store@newmovements.com">store@newmovements.com</a>.</p>` },
  "/pages/shoe-care": { title: "Shoe care", eyebrow: "Care guide", heading: "Keep your pair moving", copy: `<p>Good care keeps materials supple, protects their finish and helps your shoes perform for longer. Always remove surface dirt first, test products on a hidden area and allow shoes to dry naturally.</p><h2>Leather</h2><p>Brush away dust with a soft brush, then apply a small amount of neutral leather cream or wax with a clean cloth. Let it absorb before buffing. Avoid soaking leather and never dry it directly on a radiator or beside a heater.</p><h2>Suede and nubuck</h2><p>Use a suede brush to lift dirt and restore the nap. Treat marks gently rather than scrubbing them deeper into the material. A suitable protector spray helps repel water and stains; reapply after cleaning and always follow the product instructions.</p><h2>Technical textiles and vegan materials</h2><p>Spot-clean textile and vegan uppers with a damp cloth and mild soap. Do not use bleach, solvents or a washing machine. Once clean, let the pair air-dry at room temperature and finish with a light, material-safe protector.</p><h2>Rubber and polished surfaces</h2><p>Wipe rubberised uppers and outsoles with a damp cloth as soon as possible after contact with mud or salt. Use a dry buffing cloth on polished finishes to bring back the shine without scratching the surface.</p><h2>Everyday habits</h2><p>Loosen the laces before taking shoes off, use a shoehorn and rotate pairs so each one can rest and dry. Store them away from direct sunlight and keep the original shape with paper or a shoe tree.</p><h2>Need a little help?</h2><p>Visit our <a href="/pages/contact-us">Oslo store</a> for advice and a complimentary shoeshine. For the full story behind our materials and production, read <a href="/pages/materials">Materials &amp; production</a>.</p>` },
  "/pages/contact-us": { title: "Contact us", eyebrow: "Get in touch", heading: "Visit us in Oslo.", copy: `<p>Experience New Movements in person at the NM Community Center at Steen &amp; Strøm in central Oslo.</p><h2>Order support</h2><p>For questions about sizing, delivery, returns or an existing order, use the official contact details shown in your order confirmation or visit the flagship store.</p><p><a href="/pages/size-guide">View the size guide →</a></p>` },
  "/pages/returns": { title: "Returns", eyebrow: "Returns", heading: "Make sure the fit is right.", copy: `<p>Try footwear indoors and keep all original packaging until you are sure about the fit. For current return windows, exchange options and destination-specific instructions, consult the refund policy and your order confirmation.</p><p><a href="/policies/refund-policy">Read the refund policy →</a></p>` },
  "/pages/size-guide": { title: "Size guide", eyebrow: "Size guide", heading: "Find your movement.", copy: `<p>New Movements shoes are unisex and individual styles may fit differently. Select a product and use the live variant picker to see every published size. If you are between sizes or need model-specific advice, contact the Oslo team before ordering.</p><p><a href="/collections/all">Choose a style →</a></p>` },
  "/pages/terms-and-conditions": { title: "Terms and conditions", eyebrow: "Terms", heading: "Terms and conditions.", copy: `<p>Product details, availability and prices are supplied by the live New Movements catalog. The final order total, delivery terms and payment details are presented for confirmation in secure checkout.</p><h2>Questions about an order</h2><p>Keep your order confirmation and contact New Movements with the order reference for assistance.</p>` },
  "/pages/join": { title: "Join New Movements", eyebrow: "Join", heading: "Move with us.", copy: `<p>The New Movements community brings together footwear, art, design and the people shaping a more circular future. Follow upcoming releases and events, or visit the NM Community Center in Oslo.</p><p><a href="/pages/contact-us">Visit the flagship store →</a></p><p><a href="/pages/career-opportunities">Career opportunities →</a></p>` },
  "/pages/career-opportunities": { title: "Career opportunities", eyebrow: "Careers", heading: "Build the next movement.", copy: `<p>New Movements is an independent Oslo brand working across footwear, material innovation, retail and community. Open roles are announced through the brand’s official channels.</p><p>For a considered open application, contact <a href="mailto:store@newmovements.com">store@newmovements.com</a> with a short introduction and relevant experience.</p>` },
  "/pages/warranty-policy": { title: "Warranty policy", eyebrow: "Customer care", heading: "Warranty policy.", copy: `<p>If a product develops a suspected manufacturing fault, stop using it and contact New Movements with the order number, a description and clear photographs. Normal wear, accidental damage and incorrect care are assessed separately from manufacturing defects.</p><p><a href="mailto:store@newmovements.com">Contact customer care →</a></p>` },
  "/policies/privacy-policy": { title: "Privacy policy", eyebrow: "Policy", heading: "Privacy policy.", copy: `<p>The storefront stores bag contents on your device. Product requests are served through the New Movements storefront, while customer, delivery and payment details are collected only in secure hosted checkout.</p><p>Contact New Movements for privacy requests relating to an order or customer communication.</p>` },
  "/policies/refund-policy": { title: "Refund policy", eyebrow: "Policy", heading: "Refund policy.", copy: `<p>Return eligibility depends on the item condition, destination and order date. Keep shoes unworn outside, retain original packaging and follow the return instructions supplied with the order.</p><p>Contact New Movements with your order reference before returning an item.</p>` },
  "/policies/shipping-policy": { title: "Shipping policy", eyebrow: "Policy", heading: "Shipping policy.", copy: `<p>Available delivery services, destination restrictions and the confirmed delivery estimate are shown in secure checkout. Taxes and duties are included where indicated by the selected market.</p>` },
};

const JOURNAL_ENTRIES = [
  { slug: "new-movements-sneakers-and-fashion", category: "Perspective", date: "June 17, 2026", author: "Martin Evensen", title: "As seen in Finansavisen", cardTitle: "New Movements, sneakers and fashion", summary: "Norway's leading financial newspaper ran a piece on New Movements, the craft, the story, and why people who know shoes are finding us.", intro: "Norway's leading financial newspaper ran a piece on New Movements, the craft, the story, and why people who know shoes are finding us.", copy: `<p>Finansavisen visited New Movements to look at the craft, the family story and the people discovering our shoes through their construction and comfort.</p><p>The conversation reflects the work behind every pair: Oslo design, European production and a long-term commitment to circular footwear.</p>` },
  { slug: "an-update-from-our-founder-and-designer", category: "Company", date: "October 31, 2022", author: "Martin Evensen", title: "An update from our founder and designer", summary: "On product, progress and the work still ahead.", intro: "Dear NM friends, it has been more than a year since our last blog post, so I wanted to share a personal update on how it is going with New Movements.", copy: `<p>New Movements began with a simple question: could a modern footwear company make products people genuinely want to keep, while taking responsibility for what happens after years of use?</p><p>The work has grown from an Oslo idea into a collaboration between designers, craftspeople, researchers and a community willing to challenge the usual product cycle. Each collection is another practical step—the work is never finished.</p><h2>Progress through better systems</h2><p>Durability, repair, material selection and end-of-life planning all influence the design process. The next movement will continue to be built openly, one considered decision at a time.</p>` },
  { slug: "opening-of-our-flagship-store", category: "Oslo", date: "September 18, 2023", author: "Martin Evensen", title: "Opening our first store in Oslo", summary: "The NM Community Center at Steen &amp; Strøm.", intro: "It's the subtle changes in the wind that first get your attention. You might notice them while riding your bike to work in the morning or in the evening when the city begins to quiet down.", copy: `<p>The NM Community Center at Steen &amp; Strøm brings New Movements into the heart of Oslo. It is a place to try the collection, compare fits and talk directly with the people behind the brand.</p><p>The store is also a meeting point for exhibitions, conversations and collaborations about design, materials and the future of footwear.</p><p><a href="/pages/contact-us">Plan your visit →</a></p>` },
  { slug: "the-nm-loafer-a-modern-classic-reimagined", category: "Product story", date: "April 1, 2025", author: "Martin Evensen", title: "The NM Loafer – a modern classic reimagined", cardTitle: "The NM Loafer", summary: "A modern take on the classic penny loafer, designed in Oslo and handcrafted in Portugal.", intro: "Discover the NM Loafer – a modern take on the classic penny loafer, designed in Oslo and handcrafted in Portugal.", copy: `<p>The loafer earns its place through versatility. New Movements keeps the recognisable proportions but brings a lighter stance, unisex fit and considered material construction to the form.</p><p>Designed in Oslo and made in Portugal, the result moves easily between work, travel and evenings out.</p><p><a href="/collections/nm-loafer">Explore loafers →</a></p>` },
  { slug: "product-story-zen-mindful-design-for-modern-movement", category: "Product story", date: "April 16, 2025", author: "Martin Evensen", title: "Product Story: Zen – Mindful design for modern movement", summary: "Crafted for those who value simplicity, comfort, and everyday purpose.", intro: "Zen: Where Minimalism Meets Movement. Crafted for those who value simplicity, comfort, and everyday purpose.", copy: `<p>Zen explores balance: cushioning without bulk, technical performance without visual noise, and a form that works across seasons and wardrobes.</p><p>Handcrafted in Portugal using premium materials, Zen was refined around how the foot moves through a full day.</p><p><a href="/collections/zen-sneaker">Explore Zen →</a></p>` },
  { slug: "shaping-the-future-of-footwear-together-with-sintef", category: "Research", date: "May 22, 2025", author: "Anita Amnzadeh", title: "Shaping the Future of Footwear - Together with SINTEF", cardTitle: "Shaping footwear’s future with SINTEF", summary: "An inspiring meeting with three departments of SINTEF, one of Europe’s leading research institutes, marking the beginning of an exciting new chapter.", intro: "Last week, we had an inspiring meeting with three departments of SINTEF, one of Europe’s leading research institutes, marking the beginning of an exciting new chapter for New Movements.", copy: `<p>Circular footwear requires more than changing a single material. Components, adhesives, manufacturing, collection systems and recycling technologies have to work together.</p><p>Collaboration with SINTEF gives New Movements access to scientific expertise and testing methods that help turn broad sustainability goals into specific design decisions.</p><h2>From ambition to evidence</h2><p>The research informs prototypes and future production, building knowledge that can improve both durability during use and material recovery afterwards.</p>` },
  { slug: "finansavisen-wrote-about-us", category: "Press", date: "June 17, 2026", author: "Martin Evensen", title: "As seen in Finansavisen", summary: "Norway's leading financial newspaper ran a piece on New Movements, the craft, the story, and why people who know shoes are finding us.", intro: "Norway's leading financial newspaper ran a piece on New Movements, the craft, the story, and why people who know shoes are finding us.", copy: `<p>Finansavisen featured New Movements and the journey from a century-old family connection to shoemaking toward an independent contemporary brand.</p><p>The coverage explored how design, responsible growth and circular product development come together in the business.</p>` },
];

function renderJournalPage(store) {
  const cards = JOURNAL_ENTRIES.map((entry) => `<a href="/blogs/news/${entry.slug}"><span>${entry.category}</span><h2>${entry.cardTitle || entry.title}</h2><p>${entry.summary}</p><small class="journal-meta">${entry.date} | ${entry.author}</small></a>`).join("");
  return documentHtml({ title: "Journal | New Movements – Oslo", description: "Stories from New Movements: design, circularity, craft and community.", path: "/blogs/news", store, body: `<section class="journal-page"><header><p class="eyebrow">Stories, people, process</p><h1>Journal</h1></header><div class="journal-grid">${cards}</div></section>` });
}

function renderJournalArticle(store, entry) {
  const path = `/blogs/news/${entry.slug}`;
  const body = `<article class="journal-article"><header><p class="eyebrow">${entry.category}</p><h1>${entry.title}</h1><small class="journal-meta">${entry.date} | ${entry.author}</small><p>${entry.intro}</p></header><div>${entry.copy}<p class="journal-back"><a href="/blogs/news">← Back to Stories</a></p></div></article>`;
  return documentHtml({ title: `${entry.title} | New Movements – Oslo`, description: entry.intro, path, store, body, type: "article" });
}

function renderUtilityPage(store, path) {
  if (path === "/cart") return documentHtml({ title: "Your bag | New Movements – Oslo", description: "Review your New Movements bag and continue to secure checkout.", path, store, body: `<header class="collection-header"><h1>Your bag</h1></header><section class="cart-layout" data-cart-root><div class="cart-items" data-cart-items></div><aside class="cart-summary"><h2>Order summary</h2><p><span>Subtotal</span><strong data-cart-subtotal>NOK 0</strong></p><p>Taxes and duties included. Delivery is confirmed in checkout.</p><p class="checkout-error" data-checkout-error hidden tabindex="-1"></p><button type="button" data-checkout-start disabled>Secure checkout</button></aside></section>` });
  if (path === "/search") return documentHtml({ title: "Search | New Movements – Oslo", description: "Search the live New Movements footwear catalog.", path, store, body: `<section class="static-page"><p class="eyebrow">Live catalog</p><h1>Search</h1><form class="search-form" role="search" data-search-form><label class="sr-only" for="search-input">Search products</label><input id="search-input" name="q" type="search" autocomplete="off" placeholder="Search shoes, styles, materials"><button type="submit">Search</button></form><p class="search-status" data-search-status></p><div class="product-grid" data-search-results></div></section>` });
  if (path === "/order/complete") return documentHtml({ title: "Thank you | New Movements – Oslo", description: "Your New Movements order has been received.", path, store, body: `<section class="message-page" data-order-complete><p class="eyebrow">Order confirmed</p><h1>Thank you.</h1><p>Your order has been received. Confirmation and delivery details will be sent to the email used at checkout.</p><a class="outline-button" href="/collections/all">Continue shopping</a></section>` });
  return null;
}

function renderContentPage(store, handle, page) {
  const philosophy = handle === "/pages/our-philosophy";
  const recycle = handle === "/pages/recycle";
  const introEnd = philosophy ? page.copy.indexOf("<h2>The problem</h2>") : -1;
  const intro = introEnd > -1 ? page.copy.slice(0, introEnd) : page.copy;
  const remainder = introEnd > -1 ? page.copy.slice(introEnd) : "";
  const body = philosophy
    ? `<section class="static-page static-page--about"><div class="static-reading"><p class="eyebrow">About</p><h1>About</h1><div class="static-copy static-copy--intro">${intro}</div><figure class="static-feature-image"><img src="/brand-assets/about-history.jpg" alt="New Movements history and community" width="1200" loading="lazy" decoding="async"></figure><div class="static-copy">${remainder}</div></div></section>`
    : recycle
      ? `<section class="static-page static-page--recycle"><div class="static-reading static-reading--recycle"><h1>${page.heading}</h1><div class="static-copy">${page.copy}</div></div></section>`
      : `<section class="static-page"><p class="eyebrow">${page.eyebrow}</p><h1>${page.heading}</h1><div class="static-copy">${handle === "/pages/materials" ? '<p class="sr-only">Chosen to last</p>' : ""}${page.copy}</div></section>`;
  return documentHtml({ title: `${page.title} | New Movements – Oslo`, description: stripHtml(page.copy).slice(0, 155), path: handle, store, body });
}

export function renderPage(store, handle) {
  if (handle === "/pages/evensen-story" || handle === "evensen-story") return renderStoryPage(store);
  if (handle === "/pages/materials") return renderMaterialsPage(store);
  if (handle === "/blogs/news") return renderJournalPage(store);
  if (handle.startsWith("/blogs/news/")) {
    const entry = JOURNAL_ENTRIES.find((item) => `/blogs/news/${item.slug}` === handle);
    return entry ? renderJournalArticle(store, entry) : null;
  }
  const utility = renderUtilityPage(store, handle);
  if (utility) return utility;
  const page = CONTENT_PAGES[handle];
  if (page) return renderContentPage(store, handle, page);
  return null;
}

export function renderCollectionPage(store, handle) {
  const collection = handle === "all" ? null : collectionByHandle(store, handle);
  if (handle !== "all" && !collection) return null;
  const products = handle === "all" ? (store.products || []) : collectionProducts(store, collection);
  const title = collection?.title || "All shoes";
  const description = stripHtml(collection?.description || collection?.seoDescription || "Unisex shoes designed in Oslo and handcrafted in Portugal.");
  const sizes = facetValues(products, "size");
  const publishedColors = facetValues(products, "color");
  const productText = products.map((product) => `${product.title} ${stripHtml(product.description || "")}`).join(" ").toLowerCase();
  const colors = publishedColors.length ? publishedColors : [
    "Black", "White", "Beige", "Brown", "Grey", "Blue", "Green", "Olive", "Orange", "Pink", "Turquoise",
  ].filter((color) => productText.includes(color.toLowerCase()));
  const types = [...new Set(products.map((product) => productType(product.title)))].sort();
  const maxPrice = Math.ceil(Math.max(0, ...products.flatMap((product) => (product.variants || []).map((variant) => Number(variant.price) || 0))));
  const highestPrice = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 }).format(maxPrice);
  const priceFacet = maxPrice ? `<details name="collection-facet"><summary>Price</summary><div class="price-filter"><div class="price-fields"><label><span>kr</span><input type="number" min="0" max="${maxPrice}" value="0" step="50" inputmode="numeric" aria-label="Minimum price" data-price-min></label><span>to</span><label><span>kr</span><input type="number" min="0" max="${maxPrice}" value="${maxPrice}" step="50" inputmode="numeric" aria-label="Maximum price" data-price-filter></label></div><p>The highest price is ${highestPrice}</p></div></details>` : "";
  const availabilityFacet = filterGroup("Availability", ["In stock", "Out of stock"]);
  const body = `<header class="collection-header"><h1>${escapeHtml(title)}</h1></header><section class="collection-layout"><div class="catalog-toolbar"><button type="button" data-mobile-filter>Filter</button><aside class="collection-filters" data-filters><div class="filter-heading"><strong>Filters</strong><span><button type="button" data-clear-filters>Clear all</button><button type="button" data-close-filters>Close</button></span></div>${priceFacet}${availabilityFacet}${filterGroup("Size", sizes)}${filterGroup("Product type", types)}${colorFilterGroup(colors)}${filterGroup("Material", ["Leather", "Suede", "Wool", "Recycled", "Rubber"])}${filterGroup("Shoe features", ["Water resistant", "Wool lined", "Lightweight"])}</aside><span class="catalog-count"><b data-filter-count>${products.length}</b> items</span><label class="catalog-sort">Sort <select data-sort><option value="featured">Featured</option><option value="az">Alphabetically, A–Z</option><option value="price-asc">Price, low to high</option><option value="price-desc">Price, high to low</option></select></label></div><div data-collection-grid>${productGrid(products, store.currency || "NOK")}</div><p class="empty-state" data-filter-empty hidden>No products match those filters.</p></section>`;
  return documentHtml({ title: `${title} | New Movements – Oslo`, description, path: `/collections/${handle}`, body, store, image: products[0]?.images?.[0]?.url || "" });
}

function safeDescription(value) {
  const text = stripHtml(value);
  return text ? `<p>${escapeHtml(text)}</p>` : "";
}

function productSchema(product, availability, currency) {
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org", "@type": "Product", name: product.title,
    image: (product.images || []).map((item) => item.url), description: stripHtml(product.description || product.seoDescription || ""),
    brand: { "@type": "Brand", name: product.brand || "New Movements" },
    offers: (product.variants || []).map((variant) => ({ "@type": "Offer", price: variant.price, priceCurrency: currency, availability: availability[variant.id] ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${SITE_ORIGIN}/products/${product.handle}` })),
  }).replaceAll("<", "\\u003c")}</script>`;
}

export function renderProductPage(store, product, availability = {}) {
  const currency = store.currency || product.currency || "NOK";
  const variants = product.variants || [];
  const images = product.images || [];
  const first = variants[0];
  const initialVariant = variants.find((variant) => availability[variant.id] === true) || first;
  const available = variants.some((variant) => availability[variant.id] === true);
  const options = variants.map((variant) => {
    const label = variant.options?.map((item) => item.value).filter(Boolean).join(" / ") || variant.sku || "Default";
    return `<option value="${escapeHtml(variant.id)}" data-price="${escapeHtml(variant.price)}" data-available="${availability[variant.id] === true}"${variant.id === initialVariant?.id ? " selected" : ""}>${escapeHtml(label)}${availability[variant.id] === true ? "" : " — Sold out"}</option>`;
  }).join("");
  const gallery = images.length ? `<section class="product-gallery${images.length > 1 ? " has-thumbs" : ""}"><div class="product-main" data-gallery-main>${responsiveImage(images[0], { alt: images[0].alt || product.title, width: 1280, sizes: "(max-width: 860px) 100vw, 62vw", priority: true })}</div>${images.length > 1 ? `<div class="product-thumbs">${images.map((image, index) => `<button type="button" data-gallery-url="${escapeHtml(imageUrl(image, 1280))}" data-gallery-srcset="${escapeHtml(imageSrcset(image))}" data-gallery-alt="${escapeHtml(image.alt || `${product.title} – view ${index + 1}`)}" aria-label="Show image ${index + 1}" aria-current="${index === 0}">${responsiveImage(image, { alt: "", width: 320, sizes: "96px", loading: "lazy" })}</button>`).join("")}</div>` : ""}</section>` : '<section class="product-gallery product-placeholder">New Movements</section>';
  const family = product.title.replace(/\s*\([^)]*\)\s*$/, "").trim().toLowerCase();
  const colorProducts = (store.products || []).filter((item) => item.handle !== product.handle && item.title.toLowerCase().startsWith(family)).slice(0, 7);
  const colorSwatches = [product, ...colorProducts].map((item) => `<a class="product-color-swatch${item.handle === product.handle ? " is-selected" : ""}" href="/products/${escapeHtml(item.handle)}" aria-label="${escapeHtml(item.title)}"${item.handle === product.handle ? ' aria-current="page"' : ""}>${item.images?.[0] ? responsiveImage(item.images[0], { alt: "", width: 160, sizes: "88px", loading: "lazy" }) : ""}</a>`).join("");
  const sizeButtons = variants.map((item) => {
    const size = item.options?.find((option) => /size/i.test(option.name))?.value || item.options?.[0]?.value || item.sku || "Default";
    const inStock = availability[item.id] === true;
    return `<button type="button" class="product-size-button${item.id === initialVariant?.id ? " is-selected" : ""}${inStock ? "" : " is-sold-out"}" data-variant-choice="${escapeHtml(item.id)}" data-price="${escapeHtml(item.price)}" data-available="${inStock}" aria-pressed="${item.id === initialVariant?.id}">${escapeHtml(/^\d+$/.test(String(size)) ? `EU ${size}` : size)}</button>`;
  }).join("");
  const recommendations = (store.products || []).filter((item) => item.handle !== product.handle).sort((left, right) => Number(right.title.toLowerCase().startsWith(family)) - Number(left.title.toLowerCase().startsWith(family))).slice(0, 4);
  const promises = `<section class="product-promises"><div><strong>Four generations of shoemakers</strong><span>since 1916</span></div><div><strong>Designed in Norway</strong><span>Hand-crafted in Portugal</span></div><div><strong>Premium Materials</strong><span>Built to last, and to be recycled</span></div></section>`;
  const body = `<section class="product-layout">${gallery}<div class="product-details"><div class="product-heading"><h1>${escapeHtml(product.title)}</h1><p class="product-price" data-product-price>${priceRange(variants, currency)}</p></div>${colorSwatches ? `<div class="product-color-picker"><span>Color: ${escapeHtml(product.title)}</span><div class="product-color-grid">${colorSwatches}</div></div>` : ""}<div class="product-size-picker"><span>Size</span><div class="product-size-grid">${sizeButtons}</div><select class="variant-fallback" aria-label="Size / variant" data-product-variant>${options}</select></div><a class="size-guide-link" href="/pages/size-guide">Size guide ↗</a><div class="purchase-row"><label>Quantity<input type="number" value="1" min="1" max="20" inputmode="numeric" data-quantity></label><button type="button" data-add-to-cart data-id="${escapeHtml(product.id)}" data-handle="${escapeHtml(product.handle)}" data-title="${escapeHtml(product.title)}" data-image="${escapeHtml(imageUrl(images[0], 480))}" data-variant="${escapeHtml(initialVariant?.id || "")}" data-price="${escapeHtml(initialVariant?.price ?? "")}"${available ? "" : " disabled"}>${available ? "Add to cart" : "Sold out"}</button></div><div class="product-accordions"><details open><summary>Details</summary>${safeDescription(product.description || product.seoDescription)}</details><details><summary>Features</summary><p>Unisex footwear designed for everyday movement, comfort and long use.</p></details><details><summary>Materials</summary><p>Material information is supplied with the published product description and variant selection.</p></details><details><summary>Shipping &amp; Delivery</summary><p>Taxes and duties are included. Delivery timing is confirmed through secure checkout.</p></details><details><summary>Returns &amp; Exchanges</summary><p><a href="/pages/returns">Read our returns and exchanges information.</a></p></details></div><div class="shop-benefits"><strong>Shop with New Movements</strong><ul><li>Free shipping</li><li>Delivery within 2–5 days</li><li>Free exchanges</li><li>Taxes &amp; duties included</li><li>Free return within 30 days</li></ul></div></div></section>${recommendations.length ? `<section class="recommendations"><header><h2>You may also like</h2></header>${productGrid(recommendations, currency, 4)}</section>` : ""}${promises}`;
  return documentHtml({ title: `${product.seoTitle || product.title} | New Movements – Oslo`, description: stripHtml(product.seoDescription || product.description || product.title).slice(0, 155), path: `/products/${product.handle}`, body, store, schema: productSchema(product, availability, currency), image: images[0]?.url || "", type: "product" });
}

export function renderMessagePage(store, { title, heading, text }) {
  return documentHtml({ title, description: text, path: "/404.html", store, body: `<section class="message-page"><p class="eyebrow">New Movements</p><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(text)}</p><a class="outline-button" href="/collections/all">Continue shopping</a></section>` });
}

export const renderNotFoundPage = (store) => renderMessagePage(store, { title: "Page not found | New Movements", heading: "Page not found", text: "The page may have moved, or the product is no longer published." });
export const renderUnavailablePage = (store) => renderMessagePage(store, { title: "Store temporarily unavailable | New Movements", heading: "We’ll be right back", text: "We could not load the live catalog. Please try again shortly." });

export function renderSitemap(store) {
  const paths = [...STATIC_PATHS, "/collections/all", ...publishedCollections(store).map((item) => `/collections/${item.handle}`), ...(store.products || []).map((item) => `/products/${item.handle}`)];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(paths)].map((path) => `  <url><loc>${SITE_ORIGIN}${canonicalPath(path)}</loc></url>`).join("\n")}\n</urlset>\n`;
}
