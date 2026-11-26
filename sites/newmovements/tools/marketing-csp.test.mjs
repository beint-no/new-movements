import assert from "node:assert/strict";
import test from "node:test";
import { GOOGLE_COUNTRY_DOMAINS } from "../marketing-csp.mjs";
import worker from "../worker.js";

async function storefrontPolicy() {
  const request = new Request("https://newmovements.com/brand-assets/logo.svg");
  const env = { ASSETS: { fetch: async () => new Response("ok") } };
  const response = await worker.fetch(request, env);
  assert.equal(response.status, 200);
  const policy = response.headers.get("Content-Security-Policy");
  assert.ok(policy);
  const directives = policy.split(";").map((part) => part.trim().split(/\s+/));
  assert.equal(new Set(directives.map(([name]) => name)).size, directives.length);
  return new Map(directives.map(([name, ...sources]) => [name, sources]));
}

test("Google Ads allows all delivery-market Google origins for images and connections", async () => {
  const policy = await storefrontPolicy();
  assert.equal(new Set(GOOGLE_COUNTRY_DOMAINS).size, 30);
  for (const origin of ["https://www.google.com", ...GOOGLE_COUNTRY_DOMAINS]) {
    assert.ok(policy.get("img-src").includes(origin), `img-src ${origin}`);
    assert.ok(policy.get("connect-src").includes(origin), `connect-src ${origin}`);
  }
});

test("marketing CSP preserves the script and frame sources for Turnstile and Google Tag Manager", async () => {
  const policy = await storefrontPolicy();
  assert.deepEqual(policy.get("script-src"), ["'self'", "https://challenges.cloudflare.com", "https://www.googletagmanager.com", "https://www.googleadservices.com", "https://www.google.com"]);
  assert.deepEqual(policy.get("frame-src"), ["https://challenges.cloudflare.com", "https://www.googletagmanager.com"]);
  assert.ok(policy.get("img-src").includes("https://www.facebook.com"));
  assert.deepEqual(policy.get("frame-ancestors"), ["'none'"]);
});
