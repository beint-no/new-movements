// @ts-check

import { createReaiStorefrontWorker } from "../../packages/reai-cloudflare-storefront/worker.mjs";
import * as storefront from "./storefront.mjs";
import { handleStorefrontRequest } from "./routes.mjs";

export default createReaiStorefrontWorker({
  cacheKey: "newmovements-v5",
  storefront,
  market: "default",
  locale: "en",
  checkoutReturnPath: "/order/complete",
  beforeRequest: handleStorefrontRequest,
  noStorePaths: ["/cart/", "/search/", "/order/complete/"],
});
