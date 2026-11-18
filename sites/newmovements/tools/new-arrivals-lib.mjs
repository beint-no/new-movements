import { daysSince } from "../seasonal-ranking.mjs";

// Pure helpers behind tools/refresh-new-arrivals.mjs.

/**
 * @param {{ known: string[], arrivals: Array<{ handle: string, since: string }> }} current
 * @param {string[]} publishedHandles every product published on the site right now
 * @param {{ today: string, days: number, now?: Date }} options today as YYYY-MM-DD (Oslo)
 */
export function mergeNewArrivals({ known, arrivals }, publishedHandles, { today, days, now = new Date() }) {
  const knownSet = new Set(known);
  // The very first run only records what is already published; nothing is new then.
  const added = knownSet.size ? publishedHandles.filter((handle) => !knownSet.has(handle)) : [];
  // Expired entries are kept for as long again, then dropped so the file stays short.
  const kept = arrivals.filter((entry) => daysSince(entry.since, now) < days * 2);
  const have = new Set(kept.map((entry) => entry.handle));
  return {
    known: [...new Set([...known, ...publishedHandles])].sort(),
    arrivals: [...added.filter((handle) => !have.has(handle)).map((handle) => ({ handle, since: today })), ...kept],
    added,
  };
}

export function renderNewArrivalsModule({ known, arrivals }, days) {
  return `// New products stay at the very top of the Men and Women pages for NEW_ARRIVAL_DAYS after the date
// they were added, then fall back into the normal order. Dates are Europe/Oslo calendar days.
//
// tools/refresh-new-arrivals.mjs adds products that were newly published in ReAI (and keeps
// KNOWN_HANDLES up to date); the entries can also be edited by hand. An entry expires by itself.

export const NEW_ARRIVAL_DAYS = ${days};

export const NEW_ARRIVALS = [
${arrivals.map((entry) => `  { handle: ${JSON.stringify(entry.handle)}, since: ${JSON.stringify(entry.since)} },`).join("\n")}
];

// Every product that was already published when this list was last refreshed.
export const KNOWN_HANDLES = [
${known.map((handle) => `  ${JSON.stringify(handle)},`).join("\n")}
];
`;
}
