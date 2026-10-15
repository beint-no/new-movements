# New Movements

## Public business context

- New Movements is an Oslo footwear brand focused on unisex, repairable and recyclable shoes.
- The public storefront defaults to English. Norwegian is available under `/nb` with `nb-NO` catalog/checkout delivery; additional locales should use the same shared Worker locale map. Norway uses NOK, Germany EUR and Switzerland CHF; the server selects the configured ReAI market.
- The reference domain is `https://newmovements.com`.

## Site constraints

- Preserve the restrained black-and-white editorial character, generous product photography and unisex positioning of the reference store.
- Products, collections, variants, prices, availability, descriptions and images are rendered from the ReAI Site API at request time.
- Never add a committed catalog, Shopify runtime client, or local product images. Product images must use the API `url`, `renditions`, `alt`, `width` and `height` fields.
- Preserve Shopify-compatible paths: `/products/{handle}`, `/collections/{handle}`, `/cart`, `/search`, `/pages/{handle}` and `/policies/{handle}`.
- Cart state is browser-local. Checkout posts opaque Site API variant IDs and quantities to `/reai/checkout/start`, then opens merchant-domain contact and delivery before ReAI summary/payment. The success return is `/order/complete`.
- Keep the Site credential in the Worker secret `REAI_SITE_TOKEN`.

## Local development

```sh
cp sites/newmovements/.dev.vars.example sites/newmovements/.dev.vars
npm ci
npm run dev
```

Use a Site-scoped credential in `.dev.vars`; it must never be exposed to browser JavaScript. The storefront expects the New Movements Shopify catalog to be connected and published in ReAI, including product images and renditions.

Newsletter signup posts email, optional name and explicit consent through the shared Worker and ReAI Site API. Keep submissions server-side. The footer explicitly requests `welcomeDiscount: true`, which queues the built-in welcome-discount flow once per email/store. Its editable default email contains existing code `CC` for 5% off; ordinary newsletter signup stays separate. No codes are created and no external webhook is used.

## Checks

```sh
npm run check
```

## Deployment

Run checks and deploy from local; GitHub Actions checks and PR previews are
temporarily manual-only. Configure the Site API credential with `npm run secret`
only for initial setup or an intentional rotation. Normal deployments retain it.

