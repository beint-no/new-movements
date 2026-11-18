import assert from "node:assert/strict";
import test from "node:test";
import { isWinterSeason, rankForWinter } from "../seasonal-ranking.mjs";
import { renderCollectionPage } from "../storefront.mjs";

const at = (iso) => new Date(iso);

test("winter runs from 1 October through 1 March, measured on the Oslo calendar", () => {
  assert.equal(isWinterSeason(at("2026-09-30T12:00:00Z")), false);
  assert.equal(isWinterSeason(at("2026-10-01T12:00:00Z")), true);
  assert.equal(isWinterSeason(at("2026-12-24T12:00:00Z")), true);
  assert.equal(isWinterSeason(at("2027-02-28T12:00:00Z")), true);
  assert.equal(isWinterSeason(at("2027-03-01T12:00:00Z")), true);
  assert.equal(isWinterSeason(at("2027-03-02T12:00:00Z")), false);
  assert.equal(isWinterSeason(at("2026-07-15T12:00:00Z")), false);
  // 22:30 UTC on 30 Sep is already 1 Oct in Oslo (UTC+2). 23:30 UTC on 1 Mar is already 2 Mar there (UTC+1).
  assert.equal(isWinterSeason(at("2026-09-30T22:30:00Z")), true);
  assert.equal(isWinterSeason(at("2027-03-01T23:30:00Z")), false);
});

const products = ["zen-white", "original-olive-brown", "allrounder-y-smooth-forest", "cloud-boot-black"].map((handle) => ({ handle }));
const sales = { men: { "allrounder-y-smooth-forest": 5, "cloud-boot-black": 4, "original-olive-brown": 2 }, women: { "cloud-boot-black": 9, "allrounder-y-smooth-forest": 3 } };
const winterHandles = ["cloud-boot-black", "allrounder-y-smooth-forest"];
const winterNow = at("2026-11-18T12:00:00Z");
const handles = (list) => list.map((product) => product.handle);

test("in winter, winter shoes come first and each audience is ordered by its own sales", () => {
  assert.deepEqual(handles(rankForWinter(products, "men", { winterHandles, now: winterNow, sales })),
    ["allrounder-y-smooth-forest", "cloud-boot-black", "original-olive-brown", "zen-white"]);
  assert.deepEqual(handles(rankForWinter(products, "women", { winterHandles, now: winterNow, sales })),
    ["cloud-boot-black", "allrounder-y-smooth-forest", "zen-white", "original-olive-brown"]);
});

test("a winter shoe with no sales still outranks a non-winter best seller", () => {
  const ranked = rankForWinter([{ handle: "seller" }, { handle: "quiet-boot" }], "men", {
    winterHandles: ["quiet-boot"], now: winterNow, sales: { men: { seller: 50 } },
  });
  assert.deepEqual(handles(ranked), ["quiet-boot", "seller"]);
});

test("ties keep the original order and the input is not modified", () => {
  const input = [{ handle: "b" }, { handle: "a" }, { handle: "c" }];
  const ranked = rankForWinter(input, "men", { winterHandles: [], now: winterNow, sales: { men: {} } });
  assert.deepEqual(handles(ranked), ["b", "a", "c"]);
  assert.deepEqual(handles(input), ["b", "a", "c"]);
});

test("outside winter and for other views the order is untouched", () => {
  const summer = at("2026-06-15T12:00:00Z");
  assert.equal(rankForWinter(products, "men", { winterHandles, now: summer, sales }), products);
  assert.equal(rankForWinter(products, "", { winterHandles, now: winterNow, sales }), products);
});

// The real Men and Women pages: the ranking has to reach the rendered product grid.
const image = { url: "https://app.reai.no/media/p.avif", alt: "Sko", width: 1600, height: 2000, renditions: [] };
const shoe = (handle, title) => ({
  id: `00000000-0000-4000-8000-${String(Math.abs([...handle].reduce((n, c) => n * 31 + c.charCodeAt(0), 7))).padStart(12, "0").slice(0, 12)}`,
  handle, title, brand: "New Movements", productType: "Test", description: "<p>Test</p>", attributes: [],
  images: [image, image],
  variants: ["40", "41", "42", "44"].map((size) => ({ id: `${handle}-${size}`, price: 2595, sku: `${handle}-${size}`, options: [{ name: "Size", value: size }] })),
});
const store = {
  currency: "NOK", locale: "en", marketHandle: "default", countryCode: "NO",
  markets: [{ handle: "default", currency: "NOK", countries: ["NO"] }],
  products: products.map((product) => shoe(product.handle, product.handle)),
  collections: [
    { id: "w", handle: "women", title: "Women", products },
    { id: "m", handle: "men", title: "Men", products },
    { id: "aw", handle: "autumn-winter", title: "Autumn & Winter", products: winterHandles.map((handle) => ({ handle })) },
  ],
};
const gridOrder = (html) => [...new Set([...html.matchAll(/href="\/products\/([a-z0-9-]+)/g)].map((match) => match[1]))];
const render = (handle, now, query = "") => renderCollectionPage(store, handle, {
  now, url: new URL(`https://newmovements.com/collections/${handle}${query}`),
});

test("the Men and Women pages show winter shoes first in winter", () => {
  assert.deepEqual(gridOrder(render("men", winterNow)), ["allrounder-y-smooth-forest", "cloud-boot-black", "original-olive-brown", "zen-white"]);
  assert.deepEqual(gridOrder(render("women", winterNow)), ["cloud-boot-black", "allrounder-y-smooth-forest", "zen-white", "original-olive-brown"]);
});

test("the pages keep the Featured order out of season and when another sort is chosen", () => {
  const original = products.map((product) => product.handle);
  assert.deepEqual(gridOrder(render("men", at("2026-06-15T12:00:00Z"))), original);
  assert.deepEqual(gridOrder(render("men", winterNow, "?sort_by=title-ascending")),
    [...original].sort());
});
