import assert from "node:assert/strict";
import test from "node:test";

import { createReaiStorefrontWorker } from "./worker.mjs";

const storefront = {
  HANDLE: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  matchRoute: () => null,
};

test("rejects Site API requests when the Worker has no credential", async () => {
  const worker = createReaiStorefrontWorker({
    cacheKey: "missing-token",
    storefront,
    market: "default",
    locale: "en",
  });
  const response = await worker.fetch(new Request("https://shop.example/reai/catalog"), {});

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "The Site API is not configured." });
});

test("validates checkout lines before calling ReAI", async () => {
  const worker = createReaiStorefrontWorker({
    cacheKey: "invalid-checkout",
    storefront,
    market: "default",
    locale: "en",
  });
  const response = await worker.fetch(new Request("https://shop.example/reai/checkout/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines: [{ variantId: "not-a-uuid", quantity: 1 }] }),
  }), { REAI_SITE_TOKEN: "test-token" });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "The cart contains an invalid variant or quantity." });
});

test("adds a same-origin return URL and idempotency key", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  let upstreamRequest;
  globalThis.fetch = async (input, init) => {
    upstreamRequest = { input, init };
    return new Response(JSON.stringify({ checkoutUrl: "https://app.reai.no/checkout/session/example" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  };

  const worker = createReaiStorefrontWorker({
    cacheKey: "checkout",
    storefront,
    market: "default",
    locale: "en",
  });
  const variantId = "018f3c2e-8b1a-4d3e-9c4f-5a6b7c8d9e0f";
  const response = await worker.fetch(new Request("https://shop.example/reai/checkout/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines: [{ variantId, quantity: 2 }] }),
  }), { REAI_SITE_TOKEN: "test-token" });

  assert.equal(response.status, 201);
  assert.equal(upstreamRequest.input, "https://app.reai.no/site/v1/commerce/checkout-sessions?market=default&locale=en");
  assert.ok(upstreamRequest.init.headers.get("Idempotency-Key"));
  assert.deepEqual(JSON.parse(upstreamRequest.init.body), {
    lines: [{ variantId, quantity: 2 }],
    returnUrl: "https://shop.example/bestilling/fullfort/",
  });
});

test("scopes API routes, checkout returns, and response language to a path-prefixed locale", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const upstreamRequests = [];
  globalThis.fetch = async (input, init) => {
    upstreamRequests.push({ input, init });
    return new Response(JSON.stringify({ checkoutUrl: "https://app.reai.no/checkout/session/example" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  };

  const worker = createReaiStorefrontWorker({
    cacheKey: "localized-checkout",
    storefront,
    locale: "nb-NO",
    market: "norway",
    pathPrefix: "/nb",
    checkoutReturnPath: "/bestilling/fullfort/",
  });
  const variantId = "018f3c2e-8b1a-4d3e-9c4f-5a6b7c8d9e0f";
  const response = await worker.fetch(new Request("https://shop.example/nb/reai/checkout/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines: [{ variantId, quantity: 1 }] }),
  }), { REAI_SITE_TOKEN: "test-token" });

  assert.equal(response.status, 201);
  assert.equal(response.headers.get("Content-Language"), "nb-NO");
  assert.equal(upstreamRequests[0].input, "https://app.reai.no/site/v1/commerce/checkout-sessions?market=norway&locale=nb-NO");
  assert.equal(JSON.parse(upstreamRequests[0].init.body).returnUrl, "https://shop.example/nb/bestilling/fullfort/");
});

test("sends the configured market and locale on every commerce delivery route", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const inputs = [];
  globalThis.fetch = async (input) => {
    inputs.push(String(input));
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const worker = createReaiStorefrontWorker({
    cacheKey: "market-context",
    storefront,
    locale: "en-NO",
    market: "international",
  });
  const routes = [
    "/reai/catalog",
    "/reai/products/example",
    "/reai/collections",
    "/reai/collections/example",
    "/reai/availability/018f3c2e-8b1a-4d3e-9c4f-5a6b7c8d9e0f",
  ];
  for (const route of routes) {
    const response = await worker.fetch(new Request(`https://shop.example${route}`), {
      REAI_SITE_TOKEN: "test-token",
    });
    assert.equal(response.status, 200);
  }

  for (const input of inputs) {
    const url = new URL(input);
    assert.equal(url.searchParams.get("market"), "international");
    assert.equal(url.searchParams.get("locale"), "en-NO");
  }
});

test("serves cached catalog JSON stale while revalidating the storefront snapshot by ETag", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  const originalNow = Date.now;
  context.after(() => {
    globalThis.fetch = originalFetch;
    globalThis.caches = originalCaches;
    Date.now = originalNow;
  });

  let now = 1_000_000;
  Date.now = () => now;
  const cachedResponses = new Map();
  globalThis.caches = {
    default: {
      async match(request) {
        return cachedResponses.get(request.url)?.clone();
      },
      async put(request, response) {
        cachedResponses.set(request.url, response.clone());
      },
    },
  };

  const snapshot = {
    catalogVersion: 7,
    marketId: "018f3c2e-8b1a-4d3e-9c4f-5a6b7c8d9e0f",
    marketHandle: "norway",
    locale: "nb-NO",
    currency: "NOK",
    products: [{ id: "product-1", handle: "example" }],
    collections: [{ id: "collection-1", handle: "all", products: [] }],
  };
  let upstreamCalls = 0;
  globalThis.fetch = async (_input, init) => {
    upstreamCalls += 1;
    if (init.headers.get("If-None-Match")) return new Response(null, { status: 304 });
    return new Response(JSON.stringify(snapshot), {
      headers: {
        "Content-Type": "application/json",
        ETag: 'W/"storefront:7:market:nb-NO"',
      },
    });
  };

  const worker = createReaiStorefrontWorker({
    cacheKey: "stale-revalidation",
    storefront,
    market: "norway",
    locale: "nb-NO",
  });
  const request = () => new Request("https://shop.example/reai/catalog");
  const env = { REAI_SITE_TOKEN: "test-token" };

  const miss = await worker.fetch(request(), env);
  assert.equal(miss.headers.get("X-ReAI-Storefront-Cache"), "MISS");
  assert.equal(upstreamCalls, 1);
  assert.equal((await miss.json()).collections, undefined);

  now += 61_000;
  let revalidation;
  const stale = await worker.fetch(request(), env, { waitUntil(promise) { revalidation = promise; } });
  assert.equal(stale.headers.get("X-ReAI-Storefront-Cache"), "STALE");
  assert.ok(revalidation);
  await revalidation;
  assert.equal(upstreamCalls, 2);

  const hit = await worker.fetch(request(), env);
  assert.equal(hit.headers.get("X-ReAI-Storefront-Cache"), "HIT");
  assert.equal(upstreamCalls, 2);
});

test("catalog projections share the snapshot but isolate views and conditional responses", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  context.after(() => {
    globalThis.fetch = originalFetch;
    globalThis.caches = originalCaches;
  });
  const cache = new Map();
  globalThis.caches = { default: {
    async match(request) { return cache.get(request.url)?.clone(); },
    async put(request, response) { cache.set(request.url, response.clone()); },
  } };
  const products = [{ id: "35", size: "35" }, { id: "42", size: "42" }, { id: "47", size: "47" }];
  let upstreamCalls = 0;
  globalThis.fetch = async () => {
    upstreamCalls++;
    return Response.json({ catalogVersion: 7, marketId: "market", locale: "en", products, collections: [] });
  };
  const worker = createReaiStorefrontWorker({
    cacheKey: "view-test", market: "default", locale: "en",
    storefront: { ...storefront, catalogProductsForRequest(entries, { url }) {
      const view = url.searchParams.get("view");
      return entries.filter((product) => view === "women" ? Number(product.size) <= 42 : view === "men" ? Number(product.size) >= 40 : true);
    } },
  });
  const request = (view, etag) => new Request(`https://shop.example/reai/catalog${view ? `?view=${view}` : ""}`, { headers: etag ? { "If-None-Match": etag } : {} });
  const env = { REAI_SITE_TOKEN: "test-token" };
  const women = await worker.fetch(request("women"), env);
  const men = await worker.fetch(request("men", women.headers.get("ETag")), env);
  assert.equal(men.status, 200);
  assert.deepEqual((await women.json()).products.map((p) => p.id), ["35", "42"]);
  assert.deepEqual((await men.json()).products.map((p) => p.id), ["42", "47"]);
  assert.equal((await worker.fetch(request("men", men.headers.get("ETag")), env)).status, 304);
  assert.deepEqual((await (await worker.fetch(request(""), env)).json()).products, products);
  assert.equal(upstreamCalls, 1);

  // The direct catalog fallback applies the same projection if the snapshot is unavailable.
  globalThis.caches = undefined;
  globalThis.fetch = async (url) => String(url).includes("/storefront")
    ? new Response(null, { status: 500 }) : Response.json({ products });
  const fallback = await worker.fetch(request("women"), env);
  assert.equal(fallback.status, 200);
  assert.deepEqual((await fallback.json()).products.map((p) => p.id), ["35", "42"]);
});

