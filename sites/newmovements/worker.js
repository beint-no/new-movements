// @ts-check

import { createReaiMarketStorefrontWorker } from "../../packages/reai-cloudflare-storefront/markets.mjs";
import * as storefront from "./storefront.mjs";
import { handleStorefrontRequest } from "./routes.mjs";

const worker = createReaiMarketStorefrontWorker({
  cacheKey: "newmovements-v16",
  storefront,
  market: "default",
  locale: "en",
  imageOrigins: ["https://cdn.shopify.com"],
  merchantCheckoutPath: "/checkout",
  checkoutReturnPath: "/order/complete",
  beforeRequest: handleStorefrontRequest,
  noStorePaths: ["/cart/", "/search/", "/order/complete/"],
});

// The review hostname must never compete with the eventual production storefront.
export default {
  async fetch(request, env, context) {
    const review = !["newmovements.com", "www.newmovements.com"].includes(new URL(request.url).hostname);
    if (review && new URL(request.url).pathname === "/robots.txt") return new Response("User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain", "X-Robots-Tag": "noindex, nofollow" } });
    const response = await worker.fetch(request, env, context);
    if (!review) return response;
    const headers = new Headers(response.headers); headers.set("X-Robots-Tag", "noindex, nofollow");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  },
};
