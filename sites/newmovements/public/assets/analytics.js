let session;
const pathPrefix = document.body?.dataset.pathPrefix || '';
const sitePath = (path) => `${pathPrefix}${path === '/' ? '/' : path}`;
let timer;
let inFlight = false;
const queue = [];
const kinds = new Set(['page_view', 'product_view', 'add_to_cart', 'remove_from_cart', 'checkout_view']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const enabled = () => navigator.globalPrivacyControl !== true && navigator.doNotTrack !== '1';

function sessionId() {
  if (session) return session;
  session = crypto.randomUUID();
  try {
    const saved = JSON.parse(sessionStorage.getItem('nm-analytics-session') || 'null');
    if (saved && uuid.test(saved.id) && Date.now() - saved.at < 30 * 60 * 1000 && saved.at <= Date.now()) session = saved.id;
    sessionStorage.setItem('nm-analytics-session', JSON.stringify({id: session, at: Date.now()}));
  } catch { /* Storage is optional; tracking must never block shopping. */ }
  return session;
}

function schedule(delay = 5000) {
  if (timer || inFlight || !queue.length || document.readyState !== 'complete' || document.visibilityState === 'hidden' || navigator.onLine === false) return;
  timer = setTimeout(() => {
    timer = undefined;
    if (typeof requestIdleCallback === 'function') requestIdleCallback(() => void flush(), {timeout: 2000});
    else void flush();
  }, delay);
}

async function flush() {
  clearTimeout(timer);
  timer = undefined;
  if (!enabled()) { queue.length = 0; return; }
  if (inFlight || !queue.length || navigator.onLine === false) return;
  inFlight = true;
  const batch = queue.splice(0, 25);
  batch.forEach(item => item.attempts++);
  let retry = false;
  try {
    const response = await fetch(sitePath('/reai/analytics/events'), {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({events: batch.map(item => item.event)}), keepalive: true,
    });
    retry = response.status >= 500;
  } catch { retry = true; }
  finally {
    inFlight = false;
    // Retry transient failures once, retaining UUIDs for server deduplication.
    if (retry && enabled()) queue.unshift(...batch.filter(item => item.attempts < 2));
    queue.splice(25);
    schedule(retry ? 15000 : 5000);
  }
}

export function track(kind, details = {}) {
  // Analytics is best-effort and must not interrupt cart or checkout code.
  try {
    if (!enabled() || !kinds.has(kind)) return;
    const event = {id: crypto.randomUUID(), sessionId: sessionId(), kind, path: location.pathname};
    if (uuid.test(details.productId)) event.productId = details.productId;
    if (uuid.test(details.variantId)) event.variantId = details.variantId;
    if (Number.isFinite(details.quantity)) event.quantity = Math.min(100, Math.max(1, Math.trunc(details.quantity)));
    queue.push({event, attempts: 0});
    queue.splice(25);
    schedule();
  } catch { /* Unsupported browser APIs must not affect the storefront. */ }
}

track('page_view');
if (location.pathname.replace(new RegExp(`^${pathPrefix}(?=\\/)`), '') === '/checkout') track('checkout_view');
window.addEventListener('load', () => schedule(), {once: true});
window.addEventListener('online', () => schedule());
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') void flush();
  else schedule();
});
window.addEventListener('pagehide', () => void flush());
