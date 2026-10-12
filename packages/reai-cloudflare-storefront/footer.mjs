const COPY = Object.freeze({
  en: Object.freeze({
    label: "Legal and platform information",
    poweredBy: "Powered by ReAI",
    refund: "Refund policy",
    privacy: "Privacy policy",
    terms: "Terms of service",
  }),
  nb: Object.freeze({
    label: "Juridisk informasjon og plattform",
    poweredBy: "Drevet av ReAI",
    refund: "Retur",
    privacy: "Personvern",
    terms: "Kjøpsvilkår",
  }),
});

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const requiredText = (value, name) => {
  const text = String(value || "").trim();
  if (!text) throw new TypeError(`${name} is required`);
  return text;
};

const requiredHref = (value, name) => {
  const href = requiredText(value, name);
  if (!((href.startsWith("/") && !href.startsWith("//")) || href.startsWith("https://"))) {
    throw new TypeError(`${name} must be a root-relative or HTTPS URL`);
  }
  return href;
};

const language = (locale) => /^(?:nb|no)(?:-|$)/i.test(String(locale || "")) ? "nb" : "en";

export function renderCompactLegalFooter({
  owner,
  refundHref,
  privacyHref,
  termsHref,
  locale = "en",
  year = new Date().getFullYear(),
  className = "",
  labels = {},
  showAttribution = true,
} = {}) {
  const copy = Object.fromEntries(Object.entries({ ...COPY[language(locale)], ...labels })
    .map(([key, value]) => [key, requiredText(value, `labels.${key}`)]));
  const classes = [className, "compact-legal-footer"].filter(Boolean).join(" ");
  const numericYear = Number(year);
  if (!Number.isInteger(numericYear) || numericYear < 2000) throw new TypeError("year must be a valid year");
  const copyright = `© ${numericYear} ${requiredText(owner, "owner")}`;
  const links = [
    ...(showAttribution ? [["https://reai.no", copy.poweredBy, ' rel="external"']] : []),
    [requiredHref(refundHref, "refundHref"), copy.refund, ""],
    [requiredHref(privacyHref, "privacyHref"), copy.privacy, ""],
    [requiredHref(termsHref, "termsHref"), copy.terms, ""],
  ];

  return `<div class="${escapeHtml(classes)}"><span>${escapeHtml(copyright)}</span><nav class="compact-legal-links" aria-label="${escapeHtml(copy.label)}">${links.map(([href, label, attributes]) => `<a href="${escapeHtml(href)}"${attributes}>${escapeHtml(label)}</a>`).join("")}</nav></div>`;
}
