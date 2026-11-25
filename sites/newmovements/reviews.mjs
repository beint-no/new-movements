// Editorial snapshot of the four newest Google reviews that include written text.
// Source: Google Business Profile reviews sorted by newest, checked 2026-11-25. Rating-only
// reviews are skipped. Google shows review age only in weeks, so `date` is the year and month.
// Excerpts stay in the language they were written in.
// Refresh this file manually; the storefront never calls a review service.
export const GOOGLE_REVIEWS_URL = "https://search.google.com/local/reviews?placeid=ChIJAbMhE79tQUYR8i1ALv9joyk";
export const GOOGLE_REVIEW_COUNT = 69;
export const FEATURED_REVIEWS = [
  {
    name: "Øyvind Alseth", date: "2026-11",
    excerpt: "Gode sko, god service!",
  },
  {
    name: "Grant Gebetsberger", date: "2026-08",
    excerpt: "We had an excellent shopping experience at New Movements! The founder was in-store and told us all about…",
  },
  {
    name: "Pieter van der Werf", date: "2026-08",
    excerpt: "Wat een fantastisch fijne plek om geholpen te worden. Martin was toevallig in de winkel en als eigenaar…",
  },
  {
    name: "Antonio Kaelin", date: "2026-08",
    excerpt: "Var innom her for å se på sko og fikk en fantastisk service av personalet. Har hatt New Movements…",
  },
];
