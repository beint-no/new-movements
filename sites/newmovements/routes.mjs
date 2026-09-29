const REDIRECTS = new Map([
  ["/collections/all-shoes-1", "/collections/all"],
  ["/collections/all-shoes", "/collections/all"],
  ["/pages/about-us", "/pages/evensen-story"],
  ["/pages/contact", "/pages/contact-us"],
  ["/policies/terms-of-service", "/pages/terms-and-conditions"],
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
  ["/pages/buy-a-gift-card", "/collections/gift-card"],
  ["/pages/store", "/pages/contact-us"],
  ["/pages/store-locator", "/pages/contact-us"],
  ["/pages/video", "/pages/evensen-story"],
  ["/pages/shoe-care", "/pages/materials"],
  ["/pages/guttestreker-oa-studio-at-new-movements", "/blogs/news/afterwork-at-new-movements"],
  ["/blogs/walk-the-talk", "/blogs/news"],
  ["/blogs/lets-go", "/blogs/news"],
  ["/blogs/finansavisen", "/blogs/news"],
  ["/blogs/news/circularity", "/pages/recycle"],
  ["/blogs/news/allrounder", "/collections/allrounder"],
]);

const BRAND_ASSETS = new Map([
  ["/brand-assets/logo.png", "https://newmovements.com/cdn/shop/files/new-movements-logo-oslo-wave-black_8ba4c646-e72d-4ef0-b7b5-1b13c91173f1.png?height=72&v=1669122861"],
  ["/brand-assets/hero-women.jpg", "https://newmovements.com/cdn/shop/files/cloud_boots_brown_full_body_2.jpg?v=1772235076&width=1920"],
  ["/brand-assets/hero-men.jpg", "https://newmovements.com/cdn/shop/files/moss_brown_close_3.jpg?v=1790535895&width=1920"],
  ["/brand-assets/community-center.jpg", "https://newmovements.com/cdn/shop/files/nm-cc-store-01.jpg?height=1200&v=1739536072"],
  ["/brand-assets/instrument-sans-regular.woff2", "https://newmovements.com/cdn/fonts/instrument_sans/instrumentsans_n4.db86542ae5e1596dbdb28c279ae6c2086c4c5bfa.woff2"],
  ["/brand-assets/instrument-sans-medium.woff2", "https://newmovements.com/cdn/fonts/instrument_sans/instrumentsans_n5.1ce463e1cc056566f977610764d93d4704464858.woff2"],
  ["/brand-assets/instrument-sans-italic.woff2", "https://newmovements.com/cdn/fonts/instrument_sans/instrumentsans_i4.028d3c3cd8d085648c808ceb20cd2fd1eb3560e5.woff2"],
]);

export function canonicalPath(pathname) {
  let path = pathname.replace(/\/index\.html$/, "/").replace(/\/$/, "") || "/";
  const scopedProduct = path.match(/^\/collections\/[^/]+\/products\/([^/]+)$/);
  if (scopedProduct) path = `/products/${scopedProduct[1]}`;
  return REDIRECTS.get(path) || path;
}

export function redirectStorefrontRequest({ request, url }) {
  if (!["GET", "HEAD"].includes(request.method) || url.pathname.startsWith("/reai/")) return null;
  const pathname = canonicalPath(url.pathname);
  const hostname = url.hostname === "www.newmovements.com" ? "newmovements.com" : url.hostname;
  if (pathname === url.pathname && hostname === url.hostname) return null;
  const destination = new URL(url.href);
  destination.pathname = pathname;
  destination.hostname = hostname;
  return new Response(null, {
    status: hostname === url.hostname ? 301 : 308,
    headers: { Location: destination.href, "Cache-Control": "public, max-age=3600" },
  });
}

export async function handleStorefrontRequest(context) {
  const { request, env, url } = context;
  const brandAsset = BRAND_ASSETS.get(url.pathname);
  if (brandAsset && ["GET", "HEAD"].includes(request.method)) {
    const upstream = await fetch(brandAsset, { method: request.method, headers: { Accept: request.headers.get("Accept") || "*/*" } });
    if (!upstream.ok) return new Response("Brand asset unavailable.", { status: 502 });
    const headers = new Headers({
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "Content-Type": upstream.headers.get("Content-Type") || "application/octet-stream",
    });
    return new Response(request.method === "HEAD" ? null : upstream.body, { status: 200, headers });
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
