// @ts-check

import { createReaiMarketStorefrontWorker } from "../../packages/reai-cloudflare-storefront/markets.mjs";
import * as storefront from "./storefront.mjs";
import { handleStorefrontRequest } from "./routes.mjs";
import { withMarketingCsp } from "./marketing-csp.mjs";

const liveHosts = ["newmovements.com", "www.newmovements.com"];

const worker = createReaiMarketStorefrontWorker({
  cacheKey: "newmovements-v18",
  storefront,
  market: "default",
  locale: "en",
  locales: [
    { pathPrefix: "", locale: "en" },
    { pathPrefix: "/nb", locale: "nb-NO" },
  ],
  countryLocales: { NO: "nb-NO" },
  imageOrigins: ["https://cdn.shopify.com"],
  marketingUserAgentHosts: liveHosts,
  merchantCheckoutPath: "/checkout",
  checkoutReturnPath: "/order/complete",
  beforeRequest: handleStorefrontRequest,
  // Root documents are dynamic catalog renders. Keep an upstream failure from
  // being cached as the static unavailable shell in a browser or edge cache.
  noStorePaths: ["/", "/cart/", "/search/", "/order/complete/"],
});

// The review hostname must never compete with the eventual production storefront.
export default {
  async fetch(request, env, context) {
    const requestUrl = new URL(request.url);
    const review = !liveHosts.includes(requestUrl.hostname);
    const hsts = requestUrl.protocol === "https:" ? { "Strict-Transport-Security": "max-age=31536000" } : {};
    if (['GET', 'HEAD'].includes(request.method) && /^\/de(?:\/|$)/.test(requestUrl.pathname)) {
      requestUrl.pathname = requestUrl.pathname.slice(3) || '/';
      return new Response(null, { status: 308, headers: { Location: requestUrl.href, 'Cache-Control': 'public, max-age=3600', ...hsts, ...(review ? { "X-Robots-Tag": "noindex, nofollow" } : {}) } });
    }
    if (review && /^(?:\/(?:nb|de))?\/robots\.txt$/.test(requestUrl.pathname)) return new Response("User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain", "X-Robots-Tag": "noindex, nofollow", ...hsts } });
    if (!review && /^(?:\/(?:nb|de))?\/robots\.txt$/.test(requestUrl.pathname)) return new Response("User-agent: *\nAllow: /\nSitemap: https://newmovements.com/sitemap.xml\nSitemap: https://newmovements.com/nb/sitemap.xml\n", { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600", ...hsts } });
    const response = await worker.fetch(request, env, context);
    const headers = new Headers(response.headers);
    // Only this storefront opts into advertising measurement.
    const csp = headers.get('Content-Security-Policy');
    if (csp) headers.set('Content-Security-Policy', withMarketingCsp(csp));
    if (requestUrl.protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000");
    if (review) headers.set("X-Robots-Tag", "noindex, nofollow");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
