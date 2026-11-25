import assert from "node:assert/strict";
import test from "node:test";
import { GOOGLE_COUNTRY_DOMAINS, withMarketingCsp } from "../marketing-csp.mjs";

const base = "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://app.reai.no; script-src 'self'; form-action 'self' mailto:; base-uri 'self'; frame-ancestors 'none'; object-src 'none'";
const directive = (policy, name) => policy.split(";").map((part) => part.trim().split(/\s+/)).find(([key]) => key === name)?.slice(1) ?? [];

test("Google Ads can reach the visitor's own Google domain in every delivery country", () => {
  const policy = withMarketingCsp(base);
  for (const origin of ["https://www.google.no", "https://www.google.se", "https://www.google.co.uk", "https://www.google.de", "https://www.google.com.cy", "https://www.google.com"]) {
    assert.ok(directive(policy, "img-src").includes(origin), `img-src ${origin}`);
    assert.ok(directive(policy, "connect-src").includes(origin), `connect-src ${origin}`);
  }
  assert.equal(GOOGLE_COUNTRY_DOMAINS.length, 30);
});

test("marketing CSP keeps scripts to the documented Google tag origins", () => {
  const policy = withMarketingCsp(base);
  assert.deepEqual(directive(policy, "script-src"), ["'self'", "https://www.googletagmanager.com", "https://www.googleadservices.com", "https://www.google.com"]);
  assert.deepEqual(directive(policy, "frame-src"), ["https://www.googletagmanager.com"]);
  assert.ok(directive(policy, "img-src").includes("https://www.facebook.com"));
  assert.match(policy, /^default-src 'self'; .*frame-ancestors 'none'; object-src 'none'; connect-src /);
});
