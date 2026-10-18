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
    const requestUrl = new URL(request.url);
    const review = !["newmovements.com", "www.newmovements.com"].includes(requestUrl.hostname);
    if (review && /^(?:\/nb)?\/robots\.txt$/.test(requestUrl.pathname)) return new Response("User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain", "X-Robots-Tag": "noindex, nofollow" } });
    if (!review && /^(?:\/nb)?\/robots\.txt$/.test(requestUrl.pathname)) return new Response("User-agent: *\nAllow: /\nSitemap: https://newmovements.com/sitemap.xml\nSitemap: https://newmovements.com/nb/sitemap.xml\n", { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
    const response = await worker.fetch(request, env, context);
    const headers = new Headers(response.headers);
    // Only this storefront opts into consent-controlled advertising measurement.
    const csp = headers.get('Content-Security-Policy');
    const google = 'https://www.googletagmanager.com https://www.googleadservices.com https://www.google.com';
    const transport = `${google} https://www.google.no https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com https://ad.doubleclick.net`;
    if (csp) headers.set('Content-Security-Policy', csp
      .replace(/img-src ([^;]+)/, `img-src $1 https://www.facebook.com ${transport}`)
      .replace(/script-src ([^;]+)/, `script-src $1 ${google}`)
      + `; connect-src 'self' ${transport}; frame-src https://www.googletagmanager.com`);
    if (review) headers.set("X-Robots-Tag", "noindex, nofollow");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
