# ReAI Site client

Native ESM client for the ReAI Site API. Storefront source remains JavaScript and receives build-time checking through JSDoc, generated OpenAPI declarations and TypeScript with `noEmit`.

Regenerate `site-api.d.ts` from the canonical Site OpenAPI document with:

```sh
npm run generate:site-api
```

The generated file is committed so ordinary type checks are deterministic and do not require network access. The full repository check compares it with the live OpenAPI document.
