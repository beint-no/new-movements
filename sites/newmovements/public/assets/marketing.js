const PIXEL_ID = '689458021409484';
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
  // and form fields out of Meta. No third-party script can inspect the checkout.
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
  if (wasGranted && !consent) {
    for (const name of ['_fbp', '_fbc']) {
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
    if (!permitted() || !Number.isFinite(Number(state.total)) || !/^[A-Z]{3}$/.test(state.currency)) return;
    // The checkout ID grants access to customer details; only its SHA-256 digest
    // may leave this browser. The same ID also deduplicates refreshes and retries.
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`nm-purchase:${state.id}`));
    const id = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
    if (!permitted() || purchases.has(id)) return;
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
