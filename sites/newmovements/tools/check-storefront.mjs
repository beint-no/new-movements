import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import {
  STORE_SCRIPT, STORE_STYLE, imageCandidates, imageUrl, matchRoute, priceRange,
  renderCollectionPage, renderHomePage, renderPage, renderProductPage, renderSitemap, renderStoryPage,
} from "../storefront.mjs";

const image = {
  url: "https://app.reai.no/media/product-images/allrounder.avif",
  alt: "White leather sneaker",
  width: 1600,
  height: 2000,
  renditions: [
    { url: "https://app.reai.no/media/product-images/allrounder-480.avif", width: 480, height: 600 },
    { url: "https://app.reai.no/media/product-images/allrounder-960.avif", width: 960, height: 1200 },
  ],
};
const product = {
  id: "00000000-0000-4000-8000-000000000001",
  handle: "allrounder-y-white",
  title: "Allrounder Y (White Leather)",
  brand: "New Movements",
  productType: "Sneakers",
  attributes: [{ key: "color", name: "Color", values: [{ id: "color-white", label: "White", taxonomyValues: [{ id: "gid://shopify/TaxonomyValue/3", name: "White" }], colors: ["#ffffff"], aliases: [] }] }],
  description: "A water-repellent unisex sneaker designed in Oslo.",
  seoTitle: "Allrounder Y (White) - Water-repellent sneaker | New Movements - Osl",
  seoDescription: "White leather unisex sneaker.",
  images: [image, { ...image, url: "https://app.reai.no/media/product-images/allrounder-side.avif", alt: null }],
  variants: [
    { id: "11111111-1111-4111-8111-111111111111", price: 2595, sku: "AY-W-40", options: [{ name: "Size", value: "40" }] },
    { id: "22222222-2222-4222-8222-222222222222", price: 2595, sku: "AY-W-41", options: [{ name: "Size", value: "41" }] },
  ],
};
const store = {
  currency: "NOK", catalogVersion: 1, products: [
    product,
    { ...product, id: "00000000-0000-4000-8000-000000000002", handle: "allrounder-y-black", title: "Allrounder Y (Black)" },
  ],
  collections: [
    { id: "c1", handle: "new-arrivals", title: "New Arrivals", products: [{ handle: product.handle }] },
    { id: "c2", handle: "sneakers", title: "Sneakers", products: [{ handle: product.handle }] },
    { id: "c3", handle: "loafers", title: "Loafers", products: [{ handle: product.handle }] },
    { id: "c4", handle: "women", title: "Women", products: [{ handle: product.handle }] },
    { id: "c5", handle: "men", title: "Men", products: [{ handle: product.handle }] },
  ],
};

assert.equal(matchRoute("/products/allrounder-y-white").type, "product");
assert.equal(matchRoute("/collections/all").type, "collection");
assert.equal(matchRoute("/pages/evensen-story").type, "page");
assert.equal(matchRoute("/blogs/news").type, "page");
assert.equal(matchRoute("/cart").type, "page");
assert.equal(matchRoute("/sitemap.xml").type, "sitemap");
assert.equal(matchRoute("/pages/materials").type, "page");
assert.equal(matchRoute("/pages/shoe-care").type, "page");
assert.equal(imageCandidates(image).length, 3);
assert.match(imageUrl(image, 600), /960\.avif$/);
assert.match(priceRange(product.variants, "NOK"), /2\D595/);

