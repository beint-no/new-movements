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
- CI validates and creates isolated previews for open PRs. Production deployment remains local-only.
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

Production deployment is local-only. Product data continues to be managed and published
through ReAI; this repository does not contain a second catalog or Shopify
runtime client.

## Working here

This private repository works independently of the customer-sites hub. Operators
keep its primary checkout on main and develop in dedicated worktrees under
~/.r-worktrees. Use pull requests and squash merges. A hub commit records a
reviewed child revision; editing or deploying this site does not deploy siblings.
Keep credentials out of Git, documentation and browser code. Client access is
repository-specific; the hub never grants access to its submodules.

## Countries and currencies

Delivery countries are discovered from the ReAI Site markets. Several countries can
share a market and price list; New Movements keeps one Shopify-synced list per currency.
The header searches country names, ISO country codes and currency codes, with a native
select fallback. The HttpOnly preference retains both market and country, and the
Worker passes the validated country to checkout. Never infer the delivery country
from currency alone or generate exchange-rate prices in browser code.

## Automatic PR previews

Open PRs receive a stable isolated Cloudflare Preview URL, updated on pushes
and removed on close. `.github/workflows/preview.yml` builds without deployment
credentials, then requests the trusted workflow in beint-no/reai through signed
GitHub Actions OIDC. Cloudflare credentials stay in the central deployment repository.
The server maps this repository to its assigned Worker, verifies the current PR,
and provides only a read-only PREVIEW Site credential where catalog access is needed.
Previews are noindex and reject orders, payments and form submissions.
Manually dispatch PR previews with a PR number to backfill an already-open PR.
Register independently created repositories in the server's customer preview registry;
new repositories created through the e-commerce module are recognized automatically.

