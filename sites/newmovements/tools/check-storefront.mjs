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
  description: "A water-repellent unisex sneaker designed in Oslo.",
  seoTitle: "Allrounder Y White",
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
  ],
};

assert.equal(matchRoute("/products/allrounder-y-white").type, "product");
assert.equal(matchRoute("/collections/all").type, "collection");
assert.equal(matchRoute("/pages/evensen-story").type, "page");
assert.equal(matchRoute("/blogs/news").type, "page");
assert.equal(matchRoute("/cart").type, "page");
assert.equal(matchRoute("/sitemap.xml").type, "sitemap");
assert.equal(matchRoute("/pages/materials").type, "page");
assert.equal(imageCandidates(image).length, 3);
assert.match(imageUrl(image, 600), /960\.avif$/);
assert.match(priceRange(product.variants, "NOK"), /2\D595/);

const home = renderHomePage(store);
assert.match(home, /Women &amp; Men New Arrivals|Women & Men New Arrivals/);
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
assert.match(story, /Fresh of the truck/);
assert.match(story, /<p>2(?:&nbsp;|\s)595<\/p>/);
assert.match(story, /data-about-menu/);

const journal = renderPage(store, "/blogs/news");
assert.match(journal, /<h1>Journal<\/h1>/);
assert.match(journal, /New Movements, sneakers and fashion/);
assert.match(journal, /data-about-toggle/);
assert.match(journal, /class="site-footer"/);
assert.match(journal, new RegExp(STORE_STYLE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

const materials = renderPage(store, "/pages/materials");
assert.match(materials, /Chosen to last/);
assert.match(materials, /data-mega-toggle/);
const recycle = renderPage(store, "/pages/recycle");
assert.match(recycle, /static-page--recycle/);
assert.match(recycle, /<h1>Why We Recycle<\/h1>/);
assert.doesNotMatch(recycle, /20% recycle/);
assert.match(recycle, /maps\.app\.goo\.gl\/TheZsfUEc8qxNy2j8/);

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