test("cold storefront render falls back when the consolidated endpoint returns a server error", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/commerce/storefront")) return new Response(null, { status: 502 });
    if (url.includes("/commerce/catalog")) return Response.json({ catalogVersion: 3, marketId: "market", locale: "en", currency: "NOK", products: [], collections: [] });
    if (url.includes("/commerce/collections")) return Response.json({ collections: [] });
    throw new Error(`Unexpected upstream request: ${url}`);
  };
  const worker = createReaiStorefrontWorker({
    cacheKey: "storefront-5xx-fallback",
    storefront: {
      ...storefront,
      matchRoute: (path) => path === "/" ? { type: "home" } : null,
      renderHomePage: () => "<title>Fallback home</title>",
      homeAvailabilityVariants: () => [],
    },
    market: "default",
    locale: "en",
  });
  const response = await worker.fetch(new Request("https://shop.example/"), { REAI_SITE_TOKEN: "test-token" });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Fallback home/);
});

test("loads live product availability in one batch request", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  const variantIds = [
    "018f3c2e-8b1a-4d3e-9c4f-5a6b7c8d9e0f",
    "028f3c2e-8b1a-4d3e-9c4f-5a6b7c8d9e0f",
  ];
  const upstreamUrls = [];
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    upstreamUrls.push(url);
    if (url.pathname === "/site/v1/commerce/availability") {
      return new Response(JSON.stringify({
        variants: [
          { variantId: variantIds[0], status: "AVAILABLE" },
          { variantId: variantIds[1], status: "OUT_OF_STOCK" },
        ],
      }), { headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({
      catalogVersion: 1,
      marketId: "market-id",
      marketHandle: "default",
      locale: "en",
      currency: "NOK",
      products: [{
        id: "product-id",
        handle: "example",
        variants: variantIds.map((id) => ({ id })),
      }],
      collections: [],
    }), { headers: { "Content-Type": "application/json" } });
  };
  let renderedAvailability;
  const productStorefront = {
    ...storefront,
    matchRoute() {
      return { type: "product", valid: true, needsSlash: false, handle: "example" };
    },
    productByHandle(store, handle) {
      return store.products.find((product) => product.handle === handle);
    },
    renderProductPage(_store, _product, availability) {
      renderedAvailability = availability;
      return "<!doctype html><title>Example</title>";
    },
  };
  const worker = createReaiStorefrontWorker({
    cacheKey: "batch-availability",
    storefront: productStorefront,
    market: "default",
    locale: "en",
  });

  const response = await worker.fetch(
    new Request("https://shop.example/products/example/"),
    { REAI_SITE_TOKEN: "test-token" },
  );

  assert.equal(response.status, 200);
  const availabilityRequests = upstreamUrls.filter((url) => url.pathname === "/site/v1/commerce/availability");
  assert.equal(availabilityRequests.length, 1);
  assert.deepEqual(availabilityRequests[0].searchParams.getAll("variantId"), variantIds);
  assert.deepEqual(renderedAvailability, {
    [variantIds[0]]: true,
    [variantIds[1]]: false,
  });
});

