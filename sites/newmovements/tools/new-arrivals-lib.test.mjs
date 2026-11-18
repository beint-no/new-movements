import assert from "node:assert/strict";
import test from "node:test";
import { mergeNewArrivals, renderNewArrivalsModule } from "./new-arrivals-lib.mjs";

const options = { today: "2026-11-18", days: 45, now: new Date("2026-11-18T12:00:00Z") };

test("the first run only records what is published and adds nothing as new", () => {
  const merged = mergeNewArrivals({ known: [], arrivals: [] }, ["b", "a"], options);
  assert.deepEqual(merged, { known: ["a", "b"], arrivals: [], added: [] });
});

test("a product published since the last run becomes a new arrival dated today", () => {
  const merged = mergeNewArrivals({ known: ["a", "b"], arrivals: [] }, ["a", "b", "c"], options);
  assert.deepEqual(merged.added, ["c"]);
  assert.deepEqual(merged.arrivals, [{ handle: "c", since: "2026-11-18" }]);
  assert.deepEqual(merged.known, ["a", "b", "c"]);
});

test("existing entries are kept, and ones twice as old as the boost are dropped", () => {
  const merged = mergeNewArrivals({
    known: ["a", "old", "recent"],
    arrivals: [{ handle: "recent", since: "2026-10-20" }, { handle: "old", since: "2026-08-01" }],
  }, ["a", "old", "recent"], options);
  assert.deepEqual(merged.arrivals, [{ handle: "recent", since: "2026-10-20" }]);
  assert.deepEqual(merged.added, []);
});

test("a product that is already listed is not added twice", () => {
  const merged = mergeNewArrivals({ known: ["a"], arrivals: [{ handle: "b", since: "2026-11-10" }] }, ["a", "b"], options);
  assert.deepEqual(merged.arrivals, [{ handle: "b", since: "2026-11-10" }]);
});

test("the generated module can be imported and carries the data", async () => {
  const text = renderNewArrivalsModule({ known: ["a", "b"], arrivals: [{ handle: "b", since: "2026-11-18" }] }, 45);
  const loaded = await import(`data:text/javascript,${encodeURIComponent(text)}`);
  assert.equal(loaded.NEW_ARRIVAL_DAYS, 45);
  assert.deepEqual(loaded.NEW_ARRIVALS, [{ handle: "b", since: "2026-11-18" }]);
  assert.deepEqual(loaded.KNOWN_HANDLES, ["a", "b"]);
});
