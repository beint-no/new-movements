// @ts-check
import { ReaiSiteClient } from '../reai-site-client/client.mjs';
import { createReaiStorefrontWorker } from './worker.mjs';

/** @typedef {import('../reai-site-client/site-api.d.ts').components['schemas']['SiteDeliveryMarketRes']} Market */
const COOKIE = 'reai-market';
const cookieValue = (request) => request.headers.get('Cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
const choiceCookie = (handle) => `${COOKIE}=${encodeURIComponent(handle)}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`;

/** Country selects an enabled market; currency alone cannot identify a destination or price list. */
/** @param {Market[]} markets @param {{ requested?: string | null, saved?: string, country?: string | null }} context */
export function selectMarket(markets, { requested, saved, country } = {}) {
  return markets.find((market) => market.handle === requested)
    || markets.find((market) => market.handle === saved)
    || markets.find((market) => country && market.countries?.includes(country))
    || markets.find((market) => market.isDefault)
    || markets[0];
}

/** Wrap the static worker with Site API market discovery and server-side preference handling. */
export function createReaiMarketStorefrontWorker(options) {
  /** @type {{ markets: Market[], expiresAt: number, token: string, baseUrl: string } | undefined} */
  let configuration;
  /** @type {Promise<Market[]> | undefined} */
  let pending;

  async function marketsFor(env) {
    const baseUrl = env.REAI_BASE_URL || 'https://app.reai.no';
    if (configuration && configuration.token === env.REAI_SITE_TOKEN && configuration.baseUrl === baseUrl && configuration.expiresAt > Date.now()) return configuration.markets;
    if (pending) return pending;
    pending = (async () => {
      const result = await new ReaiSiteClient({ baseUrl, token: env.REAI_SITE_TOKEN }).site();
      if (!result.response.ok) throw new Error('Market settings are unavailable');
      const site = await result.json();
      const markets = (site.markets || []).filter((market) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(market.handle));
      if (!markets.length) throw new Error('No market is configured');
      configuration = { markets, expiresAt: Date.now() + 60_000, token: env.REAI_SITE_TOKEN, baseUrl };
      return markets;
    })();
    try { return await pending; } finally { pending = undefined; }
  }

  return {
    async fetch(request, env, executionContext) {
      const url = new URL(request.url);
      // Assets need neither market discovery nor personalized response headers.
      if (!options.storefront.matchRoute(url.pathname) && !url.pathname.startsWith('/reai/')) {
        return createReaiStorefrontWorker(options).fetch(request, env, executionContext);
      }
      let markets;
      try { markets = await marketsFor(env); }
      catch {
        return new Response('The store is temporarily unavailable. Please try again.', { status: 503, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' } });
      }
      const requested = url.searchParams.get('market');
      if (requested && !markets.some((market) => market.handle === requested)) return new Response('This market is unavailable.', { status: 400, headers: { 'Cache-Control': 'no-store' } });
      if (url.pathname === '/reai/market') {
        if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
        if (request.headers.get('Origin') && request.headers.get('Origin') !== url.origin) return new Response(null, { status: 403 });
        const form = await request.formData();
        const market = markets.find((item) => item.handle === form.get('market'));
        if (!market) return new Response('This market is unavailable.', { status: 400, headers: { 'Cache-Control': 'no-store' } });
        let returnTo;
        try { returnTo = new URL(String(form.get('returnTo') || '/'), url.origin); }
        catch { return new Response(null, { status: 400 }); }
        if (returnTo.origin !== url.origin) return new Response(null, { status: 400 });
        returnTo.searchParams.delete('market');
        returnTo.searchParams.delete('filter.v.price.gte');
        returnTo.searchParams.delete('filter.v.price.lte');
        return new Response(null, { status: 303, headers: { Location: returnTo.href, 'Set-Cookie': choiceCookie(market.handle), 'Cache-Control': 'no-store' } });
      }
      const country = request.cf?.country || request.headers.get('CF-IPCountry');
      const market = selectMarket(markets, { requested, saved: cookieValue(request), country });
      if (!market) return new Response('This market is unavailable.', { status: 503 });
      const renderer = Object.fromEntries(Object.entries(options.storefront).map(([name, value]) => [name,
        name.startsWith('render') && typeof value === 'function'
          ? (store, ...args) => value(store ? { ...store, markets, marketReturnTo: url.pathname + url.search } : store, ...args)
          : value,
      ]));
      const response = await createReaiStorefrontWorker({ ...options, storefront: renderer, market: market.handle, locale: options.locale || market.defaultLocale }).fetch(request, env, executionContext);
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'private, no-store');
      headers.set('Vary', 'Cookie, CF-IPCountry');
      headers.set('X-ReAI-Market', market.handle);
      if (requested || !cookieValue(request)) headers.append('Set-Cookie', choiceCookie(market.handle));
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    },
  };
}