test("collection stock filters load live stock in batches and cannot be cached", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  const id = "018f3c2e-8b1a-4d3e-9c4f-5a6b7c8d9e0f";
  const calls = [];
  globalThis.fetch = async (input) => {
    const url = new URL(input);
    calls.push(url.pathname);
    if (url.pathname === "/site/v1/commerce/availability") return Response.json({ variants: [{ variantId: id, status: "AVAILABLE" }] });
    return Response.json({ catalogVersion: 1, marketId: "market", locale: "en", currency: "NOK", products: [{ id: "product", variants: [{ id }] }], collections: [{ handle: "all" }] });
  };
  const rendered = [];
  const worker = createReaiStorefrontWorker({ cacheKey: "collection-stock", market: "default", locale: "en", storefront: {
    ...storefront,
    matchRoute: () => ({ type: "collection", valid: true, needsSlash: false, handle: "all" }),
    collectionAvailabilityVariants: (store, _handle, ctx) => ctx.url.searchParams.has("filter.v.availability") ? store.products.flatMap(p => p.variants) : [],
    renderCollectionPage: (_store, _handle, ctx) => { rendered.push(ctx.availability); return "<title>Collection</title>"; },
  } });
  const env = { REAI_SITE_TOKEN: "test-token" };
  const normal = await worker.fetch(new Request("https://shop.example/collections/all"), env);
  assert.match(normal.headers.get("Cache-Control"), /public/);
  assert.equal(calls.filter(p => p.endsWith("/availability")).length, 0);
  const filtered = await worker.fetch(new Request("https://shop.example/collections/all?filter.v.availability=1"), env);
  assert.equal(filtered.headers.get("Cache-Control"), "no-store");
  assert.equal(calls.filter(p => p.endsWith("/availability")).length, 1);
  assert.deepEqual(rendered[1], { [id]: true });
});