```sh
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

As checked on 2026-10-13, tenant 3157's Site is named New Movements, has no
active domain, and uses the existing review Worker. All enabled market shipping
methods are free without a minimum order: Bring/Posten and PostNord in Norway,
PostNord/Bring in Sweden and Denmark (merchant-fulfilled), and DHL Express for other supported destinations. Taxes and duties are included in every destination,
as the merchant explicitly confirmed. On 2026-10-13, the merchant confirmed that
international orders will use the existing DHL/Webshipper fulfillment setup with
duties and taxes billed to New Movements. ReAI's current DHL booking adapter
supports Norway domestic only; international delivery remains merchant-fulfilled.
Before cutover, verify the operational handoff of ReAI orders to that setup.
Do not mistake a free checkout rate or Norwegian export VAT code for a completed
DDP shipping integration.
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

Collection controls progressively enhance the GET form: checkboxes update immediately; price input is debounced; sort, individual removal and Clear all use the same server-rendered collection. Keep URL/history, focus and the mobile drawer intact, abort superseded requests, and retain native navigation/no-JS submission as fallback. No client-side filtering or second catalog. Checkout inherits the active locale's configured Site delivery context; the session carries it through hosted checkout and payment widgets.

## Built-in email flows

Sold-out sizes offer an explicit one-time notification form posting exact opaque variant ID, email and consent through `/reai/stock/subscribe`. It shares the server-side signup rate limit and never implies newsletter consent. ReAI owns subscriptions, templates and sending; the Worker only renders the form. Size sorting is numeric, including fractional sizes; notification links select the exact variant.

On portrait mobile/tablet, the homepage hero stacks men above women within the first viewport. Landscape puts them side by side to retain useful photo and button space. Keep both collection links visible, use the approved photos with shoe-focused crops, and preserve the two-column desktop composition.

The seasonal homepage uses curated product handles with live batch availability, alternating women's and men's views. Only stocked variants in the relevant size range qualify. Approved hero photos accompany “Crafted through generations / Oslo 1916”. Keep curated handles as presentation data; inventory, variant identities, imagery and product content stay in ReAI.

Checkout stock conflicts use the API's `INSUFFICIENT_STOCK` code and per-variant
`stockIssues`. Highlight only affected cart lines, show their localized title and
selected options, and offer removal/another size for sold-out items or a quantity
reduction for limited stock. Keep the rest of the bag. Cart edits clear the old
limits because shared stock can change; every checkout attempt revalidates. Ignore
responses for a cart changed while checkout was pending. Never infer stock from
the cached catalog or silently discard a cart line.

Asset URLs are derived from SHA-256 content hashes by tools/build-assets.mjs. Wrangler builds them automatically for development, dry runs and deployment; npm checks build them before importing the renderer. The generated manifest and public assets live in ignored dist/. Static fallback pages receive the same stylesheet URL. Never edit generated output or add manual version counters. One-time stock notification consent starts checked; submitting Notify me requests that notification only and does not subscribe to the newsletter.

## Layout gutters

Use the existing --pad responsive gutter for homepage product sections, collection headers/toolbars/grids and general content pages. Keep collection grids aligned to their headers without a second nested gutter. Search cards share the recommendation card styling, with responsive column counts. Category product photos use contain fitting to keep the full shoe visible at every
width, with a stable 4:5 frame on mobile. Full-width hero/category photography and
horizontally scrolling product rails are intentional; text and controls should remain inside their content columns. Review all sitemap routes plus cart, search, confirmation and error pages at narrow mobile, tablet and desktop widths after shared layout changes.

## Market selection

The shared market Worker discovers enabled markets through the Site API, caches the small configuration for one minute, and selects explicit query choice, saved cookie, Cloudflare country, then the default market. The header is a destination-and-currency selector because a currency alone cannot identify Shopify pricing or shipping. HTML and catalog responses are private; the shared catalog cache is scoped by market and locale.

Switching markets retains variant IDs and quantities and reloads authoritative prices from ReAI. Checkout is disabled while repricing or if an item has no price in the selected market. Never convert cached cart values or add exchange rates in the browser. Shopify contextual pricing remains the source of each market list. Price filters are cleared on a market change.

## Collections

All collection titles, descriptions, images and membership come from the published ReAI snapshot.
Do not infer missing collections from product names or silently recreate unpublished collections.
`/collections` lists the published collections, including real collections that currently have no
published products. Both Shop navigation and the footer link to it. Shopify's separate `shoe-care-1`
collection retains its own route and membership. The empty tax utility collection remains hidden.

## Merchant-domain checkout

New Movements opts in with merchantCheckoutPath=/checkout. The shared Worker and typed Site client own the private proxy; the Site token stays server-side. Contact, address, delivery and discount edits are saved in ReAI with optimistic revision checks. Cross-market country changes create a new currency quote and retire the old draft. Background preparation is unpayable and holds no stock; ReAI validates and reserves only on payment submission. The complete hosted checkout remains the shared default for other storefronts. Checkout HTML/API are no-store, noindex and no-referrer; never log their personal data. Confirmation checks fulfillment before removing purchased cart quantities, once per checkout. No implicit newsletter consent.

Checkout shipping cards consume Site API carrier logos, localized descriptions and pickup labels. Pickup search filters returned locations locally and supports keyboard selection; distance is shown only when supplied by the carrier. Optional Norwegian address suggestions use the same private Worker/Site client boundary because Bring requires credentials; keep manual input working during provider failure. Checkout promises free returns within 30 days and free exchanges per https://newmovements.com/pages/returns-exchanges (checked 2026-10-12); Free delivery and taxes/duties included were separately confirmed on 2026-10-13; keep all shopping surfaces consistent. Payment marks are optimized inline SVG; Vipps is shown for Norwegian destinations only.

Checkout contact drafts use sessionStorage (this browser tab) with a 24-hour expiry. Store only contact/address fields, never delivery quotes, payment tokens or consent. Write on input and pagehide to protect unfinished edits; restore into compatible quotes without overriding newer server edits or the quote country/currency. Clear the matching draft after confirmed completion. Disabled browser storage must not block server autosave. Selecting delivery saves a partial draft; complete validation belongs to Continue to payment. Required fields are marked, optional fields labeled, and validation errors are shown beside inputs with accessible focus.

Browser analytics batches after page load and an idle opportunity (five-second
window), with one in-flight request and one retry for transient failures. Pending
events are bounded at 25. Hidden-page flushes use keepalive; GPC/DNT opt-outs,
storage restrictions and missing browser APIs must never interrupt shopping.
Only allowlisted anonymous event fields are transmitted.

## Launch audit (2026-10-13)

Gift Card (product 70025) is deliberately unpublished from this Site: ReAI does not
yet issue or redeem stored-value codes. Legacy product/collection/page links lead
to gift-card customer care. Never republish it as an ordinary digital product.
On 2026-10-13, the merchant confirmed there are no outstanding Shopify gift-card
balances, so no balance migration is required. Gift-card sales remain unavailable
until issuance and redemption are supported. The original Shopify store remains
the backup; this change is ReAI-only.

Recovery flow has stage zero only. The previous 8/16-hour follow-ups conflicted
with Bud's one marketing email per sender/recipient per 24 hours and the 24-hour
checkout lifetime. Do not bypass that cap or promise these follow-ups. Other
welcome/post-purchase stages use longer delays and retain consent checks.

The legacy 2021 sneakers-and-fashion article is preserved as a dated archive with
local editorial images. Its Shopify URL redirects to the canonical journal article.
It remains in the sitemap, without joining the curated current Stories listing.

## Size guide (2026-10-14)

`size-guide-data.mjs` contains the five brand charts transcribed from the supplied
SHOE LASTS + SIZE CHART + LACE LENGTH workbook, Last Sizes sheet. Its provenance
includes the source checksum and exact ranges. All 88 rows retain their supplied
EU/US/UK conversions, half sizes and blanks; never extrapolate a missing size.
The merchant authorized using best judgment to publish CM guidance on 2026-10-14.
Lengths are provisionally interpreted as heel-to-toe foot measurements, matching
how the original public Original/Allrounder guide describes its matching CM values.
`SIZE_GUIDE_SOURCE` records this assumption with `lengthConfirmed: false`; the team
was asked to confirm it by email. Do not treat this as merchant-verified measurement
meaning. Display the supplied lengths as approximate, style-specific guidance;
do not invent toe allowance, extrapolate missing rows, or smooth jumps around
EU 40/40.5 in boots/loafers. Values 200–320 are converted from mm to cm; values
22–30 already represent cm, regardless of inconsistent workbook headings.
Lace tables also have overlapping/missing ranges and are not published.

`size-guide.mjs` renders the standalone `/pages/size-guide` with `style` and `view`
queries. Product pages use the same content in a native side dialog, loaded only
when requested. Navigation works without JavaScript; Escape and close return
focus to the product link. Model matching uses explicit known brand families.
Allrounder S, High Flow and Zipper Boot lack an explicit chart in the workbook and
open the general guide without assigning another model's fit. Size guidance does
not alter ReAI variants, stock, merchandising ranges, cart state or checkout.

Product footwear with multiple sizes starts without a selection; only an explicit
variant URL preselects a size. Sold-out choices explain the one-time notification.
The guide link stays beside size selection and highlights its exact EU row.
CM/inches is a display conversion from supplied lengths (cm / 2.54, two decimals),
not another chart or a foot-to-size calculator. Guide navigation retains chosen
size/unit, works as ordinary links without JS, and stays inside the drawer with JS.
All style choices wrap on mobile; never clip them in a hidden horizontal rail.
Purchase reassurance uses the confirmed delivery/returns policy beside Add to cart.

## Merchant review (2026-10-14)

Martin requested Boots as the guide heading, with Moss retained among its models.
Only Original/Allrounder, Boots and Loafers are active guide choices. Classic/Cruiser
and Everyday Sandals source tables remain archived in size-guide-data.mjs for
provenance and are not offered in shopper navigation. Do not reintroduce them
without merchant approval. The generic Features copy does not say Unisex.

Free delivery uses PostNord/Bring in Norway, Sweden and Denmark; other supported
destinations use DHL Express. Sweden/Denmark use fixed, merchant-fulfilled delivery
configured in ReAI, not the Norway-only dynamic booking/pickup-point integration.
Taxes and duties remain included everywhere. Footer Vipps appears for Norwegian
destinations, reusing the optimized payment mark already used by checkout.
Product help links are underlined with a visible keyboard focus indicator.

## Shopping polish (2026-10-14)

Search uses the shared bounded literal token/ranking helper over names, product type, category,
managed attributes, variant selections and collection labels. Predictive search uses /reai/search
(six compact suggestions) from the same cached snapshot; never download the full catalog for search.
Typing is debounced, stale requests abort, and the full GET results work without JavaScript.
Cards prefer existing neutral studio shots; audience-specific galleries remain unchanged.

An exact size filter checks current availability by default, with an explicit Include sold-out
sizes option. Product links and quick-add retain that explicit variant; changing colour retains
an exact matching selection. Family identity uses a specific merchant product type or exact model
name, never a title prefix. Recommendations show other models with live stock, respecting an
explicit selected size; no personalization engine or inferred material claims.

Search and bag use native modal dialogs with focus containment and restoration. Purchased lines
and editable quantities precede at most two stocked care suggestions. Mobile products have a
compact swatch/thumb row and a sticky Choose size / Add to bag / Notify me action. Image zoom
loads only on intent. Product facts come from managed attributes, and Google reviews are labelled
as brand reviews, never product ratings. Keep size measurement assumptions unchanged.

The collection directory hides empty collections and the duplicate Shoe Care card while keeping
managed collections and legacy links. /collections/new-arrivals redirects to /collections/new-in;
/collections/shoe-care-1 redirects to the consolidated /collections/shoe-care. Country/market
landing queries are validated against enabled markets; product offers have exact variant URLs
and merchant return-policy metadata. Review hostnames send noindex and disallow crawling;
newmovements.com becomes indexable only when the user separately approves domain cutover.
