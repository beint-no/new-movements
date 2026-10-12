// @ts-check

import { ReaiSiteClient } from "./client.mjs";

const client = new ReaiSiteClient({ token: "type-test" });

// @ts-expect-error locale is required for an explicit delivery context
client.catalog({ market: "default" });

// @ts-expect-error checkout lines must match the generated Site API request
client.createCheckoutSession({}, { market: "default", locale: "nb-NO" }, "idempotency-key");

// @ts-expect-error raw API requests are private so consumers must use typed operations
client.request("/site/v1/commerce/catalog");
