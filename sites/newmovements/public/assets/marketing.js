const PIXEL_ID = '689458021409484';
const GOOGLE_ADS_ID = 'AW-799575406';
const GOOGLE_PURCHASE = `${GOOGLE_ADS_ID}/bPYmCMfdnd0aEO6aov0C`;
const googlePurchases = new Set();
let googleScript;
let googleReady = false;
let googleConfigured = false;
let googleScheduled = false;
const googleQueue = new Map();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const maxAge = 90 * 24 * 60 * 60;
const pendingImages = new Set();
const purchases = new Set();
let consent = false;
let pageSent = false;
let completedCheckout;
let currentCheckout;
let checkoutSent = false;

const permitted = () => consent && ['newmovements.com', 'www.newmovements.com'].includes(location.hostname)
  && navigator.globalPrivacyControl !== true && navigator.doNotTrack !== '1';

function googleTag() {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(arguments);
}

function googleConsent(granted) {
  googleTag('consent', 'update', {ad_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied', ad_personalization: granted ? 'granted' : 'denied',
    analytics_storage: 'denied'});
}

function googlePage() {
  return {page_location: location.origin + location.pathname, page_referrer: '', page_title: 'New Movements'};
}

function startGoogle() {
  googleScheduled = false;
  if (!permitted() || googleScript) return;
  googleTag('consent', 'default', {ad_storage: 'denied', ad_user_data: 'denied',
    ad_personalization: 'denied', analytics_storage: 'denied'});
  googleTag('set', {...googlePage(), ads_data_redaction: true, url_passthrough: false,
    allow_enhanced_conversions: false});
  googleTag('set', 'user_data', null);
  googleScript = document.createElement('script');
  googleScript.async = true;
  googleScript.referrerPolicy = 'no-referrer';
  googleScript.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`;
  googleScript.onload = () => {
    googleReady = true;
    configureGoogle();
  };
  googleScript.onerror = () => {
    googleQueue.clear();
    googleScript.remove();
    googleScript = undefined;
    window.dataLayer = [];
  };
  document.head.append(googleScript);
}

function configureGoogle() {
  if (!permitted() || !googleReady) return;
  googleConsent(true);
  if (!googleConfigured) {
    googleConfigured = true;
    // Google requires a Date object for its initialization command.
    googleTag('js', new Date());
    googleTag('config', GOOGLE_ADS_ID, {...googlePage(), allow_enhanced_conversions: false});
  }
  for (const [id, purchase] of googleQueue) sendGooglePurchase(id, purchase);
  googleQueue.clear();
}

function prepareGoogle() {
  if (!permitted() || googleScript || googleScheduled) return;
  googleScheduled = true;
  const idle = () => {
    if (window.requestIdleCallback) window.requestIdleCallback(startGoogle, {timeout: 1500});
    else setTimeout(startGoogle, 0);
  };
  if (document.readyState === 'complete') idle();
  else window.addEventListener('load', idle, {once: true});
}

function sendGooglePurchase(id, purchase) {
  if (!permitted() || googlePurchases.has(id)) return;
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem('nm-google-purchases') || '[]').filter(item => item.at > Date.now() - maxAge * 1000); } catch { /* Storage is optional. */ }
  if (saved.some(item => item.id === id)) return;
  googlePurchases.add(id);
  googleTag('event', 'conversion', {send_to: GOOGLE_PURCHASE, ...purchase, transaction_id: id, ...googlePage()});
  try { localStorage.setItem('nm-google-purchases', JSON.stringify([...saved.slice(-99), {id, at: Date.now()}])); } catch { /* Storage is optional. */ }
}

function googlePurchase(id, state) {
  if (!permitted()) return;
  const purchase = {value: Number(state.total), currency: state.currency};
  if (googleReady) sendGooglePurchase(id, purchase);
  else if (googleQueue.size < 10) googleQueue.set(id, purchase);
}

function cookie(name) {
  return document.cookie.split('; ').find(part => part.startsWith(`${name}=`))?.slice(name.length + 1);
}

function identifiers() {
  let fbp = cookie('_fbp');
  if (!/^fb\.1\.\d{13}\.\d+$/.test(fbp || '')) {
    fbp = `fb.1.${Date.now()}.${crypto.getRandomValues(new Uint32Array(1))[0]}`;
    document.cookie = `_fbp=${fbp}; Path=/; Domain=newmovements.com; Max-Age=${maxAge}; SameSite=Lax; Secure`;
  }
  const click = new URL(location.href).searchParams.get('fbclid');
  if (click && /^[A-Za-z0-9_-]{1,500}$/.test(click)) {
    document.cookie = `_fbc=fb.1.${Date.now()}.${click}; Path=/; Domain=newmovements.com; Max-Age=${maxAge}; SameSite=Lax; Secure`;
  }
  const fbc = cookie('_fbc');
  return {fbp, ...(/^fb\.1\.\d{13}\.[A-Za-z0-9_-]{1,500}$/.test(fbc || '') ? {fbc} : {})};
}

function send(event, data = {}, eventId = crypto.randomUUID()) {
  if (!permitted()) return false;
  // Explicit image beacons keep checkout bearer tokens, search queries, referrers
  // and form fields out of Meta without loading its SDK into the checkout.
  const params = new URLSearchParams({id: PIXEL_ID, ev: event, dl: location.origin + location.pathname,
    noscript: '1', eid: eventId, ...identifiers()});
  for (const [key, value] of Object.entries(data)) params.set(`cd[${key}]`, typeof value === 'object' ? JSON.stringify(value) : String(value));
  const image = new Image(1, 1);
  image.referrerPolicy = 'no-referrer';
  pendingImages.add(image);
  const release = () => pendingImages.delete(image);
  image.onload = image.onerror = release;
  image.src = `https://www.facebook.com/tr/?${params}`;
  setTimeout(release, 30000);
  return true;
}

