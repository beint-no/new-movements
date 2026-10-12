// @ts-check

import { createReaiMarketStorefrontWorker } from "../../packages/reai-cloudflare-storefront/markets.mjs";
import * as storefront from "./storefront.mjs";
import { handleStorefrontRequest } from "./routes.mjs";

export default createReaiMarketStorefrontWorker({
  cacheKey: "newmovements-v15",
  storefront,
  market: "default",
  locale: "en",
  imageOrigins: ["https://cdn.shopify.com"],
  checkoutReturnPath: "/order/complete",
  beforeRequest: handleStorefrontRequest,
  noStorePaths: ["/cart/", "/search/", "/order/complete/"],
});
