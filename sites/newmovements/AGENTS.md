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

