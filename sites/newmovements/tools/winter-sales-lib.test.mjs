import assert from "node:assert/strict";
import test from "node:test";
import { aggregateSales, audienceOf, currentSeason, renderModule, sizeOf } from "./winter-sales-lib.mjs";

test("sizes are read from the product name or from the SKU, half sizes included", () => {
  assert.equal(sizeOf({ name: "Cloud Boot (Black) (Size: 39)" }), 39);
  assert.equal(sizeOf({ name: "Allrounder Y (Smooth Forest) (Size: 43.5)" }), 43.5);
  assert.equal(sizeOf({ name: "Shoe", sku: "WS1UA02-003-43/5" }), 43.5);
  assert.equal(sizeOf({ name: "Shoe", sku: "W2UA01-001-40" }), 40);
  assert.equal(sizeOf({ name: "Caspara Boreal Puffer Jacket – Herre (Farge: Navy - Størrelse: L)", sku: "7073609023483" }), null);
});

test("sizes 35-41 are women and 42-48 are men", () => {
  assert.deepEqual([34, 35, 41, 41.5, 42, 47, 48, 49].map(audienceOf), [null, "women", "women", "women", "men", "men", "men", null]);
  assert.equal(audienceOf(null), null);
});

const handles = new Map([[1, "cloud-boot-black"], [2, "allrounder-y-smooth-forest"], [3, "puffer-jacket"]]);
const line = (productId, size, quantity, extra = {}) => ({ productId, name: `Item (Size: ${size})`, sku: null, quantity, ...extra });

test("shopper demand is counted per product and audience across currencies and channels", () => {
  const { women, men, stats } = aggregateSales([
    line(1, 39, 4), line(1, 39, 2, { currencyCode: "EUR" }), line(1, 44, 3), line(2, 44, 5), line(2, 40, 1),
  ], handles);
  assert.deepEqual(women, { "cloud-boot-black": 6, "allrounder-y-smooth-forest": 1 });
  assert.deepEqual(men, { "allrounder-y-smooth-forest": 5, "cloud-boot-black": 3 });
  assert.equal(stats.linesUsed, 5);
});

test("wholesale lines, other products and unsized lines are left out", () => {
  const { women, men, stats } = aggregateSales([
    { productId: null, name: "W3UA02 – Low Cloud Boot (Camel Brown)", sku: null, quantity: 90 },
    line(99, 40, 3),
    { productId: 3, name: "Puffer Jacket (Størrelse: L)", sku: null, quantity: 4 },
    line(1, 36, 2),
  ], handles);
  assert.deepEqual(women, { "cloud-boot-black": 2 });
  assert.deepEqual(men, {});
  assert.deepEqual(stats, { linesUsed: 1, skippedNoProduct: 1, skippedNotStorefront: 1, skippedNoSize: 1 });
});

test("returns net off sales and products that net to zero or less are dropped", () => {
  const { women } = aggregateSales([line(1, 38, 3), line(1, 38, -1), line(2, 38, 1), line(2, 38, -1)], handles);
  assert.deepEqual(women, { "cloud-boot-black": 2 });
});

test("the season runs from 1 October until today and is empty in summer", () => {
  assert.deepEqual(currentSeason(new Date("2026-11-18T12:00:00Z")), { from: "2026-10-01", to: "2026-11-18" });
  assert.deepEqual(currentSeason(new Date("2027-01-20T12:00:00Z")), { from: "2026-10-01", to: "2027-01-20" });
  assert.deepEqual(currentSeason(new Date("2027-03-01T12:00:00Z")), { from: "2026-10-01", to: "2027-03-01" });
  assert.equal(currentSeason(new Date("2027-06-15T12:00:00Z")), null);
});

test("the generated module can be imported and carries the numbers", async () => {
  const text = renderModule({ women: { "cloud-boot-black": 6 }, men: { "allrounder-y-smooth-forest": 5 } },
    { from: "2026-10-01", to: "2026-11-18", generatedOn: "2026-11-18", stats: { linesUsed: 2, skippedNoProduct: 0, skippedNotStorefront: 0, skippedNoSize: 0 } });
  const loaded = await import(`data:text/javascript,${encodeURIComponent(text)}`);
  assert.deepEqual(loaded.WINTER_SALES, { women: { "cloud-boot-black": 6 }, men: { "allrounder-y-smooth-forest": 5 } });
  assert.deepEqual(loaded.WINTER_SALES_PERIOD, { from: "2026-10-01", to: "2026-11-18", generatedOn: "2026-11-18" });
});
