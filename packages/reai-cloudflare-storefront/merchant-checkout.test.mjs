import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../sites/newmovements/worker.js';

const origin = 'https://store.example';
const token = 'a'.repeat(32);
const env = {
  REAI_BASE_URL: 'https://upstream.example',
  REAI_SITE_TOKEN: 'private-site-key',
  ASSETS: { fetch: () => new Response('asset') },
};
let calls = [];
globalThis.fetch = async (url, options) => {
  calls.push({ url, options });
  return Response.json(new URL(url).pathname.endsWith('/checkout-sessions')
    ? { id: token } : { currency: 'NOK', total: 123 });
};
function request(path, method = 'GET', body, extra = {}) {
  return new Request(origin + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...extra },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

test('merchant checkout renders privately without a credential or token', async () => {
  const response = await worker.fetch(request('/checkout'), env, {});
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
  const html = await response.text();
  assert.match(html, /data-customer-form/);
  assert.ok(!html.includes(env.REAI_SITE_TOKEN));
  assert.ok(!html.includes(token));
});

test('checkout requires a cookie and rejects external writes before contacting ReAI', async () => {
  const requests = [
    [request('/reai/checkout/read'), 401],
    [request('/reai/checkout/payment', 'POST', {}, {
      Origin: 'https://evil.example', Cookie: `__Host-reai-checkout=${token}`,
    }), 403],
  ];
  for (const [input, status] of requests) {
    calls = [];
    const response = await worker.fetch(input, env, {});
    assert.equal(response.status, status);
    assert.equal(calls.length, 0);
  }
});

test('starting checkout sets a secure HttpOnly cookie and returns only the merchant URL', async () => {
  const response = await worker.fetch(request('/reai/checkout/start', 'POST', {
    lines: [{ variantId: '8702b42e-45e9-4678-9088-e052a003ec47', quantity: 1 }],
  }, { Origin: origin }), env, {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { checkoutUrl: origin + '/checkout' });
  assert.match(response.headers.get('Set-Cookie'), /Secure; HttpOnly; SameSite=Lax/);
  assert.equal(JSON.parse(calls.at(-1).options.body).returnUrl, origin + '/checkout?confirmation=1');
});

test('session operations bind the cookie token and server credential without exposing either', async () => {
  const response = await worker.fetch(request('/reai/checkout/read', 'GET', undefined, {
    Cookie: `__Host-reai-checkout=${token}`,
  }), env, {});
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(calls.at(-1).options.headers.get('Authorization'), 'Bearer private-site-key');
  assert.equal(calls.at(-1).url, `https://upstream.example/site/v1/commerce/checkout-sessions/${token}`);
});
