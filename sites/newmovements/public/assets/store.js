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
  document.querySelectorAll('[data-cart-count]').forEach((node) => {
    node.textContent = String(count);
    node.hidden = count === 0;
  });
};
const money = (value, currency = 'NOK') => new Intl.NumberFormat('en-NO', {
  style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: Number(value) % 1 ? 2 : 0,
}).format(Number(value));
const plainMoney = (value) => new Intl.NumberFormat('nb-NO', { maximumFractionDigits: Number(value) % 1 ? 2 : 0 }).format(Number(value));
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
const addCartItem = (product, variant, quantity = 1) => {
  if (!UUID.test(variant?.id || '')) return false;
  const items = readCart();
  const safeQuantity = Math.max(1, Math.min(20, Number(quantity || 1)));
  const existing = items.find((item) => item.variant === variant.id);
  if (existing) existing.quantity = Math.min(20, existing.quantity + safeQuantity);
  else items.push({
    id: product.id,
    variant: variant.id,
    handle: product.handle,
    title: product.title,
    url: product.url || `/products/${product.handle}`,
    label: variant.label || '',
    image: product.image || '',
    price: Number(variant.price),
    quantity: safeQuantity,
  });
  writeCart(items);
  showToast(`${safeQuantity} × ${product.title} added to your bag.`);
  return true;
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
const aboutToggle = document.querySelector('[data-about-toggle]');
const aboutMenu = document.querySelector('[data-about-menu]');
const megaBackdrop = document.querySelector('[data-mega-backdrop]');
let navCloseTimer = 0;
const setDropdownState = (toggle, menu, open) => {
  if (!toggle || !menu) return;
  toggle.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-hidden', String(!open));
  menu.dataset.open = String(open);
  menu.inert = !open;
};
const syncDropdownBackdrop = () => {
  const open = megaToggle?.getAttribute('aria-expanded') === 'true' || aboutToggle?.getAttribute('aria-expanded') === 'true';
  document.body.classList.toggle('mega-open', open);
};
const setMegaMenu = (open) => {
  if (!megaToggle || !megaMenu) return;
  clearTimeout(navCloseTimer);
  if (open) setDropdownState(aboutToggle, aboutMenu, false);
  setDropdownState(megaToggle, megaMenu, open);
  syncDropdownBackdrop();
};
const setAboutMenu = (open) => {
  if (!aboutToggle || !aboutMenu) return;
  clearTimeout(navCloseTimer);
  if (open) setDropdownState(megaToggle, megaMenu, false);
  setDropdownState(aboutToggle, aboutMenu, open);
  syncDropdownBackdrop();
};
megaToggle?.addEventListener('click', () => {
  const supportsHover = window.matchMedia('(hover: hover)').matches;
  setMegaMenu(supportsHover || megaToggle.getAttribute('aria-expanded') !== 'true');
});
const scheduleDropdownClose = (close) => {
  clearTimeout(navCloseTimer);
  navCloseTimer = setTimeout(close, 140);
};
const cancelDropdownClose = () => clearTimeout(navCloseTimer);
megaToggle?.addEventListener('mouseenter', () => setMegaMenu(true));
megaToggle?.addEventListener('mouseleave', () => scheduleDropdownClose(() => setMegaMenu(false)));
megaToggle?.addEventListener('focus', () => setMegaMenu(true));
megaMenu?.addEventListener('mouseenter', cancelDropdownClose);
megaMenu?.addEventListener('mouseleave', () => scheduleDropdownClose(() => setMegaMenu(false)));
aboutToggle?.addEventListener('mouseenter', () => setAboutMenu(true));
aboutToggle?.addEventListener('mouseleave', () => scheduleDropdownClose(() => setAboutMenu(false)));
aboutToggle?.addEventListener('focus', () => setAboutMenu(true));
aboutMenu?.addEventListener('mouseenter', cancelDropdownClose);
aboutMenu?.addEventListener('mouseleave', () => scheduleDropdownClose(() => setAboutMenu(false)));
megaBackdrop?.addEventListener('click', () => { setMegaMenu(false); setAboutMenu(false); });
document.addEventListener('focusin', (event) => {
  if (megaToggle?.getAttribute('aria-expanded') === 'true' && !megaToggle.contains(event.target) && !megaMenu?.contains(event.target)) setMegaMenu(false);
  if (aboutToggle?.getAttribute('aria-expanded') === 'true' && !aboutToggle.contains(event.target) && !aboutMenu?.contains(event.target)) setAboutMenu(false);
});
document.addEventListener('pointerdown', (event) => {
  if (megaToggle?.getAttribute('aria-expanded') === 'true' && !megaToggle.contains(event.target) && !megaMenu?.contains(event.target)) setMegaMenu(false);
  if (aboutToggle?.getAttribute('aria-expanded') === 'true' && !aboutToggle.contains(event.target) && !aboutMenu?.contains(event.target)) setAboutMenu(false);
});
setMegaMenu(false);
setAboutMenu(false);

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
  if (event.key === 'Escape') { setMenu(false); setMegaMenu(false); setAboutMenu(false); closeDrawers(); }
});

