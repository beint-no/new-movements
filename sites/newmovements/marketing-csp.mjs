// @ts-check

// Google Ads sends some hits to the visitor's own Google domain (www.google.<TLD>). CSP has no
// wildcard for the TLD, so list one per delivery country in the ReAI site markets.
export const GOOGLE_COUNTRY_DOMAINS = [
  "no", "se", "dk", "fi", "de", "at", "be", "bg", "ch", "com.cy", "cz", "ee", "es", "fr", "co.uk", "gr",
  "hr", "hu", "ie", "it", "lt", "lu", "lv", "com.mt", "nl", "pl", "pt", "ro", "si", "sk",
].map((tld) => `https://www.google.${tld}`);

const google = "https://www.googletagmanager.com https://www.googleadservices.com https://www.google.com";
const transport = `${google} ${GOOGLE_COUNTRY_DOMAINS.join(" ")} https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com https://ad.doubleclick.net`;

/** @param {string} csp */
export const withMarketingCsp = (csp) => csp
  .replace(/img-src ([^;]+)/, `img-src $1 https://www.facebook.com ${transport}`)
  .replace(/script-src ([^;]+)/, `script-src $1 ${google}`)
  .replace(/frame-src ([^;]+)/, "frame-src $1 https://www.googletagmanager.com")
  + `; connect-src 'self' ${transport}`;
