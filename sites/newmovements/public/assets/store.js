const CART_KEY = 'newmovements-cart-v1';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const readCart = () => {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
};
const writeCart = (items) => {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCount();
  renderDrawerCart();
};
const updateCount = () => {
  const count = readCart().reduce((total, item) => total + Number(item.quantity || 0), 0);
  document.querySelectorAll('[data-cart-count]').forEach((node) => { node.textContent = String(count); });
};
const money = (value, currency = 'NOK') => new Intl.NumberFormat('en-NO', {
  style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: Number(value) % 1 ? 2 : 0,
}).format(Number(value));
const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
if (!document.querySelector('[data-drawer-backdrop]')) {
  document.querySelector('.site-header')?.insertAdjacentHTML('afterend', '<div class="drawer-backdrop" data-drawer-backdrop hidden></div><aside class="store-drawer search-drawer" aria-label="Search" aria-hidden="true" data-search-drawer><header><h2>Search</h2><button type="button" data-drawer-close>Close</button></header><form role="search" data-predictive-search><label class="sr-only" for="predictive-query">Search products</label><input id="predictive-query" name="q" type="search" autocomplete="off" placeholder="Search shoes, styles, materials"><button type="submit">View all</button></form><p data-predictive-status>Start typing to search the live catalog.</p><div class="predictive-results" data-predictive-results></div></aside><aside class="store-drawer cart-drawer" aria-label="Shopping bag" aria-hidden="true" data-cart-drawer><header><h2>Your bag</h2><button type="button" data-drawer-close>Close</button></header><div data-drawer-cart-items></div><footer><p><span>Subtotal</span><strong data-drawer-subtotal>NOK 0</strong></p><a href="/cart">View bag</a></footer></aside>');
}
const showToast = (message) => {
  const toast = document.querySelector('[data-cart-toast]');
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { toast.hidden = true; }, 2600);
};

const menuButton = document.querySelector('[data-menu-toggle], .menu-toggle');
const mobileNav = document.querySelector('[data-mobile-nav]');
const setMenu = (open) => {
  menuButton?.setAttribute('aria-expanded', String(open));
  mobileNav?.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
};
menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
mobileNav?.addEventListener('click', (event) => { if (event.target.closest('a')) setMenu(false); });

const megaToggle = document.querySelector('[data-mega-toggle]');
const megaMenu = document.querySelector('[data-mega-menu]');
const setMegaMenu = (open) => {
  if (!megaToggle || !megaMenu) return;
  megaToggle.setAttribute('aria-expanded', String(open));
  megaMenu.hidden = !open;
};
megaToggle?.addEventListener('click', () => setMegaMenu(megaToggle.getAttribute('aria-expanded') !== 'true'));

const backdrop = document.querySelector('[data-drawer-backdrop]');
const searchDrawer = document.querySelector('[data-search-drawer]');
const cartDrawer = document.querySelector('[data-cart-drawer]');
let drawerOpener = null;
const closeDrawers = () => {
  [searchDrawer, cartDrawer].forEach((drawer) => drawer?.setAttribute('aria-hidden', 'true'));
  if (backdrop) backdrop.hidden = true;
  document.body.classList.remove('drawer-open');
  drawerOpener?.focus();
  drawerOpener = null;
};
const openDrawer = (drawer, opener) => {
  [searchDrawer, cartDrawer].forEach((item) => item?.setAttribute('aria-hidden', 'true'));
  drawerOpener = opener;
  drawer?.setAttribute('aria-hidden', 'false');
  if (backdrop) backdrop.hidden = false;
  document.body.classList.add('drawer-open');
  drawer?.querySelector('input,button,a')?.focus();
};
document.querySelectorAll('[data-search-open], .utility-nav a[href="/search"]').forEach((button) => button.addEventListener('click', (event) => { event.preventDefault(); openDrawer(searchDrawer, button); }));
document.querySelectorAll('[data-cart-open], .utility-nav a[href="/cart"], .site-nav>a[href="/cart"]').forEach((button) => button.addEventListener('click', (event) => { event.preventDefault(); renderDrawerCart(); openDrawer(cartDrawer, button); }));
document.querySelectorAll('[data-drawer-close]').forEach((button) => button.addEventListener('click', closeDrawers));
backdrop?.addEventListener('click', closeDrawers);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { setMenu(false); setMegaMenu(false); closeDrawers(); }
});

