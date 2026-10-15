import { searchProducts } from "../reai-site-client/search.mjs";
// @ts-check

import { ReaiSiteClient } from "../reai-site-client/client.mjs";

/** @typedef {import("../reai-site-client/site-api.d.ts").components["schemas"]["SiteCheckoutSessionReq"]} SiteCheckoutSessionRequest */
/** @typedef {{ REAI_BASE_URL?: string, REAI_SITE_TOKEN?: string, CHECKOUT_ENABLED?: string, NEWSLETTER_RATE_LIMIT?: { limit(options: { key: string }): Promise<{ success: boolean }> }, CHECKOUT_RATE_LIMIT?: { limit(options: { key: string }): Promise<{ success: boolean }> }, ASSETS: { fetch(request: Request): Promise<Response> } }} WorkerEnv */
/** @typedef {{ request: Request, env: WorkerEnv, url: URL, renderContext: any }} BeforeRequestContext */

const STATIC_ASSET = /\.(?:avif|css|eot|gif|ico|jpe?g|js|json|map|mp4|ogg|otf|png|svg|ttf|webm|webp|woff2?)$/i;
const VARIANT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MARKET_HANDLE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STOREFRONT_FRESH_MILLISECONDS = 60_000;
const STOREFRONT_STALE_WHILE_REVALIDATE_MILLISECONDS = 300_000;
const STOREFRONT_CACHE_RETENTION_SECONDS = 86_400;

const defaultMessages = {
  invalidJson: "Invalid JSON.",
  invalidNewsletter: "Provide a valid email and newsletter consent; name is optional (75 characters maximum).",
  signupRateLimited: "Please wait a moment before signing up again.",
  invalidLineCount: "The cart must contain between 1 and 100 lines.",
  invalidLine: "The cart contains an invalid variant or quantity.",
  notConfigured: "The Site API is not configured.",
  invalidProductHandle: "Invalid product handle.",
  invalidCollectionHandle: "Invalid collection handle.",
  invalidVariantId: "Invalid variant ID.",
  routeNotFound: "API route not found.",
  methodNotAllowed: "Method not allowed.",
  temporarilyUnavailable: "The Site API is temporarily unavailable.",
};

export const norwegianMessages = {
  invalidJson: "Ugyldig JSON.",
  invalidNewsletter: "Oppgi en gyldig e-postadresse og samtykke til nyhetsbrev; navn er valgfritt (maks 75 tegn).",
  signupRateLimited: "Vent litt før du melder deg på igjen.",
  invalidLineCount: "Handlekurven må inneholde mellom 1 og 100 linjer.",
  invalidLine: "Handlekurven inneholder en ugyldig variant eller et ugyldig antall.",
  notConfigured: "Site API er ikke konfigurert.",
  invalidProductHandle: "Ugyldig produkthåndtak.",
  invalidCollectionHandle: "Ugyldig samlingshåndtak.",
  invalidVariantId: "Ugyldig variant-ID.",
  routeNotFound: "Fant ikke API-ruten.",
  methodNotAllowed: "Metoden er ikke tillatt.",
  temporarilyUnavailable: "Site API er midlertidig utilgjengelig.",
};

function siteBaseUrl(env) {
  return (env.REAI_BASE_URL || "https://app.reai.no").replace(/\/$/, "");
}

function siteOrigin(env) {
  try {
    return new URL(siteBaseUrl(env)).origin;
  } catch {
    return "https://app.reai.no";
  }
}

function baseSecurityHeaders(headers, env, extraImageOrigins) {
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set(
    "Content-Security-Policy",
    `default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: ${siteOrigin(env)}${extraImageOrigins ? ` ${extraImageOrigins}` : ''}; script-src 'self'; form-action 'self' mailto:; base-uri 'self'; frame-ancestors 'none'; object-src 'none'`,
  );
  return headers;
}

function cacheRequest(cacheKey) {
  return new Request(`https://reai-storefront-cache.invalid/${encodeURIComponent(cacheKey)}`);
}

function normalizePathPrefix(pathPrefix = "") {
  const value = String(pathPrefix).trim();
  if (!value || value === "/") return "";
  if (!value.startsWith("/") || value.endsWith("/") || value.includes("//") || value.includes("?") || value.includes("#")) {
    throw new TypeError(`Invalid pathPrefix: ${pathPrefix}`);
  }
  return value;
}

function stripPathPrefix(pathname, pathPrefix) {
  if (!pathPrefix) return pathname;
  if (pathname === pathPrefix) return "/";
  if (!pathname.startsWith(`${pathPrefix}/`)) return null;
  return pathname.slice(pathPrefix.length);
}

/**
 * @param {{
 *   cacheKey: string,
 *   storefront: any,
 *   checkoutReturnPath?: string, merchantCheckoutPath?: string,
 *   noStorePaths?: string[],
 *   messages?: Partial<typeof defaultMessages>,
 *   locale: string,
 *   market: string,
 *   countryCode?: string, imageOrigins?: string[],
 *   pathPrefix?: string,
 *   beforeRequest?: ((context: BeforeRequestContext) => Response | null | Promise<Response | null>) | null,
 * }} options
 */
