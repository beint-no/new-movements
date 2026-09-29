import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import path from "node:path";
import {
  STORE_SCRIPT, STORE_STYLE, imageCandidates, imageUrl, matchRoute, priceRange,
  renderCollectionPage, renderHomePage, renderProductPage, renderSitemap,
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
  currency: "NOK", catalogVersion: 1, products: [product],
  collections: [
    { id: "c1", handle: "new-arrivals", title: "New Arrivals", products: [{ handle: product.handle }] },
    { id: "c2", handle: "sneakers", title: "Sneakers", products: [{ handle: product.handle }] },
    { id: "c3", handle: "loafers", title: "Loafers", products: [{ handle: product.handle }] },
  ],
};

assert.equal(matchRoute("/products/allrounder-y-white").type, "product");
assert.equal(matchRoute("/collections/all").type, "collection");
assert.equal(matchRoute("/sitemap.xml").type, "sitemap");
assert.equal(matchRoute("/pages/materials"), null);
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

const collection = renderCollectionPage(store, "sneakers");
assert.match(collection, /data-filter-count>1<\/b> items/);
assert.match(collection, /allrounder-y-white/);
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

const sitemap = renderSitemap(store);
assert.match(sitemap, /products\/allrounder-y-white/);
assert.match(sitemap, /collections\/sneakers/);

const root = path.resolve(import.meta.dirname, "..");
for (const file of [
  "public/index.html", "public/cart/index.html", "public/search/index.html", "public/order/complete/index.html",
  "public/pages/evensen-story/index.html", "public/pages/materials/index.html",
  "public/policies/privacy-policy/index.html", "public/assets/store.js", "public/assets/store.css",
]) await access(path.join(root, file));

console.log("New Movements storefront checks passed.");