function currentPage() {
  if (!permitted()) return;
  if (!pageSent) {
    pageSent = true;
    send('PageView');
    const product = document.querySelector('[data-add-to-cart]');
    if (product && uuid.test(product.dataset.id || '')) {
      const variants = document.querySelector('[data-product-variant]')?.options;
      const single = variants?.length === 1 && uuid.test(variants[0].value);
      send('ViewContent', {content_ids: [single ? variants[0].value : product.dataset.id], content_type: single ? 'product' : 'product_group'});
    }
  }
  if (currentCheckout) trackCheckout(currentCheckout);
  if (completedCheckout) void trackPurchase(completedCheckout);
}

export function setMarketingConsent(granted) {
  const wasGranted = consent;
  consent = granted === true;
  if (!permitted()) {
    googleQueue.clear();
    if (googleScript) googleConsent(false);
  } else {
    configureGoogle();
    prepareGoogle();
  }
  if (wasGranted && !consent) {
    for (const name of ['_fbp', '_fbc', ...document.cookie.split('; ').map(part => part.split('=')[0]).filter(name => name.startsWith('_gcl_'))]) {
      for (const domain of ['', '; Domain=newmovements.com', '; Domain=www.newmovements.com']) {
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax; Secure${domain}`;
      }
    }
  }
  try { currentPage(); } catch { /* Marketing must never interrupt shopping. */ }
}

export function trackCartAddition(item, quantity) {
  try {
    if (!uuid.test(item.variant || '') || !(quantity > 0)) return;
    const data = {content_ids: [item.variant], content_type: 'product', contents: [{id: item.variant, quantity}]};
    if (Number.isFinite(item.price) && item.price >= 0 && /^[A-Z]{3}$/.test(item.currency || '')) Object.assign(data, {value: item.price * quantity, currency: item.currency});
    send('AddToCart', data);
  } catch { /* Marketing must never interrupt cart updates. */ }
}

export function trackCheckout(state) {
  try {
    currentCheckout = state;
    if (state.phase !== 'details') return;
    if (permitted() && !checkoutSent) checkoutSent = send('InitiateCheckout', checkoutData(state));
  } catch { /* Marketing must never interrupt checkout. */ }
}

function checkoutData(state) {
  const contents = state.lines.filter(line => uuid.test(line.variantId) && Number.isInteger(line.quantity) && line.quantity > 0)
    .map(line => ({id: line.variantId, quantity: line.quantity}));
  return {content_ids: contents.map(line => line.id), content_type: 'product', contents,
    num_items: contents.reduce((sum, line) => sum + line.quantity, 0), value: Number(state.total), currency: state.currency};
}

export async function trackPurchase(state) {
  try {
    if (state.phase !== 'complete') return;
    completedCheckout = state;
    if (!permitted() || typeof state.id !== 'string' || !state.id || !Number.isFinite(Number(state.total))
      || Number(state.total) < 0 || !/^[A-Z]{3}$/.test(state.currency)) return;
    // The checkout ID grants access to customer details; only its SHA-256 digest
    // may leave this browser. The same ID also deduplicates refreshes and retries.
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`nm-purchase:${state.id}`));
    const id = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    if (!permitted()) return;
    googlePurchase(id, state);
    if (purchases.has(id)) return;
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem('nm-meta-purchases') || '[]').filter(item => item.at > Date.now() - maxAge * 1000); } catch { /* Storage is optional. */ }
    if (saved.some(item => item.id === id)) return;
    if (send('Purchase', checkoutData(state), id)) {
      purchases.add(id);
      try { localStorage.setItem('nm-meta-purchases', JSON.stringify([...saved.slice(-99), {id, at: Date.now()}])); } catch { /* Storage is optional. */ }
    }
  } catch { /* Marketing must never interrupt order confirmation. */ }
}

window.newMovementsMarketing = Object.freeze({setConsent: setMarketingConsent});
window.addEventListener('nm:marketing-consent', event => setMarketingConsent(event.detail?.granted));
for (const event of ['CookiebotOnConsentReady', 'CookiebotOnAccept', 'CookiebotOnDecline']) {
  window.addEventListener(event, () => setMarketingConsent(window.Cookiebot?.consent?.marketing));
}
setMarketingConsent(window.Cookiebot?.consent?.marketing ?? window.nmMarketingConsent);
