import assert from "node:assert/strict";
import test from "node:test";
import { CONTENT_PAGES, JOURNAL_ENTRIES, JOURNAL_PAGE, MATERIALS_PAGE, STORY_PAGE } from "../content.mjs";
import * as norwegian from "../content.nb.mjs";
import {
  localizeStorefront, renderCollectionPage, renderCollectionsPage, renderHomePage, renderPage, renderProductPage,
} from "../storefront.mjs";

const fields = (record) => Object.keys(record).filter((key) => key !== "nb").sort();

test("every page, journal entry and guide is written in both languages", () => {
  assert.deepEqual(Object.keys(norwegian.CONTENT_PAGES).sort(), Object.keys(CONTENT_PAGES).sort());
  for (const [handle, page] of Object.entries(CONTENT_PAGES)) {
    assert.deepEqual(fields(norwegian.CONTENT_PAGES[handle]), fields(page), handle);
  }
  assert.deepEqual(Object.keys(norwegian.JOURNAL_ENTRIES).sort(), JOURNAL_ENTRIES.map((entry) => entry.slug).sort());
  for (const entry of JOURNAL_ENTRIES) {
    const translated = norwegian.JOURNAL_ENTRIES[entry.slug];
    for (const field of ["title", "metaTitle", "summary", "imageAlt", "copy", "date"]) {
      assert.ok(translated[field], `${entry.slug} is missing ${field}`);
    }
  }
  assert.deepEqual(fields(norwegian.STORY_PAGE), fields(STORY_PAGE));
  assert.deepEqual(fields(norwegian.MATERIALS_PAGE), fields(MATERIALS_PAGE));
  assert.deepEqual(fields(norwegian.JOURNAL_PAGE), fields(JOURNAL_PAGE));
});

const image = { url: "https://app.reai.no/media/p.avif", alt: "Hvit skinnsneaker", width: 1600, height: 2000, renditions: [] };
const product = {
  id: "00000000-0000-4000-8000-000000000001", handle: "allrounder-y-white", title: "Allrounder Y (hvitt skinn)",
  brand: "New Movements", productType: "Allrounder Y", description: "<p>En vannavvisende unisex-sneaker designet i Oslo.</p>",
  attributes: [
    // Taxonomy values are the labels the filter facets use, so they belong in the fixture.
    { key: "color", name: "Color", values: [{ id: "c1", label: "White", taxonomyValues: [{ id: "gid://shopify/TaxonomyValue/3", name: "White" }], colors: ["#ffffff"], aliases: [] }] },
    { key: "shoe-features", name: "Shoe features", values: [{ id: "f1", label: "Recycled materials", taxonomyValues: [{ id: "gid://shopify/TaxonomyValue/22936", name: "Recycled materials" }], colors: [], aliases: [] }] },
    { key: "footwear-material", name: "Footwear material", values: [{ id: "m1", label: "Leather", taxonomyValues: [{ id: "gid://shopify/TaxonomyValue/9169", name: "Leather" }], colors: [], aliases: [] }] },
  ],
  images: [image, { ...image, alt: null }],
  variants: [
    { id: "11111111-1111-4111-8111-111111111111", price: 2595, sku: "A-40", options: [{ name: "Size", value: "40" }] },
    { id: "22222222-2222-4222-8222-222222222222", price: 2595, sku: "A-41", options: [{ name: "Size", value: "41" }] },
  ],
};
const catalog = {
  currency: "NOK", locale: "nb-NO", pathPrefix: "/nb", marketHandle: "default", countryCode: "NO",
  markets: [{ handle: "default", currency: "NOK", countries: ["NO", "SE"] }],
  products: [product, { ...product, id: "00000000-0000-4000-8000-000000000002", handle: "zen-black", title: "Zen (svart)", productType: "Zen" }],
  collections: [
    { id: "c1", handle: "new-in", title: "Nyheter", products: [{ handle: product.handle }] },
    { id: "c2", handle: "sneakers", title: "Sneakers", products: [{ handle: product.handle }] },
    { id: "c3", handle: "women", title: "Dame", products: [{ handle: product.handle }] },
    { id: "c4", handle: "shoe-care", title: "Skopleie", products: [{ handle: "zen-black" }] },
  ],
};

