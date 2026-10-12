// @ts-check

import { createReaiMarketStorefrontWorker } from "../../packages/reai-cloudflare-storefront/markets.mjs";
import * as storefront from "./storefront.mjs";
import { handleStorefrontRequest } from "./routes.mjs";

export default createReaiMarketStorefrontWorker({
  cacheKey: "newmovements-v14",
  storefront,
  market: "default",
  locale: "en",
  checkoutReturnPath: "/order/complete",
  beforeRequest: handleStorefrontRequest,
  noStorePaths: ["/cart/", "/search/", "/order/complete/"],
});
