import { WINTER_SALES } from "./winter-sales.mjs";

// Winter ordering for the Men and Women collection pages. From 1 October through 1 March
// (Europe/Oslo) the default "Featured" order runs in three steps for the audience of the page:
//   1. Best sellers: every shoe that sold at least MIN_PROVEN_SALES pairs this winter, whatever its
//      type, most sold first (winter shoes win ties).
//   2. Winter shoes that have not proven themselves yet.
//   3. Everything else.
// Within steps 2 and 3 the shoes that sold more come first, then the current order. Outside winter,
// and for every other sort, nothing changes. Winter shoes are the products in the "autumn-winter"
// collection, so adding a shoe there in ReAI is enough to include it.

export const WINTER_COLLECTION_HANDLE = "autumn-winter";
export const MIN_PROVEN_SALES = 3;

const osloDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit" });

export function isWinterSeason(date = new Date()) {
  const parts = Object.fromEntries(osloDate.formatToParts(date).map((part) => [part.type, part.value]));
  const month = Number(parts.month);
  const day = Number(parts.day);
  return month >= 10 || month <= 2 || (month === 3 && day === 1);
}

/**
 * @template {{ handle: string }} Product
 * @param {Product[]} products products in their default (Featured) order
 * @param {string} view "women" or "men"; any other view is returned unchanged
 * @param {{ winterHandles?: Iterable<string>, now?: Date, sales?: Record<string, Record<string, number>>, minProvenSales?: number }} [options]
 * @returns {Product[]}
 */
export function rankForWinter(products, view, { winterHandles = [], now = new Date(), sales = WINTER_SALES, minProvenSales = MIN_PROVEN_SALES } = {}) {
  if (!isWinterSeason(now) || !Object.hasOwn(sales, view)) return products;
  const winter = new Set(winterHandles);
  const units = sales[view];
  const sold = (product) => units[product.handle] || 0;
  const step = (product) => (sold(product) >= minProvenSales ? 0 : winter.has(product.handle) ? 1 : 2);
  return products
    .map((product, index) => ({ product, index }))
    .sort((left, right) =>
      step(left.product) - step(right.product)
      || sold(right.product) - sold(left.product)
      || Number(winter.has(right.product.handle)) - Number(winter.has(left.product.handle))
      || left.index - right.index)
    .map(({ product }) => product);
}