function renderDrawerCart() {
  const list = document.querySelector('[data-drawer-cart-items]');
  const subtotal = document.querySelector('[data-drawer-subtotal]');
  if (!list) return;
  const items = readCart();
  list.innerHTML = items.length ? items.map((item, index) => `<article class="drawer-cart-line" data-drawer-cart-index="${index}">${item.image ? `<img src="${escapeHtml(item.image)}" alt="">` : '<div class="drawer-cart-placeholder"></div>'}<div><a href="${escapeHtml(item.url || `/products/${item.handle}`)}">${escapeHtml(item.title)}</a><span>${item.label ? `Size ${escapeHtml(item.label)} · ` : ''}${item.quantity} × ${money(item.price)}</span><button type="button" data-drawer-remove>Remove</button></div></article>`).join('') : '<div class="drawer-empty"><p>Your bag is empty.</p><a href="/collections/all">Continue shopping</a></div>';
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
  add.dataset.label = option?.dataset.label || '';
  add.dataset.price = option?.dataset.price || '';
  add.disabled = option?.dataset.available !== 'true' || !UUID.test(add.dataset.variant);
  add.textContent = add.disabled ? 'Sold out' : 'Add to cart';
  if (productPrice && add.dataset.price) productPrice.textContent = money(add.dataset.price);
  document.querySelectorAll('[data-variant-choice]').forEach((button) => {
    const selected = button.dataset.variantChoice === add.dataset.variant;
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
};
variant?.addEventListener('change', syncVariant);
document.querySelectorAll('[data-variant-choice]').forEach((button) => button.addEventListener('click', () => {
  if (!variant) return;
  variant.value = button.dataset.variantChoice || '';
  variant.dispatchEvent(new Event('change', { bubbles: true }));
}));
syncVariant();

add?.addEventListener('click', () => {
  if (!UUID.test(add.dataset.variant || '')) return;
  const quantity = Math.max(1, Math.min(20, Number(document.querySelector('[data-quantity]')?.value || 1)));
  addCartItem({ id: add.dataset.id, handle: add.dataset.handle, title: add.dataset.title, url: add.dataset.url, image: add.dataset.image }, { id: add.dataset.variant, price: Number(add.dataset.price), label: add.dataset.label }, quantity);
});

const setCardSlide = (card, requestedIndex) => {
  const slides = [...card.querySelectorAll('[data-card-slide]')];
  if (!slides.length) return;
  const index = (requestedIndex + slides.length) % slides.length;
  card.dataset.cardIndex = String(index);
  slides.forEach((slide, slideIndex) => {
    const active = slideIndex === index;
    slide.classList.toggle('is-active', active);
    slide.setAttribute('aria-hidden', String(!active));
  });
};
document.querySelectorAll('[data-card-carousel]').forEach((carousel) => {
  const card = carousel.closest('.product-card');
  const slides = card?.querySelectorAll('[data-card-slide]') || [];
  if (!card || slides.length < 2) return;
  setCardSlide(card, 0);
  card.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'touch' && Number(card.dataset.cardIndex || 0) === 0) setCardSlide(card, 1);
  });
  card.addEventListener('pointerleave', () => setCardSlide(card, 0));
});
document.addEventListener('click', (event) => {
  const control = event.target.closest('[data-card-previous],[data-card-next]');
  if (!control) return;
  event.preventDefault();
  event.stopPropagation();
  const card = control.closest('.product-card');
  const current = Number(card?.dataset.cardIndex || 0);
  setCardSlide(card, current + (control.matches('[data-card-previous]') ? -1 : 1));
});

