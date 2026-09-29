import { canonicalPath } from "./routes.mjs";
import { renderCompactLegalFooter } from "../../packages/reai-cloudflare-storefront/footer.mjs";

export const SITE_ORIGIN = "https://newmovements.com";
export const HANDLE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const STORE_SCRIPT = "/assets/store.js?v=3";
export const STORE_STYLE = "/assets/store.css?v=4";
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

export const priceRange = (variants = [], currency = "NOK") => {
  const values = variants.map((variant) => Number(variant.price)).filter(Number.isFinite);
  if (!values.length) return formatMoney(0, currency);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  return minimum === maximum ? formatMoney(minimum, currency) : `${formatMoney(minimum, currency)} – ${formatMoney(maximum, currency)}`;
};

export function matchRoute(pathname) {
  const path = pathname === "/index.html" ? "/" : pathname;
  if (path === "/") return { type: "home" };
  if (path === "/sitemap.xml") return { type: "sitemap" };
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
  const items = featuredCollections(store).slice(0, 4);
  return items.map((item) => `<a href="/collections/${escapeHtml(item.handle)}">${escapeHtml(item.label)}</a>`).join("");
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
    header: `<a class="skip-link" href="#main">Skip to content</a><div class="announcement"><span aria-hidden="true">‹</span><span>Free worldwide delivery via DHL Express.</span><span aria-hidden="true">›</span></div><header class="site-header"><div class="site-nav"><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-nav"><span></span><span></span><span class="sr-only">Menu</span></button><nav class="desktop-nav" aria-label="Primary"><button type="button" data-mega-toggle aria-expanded="false" aria-controls="mega-menu">Shop</button><a href="/pages/evensen-story">About</a><a href="/pages/join">Join</a></nav><a class="wordmark" href="/" aria-label="New Movements home"><img src="${BRAND_LOGO}" alt="New Movements – Oslo" width="400" height="72"></a><nav class="utility-nav" aria-label="Store utilities"><span class="currency-label">${escapeHtml(store.currency || "NOK")}⌄</span><button type="button" data-search-open aria-label="Search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg></button><a class="account-link" href="/pages/contact-us" aria-label="Account and customer service"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="3.5"></circle><path d="M5.5 21c.5-5 2.6-7.5 6.5-7.5s6 2.5 6.5 7.5"></path></svg></a><button type="button" data-cart-open aria-label="Shopping bag"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 13H6L5 8Z"></path><path d="M9 8V6a3 3 0 0 1 6 0v2"></path></svg><span class="cart-badge" data-cart-count>0</span></button></nav></div><div class="mega-menu" id="mega-menu" data-mega-menu hidden><div><p>Style</p><a href="/collections/new-in">New arrivals</a><a href="/collections/sneakers">Sneakers</a><a href="/collections/loafers-low-tops">Loafers</a><a href="/collections/boots">Boots</a><a href="/collections/all">All shoes (Unisex)</a></div><div><p>Season</p><a href="/collections/spring-summer">Spring & summer</a><a href="/collections/autumn-winter">Autumn & winter</a></div><div><p>Discover</p><a href="/collections/gift-card">Gift card</a><a href="/collections/shoe-care">Shoe care</a><a href="/pages/recycle">20% Recycle</a></div><div><p>About</p><a href="/pages/evensen-story">Our story</a><a href="/pages/why-we-exist">Our philosophy</a><a href="/pages/production">Materials & production</a><a href="/blogs/news">Journal</a></div></div><nav class="mobile-nav" id="mobile-nav" data-mobile-nav>${nav(store)}<a href="/collections/all">All shoes</a><a href="/pages/evensen-story">Our story</a><a href="/pages/production">Materials</a><a href="/blogs/news">Journal</a></nav></header><div class="drawer-backdrop" data-drawer-backdrop hidden></div><aside class="store-drawer search-drawer" aria-label="Search" aria-hidden="true" data-search-drawer><header><h2>Search</h2><button type="button" data-drawer-close aria-label="Close search">Close</button></header><form role="search" data-predictive-search><label class="sr-only" for="predictive-query">Search products</label><input id="predictive-query" name="q" type="search" autocomplete="off" placeholder="Search shoes, styles, materials"><button type="submit">View all</button></form><p data-predictive-status>Start typing to search the live catalog.</p><div class="predictive-results" data-predictive-results></div></aside><aside class="store-drawer cart-drawer" aria-label="Shopping bag" aria-hidden="true" data-cart-drawer><header><h2>Your bag</h2><button type="button" data-drawer-close aria-label="Close bag">Close</button></header><div data-drawer-cart-items></div><footer><p><span>Subtotal</span><strong data-drawer-subtotal>NOK 0</strong></p><a href="/cart">View bag</a></footer></aside>`,
    footer: `<footer class="site-footer"><div class="footer-grid"><div><a class="footer-wordmark" href="/"><img src="${BRAND_LOGO}" alt="New Movements – Oslo" width="400" height="72"></a></div><div><h2>About</h2><a href="/pages/contact-us">Contact us</a><a href="/pages/recycle">Recycle</a><a href="/pages/career-opportunities">Careers</a><a href="/pages/returns">Returns</a><a href="/pages/size-guide">Size guide</a></div><div><h2>Learn</h2><a href="/pages/evensen-story">Our story</a><a href="/pages/our-philosophy">Our philosophy</a><a href="/pages/materials">Materials</a><a href="/blogs/news">Journal</a></div><div><h2>Shop</h2>${nav(store)}<a href="/collections/all">All shoes</a></div><div class="footer-story"><h2>Our Story</h2><p>New Movements builds on a family tradition that started in 1916, grounded in quality products made for Nordic seasons and long use.</p><a href="/pages/evensen-story">Continue reading →</a></div></div><section class="newsletter"><p>Join the community.</p><form data-newsletter><label for="newsletter-email">Subscribe for exclusive updates on drops, products & events.</label><div><input id="newsletter-email" type="email" autocomplete="email" placeholder="Email address"><button type="submit">Sign up</button></div><small data-newsletter-status></small></form></section>${legal}</footer><div class="toast" role="status" aria-live="polite" data-cart-toast hidden></div>`,
  };
}