const STATIC_PATHS = [
  "/pages/evensen-story", "/pages/our-philosophy", "/pages/recycle", "/pages/materials", "/pages/shoe-care",
  "/pages/contact-us", "/pages/returns", "/pages/terms-and-conditions", "/pages/join", "/pages/career-opportunities",
  "/pages/warranty-policy", "/policies/privacy-policy", "/policies/refund-policy", "/pages/gift-cards",
  "/policies/shipping-policy", "/pages/size-guide", "/blogs/news", "/cart", "/search", "/order/complete",
  ...JOURNAL_ENTRIES.map((entry) => `/blogs/news/${entry.slug}`),
];

// Words that only appear in English sentences. Norwegian keeps "for", "men" and "av", so they
// cannot be used here; everything below is either absent from Norwegian or a word this
// storefront would have left untranslated.
const ENGLISH = /\b(the|and|with|your|our|you|their|they|than|about|which|when|how|what|been|were|shop|search|close|women|choose|price|sort|filter|items|details|features|materials|returns|delivery|email|address|notify|quantity|select|sold|available|availability|read|view|join|discover|story|philosophy|recycle|careers|learn|change|menu|home|product|products|collection|collections|stock|image|guide|previous|next|bag|cart|checkout|shoes|shoe|care|gift|card|white|black|blue|brown|green|grey|gray|yellow|silver|leather|rubber|polyester|wool|suede|synthetic|waterproof|lightweight|cushioned|breathable|vegan|recycled|sustainable|eco)\b/i;

const norwegianText = (html) => html
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  // Customer reviews and brand model names stay in the language they were written in.
  .replace(/<blockquote>[\s\S]*?<\/blockquote>/gi, " ")
  .replace(/<p class="sg-models">[\s\S]*?<\/p>/gi, " ")
  .replace(/(?:href|src|datetime|content)="[^"]*"/g, " ")
  .replace(/<(?:link|meta)[^>]*>/gi, " ");

const englishPhrases = (html) => {
  const body = norwegianText(html);
  const found = [];
  for (const chunk of body.replace(/<[^>]+>/g, "\u0000").split("\u0000")) {
    const text = chunk.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    if (text.length > 2 && ENGLISH.test(text)) found.push(text);
  }
  for (const attribute of body.matchAll(/\b(?:alt|aria-label|placeholder|title)="([^"]{3,})"/g)) {
    if (ENGLISH.test(attribute[1])) found.push(attribute[1]);
  }
  return [...new Set(found)];
};

test("the Norwegian storefront renders no English interface copy", () => {
  const store = localizeStorefront(catalog, { locale: "nb-NO" });
  const context = { locale: "nb-NO", pathPrefix: "/nb" };
  const url = (path) => new URL(`https://newmovements.com/nb${path}`);
  const pages = new Map([
    ["/", renderHomePage(store, context)],
    ["/collections", renderCollectionsPage(store, { ...context, url: url("/collections") })],
    ["/collections/all", renderCollectionPage(store, "all", { ...context, url: url("/collections/all") })],
    ["/collections/women", renderCollectionPage(store, "women", { ...context, url: url("/collections/women") })],
    ["/products/allrounder-y-white", renderProductPage(store, store.products[0],
      { [product.variants[0].id]: true, [product.variants[1].id]: false },
      { ...context, url: url("/products/allrounder-y-white") })],
  ]);
  for (const path of STATIC_PATHS) {
    const html = renderPage(store, path, { ...context, url: url(path) });
    assert.ok(html, `${path} did not render`);
    pages.set(path, html);
  }
  for (const [path, html] of pages) {
    assert.deepEqual(englishPhrases(html), [], `English copy on /nb${path}`);
  }
});
