import test from "node:test";
import assert from "node:assert/strict";
import { canonicalPath, handleStorefrontRequest, redirectStorefrontRequest } from "../routes.mjs";
import worker from "../worker.js";

test("canonicalizes legacy Shopify paths", () => {
  assert.equal(canonicalPath("/collections/all-shoes-1"), "/collections/all");
  assert.equal(canonicalPath("/collections/accessories"), "/collections/shoe-care");
  assert.equal(canonicalPath("/collections/archive"), "/collections/all");
  assert.equal(canonicalPath("/collections/sneakers/products/allrounder-y-white"), "/products/allrounder-y-white");
  assert.equal(canonicalPath("/pages/about-us/"), "/pages/evensen-story");
  assert.equal(canonicalPath("/blogs/news/allrounder"), "/blogs/news/allrounder");
  assert.equal(canonicalPath("/blogs/news/circularity"), "/blogs/news/circularity");
});

test("redirects www and preserves query strings", () => {
  const url = new URL("https://www.newmovements.com/collections/all-shoes-1?sort=best");
  const response = redirectStorefrontRequest({ request: new Request(url), url });
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("Location"), "https://newmovements.com/collections/all?sort=best");
});

test("does not redirect Site API requests", () => {
  const url = new URL("https://newmovements.com/reai/catalog");
  assert.equal(redirectStorefrontRequest({ request: new Request(url), url }), null);
});

test("validates newsletter signup before provider delivery", async () => {
  const url = new URL("https://newmovements.com/newsletter");
  const invalid = await handleStorefrontRequest({ request: new Request(url, { method: "POST", body: JSON.stringify({ email: "invalid" }) }), url, env: {} });
  assert.equal(invalid.status, 400);
  const unconfigured = await handleStorefrontRequest({ request: new Request(url, { method: "POST", body: JSON.stringify({ email: "person@example.com" }) }), url, env: {} });
  assert.equal(unconfigured.status, 503);
});

test("redirects storefront HTTP requests to HTTPS", async () => {
  // Cloudflare can normalize the Worker URL to HTTPS while preserving the
  // original client scheme in CF-Visitor. Keep this regression covered.
  const request = new Request("https://newmovements.com/collections/women?view=women", {
    headers: { "CF-Visitor": JSON.stringify({ scheme: "http" }) },
  });
  const response = await handleStorefrontRequest({ request, env: {}, url: new URL(request.url) });
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("Location"), "https://newmovements.com/collections/women?view=women");
});

test("sets noindex on workers.dev and HSTS on HTTPS responses", async () => {
  const env = { ASSETS: { fetch: async () => new Response("ok") } };
  const previewAsset = await worker.fetch(new Request("https://newmovements.respiro.workers.dev/brand-assets/logo.svg"), env);
  assert.equal(previewAsset.headers.get("X-Robots-Tag"), "noindex, nofollow");
  assert.equal(previewAsset.headers.get("Strict-Transport-Security"), "max-age=31536000");

  const previewRobots = await worker.fetch(new Request("https://newmovements.respiro.workers.dev/robots.txt"), env);
  assert.equal(previewRobots.headers.get("X-Robots-Tag"), "noindex, nofollow");
  assert.equal(previewRobots.headers.get("Strict-Transport-Security"), "max-age=31536000");

  const previewDe = await worker.fetch(new Request("https://newmovements.respiro.workers.dev/de/collections/all"), env);
  assert.equal(previewDe.status, 308);
  assert.equal(previewDe.headers.get("X-Robots-Tag"), "noindex, nofollow");
  assert.equal(previewDe.headers.get("Strict-Transport-Security"), "max-age=31536000");

  const canonicalRobots = await worker.fetch(new Request("https://newmovements.com/robots.txt"), env);
  assert.equal(canonicalRobots.headers.get("X-Robots-Tag"), null);
  assert.equal(canonicalRobots.headers.get("Strict-Transport-Security"), "max-age=31536000");

  const localHttp = await worker.fetch(new Request("http://localhost:8787/robots.txt"), env);
  assert.equal(localHttp.headers.get("Strict-Transport-Security"), null);
});