function documentHtml({ title, description, path, body, store, schema = "", image = "", type = "website" }) {
  const { header, footer } = chrome(store);
  const canonical = `${SITE_ORIGIN}${path}`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="theme-color" content="#ffffff"><link rel="canonical" href="${escapeHtml(canonical)}"><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://app.reai.no" crossorigin><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:type" content="${type}">${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ""}<link rel="stylesheet" href="${STORE_STYLE}"><script type="module" src="${STORE_SCRIPT}"></script>${schema}</head><body>${header}<main id="main">${body}</main>${footer}</body></html>`;
}

function productCard(product, currency = "NOK", priority = false) {
  const image = product.images?.[0];
  const minimumPrice = Math.min(...(product.variants || []).map((variant) => Number(variant.price)).filter(Number.isFinite));
  const optionValues = (product.variants || []).flatMap((variant) => variant.options || []).map((option) => option.value).join(" ").toLowerCase();
  const searchText = `${product.title} ${product.brand || ""} ${product.description || ""} ${optionValues}`.toLowerCase();
  const type = product.title.replace(/\s*\([^)]*\)\s*$/, "").trim().toLowerCase();
  return `<article class="product-card" data-product-title="${escapeHtml(product.title.toLowerCase())}" data-product-price="${Number.isFinite(minimumPrice) ? minimumPrice : 0}" data-product-options="${escapeHtml(optionValues)}" data-product-search="${escapeHtml(searchText)}" data-product-type="${escapeHtml(type)}"><a class="product-media" href="/products/${escapeHtml(product.handle)}">${responsiveImage(image, { alt: image?.alt || product.title, width: 640, sizes: "(max-width: 700px) 50vw, 25vw", loading: priority ? undefined : "lazy", priority })}<span class="card-action">Choose</span></a><div class="product-card-copy"><h3><a href="/products/${escapeHtml(product.handle)}">${escapeHtml(product.title)}</a></h3><p>${priceRange(product.variants, currency)}</p></div></article>`;
}

