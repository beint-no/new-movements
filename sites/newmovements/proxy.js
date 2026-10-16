// Keep the Free-plan domain Worker below its 10 ms CPU limit. Rendering and API
// integration run in the existing paid account, retaining the shopper's origin.
export default {
  async fetch(request, env) {
    const original = new URL(request.url);
    if (!["newmovements.com", "www.newmovements.com"].includes(original.hostname)) {
      return new Response("Not found", { status: 404 });
    }
    if (!env.STOREFRONT_PROXY_TOKEN) return new Response("Temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
    const target = new URL(env.STOREFRONT_RUNTIME_URL);
    target.pathname = original.pathname;
    target.search = original.search;
    const headers = new Headers(request.headers);
    headers.set("X-ReAI-Storefront-Origin", `https://${original.hostname}`);
    headers.set("X-ReAI-Storefront-Token", env.STOREFRONT_PROXY_TOKEN);
    headers.set("X-ReAI-Storefront-Country", request.cf?.country || request.headers.get("CF-IPCountry") || "");
    headers.set("X-ReAI-Storefront-Client-IP", request.headers.get("CF-Connecting-IP") || "");
    headers.delete("Host");
    const response = await fetch(new Request(target, new Request(request, { headers, redirect: "manual" })));
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: response.headers });
  },
};