const home = renderHomePage(store);
assert.match(home, /Crafted through generations/);
assert.match(home, /Oslo 1916/);
assert.match(home, /<title>Women’s &amp; Men’s Shoes \| New Movements<\/title>/);
assert.match(home, /srcset=/);
assert.match(home, /width="1600" height="2000"/);
assert.match(home, /https:\/\/app\.reai\.no\/media\/product-images/);
assert.doesNotMatch(home, /cdn\.shopify\.com|assets\/products|catalog\.json/);
assert.match(home, new RegExp(STORE_SCRIPT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.match(home, new RegExp(STORE_STYLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
assert.match(home, /data-mega-menu data-open="false" aria-hidden="true"/);
assert.match(home, /data-mega-backdrop aria-hidden="true"/);
assert.doesNotMatch(home, /data-mega-menu hidden/);

const story = renderStoryPage(store);
assert.match(story, /<h1>Our Story<\/h1>/);
assert.match(story, /Johnny Evensen/);
assert.match(story, /Rolf Johnny Evensen/);
assert.match(story, /Knut Evensen/);
assert.match(story, /Martin Evensen/);
assert.match(story, /Fresh off the truck/);
assert.match(story, /<p>2(?:&nbsp;|\s)595<\/p>/);
assert.match(story, /data-about-menu/);

const journal = renderPage(store, "/blogs/news");
assert.match(journal, /<h1>Stories<\/h1>/);
assert.match(journal, /journal-card--1/);
assert.match(journal, /brand-assets\/journal\/finansavisen-card\.webp/);
assert.match(journal, /blogs\/news\/allrounder/);
assert.match(journal, /blogs\/news\/circularity/);
assert.match(journal, /Norway's leading financial newspaper ran a piece/);
assert.match(journal, /Zen: Where Minimalism Meets Movement/);
assert.match(journal, /Dear NM friends, here is an update/);
assert.doesNotMatch(journal, /cdn\.shopify\.com|new-movements-sneakers-and-fashion/);
assert.match(journal, /data-about-toggle/);
assert.match(journal, /class="site-footer"/);
assert.match(journal, new RegExp(STORE_STYLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

const journalRoutes = [
  ["finansavisen-wrote-about-us", "As seen in Finansavisen"],
  ["shaping-the-future-of-footwear-together-with-sintef", "Shaping the Future of Footwear"],
  ["product-story-zen-mindful-design-for-modern-movement", "Product Story: Zen"],
  ["the-nm-loafer-a-modern-classic-reimagined", "Product Story: The NM Loafer"],
  ["opening-of-our-flagship-store", "Opening our first store in Oslo"],
  ["an-update-from-our-founder-and-designer", "An update from our founder and designer"],
  ["allrounder", "Introducing the Allrounder sneaker"],
  ["circularity", "Thoughts on Circularity"],
];
for (const [slug, title] of journalRoutes) {
  const route = `/blogs/news/${slug}`;
  assert.equal(matchRoute(route).type, "page");
  const article = renderPage(store, route);
  assert.match(article, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(article, /class="journal-article-content"/);
  assert.match(article, /<time datetime=/);
  assert.match(article, />Shop now</);
  assert.doesNotMatch(article, /shopify-section|rte--/);
}

const sintefArticle = renderPage(store, "/blogs/news/shaping-the-future-of-footwear-together-with-sintef");
assert.match(sintefArticle, /around 1\.4%/);
assert.match(sintefArticle, /Musculoskeletal disorders/);
assert.match(sintefArticle, /journal-dash-list/);
assert.match(sintefArticle, /no glue, no stitching/);
assert.match(sintefArticle, /Want to get involved\?/);

const zenArticle = renderPage(store, "/blogs/news/product-story-zen-mindful-design-for-modern-movement");
assert.match(zenArticle, /Inspiration &amp; Design/);
assert.match(zenArticle, /Craftsmanship &amp; Materials/);
assert.match(zenArticle, /Comfort &amp; Versatility/);
assert.match(zenArticle, /journal-bullet-list/);
assert.match(zenArticle, /Gold-certified suede leather from Italy/);
assert.match(zenArticle, /zen-sand\.jpg/);
assert.match(zenArticle, /zen-cognac\.jpg/);

const loaferArticle = renderPage(store, "/blogs/news/the-nm-loafer-a-modern-classic-reimagined");
assert.match(loaferArticle, /Inspiration &amp; Design/);
assert.match(loaferArticle, /Craftsmanship &amp; Materials/);
assert.match(loaferArticle, /Comfort &amp; Versatility/);
assert.match(loaferArticle, /fourth-generation cobbler, Martin Evensen/);
assert.match(loaferArticle, /natural and recycled rubber/);
assert.match(loaferArticle, /loafer-polido-03\.jpg/);
assert.match(loaferArticle, /Loafer Polido Leather is available now[\s\S]*loafer-polido-06\.jpg/);

const founderArticle = renderPage(store, "/blogs/news/an-update-from-our-founder-and-designer");
assert.match(founderArticle, /Dear NM friends/);
assert.match(founderArticle, /started New Movements in 2018/);
assert.match(founderArticle, /Dapper Oslo/);
assert.match(founderArticle, /Retail’s Big Show/);
assert.match(founderArticle, /Norwegian Sneaker/);
assert.match(founderArticle, /SINTEF/);
assert.match(founderArticle, /founder-01\.jpg[\s\S]*founder-02\.jpg[\s\S]*founder-03\.jpg[\s\S]*founder-04\.png[\s\S]*founder-05\.png/);
assert.match(founderArticle, /Founder and Designer/);

const storeArticle = renderPage(store, "/blogs/news/opening-of-our-flagship-store");
assert.match(storeArticle, /Steen &amp; Strøm/);
assert.match(storeArticle, /What we'll be wearing this fall/);
assert.match(storeArticle, /collections\/allrounder-y/);
assert.match(storeArticle, /collections\/norwegian-sneaker/);
assert.match(storeArticle, /10-19 on weekdays/);
assert.match(storeArticle, /store-01\.jpg[\s\S]*store-02\.jpg[\s\S]*store-03\.jpg[\s\S]*store-04\.jpg[\s\S]*store-05\.jpg[\s\S]*store-06\.jpg[\s\S]*store-07\.jpg[\s\S]*store-08\.jpg/);

const allrounderArticle = renderPage(store, "/blogs/news/allrounder");
assert.match(allrounderArticle, /What if your next pair of sneakers were made from recycled materials\?/);
assert.match(allrounderArticle, /Become a <strong>zero-waste brand<\/strong>/);
assert.match(allrounderArticle, /The Allrounder is more than a sneaker\./);
assert.match(allrounderArticle, /Steve Tolo/);
assert.match(allrounderArticle, /journal-article--allrounder/);

const circularityArticle = renderPage(store, "/blogs/news/circularity");
assert.match(circularityArticle, /25 billion pairs of shoes/);
assert.match(circularityArticle, /Our eco-conscious approach/);
assert.match(circularityArticle, /Inspire new\.\.\. movements/);
assert.match(circularityArticle, /receive a 20% discount voucher/);
assert.match(circularityArticle, /Steve Tolo/);
assert.match(circularityArticle, /journal-article--circularity/);
assert.match(circularityArticle, /journal-section-title--break/);

const materials = renderPage(store, "/pages/materials");
assert.match(materials, /Master Your Materials/);
assert.match(materials, /materials-recycled-rubber\.webp/);
assert.match(materials, /materials-craft\.webp/);
assert.match(materials, /Shoe Care/);
assert.match(materials, /Fresh off the truck/);
assert.match(materials, /story-product-rail/);
assert.match(materials, /data-mega-toggle/);

const recycle = renderPage(store, "/pages/recycle");
assert.match(recycle, /static-page--recycle/);
assert.match(recycle, /<h1>Why We Recycle<\/h1>/);
assert.doesNotMatch(recycle, /20% recycle/);
assert.match(recycle, /maps\.app\.goo\.gl\/TheZsfUEc8qxNy2j8/);

const shoeCare = renderPage(store, "/pages/shoe-care");
assert.match(shoeCare, /<h1>Keep your pair moving<\/h1>/);
assert.match(shoeCare, /Suede and nubuck/);
assert.match(shoeCare, /href="\/pages\/materials"/);

const cart = renderPage(store, "/cart");
assert.match(cart, /data-cart-root/);
assert.match(cart, /data-checkout-start/);
assert.match(story, /story-product-rail/);
assert.match(story, /data-mega-toggle/);

const collection = renderCollectionPage(store, "sneakers");
assert.match(collection, /data-filter-count>1<\/b> items/);
assert.match(collection, /allrounder-y-white/);
assert.match(collection, /class="collection-filters"/);
assert.match(collection, /<summary>Color<\/summary>/);
assert.match(collection, /class="facet-options color-options"/);
assert.match(collection, /class="color-swatch"/);
assert.match(collection, /data-card-slide/);
assert.match(collection, /data-card-next/);
assert.match(collection, /data-card-quick-add/);
assert.match(collection, /data-card-product/);
assert.match(collection, /data-quick-add-dialog/);
assert.match(collection, /data-sort-menu/);
assert.match(collection, /value="manual" role="option"/);
assert.doesNotMatch(collection, /value="most-relevant"|value="best-selling"/);
assert.match(collection, /value="title-descending" role="option"/);
assert.match(collection, /value="price-ascending" role="option"/);
assert.doesNotMatch(collection, /value="created-descending"/);
assert.doesNotMatch(collection, /<select data-sort>/);
assert.match(collection, /11111111-1111-4111-8111-111111111111/);
assert.doesNotMatch(collection, /cdn\.shopify\.com/);

const page = renderProductPage(store, product, {
  "11111111-1111-4111-8111-111111111111": true,
  "22222222-2222-4222-8222-222222222222": false,
});
assert.match(page, /data-add-to-cart/);
assert.match(page, /11111111-1111-4111-8111-111111111111/);
assert.match(page, /application\/ld\+json/);
assert.match(page, /schema\.org\/InStock/);
assert.match(page, /data-gallery-srcset/);
assert.match(page, /White leather sneaker/);
assert.match(page, /You may also like/);
assert.match(page, /Shop with New Movements/);
assert.match(page, /Four generations of shoemakers/);
assert.match(page, /Size guide/);

const sitemap = renderSitemap(store);
assert.match(sitemap, /products\/allrounder-y-white/);
assert.match(sitemap, /collections\/sneakers/);

const root = path.resolve(import.meta.dirname, "..");
for (const file of [
  "public/index.html", "public/assets/store.js", "public/assets/store.css",
]) await access(path.join(root, file));

console.log("New Movements storefront checks passed.");

const womenContext = { url: new URL("https://shop.example/search?q=white&view=women") };
const search = renderPage(store, "/search", womenContext);
assert.match(search, /1 result for/);
assert.match(search, /href="\/products\/allrounder-y-white\?view=women"/);
assert.match(search, /name="view" value="women"/);
assert.match(search, /href="\/search\?view=men&amp;q=white"/);
assert.match(search, /href="\/collections\/sneakers\?view=women"/);
assert.match(search, /data-card-quick-add/);
assert.match(search, /srcset=/);
assert.match(search, /data-newsletter-form/);
assert.match(search, /name="email" type="email"/);
assert.match(search, /aria-label="Instagram"/);

// Numeric ranges retain published half sizes and keep the overlapping variant identity.
const { productView } = await import("../merchandising.mjs");
const rangeProduct = { ...product, variants: [35, 39, 42, 46.5, 48, 49].map((size) => ({ id: String(size), price: 2595, options: [{ name: "Size", value: String(size) }] })) };
assert.deepEqual(productView(rangeProduct, "women").variants.map((variant) => variant.id), ["35", "39", "42"]);
assert.deepEqual(productView(rangeProduct, "men").variants.map((variant) => variant.id), ["39", "42", "46.5", "48"]);
assert.equal(productView(rangeProduct, "women").variants[1], productView(rangeProduct, "men").variants[0]);

// Imported SEO names can omit colour or end mid-brand. Use the published name once.
const productMetadata = renderProductPage(store, product);
assert.match(productMetadata, /<title>Allrounder Y \(White Leather\) Sneakers \| New Movements<\/title>/);
assert.doesNotMatch(productMetadata, /<title>[^<]*Osl(?:<| \|)/);
assert.match(renderCollectionPage(store, "women"), /<title>Women&#39;s Shoes \| New Movements<\/title>/);
assert.match(renderCollectionPage(store, "men"), /<title>Men&#39;s Shoes \| New Movements<\/title>/);
assert.match(renderPage(store, "/search"), /name="robots" content="noindex,follow"/);
assert.doesNotMatch(sitemap, /<loc>[^<]*\/(?:cart|search|order\/complete)<\/loc>/);

const careProduct = { ...product, title: "Shoe Cleaner", variants: [{ ...product.variants[0], options: [{ name: "Size", value: "One size" }] }] };
const carePage = renderProductPage(store, careProduct);
assert.doesNotMatch(carePage, /Unisex footwear designed|class="product-promises"/);

// Publication and exact membership are authoritative; unavailable collections are never inferred from product names.
assert.equal(renderCollectionPage(store, "archive"), null);
const emptyArchiveStore = { ...store, collections: [...store.collections, { id: "empty", handle: "archive", title: "Archive", products: [] }] };
assert.doesNotMatch(renderCollectionPage(emptyArchiveStore, "archive"), /class="product-card"/);
assert.match(renderPage(emptyArchiveStore, "/collections"), /href="\/collections\/archive"/);
assert.match(renderSitemap(emptyArchiveStore), /<loc>https:\/\/newmovements.com\/collections\/archive<\/loc>/);
