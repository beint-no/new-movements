import { NEW_ARRIVALS, NEW_ARRIVAL_DAYS } from "./new-arrivals.mjs";
import { WINTER_SALES } from "./winter-sales.mjs";

// Ordering of the default "Featured" view on the Men and Women collection pages.
//
// New arrivals (see new-arrivals.mjs) come first, newest first, all year round. In winter (1 October
// through 1 March, Europe/Oslo) the rest runs in three steps for the audience of the page:
//   1. Best sellers: every shoe that sold at least MIN_PROVEN_SALES pairs this winter, whatever its
//      type, most sold first (winter shoes win ties).
//   2. Winter shoes that have not proven themselves yet.
//   3. Everything else.
// Within steps 2 and 3 the shoes that sold more come first, then the current order. Outside winter
// only the new arrivals move. Every other sort is untouched. Winter shoes are the products in the
// "autumn-winter" collection, so adding a shoe there in ReAI is enough to include it.

export const WINTER_COLLECTION_HANDLE = "autumn-winter";
export const MIN_PROVEN_SALES = 3;

const osloDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit" });
const osloDay = (date) => osloDate.format(date); // YYYY-MM-DD

export function isWinterSeason(date = new Date()) {
  const parts = Object.fromEntries(osloDate.formatToParts(date).map((part) => [part.type, part.value]));
  const month = Number(parts.month);
  const day = Number(parts.day);
  return month >= 10 || month <= 2 || (month === 3 && day === 1);
}

const dayNumber = (isoDay) => Date.UTC(...isoDay.split("-").map((part, index) => Number(part) - (index === 1 ? 1 : 0))) / 86_400_000;

/** Whole Oslo calendar days from `since` to `now`; negative when `since` is in the future. */
export const daysSince = (since, now = new Date()) => dayNumber(osloDay(now)) - dayNumber(since);

/**
 * @template {{ handle: string }} Product
 * @param {Product[]} products products in their default (Featured) order
 * @param {string} view "women" or "men"; any other view is returned unchanged
 * @param {{ winterHandles?: Iterable<string>, now?: Date, sales?: Record<string, Record<string, number>>, minProvenSales?: number, newArrivals?: Array<{ handle: string, since: string }>, newArrivalDays?: number }} [options]
 * @returns {Product[]}
 */
export function rankForWinter(products, view, {
  winterHandles = [], now = new Date(), sales = WINTER_SALES, minProvenSales = MIN_PROVEN_SALES,
  newArrivals = NEW_ARRIVALS, newArrivalDays = NEW_ARRIVAL_DAYS,
} = {}) {
  if (!Object.hasOwn(sales, view)) return products;
  const winterNow = isWinterSeason(now);
  // handle -> { age in days, position in the list }; an entry counts from its day until it expires
  const fresh = new Map(newArrivals.flatMap((entry, order) => {
    const age = daysSince(entry.since, now);
    return age >= 0 && age < newArrivalDays ? [[entry.handle, { age, order }]] : [];
  }));
  if (!winterNow && !fresh.size) return products;

  const winter = new Set(winterNow ? winterHandles : []);
  const units = winterNow ? sales[view] : {};
  const sold = (product) => units[product.handle] || 0;
  const step = (product) => (fresh.has(product.handle) ? -1 : sold(product) >= minProvenSales ? 0 : winter.has(product.handle) ? 1 : 2);
  return products
    .map((product, index) => ({ product, index }))
    .sort((left, right) => {
      const a = left.product, b = right.product;
      return step(a) - step(b)
        || (fresh.has(a.handle) ? fresh.get(a.handle).age - fresh.get(b.handle).age || fresh.get(a.handle).order - fresh.get(b.handle).order : 0)
        || sold(b) - sold(a)
        || Number(winter.has(b.handle)) - Number(winter.has(a.handle))
        || left.index - right.index;
    })
    .map(({ product }) => product);
}