function productGrid(products, currency, limit, className = "") {
  const entries = typeof limit === "number" ? products.slice(0, limit) : products;
  if (!entries.length) return '<p class="empty-state">No published products are available yet.</p>';
  return `<div class="product-grid${className ? ` ${className}` : ""}">${entries.map((item, index) => productCard(item, currency, index < 2)).join("")}</div>`;
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
  return `<details open><summary>${escapeHtml(name)}</summary><div class="facet-options">${values.map((value) => `<label><input type="checkbox" value="${escapeHtml(value.toLowerCase())}" data-facet="${escapeHtml(name.toLowerCase())}"> ${escapeHtml(value)}</label>`).join("")}</div></details>`;
}

export function renderHomePage(store) {
  const currency = store.currency || "NOK";
  const arrivals = findCollection(store, ["new-arrival", "new"]);
  const preferredHandles = ["allrounder-y-white", "allrounder-y-full-black", "allrounder-y-black-nordic-grey", "allrounder-y-smooth-forest", "allrounder-y-beige-smooth-forest", "allrounder-y-beige-sand"];
  const preferredProducts = preferredHandles.map((handle) => productByHandle(store, handle)).filter(Boolean);
  const products = preferredProducts.length >= 5 ? preferredProducts : (collectionProducts(store, arrivals).length ? collectionProducts(store, arrivals) : (store.products || []));
  const sneakers = findCollection(store, ["sneaker"]);
  const loafers = findCollection(store, ["loafer", "low-hiker"]);
  const hero = `<section class="home-hero"><a class="home-hero-panel" href="/collections/women"><img src="${HOME_HERO_IMAGES[0]}" alt="New Movements brown footwear styled in Oslo" width="1920" height="1800" fetchpriority="high"><span>Shop women's</span></a><a class="home-hero-panel" href="/collections/men"><img src="${HOME_HERO_IMAGES[1]}" alt="Brown New Movements shoe worn outdoors" width="1920" height="1800" fetchpriority="high"><span>Shop men's</span></a></section>`;
  const promises = `<section class="promise-grid"><a href="/pages/evensen-story"><strong>Fourth generation shoemaker</strong><span>Read the Evensen story</span></a><a href="/pages/our-philosophy"><strong>Designed in Oslo</strong><span>Hand-crafted in Portugal</span></a><a href="/pages/materials"><strong>Premium materials</strong><span>Built to last, and to be recycled</span></a></section>`;
  const categoryCards = [sneakers, loafers].filter(Boolean).map((collection) => {
    const product = collectionProducts(store, collection).find((item) => item.images?.[0]);
    return `<a class="category-card" href="/collections/${escapeHtml(collection.handle)}">${product ? responsiveImage(product.images[0], { alt: product.images[0].alt || collection.title, width: 960, sizes: "(max-width: 760px) 100vw, 50vw", loading: "lazy" }) : ""}<span><small>Sizes 35–47</small><strong>${escapeHtml(collection.title)}</strong><em>Shop now</em></span></a>`;
  }).join("");
  const community = `<section class="community"><img src="${COMMUNITY_IMAGE}" alt="New Movements Community Center storefront at Steen & Strøm in Oslo" width="1440" height="1000" loading="lazy"><div><p class="eyebrow">NM Community Center</p><h2>Flagship store in Oslo</h2><p>Visit our NM Community Center in Steen & Strøm, Scandinavia's oldest department store, to experience our products and be part of the journey towards a circular future.</p><p>We're looking forward to welcoming you!</p><nav><a href="${DIRECTIONS_URL}" rel="external">⌖ Get directions</a><a href="/pages/contact-us">◌ Get in touch</a></nav></div></section><section class="review-strip"><div><strong>New Movements</strong><span>★★★★★</span><small>65 Google Reviews</small></div><a href="https://www.google.com/search?q=New+Movements+Oslo+reviews" rel="external"><strong>Our customers say it best.</strong><span>Read reviews on Google →</span></a></section>`;
  const body = `${hero}${promises}<section class="catalog-section"><header><h1>Women & Men New Arrivals</h1><a href="${arrivals ? `/collections/${arrivals.handle}` : "/collections/all"}">View all</a></header>${productGrid(products, currency, 6, "home-product-strip")}</section>${categoryCards ? `<section class="category-grid">${categoryCards}</section>` : ""}${community}`;
  return documentHtml({ title: "New Movements – Oslo", description: "Unisex footwear designed in Oslo and handcrafted in Portugal for a circular future.", path: "/", body, store, image: HOME_HERO_IMAGES[0] });
}