test("rejects invalid market handles", () => {
  assert.throws(
    () => createReaiStorefrontWorker({
      cacheKey: "invalid-market",
      storefront,
      market: "Not valid!",
      locale: "en",
    }),
    /Invalid market/,
  );
});

test("requires an explicit ReAI market and locale", () => {
  assert.throws(
    () => createReaiStorefrontWorker({ cacheKey: "missing-market", storefront, locale: "nb-NO" }),
    /market is required/,
  );
  assert.throws(
    () => createReaiStorefrontWorker({ cacheKey: "missing-locale", storefront, market: "default" }),
    /locale is required/,
  );
});

test("strips the locale prefix for commerce matching and preserves it in redirects", async () => {
  let matchedPath;
  const localizedStorefront = {
    ...storefront,
    matchRoute(pathname) {
      matchedPath = pathname;
      return {
        type: "product",
        handle: "example",
        canonicalPath: "/products/example/",
        needsSlash: true,
        valid: true,
      };
    },
  };
  const worker = createReaiStorefrontWorker({
    cacheKey: "localized-route",
    storefront: localizedStorefront,
    locale: "nb-NO",
    market: "norway",
    pathPrefix: "/nb",
  });

  const response = await worker.fetch(new Request("https://shop.example/nb/products/example?market=international"), {
    REAI_SITE_TOKEN: "test-token",
  });

  assert.equal(matchedPath, "/products/example");
  assert.equal(response.status, 301);
  assert.equal(response.headers.get("Location"), "https://shop.example/nb/products/example/?market=international");
});


test("a stalled catalog refresh does not block another request", { timeout: 2000 }, async (context) => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  context.after(() => {
    globalThis.fetch = originalFetch;
    globalThis.caches = originalCaches;
  });
  globalThis.caches = { default: { async match() {}, async put() {} } };
  const started = Promise.withResolvers();
  const stalled = Promise.withResolvers();
  let calls = 0;
  const snapshot = () => new Response(JSON.stringify({ products: [], collections: [] }));
  globalThis.fetch = async () => {
    if (++calls === 1) {
      started.resolve();
      return stalled.promise;
    }
    return snapshot();
  };
  const worker = createReaiStorefrontWorker({ cacheKey: "independent-refresh", storefront, locale: "nb-NO", market: "default" });
  const request = () => new Request("https://shop.example/reai/catalog");
  const env = { REAI_SITE_TOKEN: "test-token" };
  const first = worker.fetch(request(), env);
  await started.promise;
  try {
    const second = await Promise.race([
      worker.fetch(request(), env),
      new Promise((_, reject) => {
        const timer = setTimeout(() => reject(new Error("Second request blocked by first refresh")), 500);
        context.after(() => clearTimeout(timer));
      }),
    ]);
    assert.equal(second.status, 200);
    assert.equal(calls, 2);
  } finally {
    stalled.resolve(snapshot());
    await first;
  }
});

