# New Movements storefront

This private repository owns the independently deployable `newmovements`
Cloudflare Worker.

## Repository contract

- Keep the Site credential server-side in the Worker secret
  `REAI_SITE_TOKEN`. Never commit it or expose it to browser JavaScript.
- Use `packages/reai-cloudflare-storefront/` for authentication, API proxying,
  checkout validation, caching, and common security headers.
- Send Site API requests through `packages/reai-site-client/`; do not handwrite
  `/site/v1/` requests elsewhere.
- Keep brand rendering, content, behavior, styling, and configuration under
  `sites/newmovements/`.
- Products, collections, variants, prices, availability, descriptions, images,
  and checkout come from the ReAI Site API. Do not add Shopify or a committed
  catalog as a second source of truth.
- Render API image alt text, intrinsic dimensions, and width-based renditions.
- Preserve semantic HTML, keyboard operation, visible focus, reduced-motion
  support, and useful metadata.
- CI may validate and perform Wrangler dry runs, but deployment is local-only.
  Checks run on pull requests and pushes to `main` only, not every branch push.

## Brand constraints

- New Movements is an Oslo footwear brand focused on unisex, repairable, and
  recyclable shoes.
- Preserve the restrained black-and-white editorial character, generous
  product photography, and unisex positioning of `https://newmovements.com`.
- Preserve Shopify-compatible public routes for products, collections, cart,
  search, pages, and policies.
- Cart state is browser-local. Checkout posts opaque Site API variant IDs and
  quantities to `/reai/checkout/start` and redirects to hosted checkout.

## Development

Use Node 26 and npm 11.19 or newer:

```sh
npm ci
cp sites/newmovements/.dev.vars.example sites/newmovements/.dev.vars
npm run dev
```

Open the local URL printed by Wrangler. Keep `REAI_SITE_TOKEN` in
`sites/newmovements/.dev.vars`; it is ignored by Git and must never be exposed
to browser JavaScript.

## Validation and deployment

```sh
npm run check
npm run secret
npm run deploy
```

Deployment is local-only. Product data continues to be managed and published
through ReAI; this repository does not contain a second catalog or Shopify
runtime client.
