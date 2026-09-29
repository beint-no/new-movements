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
