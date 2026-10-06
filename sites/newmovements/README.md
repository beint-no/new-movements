# New Movements storefront

Dynamic Cloudflare storefront for New Movements using the ReAI Site API. The Worker renders the homepage, collection pages, product pages and sitemap from the published catalog at request time. Browser code uses same-origin API routes for predictive search, availability and checkout. Original collection handles remain usable through live, product-derived collection views when the upstream Site catalog has not published collection membership.

## Local development

```sh
cp sites/newmovements/.dev.vars.example sites/newmovements/.dev.vars
npm ci
npm run dev
```

Use a Site-scoped credential in `.dev.vars`; it must never be exposed to browser JavaScript. The storefront expects the New Movements Shopify catalog to be connected and published in ReAI, including product images and renditions.

Newsletter signup is delivered server-side to an optional HTTPS webhook. Set `NEWSLETTER_WEBHOOK_URL` and, if the provider requires it, `NEWSLETTER_WEBHOOK_TOKEN` in `.dev.vars`. The webhook receives JSON containing `email` and `source`; without it the form reports that signup is not configured and does not collect the address.

## Checks

```sh
npm run check
```

## Deployment

Store the Site API credential as a Cloudflare Worker secret before deploying:

```sh
npm run secret
npm run deploy
```

## Merchant-domain checkout

The Worker serves `/checkout` for contact details, Norwegian delivery, pickup selection, discounts and review.
The session token stays in a `__Host-reai-checkout` Secure HttpOnly SameSite=Lax cookie; browser requests use the
same-origin `/reai/checkout/{read,shipping,discount,payment}` routes. All checkout responses use `no-store`,
and writes require the storefront Origin. Customer details are held in the form and persisted in ReAI only
when preparing the payment handoff; they are not saved to browser storage.

ReAI validates customer details, delivery and the displayed total before returning a payment-only URL.
Only payment collection happens on app.reai.no. After webhook confirmation, the shopper returns to
`/checkout?confirmation=1`, which checks ReAI's payment state before confirming the order and clearing the bag.
Wallet buttons remain on ReAI's registered payment domain. This flow currently uses the existing Norwegian/NOK
card and wallet checkout; it does not add international delivery or merchant-domain invoice ordering.

Deploy the ReAI merchant checkout API before deploying this Worker. The new endpoints are declared in the generated
Site API client. To refresh the declarations against a local ReAI instance:

```sh
REAI_SITE_OPENAPI_URL=http://localhost:18087/openapi/site npm run generate:site-api
REAI_SITE_OPENAPI_URL=http://localhost:18087/openapi/site npm run check:contract
```

Existing stores using the shared Worker keep hosted checkout unless they opt in with `merchantCheckout: true`.