const quickAddDialog = document.querySelector('[data-quick-add-dialog]');
const quickAddForm = document.querySelector('[data-quick-add-form]');
const quickAddTitle = document.querySelector('[data-quick-add-title]');
const quickAddPrice = document.querySelector('[data-quick-add-price]');
const quickAddMedia = document.querySelector('[data-quick-add-media]');
const quickAddSizes = document.querySelector('[data-quick-add-sizes]');
const quickAddStatus = document.querySelector('[data-quick-add-status]');
const quickAddSubmit = document.querySelector('[data-quick-add-submit]');
let quickAddProduct = null;
let quickAddVariant = null;
let quickAddOpener = null;
const selectQuickAddVariant = (variant, button = null) => {
  quickAddVariant = variant;
  quickAddSizes?.querySelectorAll('button').forEach((item) => {
    const selected = item === button;
    item.classList.toggle('is-selected', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
  if (quickAddPrice) quickAddPrice.textContent = plainMoney(variant.price);
  if (quickAddSubmit) quickAddSubmit.disabled = !variant.available || !UUID.test(variant.id || '');
  if (quickAddStatus) quickAddStatus.textContent = variant.available ? '' : `${variant.label} is unavailable.`;
};
const closeQuickAdd = () => quickAddDialog?.open && quickAddDialog.close();
const openQuickAdd = async (button) => {
  const card = button.closest('.product-card');
  const data = card?.querySelector('[data-card-product]')?.textContent;
  if (!data) return;
  try { quickAddProduct = JSON.parse(data); } catch { return; }
  const variants = (quickAddProduct.variants || []).filter((variant) => UUID.test(variant.id || ''));
  if (!variants.length) return;
  const requestedProduct = quickAddProduct;
  variants.forEach((variant) => { variant.available = false; });
  quickAddOpener = button;
  quickAddVariant = null;
  if (quickAddTitle) {
    quickAddTitle.textContent = quickAddProduct.title;
    quickAddTitle.href = quickAddProduct.url || `/products/${quickAddProduct.handle}`;
  }
  if (quickAddPrice) quickAddPrice.textContent = plainMoney(Math.min(...variants.map((variant) => Number(variant.price))));
  if (quickAddMedia) {
    quickAddMedia.replaceChildren();
    (quickAddProduct.images?.length ? quickAddProduct.images : [quickAddProduct.image]).filter(Boolean).forEach((src, index) => {
      const image = document.createElement('img');
      image.src = src;
      image.alt = index === 0 ? (quickAddProduct.imageAlt || quickAddProduct.title) : '';
      image.decoding = 'async';
      quickAddMedia.append(image);
    });
  }
  if (quickAddSizes) {
    quickAddSizes.replaceChildren();
    variants.forEach((variant) => {
      const size = document.createElement('button');
      size.type = 'button';
      size.dataset.quickVariant = variant.id;
      size.textContent = variant.label;
      size.disabled = !variant.available;
      size.setAttribute('aria-pressed', 'false');
      if (!variant.available) size.classList.add('is-unavailable');
      size.addEventListener('click', () => selectQuickAddVariant(variant, size));
      quickAddSizes.append(size);
    });
  }
  if (quickAddStatus) quickAddStatus.textContent = 'Checking available sizes…';
  if (quickAddSubmit) quickAddSubmit.disabled = true;
  quickAddDialog?.showModal();
  document.body.classList.add('quick-add-open');
  try {
    const query = new URLSearchParams(variants.map((variant) => ['variantId', variant.id]));
    const response = await fetch(`/reai/availability?${query}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Availability unavailable');
    const result = await response.json();
    if (quickAddProduct !== requestedProduct || !quickAddDialog?.open) return;
    const available = new Set((result.variants || []).filter((variant) => variant.status === 'AVAILABLE').map((variant) => variant.variantId));
    variants.forEach((variant) => {
      variant.available = available.has(variant.id);
      const size = quickAddSizes?.querySelector(`[data-quick-variant="${variant.id}"]`);
      if (size) { size.disabled = !variant.available; size.classList.toggle('is-unavailable', !variant.available); }
    });
    if (quickAddStatus) quickAddStatus.textContent = available.size ? '' : 'These sizes are currently sold out.';
  } catch {
    if (quickAddProduct === requestedProduct && quickAddStatus) quickAddStatus.textContent = 'We could not check stock. Open the product page to try again.';
  }

  quickAddSizes?.querySelector('button:not(:disabled)')?.focus();
};
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-card-quick-add]');
  if (button) openQuickAdd(button);
});
document.querySelector('[data-quick-add-close]')?.addEventListener('click', closeQuickAdd);
quickAddDialog?.addEventListener('click', (event) => { if (event.target === quickAddDialog) closeQuickAdd(); });
quickAddDialog?.addEventListener('close', () => {
  document.body.classList.remove('quick-add-open');
  quickAddOpener?.focus();
  quickAddOpener = null;
  quickAddProduct = null;
  quickAddVariant = null;
});
quickAddForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!quickAddProduct || !quickAddVariant) return;
  if (addCartItem(quickAddProduct, quickAddVariant)) closeQuickAdd();
});

document.querySelector('.product-thumbs')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-gallery-url]');
  const current = document.querySelector('[data-gallery-main] img');
  if (!button || !current) return;
  const source = current.closest('picture')?.querySelector('source');
  const srcset = button.dataset.gallerySrcset || '';
  if (source) source.srcset = srcset;
  current.srcset = srcset;
  current.src = button.dataset.galleryUrl;
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
    list.innerHTML = items.map((item, index) => `<article class="cart-line" data-cart-index="${index}">${item.image ? `<img src="${escapeHtml(item.image)}" alt="">` : '<div></div>'}<div><h2><a href="${escapeHtml(item.url || `/products/${item.handle}`)}">${escapeHtml(item.title)}</a></h2>${item.label ? `<p>Size ${escapeHtml(item.label)}</p>` : ''}<p>${money(item.price)}</p><label>Qty <input type="number" min="1" max="20" value="${item.quantity}" data-cart-quantity></label><button type="button" data-cart-remove>Remove</button></div><strong>${money(item.price * item.quantity)}</strong></article>`).join('');
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

const activeView = document.body.dataset.view || '';
const searchUrl = (query) => `/search?${new URLSearchParams({ q: query, ...(activeView ? { view: activeView } : {}) })}`;
let catalogPromise;
const getCatalog = () => catalogPromise ||= fetch(`/reai/catalog${activeView ? `?view=${activeView}` : ''}`).then((response) => {
  if (!response.ok) throw new Error('Catalog unavailable');
  return response.json();
});
const catalogMatches = (store, query) => {
  const needle = query.toLowerCase();
  return (store.products || []).filter((item) => `${item.title} ${item.brand || ''} ${item.description || ''} ${(item.variants || []).flatMap((entry) => entry.options || []).map((entry) => entry.value).join(' ')}`.toLowerCase().includes(needle));
};
const searchImageUrl = (image) => image?.renditions?.filter((item) => item.width >= 160).sort((a, b) => a.width - b.width)[0]?.url || image?.url;

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
    if (predictiveResults) predictiveResults.innerHTML = products.map((item) => `<a class="predictive-item" href="${escapeHtml(item.url || `/products/${item.handle}`)}">${item.images?.[0]?.url ? `<img src="${escapeHtml(searchImageUrl(item.images[0]))}" alt="" width="80" height="100">` : '<span></span>'}<b>${escapeHtml(item.title)}</b><small>${money(Math.min(...item.variants.map((entry) => Number(entry.price))), store.currency || 'NOK')}</small></a>`).join('');
  } catch {
    if (predictiveStatus) predictiveStatus.textContent = 'The live catalog is temporarily unavailable.';
  }
};
predictiveInput?.addEventListener('input', renderPredictiveSearch);
predictiveForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = predictiveInput?.value.trim() || '';
  if (query) location.assign(searchUrl(query));
});

document.querySelector('[data-order-complete]') && localStorage.removeItem(CART_KEY);
const collectionGrid = document.querySelector('[data-collection-grid] .product-grid');
const featuredCards = collectionGrid ? [...collectionGrid.querySelectorAll('.product-card')] : [];
const featuredPositions = new Map(featuredCards.map((card, index) => [card, index]));
const sortMenu = document.querySelector('[data-sort-menu]');
const sortCards = (direction, updateUrl = true) => {
  if (!collectionGrid || !featuredCards.length) return;
  const cards = [...featuredCards];
  const featuredOrder = (a, b) => featuredPositions.get(a) - featuredPositions.get(b);
  if (direction === 'title-ascending') cards.sort((a, b) => a.dataset.productTitle.localeCompare(b.dataset.productTitle) || featuredOrder(a, b));
  else if (direction === 'title-descending') cards.sort((a, b) => b.dataset.productTitle.localeCompare(a.dataset.productTitle) || featuredOrder(a, b));
  else if (direction === 'price-ascending') cards.sort((a, b) => Number(a.dataset.productPrice) - Number(b.dataset.productPrice) || featuredOrder(a, b));
  else if (direction === 'price-descending') cards.sort((a, b) => Number(b.dataset.productPrice) - Number(a.dataset.productPrice) || featuredOrder(a, b));
  else if (direction === 'created-ascending') cards.sort((a, b) => featuredPositions.get(b) - featuredPositions.get(a));
  else cards.sort(featuredOrder);
  cards.forEach((card) => collectionGrid.append(card));
  sortMenu?.querySelectorAll('[data-sort-value]').forEach((option) => option.setAttribute('aria-selected', String(option.dataset.sortValue === direction)));
  if (updateUrl) {
    const url = new URL(window.location.href);
    if (direction === 'manual') url.searchParams.delete('sort_by');
    else url.searchParams.set('sort_by', direction);
    history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }
};
sortMenu?.addEventListener('click', (event) => {
  const option = event.target.closest('[data-sort-value]');
  if (!option) return;
  sortCards(option.dataset.sortValue);
  sortMenu.open = false;
  sortMenu.querySelector('summary')?.focus();
});
const requestedSort = new URL(window.location.href).searchParams.get('sort_by');
if (sortMenu?.querySelector(`[data-sort-value="${CSS.escape(requestedSort || 'manual')}"]`)) sortCards(requestedSort || 'manual', false);

const filters = document.querySelector('[data-filters]');
const facetDetails = filters ? [...filters.querySelectorAll('details')] : [];
facetDetails.forEach((detail) => detail.addEventListener('toggle', () => {
  if (!detail.open) return;
  facetDetails.forEach((other) => { if (other !== detail) other.open = false; });
}));
document.addEventListener('pointerdown', (event) => {
  if (filters && !event.target.closest('[data-filters]')) facetDetails.forEach((detail) => { detail.open = false; });
  if (sortMenu && !event.target.closest('[data-sort-menu]')) sortMenu.open = false;
});
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  facetDetails.forEach((detail) => { detail.open = false; });
  if (sortMenu?.open) {
    sortMenu.open = false;
    sortMenu.querySelector('summary')?.focus();
  }
});
const applyFilters = () => {
  if (!filters || !collectionGrid) return;
  const active = [...filters.querySelectorAll('[data-facet]:checked')];
  const minimumPrice = Number(filters.querySelector('[data-price-min]')?.value || 0);
  const maximumPrice = Number(filters.querySelector('[data-price-filter]')?.value || Infinity);
  const byFacet = Map.groupBy(active, (input) => input.dataset.facet);
  let visible = 0;
  featuredCards.forEach((card) => {
    const haystack = `${card.dataset.productSearch || ''} ${card.dataset.productOptions || ''}`;
    const matchesFacets = [...byFacet].every(([facet, inputs]) => inputs.some((input) => {
      if (facet === 'size') return JSON.parse(card.dataset.productSizes || '[]').includes(input.value);
      if (facet === 'product type') return card.dataset.productType === input.value;
      if (facet === 'availability') return card.dataset.productAvailability === input.value.replace(' ', '-');
      return haystack.includes(input.value);
    }));
    const price = Number(card.dataset.productPrice);
    const shown = matchesFacets && price >= minimumPrice && price <= maximumPrice;
    card.hidden = !shown;
    if (shown) visible += 1;
  });
  const count = document.querySelector('[data-filter-count]');
  const empty = document.querySelector('[data-filter-empty]');
  if (count) count.textContent = String(visible);
  if (empty) empty.hidden = visible !== 0;
};
filters?.addEventListener('input', applyFilters);
filters?.querySelector('[data-clear-filters]')?.addEventListener('click', () => {
  filters.querySelectorAll('[data-facet]').forEach((input) => { input.checked = false; });
  const minimum = filters.querySelector('[data-price-min]');
  if (minimum) minimum.value = minimum.min || '0';
  const range = filters.querySelector('[data-price-filter]');
  if (range) range.value = range.max;
  applyFilters();
});
document.querySelector('[data-mobile-filter]')?.addEventListener('click', () => filters?.classList.toggle('is-open'));
filters?.querySelector('[data-close-filters]')?.addEventListener('click', () => filters.classList.remove('is-open'));
updateCount();
renderCart();
renderDrawerCart();
