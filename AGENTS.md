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
- GitHub Actions checks and PR previews are temporarily manual-only while the
  private Actions budget is exhausted. Run `npm run check` locally before pushing
  and deploy locally. Do not restore automatic triggers without agreement.

## Brand constraints

- New Movements is an Oslo footwear brand focused on unisex, repairable, and
  recyclable shoes.
- Preserve the restrained black-and-white editorial character, generous
  product photography, and unisex positioning of `https://newmovements.com`.
- Preserve Shopify-compatible public routes for products, collections, cart,
  search, pages, and policies.
- Cart state is browser-local. Checkout posts opaque Site API variant IDs and
  quantities to `/reai/checkout/start` and opens merchant-domain contact and delivery before ReAI summary/payment.

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
npm run deploy
```

Only run `npm run secret` when initially configuring or intentionally rotating the
Site credential; normal deployments retain the existing secret.

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

## Manual PR previews

Automatic PR previews are paused. Use `npm run preview:deploy -- design` and
`npm run preview:remove -- design` for local preview management. The retained
Actions workflow can be manually dispatched with a PR number when the budget
allows it, but opening, updating or closing a PR does not run it. For manually
dispatched previews, dispatch again after closing the PR to clean up its preview.

`.github/workflows/preview.yml` builds without deployment
credentials, then requests the trusted preview workflow in beint-no/reai-site-examples through signed
GitHub Actions OIDC. Cloudflare credentials stay in the central deployment repository.
The server maps this repository to its assigned Worker, verifies the current PR,
and provides only a read-only PREVIEW Site credential where catalog access is needed.
Previews are noindex and reject orders, payments and form submissions.
Manually dispatch PR previews with a PR number to backfill an already-open PR.
Register independently created repositories in the server's customer preview registry;
new repositories created through the e-commerce module are recognized automatically.

This customer repository is private at the owner’s request. Keep credentials and private data outside Git history. Preview publishing runs in the reviewed default-branch storefront-preview.yml workflow in beint-no/reai-site-examples; ReAI privately verifies the current PR and assigned Worker. Publishing credentials remain encrypted Actions secrets in the controller repository.

The preview comment records the PR head revision so reviewers can confirm which push is deployed.

## Direct Cloudflare commands

These commands run from this repository and do not use GitHub Actions. Install
with npm ci first. Authenticate using npm exec --yes --package=wrangler@4.149.0
-- wrangler login, or your CLOUDFLARE_API_TOKEN. Select the account with
CLOUDFLARE_ACCOUNT_ID. Existing Worker secrets and domain configuration are retained.

```sh
npm run deploy:local -- --dry-run
npm run deploy:local
npm run preview:deploy -- design
npm run preview:remove -- design
```

Deployment and preview creation run the relevant existing checks. --dry-run builds
without publishing. Multi-site repositories require a site name; available names
are in tools/worker-sites.json. Previews use a separate local- namespace, block
writes and carry noindex. Removing one leaves independently dispatched PR previews intact.

Catalog previews additionally need a PREVIEW Site credential with only site:read,
commerce:catalog:read and commerce:availability:read. Set
REAI_PREVIEW_CREDENTIAL_FILE to a token file outside Git, or provide
REAI_PREVIEW_CREDENTIAL in your local environment. Never use the live Site token
for a preview or commit a credential. Obtain the read-only credential through
ReAI Site credential management.

## Merchant-domain checkout

New Movements opts in with merchantCheckoutPath=/checkout. The shared Worker and typed Site client own the private proxy; the Site token stays server-side. Contact, address, delivery and discount edits are saved in ReAI with optimistic revision checks. Cross-market country changes create a new currency quote and retire the old draft. Background preparation is unpayable and holds no stock; ReAI validates and reserves only on payment submission. The complete hosted checkout remains the shared default for other storefronts. Checkout HTML/API are no-store, noindex and no-referrer; never log their personal data. Confirmation checks fulfillment before removing purchased cart quantities, once per checkout. No implicit newsletter consent.

## Analytics and flow configuration

The shared browser analytics module records page/product views, cart quantity
changes and checkout views through the private Worker proxy. It respects GPC/DNT,
uses short-lived sessionStorage IDs, strips URL queries, batches at most 25 events
and reuses event IDs on retries. The live Site credential needs
commerce:analytics:write; add it through credential scope PATCH, without rotation.
Rate limit analytics independently from commerce writes. Asset build rewrites
hashed module imports so changes invalidate parent scripts automatically.

Flow content and delivery destination rules live in ReAI, not a duplicated Worker
catalog. New Movements uses welcome/story/materials/community, checkout recovery,
exact-size restock, purchase care/reviews/recycling and annual winback. The welcome
5% offer uses existing CC; no automatic code creation. Sunset is deliberately not
ported. Anonymous analytics do not send browsing/cart recovery emails.

Dynamic Bring/Posten/PostNord booking remains Norway-only. Sweden and Denmark use fixed merchant-fulfilled PostNord/Bring delivery; other international markets expose fixed DHL
Express alternatives with country restrictions and carrier branding from the Site
API. This is merchant-fulfilled shipping, not new automatic international DHL
booking or Webshipper carrier quotes. Configure the actual customer delivery price
and thresholds separately; do not invent prices from carrier names.
