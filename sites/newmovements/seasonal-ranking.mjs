import { WINTER_SALES } from "./winter-sales.mjs";

// Winter ordering for the Men and Women collection pages. From 1 October through 1 March
// (Europe/Oslo) the default "Featured" order puts winter shoes first, then ranks by what sold
// best last winter for that audience. Outside winter, and for every other sort, nothing changes.
// Winter shoes are the products in the "autumn-winter" collection, so adding a shoe there in ReAI
// is enough to include it.

export const WINTER_COLLECTION_HANDLE = "autumn-winter";

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
 * @param {{ winterHandles?: Iterable<string>, now?: Date, sales?: Record<string, Record<string, number>> }} [options]
 * @returns {Product[]}
 */
export function rankForWinter(products, view, { winterHandles = [], now = new Date(), sales = WINTER_SALES } = {}) {
  if (!isWinterSeason(now) || !Object.hasOwn(sales, view)) return products;
  const winter = new Set(winterHandles);
  const units = sales[view];
  return products
    .map((product, index) => ({ product, index }))
    .sort((left, right) =>
      Number(winter.has(right.product.handle)) - Number(winter.has(left.product.handle))
      || (units[right.product.handle] || 0) - (units[left.product.handle] || 0)
      || left.index - right.index)
    .map(({ product }) => product);
}
