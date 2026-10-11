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

Newsletter signup posts email, optional name and explicit consent through the shared Worker and ReAI Site API. Keep submissions server-side; no external webhook, welcome email or discount automation is configured.

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
a controlled payment end to end. The footer supports newsletter signup with explicit consent. Hosted checkout creation and payment
method rendering have been checked; no payment was submitted. The production
hostname remains on its original storefront during review.

The cart drawer's Check out button shares the full-cart checkout action and validation. Footer newsletter signup posts email and explicit consent through the shared Worker/client endpoint; the API also accepts an optional name. Consent uses ReAI customer records; an enabled ReAI welcome flow sends a branded email. No discount is generated. NEWSLETTER_RATE_LIMIT limits repeated public submissions. Payment/social marks are inline SVGs from the reference store optimized with SVGO; show supported checkout brands and verified New Movements social destinations. Contact details and the store photo match the original contact page.

Collection filters are server-rendered GET forms over ReAI catalog data: availability,
price, exact Size options, merchant product type, color, footwear material and shoe
features. Keep Shopify-compatible parameter names and canonical taxonomy IDs so
existing filter links work. Use the shared filtering helper and live batch stock
only when requested. Native published collection membership takes precedence over
legacy presentation fallbacks. Product type preserves a source merchant label for the existing shopper filter; it is not a second canonical category or a new ReAI admin field. Women use EU 35–42 and men EU 39–48, including half
sizes and the same opaque variant IDs. Do not infer attribute choices from titles.

Collection controls progressively enhance the GET form: checkboxes update immediately; price input is debounced; sort, individual removal and Clear all use the same server-rendered collection. Keep URL/history, focus and the mobile drawer intact, abort superseded requests, and retain native navigation/no-JS submission as fallback. No client-side filtering or second catalog. Checkout inherits this English storefront's configured Site delivery locale; the session carries it through hosted checkout and payment widgets.

## Built-in email flows

Sold-out sizes offer an explicit one-time notification form posting exact opaque variant ID, email and consent through `/reai/stock/subscribe`. It shares the server-side signup rate limit and never implies newsletter consent. ReAI owns subscriptions, templates and sending; the Worker only renders the form. Size sorting is numeric, including fractional sizes; notification links select the exact variant.

The seasonal homepage uses curated product handles with live batch availability, alternating women's and men's views. Only stocked variants in the relevant size range qualify. Approved hero photos accompany “Crafted through generations / Oslo 1916”. Keep curated handles as presentation data; inventory, variant identities, imagery and product content stay in ReAI.

Checkout stock conflicts use the API's `INSUFFICIENT_STOCK` code and per-variant
`stockIssues`. Highlight only affected cart lines, show their localized title and
selected options, and offer removal/another size for sold-out items or a quantity
reduction for limited stock. Keep the rest of the bag. Cart edits clear the old
limits because shared stock can change; every checkout attempt revalidates. Ignore
responses for a cart changed while checkout was pending. Never infer stock from
the cached catalog or silently discard a cart line.

Asset URLs are derived from SHA-256 content hashes by tools/build-assets.mjs. Wrangler builds them automatically for development, dry runs and deployment; npm checks build them before importing the renderer. The generated manifest and public assets live in ignored dist/. Static fallback pages receive the same stylesheet URL. Never edit generated output or add manual version counters. One-time stock notification consent starts checked; submitting Notify me requests that notification only and does not subscribe to the newsletter.
