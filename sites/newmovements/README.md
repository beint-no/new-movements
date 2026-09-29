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