function renderDrawerCart() {
  const list = document.querySelector('[data-drawer-cart-items]');
  const subtotal = document.querySelector('[data-drawer-subtotal]');
  if (!list) return;
  const items = readCart();
  list.innerHTML = items.length ? items.map((item, index) => `<article class="drawer-cart-line" data-drawer-cart-index="${index}">${item.image ? `<img src="${escapeHtml(item.image)}" alt="">` : '<div class="drawer-cart-placeholder"></div>'}<div><a href="/products/${escapeHtml(item.handle)}">${escapeHtml(item.title)}</a><span>${item.quantity} × ${money(item.price)}</span><button type="button" data-drawer-remove>Remove</button></div></article>`).join('') : '<div class="drawer-empty"><p>Your bag is empty.</p><a href="/collections/all">Continue shopping</a></div>';
  if (subtotal) subtotal.textContent = money(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
}
cartDrawer?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-drawer-remove]');
  if (!button) return;
  const index = Number(button.closest('[data-drawer-cart-index]')?.dataset.drawerCartIndex);
  const items = readCart();
  items.splice(index, 1);
  writeCart(items);
  renderCart();
});

const variant = document.querySelector('[data-product-variant]');
const add = document.querySelector('[data-add-to-cart]');
const productPrice = document.querySelector('[data-product-price]');
const syncVariant = () => {
  if (!variant || !add) return;
  const option = variant.selectedOptions[0];
  add.dataset.variant = option?.value || '';
  add.dataset.price = option?.dataset.price || '';
  add.disabled = option?.dataset.available !== 'true' || !UUID.test(add.dataset.variant);
  add.textContent = add.disabled ? 'Sold out' : 'Add to bag';
  if (productPrice && add.dataset.price) productPrice.textContent = money(add.dataset.price);
};
variant?.addEventListener('change', syncVariant);
syncVariant();

add?.addEventListener('click', () => {
  if (!UUID.test(add.dataset.variant || '')) return;
  const items = readCart();
  const quantity = Math.max(1, Math.min(20, Number(document.querySelector('[data-quantity]')?.value || 1)));
  const existing = items.find((item) => item.variant === add.dataset.variant);
  if (existing) existing.quantity = Math.min(20, existing.quantity + quantity);
  else items.push({
    id: add.dataset.id, variant: add.dataset.variant, handle: add.dataset.handle,
    title: add.dataset.title, image: add.dataset.image, price: Number(add.dataset.price), quantity,
  });
  writeCart(items);
  showToast(`${quantity} × ${add.dataset.title} added to your bag.`);
});

document.querySelector('.product-thumbs')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-gallery-url]');
  const current = document.querySelector('[data-gallery-main] img');
  if (!button || !current) return;
  current.src = button.dataset.galleryUrl;
  current.srcset = button.dataset.gallerySrcset || '';
  current.alt = button.dataset.galleryAlt || add?.dataset.title || '';
  document.querySelectorAll('[data-gallery-url]').forEach((item) => item.setAttribute('aria-current', String(item === button)));
});

const cartRoot = document.querySelector('[data-cart-root]');
const checkout = document.querySelector('[data-checkout-start]');
const checkoutError = document.querySelector('[data-checkout-error]');
const renderCart = () => {
  if (!cartRoot) return;
  const items = readCart();
  const list = cartRoot.querySelector('[data-cart-items]');
  const subtotal = cartRoot.querySelector('[data-cart-subtotal]');
  if (!items.length) {
    list.innerHTML = '<div class="message-page"><h2>Your bag is empty</h2><p><a href="/collections/all">Continue shopping</a></p></div>';
  } else {
    list.innerHTML = items.map((item, index) => `<article class="cart-line" data-cart-index="${index}">${item.image ? `<img src="${escapeHtml(item.image)}" alt="">` : '<div></div>'}<div><h2><a href="/products/${escapeHtml(item.handle)}">${escapeHtml(item.title)}</a></h2><p>${money(item.price)}</p><label>Qty <input type="number" min="1" max="20" value="${item.quantity}" data-cart-quantity></label><button type="button" data-cart-remove>Remove</button></div><strong>${money(item.price * item.quantity)}</strong></article>`).join('');
  }
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (subtotal) subtotal.textContent = money(total);
  if (checkout) checkout.disabled = !items.length;
};
cartRoot?.addEventListener('change', (event) => {
  const input = event.target.closest('[data-cart-quantity]');
  if (!input) return;
  const index = Number(input.closest('[data-cart-index]')?.dataset.cartIndex);
  const items = readCart();
  if (items[index]) items[index].quantity = Math.max(1, Math.min(20, Number(input.value || 1)));
  writeCart(items); renderCart();
});
cartRoot?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-cart-remove]');
  if (!button) return;
  const index = Number(button.closest('[data-cart-index]')?.dataset.cartIndex);
  const items = readCart(); items.splice(index, 1); writeCart(items); renderCart();
});

