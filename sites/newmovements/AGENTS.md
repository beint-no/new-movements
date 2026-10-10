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

Newsletter signup is delivered server-side to an optional HTTPS webhook. Set `NEWSLETTER_WEBHOOK_URL` and, if the provider requires it, `NEWSLETTER_WEBHOOK_TOKEN` in `.dev.vars`. The webhook receives JSON containing `email` and `source`; the storefront currently links to Instagram instead of displaying a signup form. Only restore the form once provider delivery is configured.

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

## Merchandising views

`merchandising.mjs` defines women (EU 35–42) and men (EU 39–48). Sizes
39–42 overlap intentionally. Numeric range selection retains published half sizes. These are presentations of the same ReAI product
and variant IDs; do not duplicate products, stock, prices or checkout mappings.
Collections and product URLs use `?view=women` / `?view=men`; the default product
URL exposes all published sizes. Cards, quick-add, related colors, recommendations, shop navigation and search
keep that context. Search results render on the server and work without browser
JavaScript; predictive search requests `/reai/catalog?view=women` or `men` through
the optional catalog projection hook, using exactly the same composition rules. The bag identifies the selected size and merges by variant ID.

The reusable `composeProductView` in `packages/reai-site-client/merchandising.mjs`
filters an option by allowed values and selects images using whole filename tokens.
ReAI already includes its stored filename in the public image URL. It also accepts
an explicit `filename` field if a delivery contract supplies one later. No backend
schema, gender taxonomy or second catalog is needed.

Name model photos with `women` / `men` (legacy `woman`, `female`, `her`, `man`,
`male`, `him` also work). Matching photos lead the gallery; opposite markers are
excluded. Unmarked side/front/back product shots remain neutral. Unmarked lifestyle
photos are omitted from gender views rather than classified from appearance; they
remain in All sizes. Rename/curate images through ReAI when more model photos are
needed. Keep alt text descriptive; do not use it as a hidden merchandising tag.

Women’s collection cards show studio product shots at 88% scale, with feathered
background edges. The same ReAI images and proportions are retained; tagged model
photos keep their original framing. Men and All sizes keep the original scale.

Quick-add reads uncached batch availability before enabling any size. Checkout
continues to validate the actual ReAI variant ID and quantity.

`CART_UPSELL_HANDLES` in `merchandising.mjs` selects the ordered shoe-care additions
in the bag drawer. Only handles are site-owned; titles, prices, images and variant
IDs come from the same ReAI catalog used by the page. A one-click addition requires
exactly one published variant; skip missing or multi-variant products rather than
guessing a size. Opening a nonempty bag checks all additions in one uncached
availability request. Unavailable additions are hidden, and a failed check disables
new selections. Checkboxes reflect the existing cart, merge by variant ID and update
the total; unchecking removes that variant. Checkout retains its normal validation.

Brand/editorial photographs, the logo and Instrument Sans fonts are shipped under
`public/brand-assets`. Refresh them from approved brand material in Git. Product
photography remains entirely ReAI-managed. Never make brand assets depend on fetching
`newmovements.com` at runtime: after domain cutover it would point back to this Worker.

## Metadata and copy

`metadata.mjs` builds product titles from the published ReAI product name,
including its colour, and adds a footwear category where the name lacks one.
This avoids truncated, duplicated or outdated material claims in imported SEO
titles. Women’s and men’s views retain their audience in the title. Keep names,
materials, products and variant identities sourced from ReAI.

Collections use descriptive shoe headings and titles. Editorial pages have
subject-specific titles. The document renderer adds the brand once, uses the
same title/description for Open Graph, and shortens descriptions at sentence or
word boundaries. Bag, search, confirmation and error pages are noindexed and
omitted from the sitemap; the old shoe-care alias redirects to its canonical
collection. Maintain site-owned copy in Git; correct catalogue copy and
factual inconsistencies in ReAI or the connected catalogue source, rather than
adding per-product overrides to the Worker.

## Google reviews

`reviews.mjs` holds a manually maintained editorial snapshot of the four featured
Google review excerpts on the original homepage, including their names, dates and
the displayed review count. Update these from approved source material in Git.
The homepage renders the cards as static HTML with a native scrolling rail;
every card and the summary link to the business’s full Google review list.
Do not add a review API, third-party widget or runtime refresh for this section.

## Review deployment and launch

Review URL: https://newmovements.respiro.workers.dev

As checked on 2026-10-10, ReAI Site 10 (tenant 3157) is named New Movements
Development, has no active domain, and its existing credential is PREVIEW.
The current market is English/NOK with Norway as its only destination; shipping
is Bring/PostNord at NOK 69, free from NOK 850. Do not advertise worldwide DHL
shipping until the corresponding ReAI market and shipping configuration exists.

Before domain cutover: review this Worker and update the hub pointer, configure
the intended production Site identity/domain/credential, and verify shipping and
a controlled payment end to end. The inactive signup form has been replaced by
an Instagram community link. Hosted checkout creation and payment
method rendering have been checked; no payment was submitted. The production
hostname remains on its original storefront during review.
