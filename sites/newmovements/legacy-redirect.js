// Retired review links in already-sent emails must keep working. This Worker is
// outside the production request path and has no catalog, checkout or credentials.
export default {
  fetch(request) {
    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response("This preview has moved to https://newmovements.com", {
        status: 410, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
      });
    }
    const source = new URL(request.url);
    const target = new URL("https://newmovements.com");
    target.pathname = source.pathname;
    target.search = source.search;
    return new Response(null, { status: 308, headers: {
      Location: target.href, "Cache-Control": "public, max-age=86400", "X-Robots-Tag": "noindex, nofollow",
    } });
  },
};
