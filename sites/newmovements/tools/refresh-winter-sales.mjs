// Refreshes sites/newmovements/winter-sales.mjs from ReAI sales since 1 October.
//
//   REAI_API_KEY=... node sites/newmovements/tools/refresh-winter-sales.mjs [--dry-run] [--from YYYY-MM-DD] [--to YYYY-MM-DD]
//
// Read-only against ReAI. The key comes from the environment (REAI_API_KEY, REAI_TENANT_ID) and is never printed.
// Outside the winter window it does nothing unless --from and --to are given.
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { aggregateSales, currentSeason, osloDay, renderModule } from "./winter-sales-lib.mjs";

const SITE_ID = process.env.REAI_SITE_ID || "90d5aa34-0d88-43c5-befe-7c11b3eb01b5";
const TARGET = fileURLToPath(new URL("../winter-sales.mjs", import.meta.url));

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

const season = option("--from") && option("--to") ? { from: option("--from"), to: option("--to") } : currentSeason();
if (!season) {
  console.log("Outside the winter window (1 October to 1 March): nothing to refresh.");
  process.exit(0);
}
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

async function paged(path, extra = "") {
  const rows = [];
  for (let page = 1; ; page++) {
    const result = await get(`${path}?page=${page}&pageSize=100${extra}`);
    rows.push(...result.items);
    if (!result.hasNext) return rows;
  }
}

const products = await paged(`/api/sites/${SITE_ID}/products`);
const handleByProductId = new Map(products.map((product) => [product.productId, product.handle]));
const items = await paged("/api/reports/product-sales", `&startDate=${season.from}&endDate=${season.to}&grouping=sku`);

const sales = aggregateSales(items, handleByProductId);
const text = renderModule(sales, { ...season, generatedOn: osloDay(), stats: sales.stats });

console.log(`Season ${season.from} to ${season.to}: ${items.length} report rows, ${products.length} storefront products.`);
console.log(`Used ${sales.stats.linesUsed} lines; skipped ${sales.stats.skippedNoProduct} without product, ${sales.stats.skippedNotStorefront} not storefront, ${sales.stats.skippedNoSize} without size.`);
for (const audience of ["women", "men"]) {
  const top = Object.entries(sales[audience]).slice(0, 8).map(([handle, count]) => `${handle} ${count}`).join(", ");
  console.log(`${audience}: ${Object.keys(sales[audience]).length} products. Top: ${top}`);
}
if (flag("--dry-run")) console.log("Dry run: nothing written.");
else { writeFileSync(TARGET, text); console.log(`Wrote ${TARGET}`); }
