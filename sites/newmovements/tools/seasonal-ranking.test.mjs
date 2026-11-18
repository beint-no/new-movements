import assert from "node:assert/strict";
import test from "node:test";
import { MIN_PROVEN_SALES, isWinterSeason, rankForWinter } from "../seasonal-ranking.mjs";
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

// Default (Featured) order, with the winter shoes and what each audience bought.
const handlesInOrder = ["zen-white", "original-olive-brown", "quiet-boot", "cloud-boot-black", "allrounder-y-smooth-forest", "loafer-hit"];
const products = handlesInOrder.map((handle) => ({ handle }));
const winterHandles = ["quiet-boot", "cloud-boot-black", "allrounder-y-smooth-forest"];
const sales = {
  men: { "loafer-hit": 11, "allrounder-y-smooth-forest": 5, "cloud-boot-black": 5, "original-olive-brown": 2 },
  women: { "cloud-boot-black": 9, "allrounder-y-smooth-forest": 3 },
};
const winterNow = at("2026-11-18T12:00:00Z");
const handles = (list) => list.map((product) => product.handle);
const rank = (view, extra = {}) => handles(rankForWinter(products, view, { winterHandles, now: winterNow, sales, ...extra }));

test("best sellers come first whatever their type, then winter shoes, then everything else", () => {
  assert.equal(MIN_PROVEN_SALES, 3);
  assert.deepEqual(rank("men"), ["loafer-hit", "cloud-boot-black", "allrounder-y-smooth-forest", "quiet-boot", "original-olive-brown", "zen-white"]);
  assert.deepEqual(rank("women"), ["cloud-boot-black", "allrounder-y-smooth-forest", "quiet-boot", "zen-white", "original-olive-brown", "loafer-hit"]);
});

test("a shoe needs at least three pairs sold to count as a best seller", () => {
  // original-olive-brown sold 2 to men: not a best seller, so the unsold winter shoe stays ahead of it
  assert.ok(rank("men").indexOf("quiet-boot") < rank("men").indexOf("original-olive-brown"));
  assert.ok(rank("men", { minProvenSales: 2 }).indexOf("original-olive-brown") < rank("men", { minProvenSales: 2 }).indexOf("quiet-boot"));
});

test("a proven non-winter best seller outranks a winter shoe with no sales", () => {
  const ranked = rankForWinter([{ handle: "quiet-boot" }, { handle: "seller" }], "men", {
    winterHandles: ["quiet-boot"], now: winterNow, sales: { men: { seller: 50 } },
  });
  assert.deepEqual(handles(ranked), ["seller", "quiet-boot"]);
});

test("among equal best sellers a winter shoe comes first, otherwise the current order is kept", () => {
  const ranked = rankForWinter([{ handle: "b" }, { handle: "winter" }, { handle: "a" }], "men", {
    winterHandles: ["winter"], now: winterNow, sales: { men: { a: 4, b: 4, winter: 4 } },
  });
  assert.deepEqual(handles(ranked), ["winter", "b", "a"]);
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
// The page test passes its own sales so a weekly refresh of winter-sales.mjs cannot change the outcome.
const render = (handle, now, query = "") => renderCollectionPage(store, handle, {
  now, winterSales: sales, url: new URL(`https://newmovements.com/collections/${handle}${query}`),
});

test("the Men and Women pages show best sellers, then winter shoes, then the rest in winter", () => {
  assert.deepEqual(gridOrder(render("men", winterNow)), rank("men"));
  assert.deepEqual(gridOrder(render("women", winterNow)), rank("women"));
});

test("the pages keep the Featured order out of season and when another sort is chosen", () => {
  assert.deepEqual(gridOrder(render("men", at("2026-06-15T12:00:00Z"))), handlesInOrder);
  assert.deepEqual(gridOrder(render("men", winterNow, "?sort_by=title-ascending")), [...handlesInOrder].sort());
});
