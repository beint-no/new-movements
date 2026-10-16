const REDIRECTS = new Map([
  ["/collections/new-arrivals", "/collections/new-in"],
  ["/collections/shoe-care-1", "/collections/shoe-care"],
  ["/collections/accessories", "/collections/shoe-care"],
  ["/collections/archive", "/collections/all"],
  ["/collections/home", "/collections/all"],
  ["/collections/all-shoes-1", "/collections/all"],
  ["/collections/all-shoes", "/collections/all"],
  ["/pages/about-us", "/pages/evensen-story"],
  ["/pages/contact", "/pages/contact-us"],
  ["/policies/terms-of-service", "/pages/terms-and-conditions"],
  ["/policies/legal-notice", "/pages/contact-us"],
  ["/policies/contact-information", "/pages/contact-us"],
  ["/pages/production", "/pages/materials"],
  ["/pages/privacy-policy", "/policies/privacy-policy"],
  ["/pages/size-chart", "/pages/size-guide"],
  ["/pages/size-chart-1", "/pages/size-guide"],
  ["/pages/size-chart-2", "/pages/size-guide"],
  ["/pages/size-chart-3", "/pages/size-guide"],
  ["/pages/size-guide-original-allrounder-y-ns-zen", "/pages/size-guide"],
  ["/pages/size-guide-flow-cloud-boots", "/pages/size-guide"],
  ["/pages/size-guide-moss", "/pages/size-guide"],
  ["/pages/size-guide-loafers", "/pages/size-guide"],
  ["/pages/terms-conditions", "/pages/terms-and-conditions"],
  ["/pages/returns-exchanges", "/pages/returns"],
  ["/pages/why-we-exist", "/pages/our-philosophy"],
  ["/pages/buy-a-gift-card", "/pages/gift-cards"],
  ["/collections/gift-card", "/pages/gift-cards"],
  ["/products/gift-card", "/pages/gift-cards"],
  ["/pages/store", "/pages/contact-us"],
  ["/pages/store-locator", "/pages/contact-us"],
  ["/pages/video", "/pages/evensen-story"],
  ["/pages/guttestreker-oa-studio-at-new-movements", "/pages/join"],
  ["/blogs/walk-the-talk", "/blogs/news"],
  ["/blogs/walk-the-talk/new-movements-sneakers-and-fashion", "/blogs/news/new-movements-sneakers-and-fashion"],
  ["/blogs/lets-go", "/blogs/news"],
  ["/blogs/finansavisen", "/blogs/news"],
]);

export function canonicalPath(pathname) {
  let path = pathname.replace(/\/index\.html$/, "/").replace(/\/$/, "") || "/";
  const scopedProduct = path.match(/^\/collections\/[^/]+\/products\/([^/]+)$/);
  if (scopedProduct) path = `/products/${scopedProduct[1]}`;
  return REDIRECTS.get(path) || path;
}

export function redirectStorefrontRequest({ request, url }) {
  if (!["GET", "HEAD"].includes(request.method) || url.pathname.startsWith("/reai/")) return null;
  const localePrefix = url.pathname === "/nb" || url.pathname.startsWith("/nb/") ? "/nb" : "";
  const localePath = localePrefix ? (url.pathname.slice(localePrefix.length) || "/") : url.pathname;
  const pathname = canonicalPath(localePath);
  const hostname = url.hostname === "www.newmovements.com" ? "newmovements.com" : url.hostname;
  if (`${localePrefix}${pathname === "/" ? "/" : pathname}` === url.pathname && hostname === url.hostname) return null;
  const destination = new URL(url.href);
  destination.pathname = `${localePrefix}${pathname === "/" ? "/" : pathname}`;
  const sizeGuideStyles = {
    '/pages/size-guide-original-allrounder-y-ns-zen': 'sneakers',
    '/pages/size-guide-flow-cloud-boots': 'boots',
    '/pages/size-guide-moss': 'boots',
    '/pages/size-guide-loafers': 'loafers',
  };
  if (sizeGuideStyles[localePath] && !destination.searchParams.has('style')) destination.searchParams.set('style', sizeGuideStyles[localePath]);
  destination.hostname = hostname;
  return new Response(null, {
    status: hostname === url.hostname ? 301 : 308,
    headers: { Location: destination.href, "Cache-Control": "public, max-age=3600" },
  });
}

export async function handleStorefrontRequest(context) {
  const { request, env, url } = context;
  let forwardedScheme = request.headers.get("X-Forwarded-Proto");
  if (!forwardedScheme) {
    try {
      forwardedScheme = JSON.parse(request.headers.get("CF-Visitor") || "{}").scheme;
    } catch {
      forwardedScheme = null;
    }
  }
  if ((url.protocol === "http:" || forwardedScheme === "http") && !url.pathname.startsWith("/reai/")) {
    const destination = new URL(url.href);
    destination.protocol = "https:";
    return new Response(null, { status: 308, headers: { Location: destination.href, "Cache-Control": "public, max-age=3600" } });
  }
  if (url.pathname !== "/newsletter" || request.method !== "POST") return redirectStorefrontRequest(context);
  const email = String((await request.json().catch(() => ({})))?.email || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (!env.NEWSLETTER_WEBHOOK_URL) {
    return Response.json({ error: "Newsletter signup is not configured yet." }, { status: 503 });
  }
  let endpoint;
  try { endpoint = new URL(env.NEWSLETTER_WEBHOOK_URL); } catch { return Response.json({ error: "Newsletter signup is not configured correctly." }, { status: 503 }); }
  if (endpoint.protocol !== "https:") return Response.json({ error: "Newsletter signup requires a secure endpoint." }, { status: 503 });
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (env.NEWSLETTER_WEBHOOK_TOKEN) headers.Authorization = `Bearer ${env.NEWSLETTER_WEBHOOK_TOKEN}`;
  const response = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify({ email, source: "newmovements-storefront" }) });
  if (!response.ok) return Response.json({ error: "We could not complete your signup. Please try again." }, { status: 502 });
  return Response.json({ ok: true });
}