test("preserves actionable checkout stock conflicts without caching them", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  const variantId = "018f3c2e-8b1a-4d3e-9c4f-5a6b7c8d9e0f";
  const problem = {
    status: 409, code: "INSUFFICIENT_STOCK", detail: "One or more items are out of stock.",
    stockIssues: [{ variantId, title: "Shoe", options: [{ name: "Size", value: "35" }], requestedQuantity: 1, maximumQuantity: 0 }],
  };
  globalThis.fetch = async (input, init) => {
    assert.equal(init.headers.get("Accept-Language"), "en");
    return Response.json(problem, { status: 409, headers: { "Content-Type": "application/problem+json" } });
  };
  const worker = createReaiStorefrontWorker({ cacheKey: "stock-conflict", storefront, market: "default", locale: "en" });
  const response = await worker.fetch(new Request("https://shop.example/reai/checkout/start", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines: [{ variantId, quantity: 1 }] }),
  }), { REAI_SITE_TOKEN: "test-token" });
  assert.equal(response.status, 409);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("Content-Language"), "en");
  assert.deepEqual(await response.json(), problem);
});

test("allows an explicit image CDN without broadening script or form permissions", async () => {
  const worker = createReaiStorefrontWorker({ cacheKey: "image-cdn", storefront, market: "default", locale: "en", imageOrigins: ["https://cdn.shopify.com"] });
  const response = await worker.fetch(new Request("https://shop.example/reai/catalog"), {});
  const policy = response.headers.get("Content-Security-Policy");
  assert.match(policy, /img-src 'self' data: https:\/\/app.reai.no https:\/\/cdn.shopify.com;/);
  assert.match(policy, /script-src 'self'; form-action 'self' mailto:/);
  assert.throws(() => createReaiStorefrontWorker({ cacheKey: "unsafe-image-cdn", storefront, market: "default", locale: "en", imageOrigins: ["https://cdn.shopify.com; script-src *"] }), /Invalid URL|HTTPS origins/);
});

test("merchant checkout pages and draft responses suppress referrers and caching", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => new Response(JSON.stringify({ id: "a".repeat(32) }), {
    headers: { "Content-Type": "application/json" },
  });
  const worker = createReaiStorefrontWorker({
    cacheKey: "merchant-private-response", market: "default", locale: "en",
    merchantCheckoutPath: "/checkout",
    storefront: { ...storefront, renderCheckoutPage: () => "<!doctype html><title>Checkout</title>" },
  });
  for (const path of ["/checkout?checkout=" + "a".repeat(32), "/reai/checkout/" + "a".repeat(32)]) {
    const response = await worker.fetch(new Request("https://shop.example" + path), { REAI_SITE_TOKEN: "test-token" });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Referrer-Policy"), "no-referrer");
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");
  }
});

test("newsletter requests explicitly select the offer and preserve the storefront locale", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  const calls = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ input, body: JSON.parse(init.body) });
    return Response.json({ accepted: true });
  };
  const worker = createReaiStorefrontWorker({ cacheKey: "newsletter", storefront, market: "default", locale: "nb-NO" });
  const signup = (body) => worker.fetch(new Request("https://shop.example/reai/newsletter/subscribe", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "https://shop.example" }, body: JSON.stringify(body),
  }), { REAI_SITE_TOKEN: "test-token" });
  assert.equal((await signup({ email: " member@example.com ", name: " Member ", consent: true })).status, 200);
  assert.deepEqual(calls[0].body, { email: "member@example.com", name: "Member", consent: true, locale: "nb-NO" });
  assert.equal((await signup({ email: "member@example.com", consent: true, welcomeDiscount: true })).status, 200);
  assert.equal(calls[1].body.welcomeDiscount, true);
  assert.equal(calls[1].body.locale, "nb-NO");
  assert.equal((await signup({ email: "member@example.com", consent: false, welcomeDiscount: true })).status, 400);
  assert.equal((await signup({ email: "member@example.com", consent: true, welcomeDiscount: "true" })).status, 400);
  assert.equal(calls.length, 2);
});

test("newsletter forms work without JavaScript and never claim success for a disabled offer", async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  let status = 200;
  let payload;
  globalThis.fetch = async (input, init) => {
    payload = JSON.parse(init.body);
    return Response.json({ accepted: status === 200 }, { status });
  };
  const worker = createReaiStorefrontWorker({ cacheKey: "newsletter-form", storefront: {
    ...storefront, renderMessagePage: (store, message) => `<h1>${message.heading}</h1><p>${message.text}</p>`,
  }, market: "default", locale: "en" });
  const signup = () => worker.fetch(new Request("https://shop.example/reai/newsletter/subscribe", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Origin: "https://shop.example" },
    body: new URLSearchParams({ email: "member@example.com", consent: "true", welcomeDiscount: "true" }),
  }), { REAI_SITE_TOKEN: "test-token" });
  let response = await signup();
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Check your email/);
  assert.equal(payload.welcomeDiscount, true);
  status = 400;
  response = await signup();
  assert.equal(response.status, 400);
  assert.match(await response.text(), /could not save/);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});


