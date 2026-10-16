// @ts-check

import { createReaiMarketStorefrontWorker } from "../../packages/reai-cloudflare-storefront/markets.mjs";
import * as storefront from "./storefront.mjs";
import { handleStorefrontRequest } from "./routes.mjs";

const worker = createReaiMarketStorefrontWorker({
  cacheKey: "newmovements-v16",
  storefront,
  market: "default",
  locale: "en",
  locales: [
    { pathPrefix: "", locale: "en" },
    { pathPrefix: "/nb", locale: "nb-NO" },
  ],
  imageOrigins: ["https://cdn.shopify.com"],
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
    // Only the production relay can supply the original origin; direct review traffic stays noindex.
    const forwardedOrigin = request.headers.get("X-ReAI-Storefront-Origin");
    if (env.STOREFRONT_PROXY_TOKEN && request.headers.get("X-ReAI-Storefront-Token") === env.STOREFRONT_PROXY_TOKEN &&
        ["https://newmovements.com", "https://www.newmovements.com"].includes(forwardedOrigin || "")) {
      const canonical = new URL(request.url);
      canonical.host = new URL(forwardedOrigin || "").host;
      const headers = new Headers(request.headers);
      const country = headers.get("X-ReAI-Storefront-Country");
      const clientIp = headers.get("X-ReAI-Storefront-Client-IP");
      if (clientIp) headers.set("CF-Connecting-IP", clientIp);
      if (/^[A-Z]{2}$/.test(country || "")) headers.set("CF-IPCountry", country || "");
      for (const header of ["Origin", "Token", "Country", "Client-IP"]) headers.delete(`X-ReAI-Storefront-${header}`);
      request = new Request(canonical, new Request(request, { headers }));
      if (/^[A-Z]{2}$/.test(country || "")) Object.defineProperty(request, "cf", { value: { ...request.cf, country } });
    }
    const requestUrl = new URL(request.url);
    const review = !["newmovements.com", "www.newmovements.com"].includes(requestUrl.hostname);
    if (review && /^(?:\/nb)?\/robots\.txt$/.test(requestUrl.pathname)) return new Response("User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain", "X-Robots-Tag": "noindex, nofollow" } });
    if (!review && /^(?:\/nb)?\/robots\.txt$/.test(requestUrl.pathname)) return new Response("User-agent: *\nAllow: /\nSitemap: https://newmovements.com/sitemap.xml\nSitemap: https://newmovements.com/nb/sitemap.xml\n", { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
    const response = await worker.fetch(request, env, context);
    if (!review) return response;
    const headers = new Headers(response.headers); headers.set("X-Robots-Tag", "noindex, nofollow");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
