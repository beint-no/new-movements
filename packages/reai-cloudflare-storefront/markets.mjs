// @ts-check
import { ReaiSiteClient } from '../reai-site-client/client.mjs';
import { createReaiStorefrontWorker } from './worker.mjs';

/** @typedef {import('../reai-site-client/site-api.d.ts').components['schemas']['SiteDeliveryMarketRes']} Market */
const COOKIE = 'reai-market';
const cookieValue = (request) => {
  const raw = request.headers.get('Cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  try { return decodeURIComponent(raw || '').split(':'); } catch { return []; }
};
const choiceCookie = (handle, country) => `${COOKIE}=${encodeURIComponent(`${handle}:${country}`)}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`;

function normalizePathPrefix(pathPrefix = "") {
  const value = String(pathPrefix).trim();
  if (!value || value === "/") return "";
  if (!value.startsWith("/") || value.endsWith("/") || value.includes("//") || value.includes("?") || value.includes("#")) {
    throw new TypeError(`Invalid locale pathPrefix: ${pathPrefix}`);
  }
  return value;
}

function stripPathPrefix(pathname, pathPrefix) {
  if (!pathPrefix) return pathname;
  if (pathname === pathPrefix) return "/";
  if (!pathname.startsWith(`${pathPrefix}/`)) return null;
  return pathname.slice(pathPrefix.length);
}

function localeRoutes(options) {
  const configured = Array.isArray(options.locales) && options.locales.length
    ? options.locales
    : [{ pathPrefix: options.pathPrefix || "", locale: options.locale || "en" }];
  const routes = configured.map((entry) => {
    if (!entry || typeof entry !== "object") throw new TypeError("locales must contain objects");
    const pathPrefix = normalizePathPrefix(entry.pathPrefix || "");
    if (typeof entry.locale !== "string" || !entry.locale.trim()) throw new TypeError("locale is required");
    return { ...entry, pathPrefix, locale: entry.locale.trim() };
  });
  const prefixes = new Set(routes.map((entry) => entry.pathPrefix));
  if (prefixes.size !== routes.length) throw new TypeError("locale pathPrefix values must be unique");
  if (!routes.some((entry) => entry.pathPrefix === "")) throw new TypeError("locales must include a default pathPrefix");
  return routes.sort((left, right) => right.pathPrefix.length - left.pathPrefix.length);
}

function localeRouteFor(routes, pathname) {
  return routes.find((entry) => stripPathPrefix(pathname, entry.pathPrefix) !== null) || null;
}

/** Country selects an enabled market; currency alone cannot identify a destination or price list. */
/** @param {Market[]} markets @param {{ requested?: string | null | undefined, saved?: string | undefined, country?: string | null | undefined }} context */
export function selectMarket(markets, { requested, saved, country } = {}) {
  return markets.find((market) => market.handle === requested)
    || markets.find((market) => market.handle === saved)
    || markets.find((market) => country && market.countries?.includes(country))
    || markets.find((market) => market.isDefault)
    || markets[0];
}

/** @param {Market[]} markets @param {{ requested?: string | null | undefined, saved?: string | undefined, savedCountry?: string | undefined, country?: string | null | undefined }} context */
export function selectDestination(markets, { requested, saved, savedCountry, country } = {}) {
  const market = selectMarket(markets, { requested, saved, country });
  if (!market) return undefined;
  const countries = market.countries?.length ? market.countries : ['NO'];
  const selectedCountry = (market.handle === saved && countries.includes(savedCountry || '') && savedCountry)
    || (countries.includes(country || '') && country)
    || countries[0] || 'NO';
  return { market, country: selectedCountry };
}

/** Wrap the static worker with Site API market discovery and server-side preference handling. */
export function createReaiMarketStorefrontWorker(options) {
  const routes = localeRoutes(options);
  /** @type {{ markets: Market[], expiresAt: number, token: string, baseUrl: string } | undefined} */
  let configuration;

  async function marketsFor(env) {
    const baseUrl = env.REAI_BASE_URL || 'https://app.reai.no';
    if (configuration && configuration.token === env.REAI_SITE_TOKEN && configuration.baseUrl === baseUrl && configuration.expiresAt > Date.now()) return configuration.markets;
    // Reuse completed data, never another request's pending I/O. Cloudflare
    // can cancel that I/O when the originating visitor disconnects.
    const result = await new ReaiSiteClient({ baseUrl, token: env.REAI_SITE_TOKEN }).site();
    if (!result.response.ok) throw new Error('Market settings are unavailable');
    const site = await result.json();
    const markets = (site.markets || []).filter((market) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(market.handle));
    if (!markets.length) throw new Error('No market is configured');
    configuration = { markets, expiresAt: Date.now() + 60_000, token: env.REAI_SITE_TOKEN, baseUrl };
    return markets;
  }

  return {
    async fetch(request, env, executionContext) {
      const url = new URL(request.url);
      const localeRoute = localeRouteFor(routes, url.pathname);
      const routedPath = localeRoute ? stripPathPrefix(url.pathname, localeRoute.pathPrefix) : null;
      const localeOptions = localeRoute ? { ...options, ...localeRoute, pathPrefix: localeRoute.pathPrefix } : options;
      // Assets need neither market discovery nor personalized response headers.
      if (!localeRoute || (!options.storefront.matchRoute(routedPath) && !routedPath.startsWith('/reai/'))) {
        return createReaiStorefrontWorker(localeOptions).fetch(request, env, executionContext);
      }
      let markets;
      try { markets = await marketsFor(env); }
      catch {
        return new Response('The store is temporarily unavailable. Please try again.', { status: 503, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' } });
      }
      const requested = url.searchParams.get('market');
      const requestedCountry = url.searchParams.get('country');
      const countryMarket = requestedCountry && markets.find((market) => market.countries?.includes(requestedCountry));
      if (requestedCountry && (!countryMarket || (requested && !markets.find((market) => market.handle === requested)?.countries?.includes(requestedCountry)))) return new Response('This delivery country is unavailable.', { status: 400, headers: { 'Cache-Control': 'no-store' } });
      if (requested && !markets.some((market) => market.handle === requested)) return new Response('This market is unavailable.', { status: 400, headers: { 'Cache-Control': 'no-store' } });
      if (routedPath === '/reai/market') {
        if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
        if (request.headers.get('Origin') && request.headers.get('Origin') !== url.origin) return new Response(null, { status: 403 });
        const form = await request.formData();
        const selectedCountry = form.get('country');
        const market = selectedCountry ? markets.find((item) => (item.countries?.length ? item.countries : ['NO']).includes(String(selectedCountry))) : markets.find((item) => item.handle === form.get('market'));
        const country = selectedCountry || market?.countries?.[0] || 'NO';
        if (!market) return new Response('This market is unavailable.', { status: 400, headers: { 'Cache-Control': 'no-store' } });
        let returnTo;
        try { returnTo = new URL(String(form.get('returnTo') || '/'), url.origin); }
        catch { return new Response(null, { status: 400 }); }
        if (returnTo.origin !== url.origin) return new Response(null, { status: 400 });
        returnTo.searchParams.delete('market');
        returnTo.searchParams.delete('country');
        returnTo.searchParams.delete('filter.v.price.gte');
        returnTo.searchParams.delete('filter.v.price.lte');
        return new Response(null, { status: 303, headers: { Location: returnTo.href, 'Set-Cookie': choiceCookie(market.handle, country), 'Cache-Control': 'no-store' } });
      }
      const geoCountry = request.cf?.country || request.headers.get('CF-IPCountry');
      const [saved, savedCountry] = cookieValue(request);
      const destination = selectDestination(markets, { requested: requested || countryMarket?.handle, saved: requestedCountry ? undefined : saved, savedCountry, country: requestedCountry || geoCountry });
      if (!destination) return new Response('This market is unavailable.', { status: 503 });
      const { market, country } = destination;
      const renderer = Object.fromEntries(Object.entries(options.storefront).map(([name, value]) => [name,
        (name.startsWith('render') || name === 'localizeStorefront') && typeof value === 'function'
          ? (store, ...args) => value(store ? {
            ...store,
            markets,
            countryCode: country,
            marketReturnTo: url.pathname + url.search,
            pathPrefix: localeRoute?.pathPrefix || "",
            localeRoutes: routes,
          } : store, ...args)
          : value,
      ]));
      const response = await createReaiStorefrontWorker({ ...localeOptions, storefront: renderer, market: market.handle, countryCode: country, locale: localeRoute?.locale || options.locale || market.defaultLocale }).fetch(request, env, executionContext);
      const headers = new Headers(response.headers);
      headers.set('Cache-Control', 'private, no-store');
      headers.set('Vary', 'Cookie, CF-IPCountry');
      headers.set('X-ReAI-Market', market.handle);
      headers.set('X-ReAI-Country', country);
      const checkoutMarket = markets.find(item => item.handle === headers.get('X-Reai-Checkout-Market'));
      const checkoutCountry = headers.get('X-Reai-Checkout-Country');
      headers.delete('X-Reai-Checkout-Market');
      headers.delete('X-Reai-Checkout-Country');
      if (checkoutMarket?.countries?.includes(checkoutCountry)) headers.append('Set-Cookie', choiceCookie(checkoutMarket.handle, checkoutCountry));
      else if (requested || saved !== market.handle || savedCountry !== country) headers.append('Set-Cookie', choiceCookie(market.handle, country));
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    },
  };
}
