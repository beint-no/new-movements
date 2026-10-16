import assert from 'node:assert/strict';
import { test } from 'node:test';
import proxy from '../proxy.js';

const env = { STOREFRONT_RUNTIME_URL: 'https://runtime.example.workers.dev', STOREFRONT_PROXY_TOKEN: 'test-only-proxy-token' };

test('production relay preserves the origin, URL, visitor, cookie and POST body without following redirects', async () => {
  const originalFetch = globalThis.fetch;
  let forwarded;
  globalThis.fetch = async request => {
    forwarded = request;
    assert.equal(await request.text(), '{"email":"test@example.test"}');
    return new Response(null, { status: 303, headers: { Location: 'https://app.reai.no/checkout/test', 'Set-Cookie': 'saved=true; Secure' } });
  };
  try {
    const response = await proxy.fetch(new Request('https://newmovements.com/reai/newsletter/subscribe?locale=nb', {
      method: 'POST', body: '{"email":"test@example.test"}', headers: { Cookie: 'reai-market=default%3ANO', Origin: 'https://newmovements.com', 'CF-Connecting-IP': '192.0.2.1', 'CF-IPCountry': 'NO', 'X-ReAI-Storefront-Origin': 'https://attacker.test' },
    }), env);
    assert.equal(forwarded.url, 'https://runtime.example.workers.dev/reai/newsletter/subscribe?locale=nb');
    assert.equal(forwarded.redirect, 'manual');
    assert.equal(forwarded.headers.get('X-ReAI-Storefront-Origin'), 'https://newmovements.com');
    assert.equal(forwarded.headers.get('X-ReAI-Storefront-Token'), env.STOREFRONT_PROXY_TOKEN);
    assert.equal(forwarded.headers.get('X-ReAI-Storefront-Client-IP'), '192.0.2.1');
    assert.equal(forwarded.headers.get('X-ReAI-Storefront-Country'), 'NO');
    assert.equal(forwarded.headers.get('Cookie'), 'reai-market=default%3ANO');
    assert.equal(response.status, 303);
    assert.equal(response.headers.get('Location'), 'https://app.reai.no/checkout/test');
    assert.equal(response.headers.get('X-ReAI-Storefront-Token'), null);
  } finally { globalThis.fetch = originalFetch; }
});

test('a network-path URL cannot send the proxy credential to another host', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async request => { assert.equal(new URL(request.url).host, 'runtime.example.workers.dev'); return new Response('OK'); };
  try { assert.equal((await proxy.fetch(new Request('https://newmovements.com//attacker.test/path'), env)).status, 200); }
  finally { globalThis.fetch = originalFetch; }
});

test('missing relay configuration and unrecognized hosts fail closed', async () => {
  assert.equal((await proxy.fetch(new Request('https://newmovements.com/'), {})).status, 503);
  assert.equal((await proxy.fetch(new Request('https://elsewhere.test/'), env)).status, 404);
});