test("collection conditional responses follow inventory-driven order without a catalog edit", async (context) => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  const originalNow = Date.now;
  context.after(() => {
    globalThis.fetch = originalFetch;
    globalThis.caches = originalCaches;
    Date.now = originalNow;
  });
  let now = 1_000_000;
  Date.now = () => now;
  const cache = new Map();
  globalThis.caches = { default: {
    async match(request) { return cache.get(request.url)?.clone(); },
    async put(request, response) { cache.set(request.url, response.clone()); },
  } };
  let order = ["broad-sizes", "one-size"];
  let revision = 'W/"stock-1"';
  globalThis.fetch = async (_input, init) => {
    if (init.headers.get("If-None-Match") === revision) return new Response(null, { status: 304 });
    return Response.json({
      catalogVersion: 7, marketId: "market", locale: "en", products: [],
      collections: [{ id: "shoes", handle: "shoes", products: order.map(handle => ({ handle })) }],
    }, { headers: { ETag: revision } });
  };
  const worker = createReaiStorefrontWorker({ cacheKey: "stock-order", storefront, market: "norway", locale: "en" });
  const env = { REAI_SITE_TOKEN: "test-token" };
  const request = etag => new Request("https://shop.example/reai/collections/shoes", {
    headers: etag ? { "If-None-Match": etag } : {},
  });
  const first = await worker.fetch(request(), env);
  const firstTag = first.headers.get("ETag");
  assert.deepEqual((await first.json()).products.map(product => product.handle), order);
  assert.equal((await worker.fetch(request(firstTag), env)).status, 304);
  now += 61_000;
  revision = 'W/"stock-2"';
  order = [...order].reverse();
  let revalidation;
  const stale = await worker.fetch(request(firstTag), env, { waitUntil(promise) { revalidation = promise; } });
  assert.equal(stale.status, 304);
  await revalidation;
  const updated = await worker.fetch(request(firstTag), env);
  assert.equal(updated.status, 200);
  assert.notEqual(updated.headers.get("ETag"), firstTag);
  assert.deepEqual((await updated.json()).products.map(product => product.handle), order);
  assert.equal((await worker.fetch(request(updated.headers.get("ETag")), env)).status, 304);
});

test('search returns a bounded compact response from the shared snapshot and preserves ranking context', async (context) => {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  context.after(() => { globalThis.fetch = originalFetch; globalThis.caches = originalCaches; });
  const cache = new Map();
  globalThis.caches = { default: { match: async (request) => cache.get(request.url)?.clone(), put: async (request, response) => { cache.set(request.url, response.clone()); } } };
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({ catalogVersion: 1, marketHandle: 'default', locale: 'en', currency: 'NOK', products: Array.from({ length: 20 }, (_, id) => ({ id: `p${id}`, handle: `boot-${id}`, title: `Black Boot ${id}`, images: [{ url: 'https://app.reai.no/example.avif' }], variants: [{ id: `v${id}`, price: 100, options: [] }], description: 'A large description must not enter the search response.' })), collections: [] }); };
  const worker = createReaiStorefrontWorker({ cacheKey: 'compact-search', storefront: { ...storefront, catalogProductsForRequest: (products, context) => products.map((product) => ({ ...product, url: `/products/${product.handle}?view=${context.url.searchParams.get('view')}` })) }, market: 'default', locale: 'en' });
  const response = await worker.fetch(new Request('https://shop.example/reai/search?q=black+boots&view=men'), { REAI_SITE_TOKEN: 'test-token' });
  const result = await response.json();
  assert.equal(result.products.length, 6);
  assert.equal(result.products[0].url, '/products/boot-0?view=men');
  assert.equal(result.products[0].price, 100);
  assert.equal(result.products[0].variants, undefined);
  assert.equal(result.products[0].description, undefined);
  assert.equal(result.products[0].id, undefined);
  const second = await worker.fetch(new Request('https://shop.example/reai/search?q=no-match'), { REAI_SITE_TOKEN: 'test-token' });
  assert.equal((await second.json()).products.length, 0);
  assert.equal(calls, 1);
});