checkout?.addEventListener('click', async () => {
  const lines = readCart().filter((item) => UUID.test(item.variant) && item.quantity > 0).map((item) => ({ variantId: item.variant, quantity: item.quantity }));
  if (!lines.length) return;
  checkout.disabled = true; checkout.textContent = 'Opening secure checkout…';
  if (checkoutError) checkoutError.hidden = true;
  try {
    const response = await fetch('/reai/checkout/start', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ lines }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.checkoutUrl) throw new Error(payload.detail || payload.error || 'Checkout could not be started.');
    location.assign(payload.checkoutUrl);
  } catch (error) {
    if (checkoutError) { checkoutError.textContent = error.message; checkoutError.hidden = false; }
    checkout.disabled = false; checkout.textContent = 'Secure checkout';
  }
});

const searchForm = document.querySelector('[data-search-form]');
const searchResults = document.querySelector('[data-search-results]');
const searchStatus = document.querySelector('[data-search-status]');
let catalogPromise;
const getCatalog = () => catalogPromise ||= fetch('/reai/catalog').then((response) => {
  if (!response.ok) throw new Error('Catalog unavailable');
  return response.json();
});
const catalogMatches = (store, query) => {
  const needle = query.toLowerCase();
  return (store.products || []).filter((item) => `${item.title} ${item.brand || ''} ${item.description || ''} ${(item.variants || []).flatMap((entry) => entry.options || []).map((entry) => entry.value).join(' ')}`.toLowerCase().includes(needle));
};
const renderSearch = async (query) => {
  if (!searchResults || !searchStatus) return;
  searchStatus.textContent = query ? 'Searching…' : 'Enter a product name, style or material.';
  searchResults.innerHTML = '';
  if (!query) return;
  try {
    const store = await getCatalog();
    const products = catalogMatches(store, query);
    searchStatus.textContent = `${products.length} result${products.length === 1 ? '' : 's'} for “${query}”`;
    searchResults.innerHTML = products.map((item) => `<article class="product-card"><a class="product-media" href="/products/${escapeHtml(item.handle)}">${item.images?.[0]?.url ? `<img src="${escapeHtml(item.images[0].url)}" alt="${escapeHtml(item.images[0].alt || item.title)}" width="${Number(item.images[0].width) || 800}" height="${Number(item.images[0].height) || 1000}" loading="lazy">` : ''}</a><div class="product-card-copy"><h3><a href="/products/${escapeHtml(item.handle)}">${escapeHtml(item.title)}</a></h3><p>${money(Math.min(...item.variants.map((entry) => Number(entry.price))), store.currency || 'NOK')}</p></div></article>`).join('');
  } catch { searchStatus.textContent = 'The live catalog is temporarily unavailable.'; }
};
searchForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = new FormData(searchForm).get('q')?.toString().trim() || '';
  history.replaceState(null, '', query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  renderSearch(query);
});
if (searchForm) {
  const query = new URLSearchParams(location.search).get('q') || '';
  searchForm.elements.q.value = query;
  renderSearch(query);
}

