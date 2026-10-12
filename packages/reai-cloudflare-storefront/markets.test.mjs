import assert from 'node:assert/strict';
import test from 'node:test';
import { selectMarket, createReaiMarketStorefrontWorker } from './markets.mjs';
const markets = [
  { handle: 'default', currency: 'NOK', countries: ['NO'], isDefault: true },
  { handle: 'de', currency: 'EUR', countries: ['DE'] },
  { handle: 'ch', currency: 'CHF', countries: ['CH'] },
];
test('explicit and saved choices take precedence over country detection', () => {
  assert.equal(selectMarket(markets, { country: 'CH' }).currency, 'CHF');
  assert.equal(selectMarket(markets, { saved: 'de', country: 'CH' }).currency, 'EUR');
  assert.equal(selectMarket(markets, { requested: 'default', saved: 'de', country: 'CH' }).currency, 'NOK');
  assert.equal(selectMarket(markets, { country: 'US' }).currency, 'NOK');
});
test('market preference redirects safely and removes prices in the previous currency', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  globalThis.fetch = async () => Response.json({ markets });
  const worker = createReaiMarketStorefrontWorker({ storefront: { HANDLE: /^[a-z0-9-]+$/, matchRoute: () => null }, cacheKey: 'test' });
  const send = (returnTo, market = 'ch', origin = 'https://shop.example') => worker.fetch(new Request('https://shop.example/reai/market', {
    method: 'POST', headers: { Origin: origin }, body: new URLSearchParams({ market, returnTo }),
  }), { REAI_SITE_TOKEN: 'test' });
  const result = await send('/collections/women?view=women&filter.v.price.gte=2000&market=de');
  assert.equal(result.status, 303);
  assert.equal(result.headers.get('Location'), 'https://shop.example/collections/women?view=women');
  assert.match(result.headers.get('Set-Cookie'), /reai-market=ch;.*HttpOnly; Secure; SameSite=Lax/);
  assert.equal((await send('https://evil.example')).status, 400);
  assert.equal((await send('/', 'missing')).status, 400);
  assert.equal((await send('/', 'ch', 'https://evil.example')).status, 403);
});
test('catalog and checkout use the selected market and are never publicly cached', async (context) => {
  const originalFetch = globalThis.fetch;
  context.after(() => { globalThis.fetch = originalFetch; });
  let checkout;
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith('/site/v1/site')) return Response.json({ markets });
    if (String(url).includes('/checkout-sessions')) { checkout = { url, body: JSON.parse(init.body) }; return Response.json({ checkoutUrl: 'https://app.reai.no/checkout/session/test' }, { status: 201 }); }
    return Response.json({ marketHandle: 'ch', currency: 'CHF', products: [] });
  };
  const worker = createReaiMarketStorefrontWorker({ storefront: { HANDLE: /^[a-z0-9-]+$/, matchRoute: () => null }, cacheKey: 'test', locale: 'en' });
  const env = { REAI_SITE_TOKEN: 'test' };
  const response = await worker.fetch(new Request('https://shop.example/reai/catalog', { headers: { Cookie: 'reai-market=ch' } }), env);
  assert.equal(response.headers.get('X-ReAI-Market'), 'ch');
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
  const payment = await worker.fetch(new Request('https://shop.example/reai/checkout/start', {
    method: 'POST', headers: { Cookie: 'reai-market=ch', 'Content-Type': 'application/json' },
    body: JSON.stringify({ lines: [{ variantId: '018f3c2e-8b1a-4d3e-9c4f-5a6b7c8d9e0f', quantity: 2 }] }),
  }), env);
  assert.equal(payment.status, 201);
  assert.match(checkout.url, /market=ch&locale=en/);
  assert.equal(checkout.body.lines[0].quantity, 2);
  assert.equal((await worker.fetch(new Request('https://shop.example/reai/catalog?market=missing'), env)).status, 400);
});
