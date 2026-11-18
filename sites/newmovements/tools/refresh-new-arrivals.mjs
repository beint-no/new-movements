// Adds products that were newly published in ReAI to sites/newmovements/new-arrivals.mjs.
//
//   REAI_API_KEY=... node sites/newmovements/tools/refresh-new-arrivals.mjs [--dry-run]
//
// Read-only against ReAI. The key comes from the environment and is never printed. The first run only
// records the products that are published today.
import { writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { NEW_ARRIVAL_DAYS } from "../new-arrivals.mjs";
import { mergeNewArrivals, renderNewArrivalsModule } from "./new-arrivals-lib.mjs";
import { osloDay } from "./winter-sales-lib.mjs";

const SITE_ID = process.env.REAI_SITE_ID || "90d5aa34-0d88-43c5-befe-7c11b3eb01b5";
const TARGET = fileURLToPath(new URL("../new-arrivals.mjs", import.meta.url));
const key = process.env.REAI_API_KEY;
if (!key) throw new Error("REAI_API_KEY is not set");
const headers = { Authorization: `Bearer ${key}`, "X-Tenant-Id": process.env.REAI_TENANT_ID || "3157", Accept: "application/json" };

async function get(path) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(`https://app.reai.no${path}`, { headers });
    if (response.status === 429) { await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1))); continue; }
    if (!response.ok) throw new Error(`${path.split("?")[0]} answered HTTP ${response.status}`);
    const body = await response.json();
    return body.result ?? body;
  }
  throw new Error(`${path.split("?")[0]} stayed rate limited`);
}

const published = [];
for (let page = 1; ; page++) {
  const result = await get(`/api/sites/${SITE_ID}/products?page=${page}&pageSize=200`);
  published.push(...result.items.filter((product) => product.published).map((product) => product.handle));
  if (!result.hasNext) break;
}

const current = await import(`${pathToFileURL(TARGET).href}?t=${Date.now()}`);
const merged = mergeNewArrivals({ known: current.KNOWN_HANDLES, arrivals: current.NEW_ARRIVALS }, published, { today: osloDay(), days: NEW_ARRIVAL_DAYS });

console.log(`${published.length} published products; ${current.KNOWN_HANDLES.length ? `${merged.added.length} new since the last refresh` : "first run: recording the baseline"}.`);
for (const handle of merged.added) console.log(`  new: ${handle}`);
console.log(`New arrivals list now has ${merged.arrivals.length} entries.`);
if (process.argv.includes("--dry-run")) console.log("Dry run: nothing written.");
else { writeFileSync(TARGET, renderNewArrivalsModule(merged, NEW_ARRIVAL_DAYS)); console.log(`Wrote ${TARGET}`); }