const predictiveForm = document.querySelector('[data-predictive-search]');
const predictiveInput = predictiveForm?.querySelector('input[name="q"]');
const predictiveResults = document.querySelector('[data-predictive-results]');
const predictiveStatus = document.querySelector('[data-predictive-status]');
let predictiveSequence = 0;
const renderPredictiveSearch = async () => {
  const sequence = ++predictiveSequence;
  const query = predictiveInput?.value.trim() || '';
  if (!query) {
    if (predictiveStatus) predictiveStatus.textContent = 'Start typing to search the live catalog.';
    if (predictiveResults) predictiveResults.innerHTML = '';
    return;
  }
  if (predictiveStatus) predictiveStatus.textContent = 'Searching…';
  try {
    const store = await getCatalog();
    if (sequence !== predictiveSequence) return;
    const products = catalogMatches(store, query).slice(0, 6);
    if (predictiveStatus) predictiveStatus.textContent = products.length ? `${products.length} suggested product${products.length === 1 ? '' : 's'}` : `No results for “${query}”`;
    if (predictiveResults) predictiveResults.innerHTML = products.map((item) => `<a class="predictive-item" href="/products/${escapeHtml(item.handle)}">${item.images?.[0]?.url ? `<img src="${escapeHtml(item.images[0].url)}" alt="" width="80" height="100">` : '<span></span>'}<b>${escapeHtml(item.title)}</b><small>${money(Math.min(...item.variants.map((entry) => Number(entry.price))), store.currency || 'NOK')}</small></a>`).join('');
  } catch {
    if (predictiveStatus) predictiveStatus.textContent = 'The live catalog is temporarily unavailable.';
  }
};
predictiveInput?.addEventListener('input', renderPredictiveSearch);
predictiveForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = predictiveInput?.value.trim() || '';
  if (query) location.assign(`/search?q=${encodeURIComponent(query)}`);
});

document.querySelector('[data-order-complete]') && localStorage.removeItem(CART_KEY);
document.querySelector('[data-newsletter]')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const email = form.querySelector('input[type="email"]')?.value.trim() || '';
  const status = event.currentTarget.querySelector('[data-newsletter-status]');
  if (status) status.textContent = 'Signing up…';
  try {
    const response = await fetch('/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'Newsletter signup failed.');
    if (status) status.textContent = 'Thank you — you are on the list.';
    form.reset();
  } catch (error) {
    if (status) status.textContent = error.message;
  }
});

const collectionGrid = document.querySelector('[data-collection-grid] .product-grid');
const featuredCards = collectionGrid ? [...collectionGrid.querySelectorAll('.product-card')] : [];
document.querySelector('[data-sort]')?.addEventListener('change', (event) => {
  if (!collectionGrid) return;
  const cards = [...featuredCards];
  const direction = event.target.value;
  if (direction === 'az') cards.sort((a, b) => a.dataset.productTitle.localeCompare(b.dataset.productTitle));
  if (direction === 'price-asc') cards.sort((a, b) => Number(a.dataset.productPrice) - Number(b.dataset.productPrice));
  if (direction === 'price-desc') cards.sort((a, b) => Number(b.dataset.productPrice) - Number(a.dataset.productPrice));
  cards.forEach((card) => collectionGrid.append(card));
});

const filters = document.querySelector('[data-filters]');
const applyFilters = () => {
  if (!filters || !collectionGrid) return;
  const active = [...filters.querySelectorAll('[data-facet]:checked')];
  const maximumPrice = Number(filters.querySelector('[data-price-filter]')?.value || Infinity);
  const byFacet = Map.groupBy(active, (input) => input.dataset.facet);
  let visible = 0;
  featuredCards.forEach((card) => {
    const haystack = `${card.dataset.productSearch || ''} ${card.dataset.productOptions || ''}`;
    const matchesFacets = [...byFacet].every(([facet, inputs]) => inputs.some((input) => {
      if (facet === 'product type') return card.dataset.productType === input.value;
      return haystack.includes(input.value);
    }));
    const shown = matchesFacets && Number(card.dataset.productPrice) <= maximumPrice;
    card.hidden = !shown;
    if (shown) visible += 1;
  });
  const count = document.querySelector('[data-filter-count]');
  const empty = document.querySelector('[data-filter-empty]');
  if (count) count.textContent = String(visible);
  if (empty) empty.hidden = visible !== 0;
  const output = filters.querySelector('[data-price-output]');
  if (output && Number.isFinite(maximumPrice)) output.textContent = money(maximumPrice);
};
filters?.addEventListener('input', applyFilters);
filters?.querySelector('[data-clear-filters]')?.addEventListener('click', () => {
  filters.querySelectorAll('[data-facet]').forEach((input) => { input.checked = false; });
  const range = filters.querySelector('[data-price-filter]');
  if (range) range.value = range.max;
  applyFilters();
});
document.querySelector('[data-mobile-filter]')?.addEventListener('click', () => filters?.classList.toggle('is-open'));
filters?.querySelector('[data-close-filters]')?.addEventListener('click', () => filters.classList.remove('is-open'));
updateCount();
renderCart();
renderDrawerCart();
