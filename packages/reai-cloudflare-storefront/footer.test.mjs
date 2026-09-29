import assert from "node:assert/strict";
import test from "node:test";

import { renderCompactLegalFooter } from "./footer.mjs";

test("renders a generic English legal footer without merchant defaults", () => {
  const html = renderCompactLegalFooter({
    owner: "Example Store",
    year: 2026,
    refundHref: "/refund/",
    privacyHref: "/privacy/",
    termsHref: "/terms/",
  });

  assert.match(html, /© 2026 Example Store/);
  assert.match(html, /href="https:\/\/reai\.no" rel="external">Powered by ReAI/);
  assert.match(html, />Refund policy</);
  assert.match(html, />Privacy policy</);
  assert.match(html, />Terms of service</);
});

test("localizes the compact legal footer to Norwegian", () => {
  const html = renderCompactLegalFooter({
    owner: "Eksempelbutikken",
    year: 2026,
    locale: "nb-NO",
    refundHref: "/retur/",
    privacyHref: "/personvern/",
    termsHref: "/vilkar/",
  });

  assert.match(html, />Drevet av ReAI</);
  assert.match(html, />Retur</);
  assert.match(html, />Personvern</);
  assert.match(html, />Kjøpsvilkår</);
});

test("accepts labels from a storefront translation catalog", () => {
  const html = renderCompactLegalFooter({
    owner: "Example",
    year: 2026,
    refundHref: "/refund/",
    privacyHref: "/privacy/",
    termsHref: "/terms/",
    labels: { poweredBy: "Platform credit", refund: "Returns" },
  });

  assert.match(html, />Platform credit</);
  assert.match(html, />Returns</);
});

test("rejects missing content and unsafe links", () => {
  assert.throws(() => renderCompactLegalFooter(), /owner is required/);
  assert.throws(() => renderCompactLegalFooter({
    owner: "Example",
    refundHref: "javascript:alert(1)",
    privacyHref: "/privacy/",
    termsHref: "/terms/",
  }), /refundHref must be/);
  assert.throws(() => renderCompactLegalFooter({
    owner: "Example",
    refundHref: "//example.net/refund/",
    privacyHref: "/privacy/",
    termsHref: "/terms/",
  }), /refundHref must be/);
});
