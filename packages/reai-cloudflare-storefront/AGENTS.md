# ReAI Cloudflare storefront integration

This native ES module provides the shared server-side path for ReAI storefronts. It handles Site authentication, market-and-locale commerce routing, checkout input validation, catalog caching, security headers and Cloudflare static asset fallback. All upstream operations go through `@reai/site-client`, whose JSDoc is checked against declarations generated from the Site OpenAPI document.

The storefront supplies its own routing and rendering functions:

```js
import {
  createReaiStorefrontWorker,
  norwegianMessages,
} from "../../packages/reai-cloudflare-storefront/worker.mjs";
import * as storefront from "./storefront.mjs";

export default createReaiStorefrontWorker({
  cacheKey: "my-store-v1",
  storefront,
  market: "norway",
  locale: "nb-NO",
  messages: norwegianMessages,
});
```

`storefront` must export `HANDLE`, `matchRoute`, `collectionByHandle`, `productByHandle`, the page renderers and the sitemap renderer. `market` and `locale` are required because they select the ReAI delivery context. Every commerce delivery call, including availability and checkout, sends both values and isolates cached catalogs by the same pair. `beforeRequest` can implement canonical-domain or legacy-path redirects without forking the shared integration.

Optional `collectionAvailabilityVariants(store, handle, context)` selects variants
whose live stock the collection renderer needs. They are fetched through the
existing batch availability client, passed as `context.availability`, and the HTML
response becomes `no-store`. Returning an empty list keeps ordinary collections
on the cached catalog path without stock requests.

The Worker reads the complete `/site/v1/commerce/storefront` snapshot into Cloudflare's Cache API. A snapshot is fresh
for 60 seconds; for the next five minutes it is served immediately while `waitUntil` revalidates its ETag in the
background. The cache entry is retained for a day so a transient ReAI failure can still serve the last snapshot.
Catalog, product, and collection JSON routes use the same snapshot and expose `X-ReAI-Storefront-Cache` as `MISS`,
`HIT`, `STALE`, `REVALIDATED`, `REFRESH`, or `STALE_IF_ERROR`. This is an application Cache API hit; Worker-generated
responses do not report it as `Cf-Cache-Status: HIT`.
Product pages keep stock live but read up to 100 variant statuses per Site API request instead of issuing one request per variant.

The deployed module remains dependency-free and in source form so the complete security boundary remains easy to audit. TypeScript runs only as a `noEmit` development check; storefronts are authored and deployed as native JavaScript.

## Compact legal footer

The optional footer helper keeps the final line consistent without embedding merchant details or policy text:

```js
import { renderCompactLegalFooter } from "../../packages/reai-cloudflare-storefront/footer.mjs";

const footer = renderCompactLegalFooter({
  owner: "Example Store",
  locale: "en",
  refundHref: "/refund/",
  privacyHref: "/privacy/",
  termsHref: "/terms/",
  className: "footer-bottom shell",
});
```

It renders the current copyright year, a localized link to ReAI, and refund, privacy and terms links. The storefront supplies every merchant-specific value and owns the linked policy pages.

```css
.compact-legal-footer {
  display: flex;
  flex-flow: row wrap;
  align-items: center;
  gap: .35rem 1rem;
  padding-block: 12px;
  font-size: .75rem;
}

.compact-legal-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.compact-legal-links a {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  color: inherit;
  text-decoration: none;
  white-space: nowrap;
}

.compact-legal-links a + a::before {
  content: "·";
  margin-inline: .55rem;
  opacity: .55;
}
```

Each renderer receives a request-specific context with `url` as well as the fixed
market/locale context, so merchandising query parameters never leak across requests.
`GET /reai/availability?variantId=...` proxies the Site client's uncached batch
availability operation, with 1–100 distinct UUIDs, for quick-add and similar controls.

An optional `catalogProductsForRequest(products, context)` renderer hook projects
`GET /reai/catalog` for browser search using the same rules as server-rendered pages.
Projection happens after snapshot retrieval, never inside the shared cache, and
conditional response tags include the request query and Worker cache key. Keep
catalog identity and checkout variant IDs intact; filter only the presentation.

`POST /reai/newsletter/subscribe` accepts email, optional name and `consent: true`, and forwards only these values through the Site client. It rejects cross-origin submissions and returns uncached responses. Storefronts may configure the `NEWSLETTER_RATE_LIMIT` Worker binding for repeated submissions. The Site token needs `newsletter:subscribe`; ordinary signup queues the configured welcome after new consent. Optional `welcomeDiscount: true` explicitly requests the separately enabled welcome-discount flow instead, including existing subscribers, once per email/store. Both forward the current locale. No discount codes are created.

`imageOrigins` optionally permits explicit HTTPS CDN origins for imported collection images.
Keep the default policy restricted to the site and ReAI media, configure only reviewed origins,
and never derive CSP sources from browser input or widen script/form permissions.

Merchant address suggestions are optional, authenticated through the typed Site client, private/no-store and rate limited alongside checkout writes. Reject cross-site fetches and oversized queries; provider credentials stay in ReAI. Pickup filtering is local to the browser after one selected-option discovery.
