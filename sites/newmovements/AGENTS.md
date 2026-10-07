# New Movements

## Public business context

- New Movements is an Oslo footwear brand focused on unisex, repairable and recyclable shoes.
- The public storefront is English-language and prices are displayed in NOK.
- The reference domain is `https://newmovements.com`.

## Site constraints

- Preserve the restrained black-and-white editorial character, generous product photography and unisex positioning of the reference store.
- Products, collections, variants, prices, availability, descriptions and images are rendered from the ReAI Site API at request time.
- Never add a committed catalog, Shopify runtime client, or local product images. Product images must use the API `url`, `renditions`, `alt`, `width` and `height` fields.
- Preserve Shopify-compatible paths: `/products/{handle}`, `/collections/{handle}`, `/cart`, `/search`, `/pages/{handle}` and `/policies/{handle}`.
- Cart state is browser-local. Checkout posts opaque Site API variant IDs and quantities to `/reai/checkout/start`, then redirects to ReAI hosted checkout. The success return is `/order/complete`.
- Keep the Site credential in the Worker secret `REAI_SITE_TOKEN`.

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
