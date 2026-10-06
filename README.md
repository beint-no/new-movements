# New Movements storefront

Private, independently deployable Cloudflare storefront for New Movements. It
uses the ReAI Site API for products, collections, prices, availability, images,
and merchant-domain checkout with a payment-only ReAI handoff while preserving the editorial character and routes of
`https://newmovements.com`.

The repository follows the same layout as `beint-no/bakst-og-glede`:

- `sites/newmovements/` contains brand-specific rendering, static assets,
  routes, Worker configuration, and tests.
- `packages/reai-cloudflare-storefront/` contains the shared authenticated
  Worker proxy and checkout validation.
- `packages/reai-site-client/` contains the generated Site API client and
  declarations.
- `tools/` contains repository-level API boundary and contract checks.

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
