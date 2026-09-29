import assert from "node:assert/strict";
import test from "node:test";

import { ReaiSiteClient } from "./client.mjs";

test("builds every Site API operation from the generated contract", async () => {
  const requests = [];
  const client = new ReaiSiteClient({
    baseUrl: "https://api.example/",
    token: "site-token",
    async fetch(input, init) {
      requests.push(new Request(input, init));
      return Response.json({ accepted: true });
    },
  });
  const context = { market: "norway", locale: "nb-NO" };

  await client.site();
  await client.storefront(context, 'W/"storefront"');
  await client.catalog(context, 'W/"catalog"');
  await client.product("shoe/name", context);
  await client.collections(context);
  await client.collection("best sellers", context);
  await client.availabilities(["variant-1", "variant-2"], context);
  await client.availability("variant/id", context);
  await client.createCheckoutSession({
    lines: [{ variantId: "018f3c2e-8b1a-4d3e-9c4f-5a6b7c8d9e0f", quantity: 2 }],
    returnUrl: "https://shop.example/complete/",
  }, context, "checkout-key");

  assert.deepEqual(requests.map((request) => request.method), [
    "GET", "GET", "GET", "GET", "GET", "GET", "GET", "GET", "POST",
  ]);
  assert.deepEqual(requests.map((request) => new URL(request.url).pathname), [
    "/site/v1/site",
    "/site/v1/commerce/storefront",
    "/site/v1/commerce/catalog",
    "/site/v1/commerce/products/shoe%2Fname",
    "/site/v1/commerce/collections",
    "/site/v1/commerce/collections/best%20sellers",
    "/site/v1/commerce/availability",
    "/site/v1/commerce/availability/variant%2Fid",
    "/site/v1/commerce/checkout-sessions",
  ]);
  for (const request of requests.slice(1)) {
    const url = new URL(request.url);
    assert.equal(url.searchParams.get("market"), "norway");
    assert.equal(url.searchParams.get("locale"), "nb-NO");
    assert.equal(request.headers.get("Authorization"), "Bearer site-token");
  }
  assert.equal(requests[1].headers.get("If-None-Match"), 'W/"storefront"');
  assert.equal(requests[2].headers.get("If-None-Match"), 'W/"catalog"');
  assert.deepEqual(new URL(requests[6].url).searchParams.getAll("variantId"), ["variant-1", "variant-2"]);
  assert.equal(requests[8].headers.get("Idempotency-Key"), "checkout-key");
  assert.deepEqual(await requests[8].json(), {
    lines: [{ variantId: "018f3c2e-8b1a-4d3e-9c4f-5a6b7c8d9e0f", quantity: 2 }],
    returnUrl: "https://shop.example/complete/",
  });
});

test("returns typed JSON without changing the upstream response", async () => {
  const client = new ReaiSiteClient({
    token: "site-token",
    async fetch() {
      return Response.json({
        id: "site-id",
        name: "Example",
        sourceLocale: "nb-NO",
        status: "enabled",
        markets: [],
      }, { headers: { ETag: 'W/"site"' } });
    },
  });

  const result = await client.site();
  assert.equal(result.response.headers.get("ETag"), 'W/"site"');
  assert.equal((await result.json()).sourceLocale, "nb-NO");
});

test("requires a server-side Site credential", () => {
  assert.throws(() => new ReaiSiteClient({ token: "" }), /token is required/);
  assert.throws(() => new ReaiSiteClient({ token: "   " }), /token is required/);
});

test("calls fetch as a free function and trims the Site credential", async () => {
  let invokedThis;
  let authorization;
  const client = new ReaiSiteClient({
    token: " site-token \n",
    async fetch(input, init) {
      invokedThis = this;
      authorization = new Request(input, init).headers.get("Authorization");
      return Response.json({ ok: true });
    },
  });
  await client.site();
  assert.equal(invokedThis, undefined);
  assert.equal(authorization, "Bearer site-token");
});
