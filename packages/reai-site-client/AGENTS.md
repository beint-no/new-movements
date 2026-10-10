# ReAI Site client

Native ESM client for the ReAI Site API. Storefront source remains JavaScript and receives build-time checking through JSDoc, generated OpenAPI declarations and TypeScript with `noEmit`.

Regenerate `site-api.d.ts` from the canonical Site OpenAPI document with:

```sh
npm run generate:site-api
```

The generated file is committed so ordinary type checks are deterministic and do not require network access. The full repository check compares it with the live OpenAPI document.

`merchandising.mjs` is an optional pure projection helper: select existing variants
by an option's allowed values and order/filter existing images by filename tokens.
It preserves product/variant identities and image metadata and never changes the
catalog or adds API calls. Store-specific ranges and marker names belong in the site.

`filtering.mjs` is a pure catalog projection for categorical facets and price/sort
parameters. Values within a facet are OR; facets are AND against the same variant.
Structured facets match stable taxonomy IDs or entry IDs/aliases, never product
titles. Counts are distinct products matching the other facets. Supply live
availability only when filtering stock; missing stock remains unknown. Keep
store-specific facet definitions and URL parameter names in the storefront.