export function createReaiStorefrontWorker({
  cacheKey,
  storefront,
  checkoutReturnPath = "/bestilling/fullfort/",
  merchantCheckoutPath = undefined,
  noStorePaths = ["/handlekurv/", checkoutReturnPath],
  messages: messageOverrides = {},
  locale,
  market,
  pathPrefix: configuredPathPrefix = "",
  beforeRequest = null,
  countryCode = undefined,
  imageOrigins = [],
}) {
  if (!cacheKey) throw new TypeError("cacheKey is required");
  if (!storefront?.HANDLE || !storefront?.matchRoute) throw new TypeError("storefront helpers are required");
  if (typeof locale !== "string" || !locale.trim()) throw new TypeError("locale is required");
  if (typeof market !== "string" || !market.trim()) throw new TypeError("market is required");
  const extraImageOrigins = imageOrigins.map((value) => {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.origin !== value) throw new TypeError('imageOrigins must be HTTPS origins');
    return url.origin;
  }).join(' ');
  const securityHeaders = (headers, env) => baseSecurityHeaders(headers, env, extraImageOrigins);

  const messages = { ...defaultMessages, ...messageOverrides };
  const pathPrefix = normalizePathPrefix(configuredPathPrefix);
  let resolvedLocale;
  try {
    [resolvedLocale] = Intl.getCanonicalLocales(locale.trim());
  } catch {
    throw new TypeError(`Invalid locale: ${locale}`);
  }
  if (!resolvedLocale) throw new TypeError(`Invalid locale: ${locale}`);
  const canonicalLocale = resolvedLocale;
  const canonicalMarket = String(market).trim().toLowerCase();
  if (!MARKET_HANDLE.test(canonicalMarket)) throw new TypeError(`Invalid market: ${market}`);
  const storefrontCache = cacheRequest(`${cacheKey}:${canonicalMarket}:${canonicalLocale}`);
  const publicPath = (pathname) => {
    const value = pathname.startsWith("/") ? pathname : `/${pathname}`;
    return pathPrefix ? `${pathPrefix}${value === "/" ? "/" : value}` : value;
  };
  const renderContext = Object.freeze({
    locale: canonicalLocale,
    market: canonicalMarket,
    pathPrefix,
    messages: Object.freeze(messages),
    publicPath,
  });
  const deliveryContext = Object.freeze({
    market: canonicalMarket,
    locale: canonicalLocale,
  });

  const jsonResponse = (body, status, env) => new Response(JSON.stringify(body), {
    status,
    headers: securityHeaders(new Headers({
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Language": canonicalLocale,
    }), env),
  });

  const htmlResponse = (html, env, status = 200, cacheControl = "public, max-age=60, stale-while-revalidate=300") => new Response(html, {
    status,
    headers: securityHeaders(new Headers({
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": status === 200 ? cacheControl : "no-store",
      "Content-Language": canonicalLocale,
    }), env),
  });

  const xmlResponse = (xml, env) => new Response(xml, {
    headers: securityHeaders(new Headers({
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      "Content-Language": canonicalLocale,
    }), env),
  });

  async function checkoutRequest(request, url, env) {
    let body;
    try {
      body = await request.json();
    } catch {
      return { error: jsonResponse({ error: messages.invalidJson }, 400, env) };
    }

    if (!Array.isArray(body.lines) || body.lines.length < 1 || body.lines.length > 100) {
      return { error: jsonResponse({ error: messages.invalidLineCount }, 400, env) };
    }

    const lines = body.lines.map((line) => ({
      variantId: line?.variantId,
      quantity: line?.quantity,
    }));
    if (lines.some((line) => !VARIANT_ID.test(line.variantId) || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20)) {
      return { error: jsonResponse({ error: messages.invalidLine }, 400, env) };
    }

    /** @type {SiteCheckoutSessionRequest} */
    const checkoutBody = {
      lines,
      returnUrl: new URL(publicPath(checkoutReturnPath), url.origin).href,
      ...(merchantCheckoutPath ? { merchantCheckoutUrl: new URL(publicPath(merchantCheckoutPath), url.origin).href } : {}),
    };
    return { body: checkoutBody };
  }

  function siteClient(env) {
    if (!env.REAI_SITE_TOKEN) {
      throw Object.assign(new Error(messages.notConfigured), { status: 503 });
    }
    return new ReaiSiteClient({
      baseUrl: siteBaseUrl(env),
      token: env.REAI_SITE_TOKEN,
    });
  }

  /**
   * @template T
   * @param {import("../reai-site-client/client.mjs").SiteApiResponse<T>} result
   * @returns {Promise<T>}
   */
  async function siteJson(result) {
    const response = result.response;
    if (!response.ok) {
      throw Object.assign(new Error(`Site API ${response.status}`), { status: response.status });
    }
    return result.json();
  }

  async function legacyStorefront(env, cached) {
    const client = siteClient(env);
    const catalogResult = await client.catalog(deliveryContext, cached?.etag);
    const catalogResponse = catalogResult.response;
    if (catalogResponse.status === 304 && cached) {
      return { store: cached.store, etag: cached.etag, revalidated: true };
    }
    if (!catalogResponse.ok) {
      throw Object.assign(new Error(`Site API ${catalogResponse.status}`), { status: catalogResponse.status });
    }
    const [catalog, list] = await Promise.all([
      catalogResult.json(),
      client.collections(deliveryContext).then(siteJson),
    ]);
    const collections = await Promise.all((list.collections || []).map(async (collection) => {
      if (!storefront.HANDLE.test(collection.handle)) return { ...collection, products: [] };
      try {
        return await siteJson(await client.collection(collection.handle, deliveryContext));
      } catch {
        return { ...collection, products: [] };
      }
    }));
    return {
      store: { ...catalog, products: catalog.products || [], collections },
      etag: catalogResponse.headers.get("ETag"),
      revalidated: false,
    };
  }

  async function buildStorefront(env, cached) {
    const result = await siteClient(env).storefront(deliveryContext, cached?.etag);
    const response = result.response;
    if (response.status === 404) return legacyStorefront(env, cached);
    if (response.status === 304 && cached) {
      return { store: cached.store, etag: cached.etag, revalidated: true };
    }
    if (!response.ok) {
      throw Object.assign(new Error(`Site API ${response.status}`), { status: response.status });
    }
    const store = await result.json();
    return {
      store: { ...store, products: store.products || [], collections: store.collections || [] },
      etag: response.headers.get("ETag"),
      revalidated: false,
    };
  }

  async function readCachedStorefront() {
    try {
      const cached = await caches.default.match(storefrontCache);
      if (!cached) return null;
      return {
        store: await cached.json(),
        etag: cached.headers.get("ETag"),
        cachedAt: Number(cached.headers.get("X-ReAI-Cached-At")) || 0,
      };
    } catch {}
    return null;
  }

  async function writeCachedStorefront(store, etag) {
    try {
      await caches.default.put(storefrontCache, new Response(JSON.stringify(store), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": `public, max-age=${STOREFRONT_CACHE_RETENTION_SECONDS}`,
          "X-ReAI-Cached-At": String(Date.now()),
          ...(etag ? { ETag: etag } : {}),
        },
      }));
    } catch {}
  }

  async function refreshStorefront(env, cached) {
    // Worker I/O belongs to the invoking request. Sharing an in-flight promise
    // can leave later visitors waiting on a canceled request's refresh forever.
    const refreshed = await buildStorefront(env, cached);
    await writeCachedStorefront(refreshed.store, refreshed.etag);
    return {
      store: refreshed.store,
      etag: refreshed.etag,
      cacheStatus: refreshed.revalidated ? "REVALIDATED" : cached ? "REFRESH" : "MISS",
    };
  }

  async function getStorefront(env, executionContext) {
    const cached = await readCachedStorefront();
    if (!cached) return refreshStorefront(env, null);
    const age = Date.now() - cached.cachedAt;
    if (age <= STOREFRONT_FRESH_MILLISECONDS) {
      return { store: cached.store, etag: cached.etag, cacheStatus: "HIT" };
    }
    if (
      age <= STOREFRONT_FRESH_MILLISECONDS + STOREFRONT_STALE_WHILE_REVALIDATE_MILLISECONDS &&
      executionContext?.waitUntil
    ) {
      executionContext.waitUntil(refreshStorefront(env, cached));
      return { store: cached.store, etag: cached.etag, cacheStatus: "STALE" };
    }
    try {
      return await refreshStorefront(env, cached);
    } catch {
      return { store: cached.store, etag: cached.etag, cacheStatus: "STALE_IF_ERROR" };
    }
  }

  async function variantAvailability(env, variants) {
    const requested = variants || [];
    const batches = [];
    for (let index = 0; index < requested.length; index += 100) batches.push(requested.slice(index, index + 100));
    const batchEntries = await Promise.all(batches.map(async (batch) => {
      try {
        const payload = await siteJson(await siteClient(env).availabilities(
          batch.map((variant) => variant.id),
          deliveryContext,
        ));
        return payload.variants.map((variant) => [variant.variantId, variant.status === "AVAILABLE"]);
      } catch (error) {
        if (error.status !== 404) return batch.map((variant) => [variant.id, null]);
        return Promise.all(batch.map(async (variant) => {
          try {
            const payload = await siteJson(await siteClient(env).availability(variant.id, deliveryContext));
            return [variant.id, payload.status === "AVAILABLE"];
          } catch {
            return [variant.id, null];
          }
        }));
      }
    }));
    return Object.fromEntries(batchEntries.flat());
  }

  function catalogProducts(store, url) {
    return storefront.catalogProductsForRequest?.(store.products || [], { ...renderContext, url, collections: store.collections }) ?? store.products;
  }

  function cachedCommerceBody(route, store, url) {
    const context = {
      catalogVersion: store.catalogVersion,
      marketId: store.marketId,
      marketHandle: store.marketHandle,
      locale: store.locale,
      currency: store.currency,
    };
    if (route === "/reai/search") {
      const query = (url.searchParams.get("q") || "").slice(0, 200);
      const products = searchProducts(catalogProducts(store, url), query, 6).map((product) => {
        const image = storefront.searchImage?.(product) || product.images?.[0];
        const rendition = image?.renditions?.find((entry) => entry.width >= 160) || image;
        const productUrl = new URL(product.url || `/products/${product.handle}`, url.origin);
        if (product.selectedVariantId) productUrl.searchParams.set("variant", product.selectedVariantId);
        return { title: product.title, url: productUrl.pathname + productUrl.search, image: rendition?.url,
          price: Math.min(...product.variants.map((variant) => Number(variant.price))) };
      });
      return { key: `search:${encodeURIComponent(url.search)}`, body: { currency: store.currency, products } };
    }
    if (route === "/reai/catalog") {
      return {
        key: storefront.catalogProductsForRequest ? `catalog:${encodeURIComponent(url.search)}` : "catalog",
        body: { ...context, products: catalogProducts(store, url) },
      };
    }
    if (route === "/reai/collections") {
      return {
        key: "collections",
        body: {
          ...context,
          collections: store.collections.map(({ products, ...collection }) => collection),
        },
      };
    }
    if (route.startsWith("/reai/products/")) {
      const handle = route.slice("/reai/products/".length);
      const product = store.products.find((candidate) => candidate.handle === handle);
      return product ? { key: `product-${product.id}`, body: { ...context, ...product } } : null;
    }
    if (route.startsWith("/reai/collections/")) {
      const handle = route.slice("/reai/collections/".length);
      const collection = store.collections.find((candidate) => candidate.handle === handle);
      return collection ? { key: `collection-${collection.id}`, body: { ...context, ...collection } } : null;
    }
    return null;
  }

  function cacheEntityTag(key, store, snapshotEtag) {
    // Stock-driven collection order can change without a catalog edit.
    return `W/"${cacheKey}:${key}:${store.catalogVersion}:${store.marketId}:${store.locale}:${encodeURIComponent(snapshotEtag || "")}"`;
  }

  function matchesEntityTag(request, entityTag) {
    const strongForm = entityTag.replace(/^W\//, "");
    return (request.headers.get("If-None-Match") || "")
      .split(",")
      .some((candidate) => candidate.trim() === "*" || candidate.trim().replace(/^W\//, "") === strongForm);
  }

  async function cachedCommerceResponse(request, env, route, executionContext) {
    if (request.method !== "GET") return null;
    if (
      route !== "/reai/search"
      && route !== "/reai/catalog"
      && route !== "/reai/collections"
      && !route.startsWith("/reai/products/")
      && !route.startsWith("/reai/collections/")
    ) return null;
    const cached = await getStorefront(env, executionContext);
    const resolved = cachedCommerceBody(route, cached.store, new URL(request.url));
    if (!resolved) return null;
    const entityTag = cacheEntityTag(resolved.key, cached.store, cached.etag);
    const headers = securityHeaders(new Headers({
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      "Content-Language": canonicalLocale,
      ETag: entityTag,
      "X-ReAI-Storefront-Cache": cached.cacheStatus,
    }), env);
    if (matchesEntityTag(request, entityTag)) return new Response(null, { status: 304, headers });
    headers.set("Content-Type", "application/json; charset=utf-8");
    return new Response(JSON.stringify(resolved.body), { headers });
  }

  async function siteApiResponse(request, env, url, executionContext) {
    if (!env.REAI_SITE_TOKEN) return jsonResponse({ error: messages.notConfigured }, 503, env);

    const route = stripPathPrefix(url.pathname, pathPrefix);
    if (route == null) return jsonResponse({ error: messages.routeNotFound }, 404, env);
    // A storefront projection hook may transform the JSON body per locale;
    // bypass the response cache in that case while retaining the shared
    // upstream storefront snapshot cache below.
    const cachedResponse = storefront.localizeStorefront
      ? null
      : await cachedCommerceResponse(request, env, route, executionContext).catch(() => null);
    if (cachedResponse) return cachedResponse;
    const client = siteClient(env);
    let upstreamResult;
    let cacheControl = "public, max-age=60, stale-while-revalidate=300";

    if (route === "/reai/search") return jsonResponse({ error: messages.temporarilyUnavailable }, 503, env);

    if (request.method === "GET" && route === "/reai/site") {
      upstreamResult = client.site();
    } else if (request.method === "GET" && route === "/reai/catalog") {
      upstreamResult = client.catalog(deliveryContext);
    } else if (request.method === "GET" && route.startsWith("/reai/products/")) {
      const handle = route.slice("/reai/products/".length);
      if (!handle || handle.includes("/")) return jsonResponse({ error: messages.invalidProductHandle }, 400, env);
      upstreamResult = client.product(handle, deliveryContext);
    } else if (request.method === "GET" && route === "/reai/collections") {
      upstreamResult = client.collections(deliveryContext);
    } else if (request.method === "GET" && route.startsWith("/reai/collections/")) {
      const handle = route.slice("/reai/collections/".length);
      if (!handle || handle.includes("/") || !storefront.HANDLE.test(handle)) {
        return jsonResponse({ error: messages.invalidCollectionHandle }, 400, env);
      }
      upstreamResult = client.collection(handle, deliveryContext);
    } else if (request.method === "GET" && route === "/reai/availability") {
      const variantIds = [...new Set(url.searchParams.getAll("variantId"))];
      if (!variantIds.length || variantIds.length > 100 || variantIds.some((id) => !VARIANT_ID.test(id))) {
        return jsonResponse({ error: messages.invalidVariantId }, 400, env);
      }
      upstreamResult = client.availabilities(variantIds, deliveryContext);
      cacheControl = "no-store";
    } else if (request.method === "GET" && route.startsWith("/reai/availability/")) {
      const variantId = route.slice("/reai/availability/".length);
      if (!VARIANT_ID.test(variantId)) return jsonResponse({ error: messages.invalidVariantId }, 400, env);
      upstreamResult = client.availability(variantId, deliveryContext);
      cacheControl = "no-store";
    } else if (request.method === "POST" && route === "/reai/analytics/events") {
      if (request.headers.get("Origin") !== url.origin) return jsonResponse({ error: "Invalid origin" }, 403, env);
      if (Number(request.headers.get("Content-Length")) > 16000) return jsonResponse({ error: "Batch too large" }, 413, env);
      if (env.ANALYTICS_RATE_LIMIT) {
        const { success } = await env.ANALYTICS_RATE_LIMIT.limit({ key: `analytics:${url.host}:${request.headers.get("CF-Connecting-IP") || "local"}` });
        if (!success) return jsonResponse({ error: "Rate limited" }, 429, env);
      }
      const text = await request.text();
      if (text.length>16000) return jsonResponse({ error: "Batch too large" }, 413, env);
      let batch;
      try { batch=JSON.parse(text); } catch { return jsonResponse({ error: "Invalid events" }, 400, env); }
      const kinds=new Set(["page_view","product_view","add_to_cart","remove_from_cart","checkout_view"]);
      if (!batch || !Array.isArray(batch.events) || batch.events.length<1 || batch.events.length>25 || batch.events.some((event) =>
          !event || typeof event!=="object" || !VARIANT_ID.test(event.id) || !VARIANT_ID.test(event.sessionId) || !kinds.has(event.kind) || typeof event.path!=="string" || event.path.length>500 || !/^\/[^?#\s]*$/.test(event.path) ||
          (event.productId!=null && !VARIANT_ID.test(event.productId)) || (event.variantId!=null && !VARIANT_ID.test(event.variantId)) ||
          (event.quantity!=null && (!Number.isInteger(event.quantity) || event.quantity<1 || event.quantity>100)))) return jsonResponse({ error: "Invalid events" }, 400, env);
      // Strip unknown fields so no personal data or arbitrary metadata reaches analytics.
      upstreamResult=client.analyticsEvents({events:batch.events.map(({id,sessionId,kind,path,productId,variantId,quantity})=>({id,sessionId,kind,path,productId,variantId,quantity}))});
      cacheControl="no-store";
    } else if (request.method === "POST" && ["/reai/newsletter/subscribe", "/reai/stock/subscribe"].includes(route)) {
      const origin = request.headers.get("Origin");
      if (origin && origin !== url.origin) return jsonResponse({ error: messages.invalidNewsletter }, 403, env);
      if (env.NEWSLETTER_RATE_LIMIT) {
        const { success } = await env.NEWSLETTER_RATE_LIMIT.limit({ key: `newsletter:${url.host}:${request.headers.get("CF-Connecting-IP") || "local"}` });
        if (!success) return jsonResponse({ error: messages.signupRateLimited }, 429, env);
      }
      let body;
      try {
        const text = await request.text();
        if (text.length > 1024) return jsonResponse({ error: messages.invalidNewsletter }, 400, env);
        if (request.headers.get("Content-Type")?.includes("application/x-www-form-urlencoded")) {
          const form = new URLSearchParams(text);
          body = Object.fromEntries(form);
          body.consent = body.consent === "true";
          if (body.welcomeDiscount != null) {
            if (!["true", "false"].includes(body.welcomeDiscount)) return jsonResponse({ error: messages.invalidNewsletter }, 400, env);
            body.welcomeDiscount = body.welcomeDiscount === "true";
          }
        } else body = JSON.parse(text);
      } catch { return jsonResponse({ error: messages.invalidJson }, 400, env); }
      const email = typeof body?.email === "string" ? body.email.trim() : "";
      const name = typeof body?.name === "string" ? body.name.trim() : body?.name;
      if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || body.consent !== true || (name != null && (typeof name !== "string" || name.length > 75))) {
        return jsonResponse({ error: messages.invalidNewsletter }, 400, env);
      }
      if (route === "/reai/stock/subscribe") {
        if (!VARIANT_ID.test(body.variantId)) return jsonResponse({ error: messages.invalidVariantId }, 400, env);
        upstreamResult = client.subscribeStock({ variantId: body.variantId, email, consent: true, locale: canonicalLocale, ...(name ? { name } : {}) });
        if (request.headers.get("Content-Type")?.includes("application/x-www-form-urlencoded")) {
          const upstream = (await upstreamResult).response;
          if (!upstream.ok) return htmlResponse(storefront.renderMessagePage(null, { title: "Stock notification", heading: "Please try again", text: "We could not save your request. Go back, refresh the product page and try again." }), env, upstream.status);
          const returnTo = typeof body.returnTo === "string" && /^\/products\/[a-z0-9-]+(?:\?view=(?:men|women))?$/.test(body.returnTo) ? body.returnTo : "/collections/all";
          return Response.redirect(new URL(`${returnTo}${returnTo.includes("?") ? "&" : "?"}notification=requested`,url.origin).href,303);
        }
      } else {
        if (body.welcomeDiscount != null && typeof body.welcomeDiscount !== "boolean") return jsonResponse({ error: messages.invalidNewsletter }, 400, env);
        upstreamResult = client.subscribeNewsletter({ email, consent: true, locale: canonicalLocale, ...(body.welcomeDiscount === true ? { welcomeDiscount: true } : {}), ...(name ? { name } : {}) });
        if (request.headers.get("Content-Type")?.includes("application/x-www-form-urlencoded")) {
          const upstream = (await upstreamResult.catch(() => ({ response: new Response(null, { status: 503 }) }))).response;
          return htmlResponse(storefront.renderMessagePage(null, upstream.ok
            ? { title: "Newsletter signup", heading: "Thanks for joining", text: body.welcomeDiscount === true ? "Check your email for your welcome discount. If you have already requested it, use the code in your earlier email." : "You're on the list. Thanks for joining our community." }
            : { title: "Newsletter signup", heading: "Please try again", text: "We could not save your signup. Go back and try again in a moment." }), env, upstream.ok ? 200 : upstream.status);
        }
      }
      cacheControl = "no-store";
    } else if (request.method === "POST" && route === "/reai/checkout/start") {
      if (env.CHECKOUT_ENABLED === "false") return jsonResponse({ error: "Checkout is disabled in this preview." }, 403, env);
      if (merchantCheckoutPath && request.headers.get("Origin") !== url.origin) return jsonResponse({ error: "Invalid request origin." }, 403, env);
      if (merchantCheckoutPath && await checkoutRateLimited(request, env, url)) return jsonResponse({ error: "Too many checkout requests. Please wait a moment." }, 429, env);
      const checkout = await checkoutRequest(request, url, env);
      if (checkout.error) return checkout.error;
      upstreamResult = client.createCheckoutSession(
        { ...checkout.body, ...(countryCode ? { countryCode } : {}) },
        deliveryContext,
        request.headers.get("Idempotency-Key") || crypto.randomUUID(),
      );
      cacheControl = "no-store";
    } else if (["GET", "POST"].includes(request.method)) {
      return jsonResponse({ error: messages.routeNotFound }, 404, env);
    } else {
      return jsonResponse({ error: messages.methodNotAllowed }, 405, env);
    }

    try {
      const upstream = (await upstreamResult).response;
      const responseHeaders = securityHeaders(new Headers(), env);
      responseHeaders.set("Content-Type", upstream.headers.get("Content-Type") || "application/json; charset=utf-8");
      responseHeaders.set("Cache-Control", upstream.ok ? cacheControl : "no-store");
      responseHeaders.set("Content-Language", canonicalLocale);
      let body = upstream.body;
      if (upstream.ok && ["/reai/catalog", "/reai/collections"].includes(route)) {
        let store = await upstream.json();
        if (storefront.localizeStorefront) store = storefront.localizeStorefront(store, { ...renderContext, url });
        if (route === "/reai/catalog" && storefront.catalogProductsForRequest) {
          body = JSON.stringify({ ...store, products: catalogProducts(store, url) });
        } else {
          body = JSON.stringify(store);
        }
      }
      return new Response(body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error("Site API request failed", error);
      return jsonResponse({ error: messages.temporarilyUnavailable }, 502, env);
    }
  }

  async function checkoutRateLimited(request, env, url) {
    if (!env.CHECKOUT_RATE_LIMIT) return false;
    const result = await env.CHECKOUT_RATE_LIMIT.limit({ key: `checkout:${url.host}:${request.headers.get("CF-Connecting-IP") || "local"}` });
    return !result.success;
  }

  async function merchantCheckout(request, env, url) {
    if (!merchantCheckoutPath) return null;
    const path = stripPathPrefix(url.pathname, pathPrefix);
    const api = path?.match(/^\/reai\/checkout\/([a-f0-9]{32})(?:\/(delivery-options|prepare-payment|change-country|address-suggestions))?$/);
    const isPage = path === merchantCheckoutPath || path === checkoutReturnPath;
    if (!api && !isPage) return null;
    const headers = securityHeaders(new Headers({ "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" }), env);
    headers.set("Content-Language", canonicalLocale);
    headers.set("Referrer-Policy", "no-referrer");
    try {
      const id = api?.[1] || url.searchParams.get("checkout");
      if (!id || !/^[a-f0-9]{32}$/.test(id)) return isPage ? Response.redirect(new URL("/cart", url.origin).href, 303) : jsonResponse({ error: "Checkout not found." }, 404, env);
      const client = siteClient(env);
      let result;
      if (["GET", "HEAD"].includes(request.method) && !api?.[2]) result = await client.checkoutDetails(id);
      else if (api?.[2] === "address-suggestions" && request.method === "GET") {
        if (request.headers.get("Sec-Fetch-Site") === "cross-site") return jsonResponse({ error: "Invalid request origin." }, 403, env);
        if (await checkoutRateLimited(request, env, url)) return jsonResponse({ error: "Too many checkout requests. Please wait a moment." }, 429, env);
        const query = url.searchParams.get("query") || "";
        if (query.length > 254) return jsonResponse({ error: "Address query too long." }, 400, env);
        result = await client.checkoutAddressSuggestions(id, query, url.searchParams.get("countryCode") || "NO");
      }
      else if (api && ["PATCH", "POST"].includes(request.method)) {
        if (env.CHECKOUT_ENABLED === "false") return jsonResponse({ error: "Checkout is disabled in this preview." }, 403, env);
        if (request.headers.get("Origin") !== url.origin || request.headers.get("Sec-Fetch-Site") === "cross-site") return jsonResponse({ error: "Invalid request origin." }, 403, env);
        if (await checkoutRateLimited(request, env, url)) return jsonResponse({ error: "Too many checkout requests. Please wait a moment." }, 429, env);
        const text = await request.text();
        if (text.length > 8192) return jsonResponse({ error: "Request too large." }, 413, env);
        let body;
        try { body = JSON.parse(text); } catch { return jsonResponse({ error: "Invalid JSON." }, 400, env); }
        if (request.method === "PATCH" && !api[2]) result = await client.updateCheckout(id, body);
        else if (request.method === "POST" && api[2] === "delivery-options") result = await client.checkoutDeliveryOptions(id, body);
        else if (request.method === "POST" && api[2] === "change-country") result = await client.changeCheckoutCountry(id, body, request.headers.get("Idempotency-Key") || crypto.randomUUID());
        else if (request.method === "POST" && api[2] === "prepare-payment") result = await client.prepareCheckoutPayment(id, body);
        else return jsonResponse({ error: "Method not allowed." }, 405, env);
      } else return jsonResponse({ error: "Method not allowed." }, 405, env);
      const upstream = result.response;
      if (!upstream.ok) {
        headers.set("Content-Type", "application/json; charset=utf-8");
        return new Response(request.method === "HEAD" ? null : upstream.body, { status: upstream.status, headers });
      }
      const details = await upstream.json();
      if (details.marketHandle && details.customer?.countryCode) {
        headers.set("X-Reai-Checkout-Market", details.marketHandle);
        headers.set("X-Reai-Checkout-Country", details.customer.countryCode);
      }
      if (!isPage) {
        headers.set("Content-Type", "application/json; charset=utf-8");
        return new Response(request.method === "HEAD" ? null : JSON.stringify(details), { status: upstream.status, headers });
      }
      headers.set("Content-Type", "text/html; charset=utf-8");
      return new Response(request.method === "HEAD" ? null : storefront.renderCheckoutPage(details, { completed: path === checkoutReturnPath, pathPrefix }), { headers });
    } catch {
      return new Response("Checkout is temporarily unavailable. Please refresh to try again.", { status: 503, headers });
    }
  }

  async function renderCommerce(request, env, url, executionContext) {
    const pageContext = { ...renderContext, url };
    const storefrontPath = stripPathPrefix(url.pathname, pathPrefix);
    if (storefrontPath == null) return null;
    const route = storefront.matchRoute(storefrontPath);
    if (!route) return null;
    if (request.method !== "GET" && request.method !== "HEAD") {
      return jsonResponse({ error: messages.methodNotAllowed }, 405, env);
    }
    if (route.needsSlash) {
      return Response.redirect(`${url.origin}${publicPath(route.canonicalPath)}${url.search}`, 301);
    }

    let store;
    let cacheStatus;
    try {
      const cached = await getStorefront(env, executionContext);
      store = cached.store;
      cacheStatus = cached.cacheStatus;
      if (storefront.localizeStorefront) store = storefront.localizeStorefront(store, pageContext);
    } catch (error) {
      console.error("Storefront snapshot failed", error);
      if (route.type === "home") return null;
      if (route.type === "sitemap") return jsonResponse({ error: messages.temporarilyUnavailable }, 502, env);
      return htmlResponse(storefront.renderUnavailablePage(null, pageContext, route.canonicalPath || "/"), env, 502);
    }

    if (route.type === "home") {
      const variants = storefront.homeAvailabilityVariants?.(store, pageContext) || [];
      const availability = variants.length ? await variantAvailability(env, variants) : {};
      const response = htmlResponse(storefront.renderHomePage(store, { ...pageContext, availability }), env);
      if (variants.length) response.headers.set("Cache-Control", "no-store");
      response.headers.set("X-ReAI-Storefront-Cache", cacheStatus);
      return response;
    }
    if (route.type === "sitemap") {
      const response = xmlResponse(storefront.renderSitemap(store, pageContext), env);
      response.headers.set("X-ReAI-Storefront-Cache", cacheStatus);
      return response;
    }

    if (route.type === "page" && typeof storefront.renderPage === "function") {
      const html = storefront.renderPage(store, route.handle, pageContext);
      if (!html) return htmlResponse(storefront.renderNotFoundPage(store, pageContext, route.canonicalPath), env, 404);
      const response = htmlResponse(html, env);
      response.headers.set("X-ReAI-Storefront-Cache", cacheStatus);
      return response;
    }

    if (route.type === "collection") {
      if (!route.valid) return htmlResponse(storefront.renderNotFoundPage(store, pageContext, route.canonicalPath), env, 404);
      if (route.handle !== "all" && !storefront.collectionByHandle(store, route.handle)) {
        try {
          const detail = await siteJson(await siteClient(env).collection(route.handle, deliveryContext));
          store = { ...store, collections: [...store.collections, detail] };
        } catch (error) {
          return htmlResponse(storefront.renderNotFoundPage(store, pageContext, route.canonicalPath), env, error.status === 404 ? 404 : 502);
        }
      }
      const requestedVariants = storefront.collectionAvailabilityVariants?.(store, route.handle, pageContext) || [];
      const availability = requestedVariants.length ? await variantAvailability(env, requestedVariants) : {};
      const response = htmlResponse(
        storefront.renderCollectionPage(store, route.handle, { ...pageContext, availability }), env, 200,
        requestedVariants.length ? "no-store" : "public, max-age=60, stale-while-revalidate=300",
      );
      response.headers.set("X-ReAI-Storefront-Cache", cacheStatus);
      return response;
    }

    if (route.type === "product") {
      if (!route.valid) return htmlResponse(storefront.renderNotFoundPage(store, pageContext, route.canonicalPath), env, 404);
      let product = storefront.productByHandle(store, route.handle);
      if (!product) {
        try {
          product = await siteJson(await siteClient(env).product(route.handle, deliveryContext));
        } catch (error) {
          return htmlResponse(storefront.renderNotFoundPage(store, pageContext, route.canonicalPath), env, error.status === 404 ? 404 : 502);
        }
      }
      const availability = await variantAvailability(env, storefront.productAvailabilityVariants?.(store, product, pageContext) || product.variants);
      const response = htmlResponse(storefront.renderProductPage(store, product, availability, pageContext), env);
      response.headers.set("X-ReAI-Storefront-Cache", cacheStatus);
      return response;
    }

    return null;
  }

  return {
    async fetch(request, env, executionContext) {
      const url = new URL(request.url);
      const earlyResponse = await beforeRequest?.({ request, env, url, renderContext });
      if (earlyResponse) return earlyResponse;
      const checkoutResponse = await merchantCheckout(request, env, url);
      if (checkoutResponse) return checkoutResponse;
      const storefrontPath = stripPathPrefix(url.pathname, pathPrefix);
      if (storefrontPath?.startsWith("/reai/")) return siteApiResponse(request, env, url, executionContext);

      const rendered = await renderCommerce(request, env, url, executionContext);
      if (rendered) {
        if (request.method === "HEAD") return new Response(null, { status: rendered.status, headers: rendered.headers });
        return rendered;
      }

      // Locale-prefixed storefronts share the same static asset bundle. Strip
      // the public locale prefix before asking the Assets binding for a file.
      const assetRequest = storefrontPath !== url.pathname
        ? new Request(new URL(storefrontPath || "/", url.origin), request)
        : request;
      const response = await env.ASSETS.fetch(assetRequest);
      const headers = securityHeaders(new Headers(response.headers), env);
      const localPath = storefrontPath || url.pathname;
      const path = localPath.endsWith("/") ? localPath : `${localPath}/`;
      headers.set("Content-Language", canonicalLocale);
      headers.set(
        "Cache-Control",
        noStorePaths.includes(path)
          ? "no-store"
          : STATIC_ASSET.test(url.pathname)
            ? "public, max-age=3600, stale-while-revalidate=86400"
            : "public, max-age=300, stale-while-revalidate=3600",
      );

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    },
  };
}