export function renderCollectionPage(store, handle) {
  const collection = handle === "all" ? null : collectionByHandle(store, handle);
  if (handle !== "all" && !collection) return null;
  const products = handle === "all" ? (store.products || []) : collectionProducts(store, collection);
  const title = collection?.title || "All shoes";
  const description = stripHtml(collection?.description || collection?.seoDescription || "Unisex shoes designed in Oslo and handcrafted in Portugal.");
  const sizes = facetValues(products, "size");
  const colors = facetValues(products, "color");
  const types = [...new Set(products.map((product) => product.title.replace(/\s*\([^)]*\)\s*$/, "").trim()))].sort();
  const maxPrice = Math.ceil(Math.max(0, ...products.flatMap((product) => (product.variants || []).map((variant) => Number(variant.price) || 0))));
  const body = `<header class="collection-header"><p class="eyebrow">Shop</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></header><section class="collection-layout"><aside data-filters><div class="filter-heading"><strong>Filter</strong><span><button type="button" data-clear-filters>Clear all</button><button type="button" data-close-filters>Close</button></span></div>${maxPrice ? `<details open><summary>Price</summary><label class="price-filter">Up to <output data-price-output>${formatMoney(maxPrice, store.currency || "NOK")}</output><input type="range" min="0" max="${maxPrice}" value="${maxPrice}" step="50" data-price-filter></label></details>` : ""}${filterGroup("Size", sizes)}${filterGroup("Product type", types)}${filterGroup("Color", colors)}${filterGroup("Material", ["Leather", "Suede", "Wool", "Recycled", "Rubber"])}</aside><div><div class="catalog-toolbar"><span><b data-filter-count>${products.length}</b> items</span><button type="button" data-mobile-filter>Filter</button><label>Sort <select data-sort><option value="featured">Featured</option><option value="az">Alphabetically, A–Z</option><option value="price-asc">Price, low to high</option><option value="price-desc">Price, high to low</option></select></label></div><div data-collection-grid>${productGrid(products, store.currency || "NOK")}</div><p class="empty-state" data-filter-empty hidden>No products match those filters.</p></div></section>`;
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
  const body = `<div class="breadcrumbs"><a href="/">Home</a><span>/</span><a href="/collections/all">Shop</a><span>/</span><span>${escapeHtml(product.title)}</span></div><section class="product-layout">${gallery}<div class="product-details"><p class="eyebrow">${escapeHtml(product.brand || "New Movements")}</p><h1>${escapeHtml(product.title)}</h1><p class="product-price" data-product-price>${priceRange(variants, currency)}</p><p class="tax-note">Taxes and duties included.</p><label class="variant-label">Size / variant<select data-product-variant>${options}</select></label><div class="purchase-row"><label>Quantity<input type="number" value="1" min="1" max="20" inputmode="numeric" data-quantity></label><button type="button" data-add-to-cart data-id="${escapeHtml(product.id)}" data-handle="${escapeHtml(product.handle)}" data-title="${escapeHtml(product.title)}" data-image="${escapeHtml(imageUrl(images[0], 480))}" data-variant="${escapeHtml(initialVariant?.id || "")}" data-price="${escapeHtml(initialVariant?.price ?? "")}"${available ? "" : " disabled"}>${available ? "Add to bag" : "Sold out"}</button></div><div class="product-note"><span>Free worldwide delivery</span><span>Free exchanges</span><span>Designed in Oslo</span></div><details open><summary>Product details</summary>${safeDescription(product.description || product.seoDescription)}</details><details><summary>Shipping & returns</summary><p>Delivery, taxes and duties are calculated and confirmed through secure checkout.</p></details></div></section>`;
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
