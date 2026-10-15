import {track} from './analytics.js';
document.documentElement.classList.add('has-store-js');
const CART_KEY = 'newmovements-cart-v1';
const pathPrefix = document.body.dataset.pathPrefix || '';
const sitePath = (path) => `${pathPrefix}${path === '/' ? '/' : path}`;
const localHref = (href) => typeof href === 'string' && href.startsWith('/') && !href.startsWith(`${pathPrefix}/`) ? sitePath(href) : href;
const activeCurrency = document.body.dataset.currency || 'NOK';
const activeMarket = document.body.dataset.market || 'default';
let cartRepricing = false;
let cartPriceRequest = 0;
let cartPriceFailed = false;
let unavailableMarketVariants = new Set();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let checkoutStockIssues = new Map();
let cartRevision = 0;

const readCart = () => {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { return []; }
};
const writeCart = (items) => {
  const previous=readCart();
  for(const item of items) {
    const delta=item.quantity-(previous.find(p=>p.variant===item.variant)?.quantity||0);
    if(delta>0) track('add_to_cart',{productId:item.id,variantId:item.variant,quantity:delta});
  }
  for(const item of previous) {
    const delta=item.quantity-(items.find(p=>p.variant===item.variant)?.quantity||0);
    if(delta>0) track('remove_from_cart',{productId:item.id,variantId:item.variant,quantity:delta});
  }
  const serialized = JSON.stringify(items);
  if (localStorage.getItem(CART_KEY) !== serialized) localStorage.setItem(CART_KEY, serialized);
  cartRevision += 1;
  checkoutStockIssues.clear();
  document.querySelectorAll('[data-checkout-error]').forEach((node) => { node.hidden = true; });
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
const money = (value, currency = activeCurrency) => new Intl.NumberFormat('en-NO', {
  style: 'currency', currency, currencyDisplay: 'code', maximumFractionDigits: Number(value) % 1 ? 2 : 0,
}).format(Number(value));
const plainMoney = (value) => new Intl.NumberFormat('nb-NO', { maximumFractionDigits: Number(value) % 1 ? 2 : 0 }).format(Number(value));
const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const cartOptions = (item) => Array.isArray(item.options)
  ? item.options.filter((option) => option.name && option.value && option.value !== 'Default Title').map((option) => `${option.name}: ${option.value}`).join(' · ')
  : item.label ? `Size ${item.label}` : '';
const cartStockMessage = (issue) => issue.maximumQuantity === 0 ? 'Sold out — remove this item to continue.' : `Only ${issue.maximumQuantity} available for this bag. Reduce the quantity to continue.`;
const cartStockNotice = (item) => {
  if (unavailableMarketVariants.has(item.variant)) return '<p class="cart-stock-issue" role="alert">Unavailable for this delivery country — remove this item to continue.</p>';
  const issue = checkoutStockIssues.get(item.variant);
  if (!issue) return '';
  const hasSize = item.options?.some((option) => /^(size|størrelse)$/i.test(option.name)) || item.label;
  return `<p class="cart-stock-notice">${escapeHtml(cartStockMessage(issue))}</p>${issue.maximumQuantity > 0 ? `<button type="button" data-cart-stock-adjust="${escapeHtml(item.variant)}">Change quantity to ${issue.maximumQuantity}</button>` : `<a class="cart-stock-action" href="${escapeHtml(localHref(item.url || `/products/${item.handle}`))}">${hasSize ? 'Choose another size' : 'View product'}</a>`}`;
};
if (!document.querySelector('[data-drawer-backdrop]')) {
  document.querySelector('.site-header')?.insertAdjacentHTML('afterend', `<div class="drawer-backdrop" data-drawer-backdrop hidden></div><dialog class="store-drawer search-drawer" aria-label="Search" data-search-drawer><header><h2>Search</h2><button type="button" data-drawer-close>Close</button></header><form role="search" data-predictive-search><label class="sr-only" for="predictive-query">Search products</label><input id="predictive-query" name="q" type="search" autocomplete="off" placeholder="Search shoes, styles, materials"><button type="submit">View all</button></form><p data-predictive-status role="status" aria-live="polite">Start typing to search the live catalog.</p><div class="predictive-results" data-predictive-results></div></dialog><dialog class="store-drawer cart-drawer" aria-label="Shopping bag" data-cart-drawer><header><h2>Your bag</h2><button type="button" data-drawer-close>Close</button></header><div data-drawer-cart-items></div><footer><p><span>Subtotal</span><strong data-drawer-subtotal>NOK 0</strong></p><a href="${sitePath('/cart')}">View bag</a></footer></dialog>`);
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
    imageAlt: product.imageAlt || product.title || 'New Movements product image',
    price: Number(variant.price),
    currency: activeCurrency,
    market: activeMarket,
    quantity: safeQuantity,
  });
  writeCart(items);
  if (cartDrawer?.getAttribute('aria-hidden') !== 'false') showToast(`${safeQuantity} × ${product.title} added to your bag.`);
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
const cartUpsells = cartDrawer?.querySelector('[data-cart-upsells]');
const upsellStatus = cartUpsells?.querySelector('[data-cart-upsell-status]');
const upsellChoices = [...(cartUpsells?.querySelectorAll('[data-cart-upsell]') || [])].flatMap((input) => {
  try {
    const selection = JSON.parse(input.dataset.cartUpsell);
    return UUID.test(selection.variant?.id || '') ? [{ ...selection, input, row: input.closest('[data-cart-upsell-row]') }] : [];
  } catch { return []; }
});
let upsellAvailability = null;
let checkingUpsellStock = false;
let upsellStockFailed = false;
let drawerOpener = null;
const closeDrawers = () => {
  [searchDrawer, cartDrawer].forEach((drawer) => { if (drawer?.open) drawer.close(); });
  if (backdrop) backdrop.hidden = true;
  document.body.classList.remove('drawer-open');
  drawerOpener?.focus();
  drawerOpener = null;
};
const openDrawer = (drawer, opener) => {
  [searchDrawer, cartDrawer].forEach((item) => { if (item?.open) item.close(); });
  const toast = document.querySelector('[data-cart-toast]');
  if (toast) toast.hidden = true;
  drawerOpener = opener;
  drawer?.showModal();
  if (backdrop) backdrop.hidden = false;
  document.body.classList.add('drawer-open');
  drawer?.querySelector('input,button,a')?.focus();
};
document.querySelectorAll('[data-search-open], .utility-nav a[href$="/search"]').forEach((button) => button.addEventListener('click', (event) => { event.preventDefault(); openDrawer(searchDrawer, button); }));
document.querySelectorAll('[data-cart-open], .utility-nav a[href$="/cart"], .site-nav>a[href$="/cart"]').forEach((button) => button.addEventListener('click', (event) => { event.preventDefault(); renderDrawerCart(); openDrawer(cartDrawer, button); refreshUpsellStock(); }));
[searchDrawer, cartDrawer].forEach((drawer) => {
  drawer?.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const choices = [...drawer.querySelectorAll('button:not(:disabled),input:not(:disabled),a[href],select:not(:disabled),[tabindex="0"]')].filter((element) => element.getClientRects().length);
    const first = choices[0], last = choices.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  drawer?.addEventListener('cancel', (event) => { event.preventDefault(); closeDrawers(); });
  drawer?.addEventListener('click', (event) => { if (event.target === drawer && event.clientX < drawer.getBoundingClientRect().left) closeDrawers(); });
});
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
  list.innerHTML = items.length ? items.map((item, index) => `<article class="drawer-cart-line${checkoutStockIssues.has(item.variant) ? ' has-stock-issue' : ''}" data-drawer-cart-index="${index}">${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || `${item.title} product image`)}">` : '<div class="drawer-cart-placeholder"></div>'}<div><a href="${escapeHtml(localHref(item.url || `/products/${item.handle}`))}">${escapeHtml(item.title)}</a><span>${cartOptions(item) ? `${escapeHtml(cartOptions(item))} · ` : ''}${item.quantity} × ${money(item.price, item.currency || 'NOK')}</span>${cartStockNotice(item)}<label class="drawer-quantity">Quantity<input data-drawer-quantity type="number" min="1" max="20" inputmode="numeric" value="${item.quantity}" aria-label="Quantity for ${escapeHtml(item.title)}"></label><button type="button" data-drawer-remove>Remove</button></div></article>`).join('') : `<div class="drawer-empty"><p>Your bag is empty.</p><a href="${sitePath('/collections/all')}">Continue shopping</a></div>`;
  if (subtotal) subtotal.textContent = cartRepricing ? 'Updating prices…' : cartPriceFailed || items.some((item) => unavailableMarketVariants.has(item.variant)) ? 'Price unavailable' : money(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  syncCartUpsells(items);
  cartDrawer.querySelectorAll('[data-checkout-start]').forEach((button) => { button.disabled = !items.length || checkoutPending || cartRepricing || cartPriceFailed || items.some((item) => unavailableMarketVariants.has(item.variant)); });
}

function syncCartUpsells(items = readCart()) {
  const selected = new Set(items.map((item) => item.variant));
  let shown = 0;
  upsellChoices.forEach(({ input, row, variant }) => {
    const inCart = selected.has(variant.id);
    const available = upsellAvailability?.has(variant.id);
    input.checked = inCart;
    input.disabled = !inCart && (checkingUpsellStock || !available);
    row.hidden = !inCart && (upsellAvailability === null || !available || shown >= 2);
    if (!row.hidden) shown++;
  });
  if (cartUpsells) cartUpsells.hidden = !items.length || !upsellChoices.some(({ row }) => !row.hidden);
  if (upsellStatus) {
    upsellStatus.textContent = checkingUpsellStock ? 'Checking shoe-care availability…' : upsellStockFailed ? 'We could not check shoe-care stock. Reopen your bag to try again.' : '';
    upsellStatus.hidden = !checkingUpsellStock && !upsellStockFailed;
  }
}

async function refreshUpsellStock() {
  if (!upsellChoices.length || !readCart().length || checkingUpsellStock) return;
  checkingUpsellStock = true;
  upsellStockFailed = false;
  upsellAvailability = null;
  syncCartUpsells();
  try {
    const query = new URLSearchParams(upsellChoices.map(({ variant }) => ['variantId', variant.id]));
    const response = await fetch(sitePath(`/reai/availability?${query}`), { cache: 'no-store' });
    if (!response.ok) throw new Error('Availability unavailable');
    const result = await response.json();
    upsellAvailability = new Set((result.variants || []).filter((variant) => variant.status === 'AVAILABLE').map((variant) => variant.variantId));
  } catch {
    upsellStockFailed = true;
  } finally {
    checkingUpsellStock = false;
    syncCartUpsells();
  }
}

cartUpsells?.addEventListener('change', (event) => {
  const choice = upsellChoices.find(({ input }) => input === event.target);
  if (!choice) return;
  if (choice.input.checked) {
    if (checkingUpsellStock || !upsellAvailability?.has(choice.variant.id)) return syncCartUpsells();
    addCartItem(choice.product, choice.variant);
  } else {
    writeCart(readCart().filter((item) => item.variant !== choice.variant.id));
  }
  renderCart();
});
cartDrawer?.addEventListener('change', (event) => {
  if (!event.target.matches('[data-drawer-quantity]')) return;
  const input = event.target;
  const index = Number(input.closest('[data-drawer-cart-index]').dataset.drawerCartIndex);
  const quantity = Number(input.value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return input.reportValidity();
  const items = readCart();
  if (!items[index]) return;
  items[index].quantity = quantity; writeCart(items); renderCart();
});
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
  const exactProductUrl = new URL(add.dataset.url, location.origin); exactProductUrl.searchParams.delete('variant');
  if (option?.value) exactProductUrl.searchParams.set('variant', option.value);
  add.dataset.url = exactProductUrl.pathname + exactProductUrl.search;
  add.dataset.label = option?.dataset.label || '';
  add.dataset.price = option?.dataset.price || '';
  add.disabled = option?.dataset.available !== 'true' || !UUID.test(add.dataset.variant);
  const unavailable = add.disabled;
  const unknown = option?.dataset.available === 'unknown';
  add.textContent = !option?.value ? 'Select your size' : unknown ? 'Check availability' : unavailable ? 'Notify me' : 'Add to cart';
  add.dataset.checkStock = String(unknown);
  add.disabled = !option?.value;
  add.dataset.notify = String(unavailable && !!option?.value);
  const mobileAction = document.querySelector('[data-mobile-purchase-action]');
  if (mobileAction) mobileAction.textContent = !option?.value ? 'Choose size' : unknown ? 'Check availability' : unavailable ? 'Notify me' : `Add to bag · ${money(option.dataset.price)}`;
  document.querySelectorAll('[data-color-link]').forEach((link) => {
    try {
      const choices = JSON.parse(link.dataset.colorVariants);
      const match = choices.find((entry) => entry.options?.some((value) => value.name.toLowerCase() === 'size' && value.value === option?.dataset.label));
      const url = new URL(link.href); url.searchParams.delete('variant');
      if (match) url.searchParams.set('variant', match.id);
      link.href = url.href;
    } catch { /* The ordinary link remains usable. */ }
  });
  const sizeStatus = document.querySelector('[data-size-status]');
  const guideLink = document.querySelector('.product-size-picker .size-guide-link');
  if (guideLink) {
    const guideUrl = new URL(guideLink.href);
    const size = option?.dataset.label || '';
    if (/^\d+(?:\.\d+)?$/.test(size)) guideUrl.searchParams.set('size', size);
    else guideUrl.searchParams.delete('size');
    guideLink.href = guideUrl.href;
  }
  document.querySelectorAll('.recommendations .product-card').forEach((card) => {
    try {
      const data = JSON.parse(card.querySelector('[data-card-product]').textContent);
      const selectedSize = option?.dataset.label;
      const match = data.variants.find((variant) => variant.label === selectedSize && variant.available);
      card.hidden = !!selectedSize && !match;
      card.dataset.selectedVariant = match?.id || '';
      card.querySelectorAll('a').forEach((link) => { const url = new URL(link.href); url.searchParams.delete('variant'); if (match) url.searchParams.set('variant', match.id); link.href = url.href; });
    } catch { /* Static recommendations remain usable. */ }
  });
  const recommendations = document.querySelector('.recommendations');
  if (recommendations) recommendations.hidden = ![...recommendations.querySelectorAll('.product-card')].some((card) => !card.hidden);
  const notify = document.querySelector('[data-stock-notification]');
  const notifySize = notify?.querySelector('select[name="variantId"]');
  const canNotify = notifySize && [...notifySize.options].some(item => item.value === add.dataset.variant);
  if (sizeStatus) sizeStatus.textContent = unknown ? 'Live stock could not be checked. Please try again.' : option?.dataset.available === 'false' ? canNotify ? 'This size is sold out. Request a one-time email below.' : 'This option is currently unavailable.' : '';
  if (option?.dataset.available === 'false' && notifySize?.querySelector(`option[value="${add.dataset.variant}"]`)) {
    notify.open = true;
    notifySize.value = add.dataset.variant;
  }
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
  if (add.dataset.checkStock === 'true') { location.assign(add.dataset.url); return; }
  if (add.dataset.notify === 'true') { const notify = document.querySelector('[data-stock-notification]'); if (notify) { notify.open = true; notify.querySelector('input[type=email]')?.focus(); } return; }
  if (!UUID.test(add.dataset.variant || '')) return;
  const quantity = Math.max(1, Math.min(20, Number(document.querySelector('[data-quantity]')?.value || 1)));
  addCartItem({ id: add.dataset.id, handle: add.dataset.handle, title: add.dataset.title, url: add.dataset.url, image: add.dataset.image, imageAlt: add.dataset.imageAlt }, { id: add.dataset.variant, price: Number(add.dataset.price), label: add.dataset.label }, quantity);
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
const initializeCardCarousels = (root = document) => root.querySelectorAll('[data-card-carousel]').forEach((carousel) => {
  const card = carousel.closest('.product-card');
  const slides = card?.querySelectorAll('[data-card-slide]') || [];
  if (!card || slides.length < 2) return;
  setCardSlide(card, 0);
  card.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'touch' && Number(card.dataset.cardIndex || 0) === 0) setCardSlide(card, 1);
  });
  card.addEventListener('pointerleave', () => setCardSlide(card, 0));
});
initializeCardCarousels();
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
  try { quickAddProduct = JSON.parse(data); if (card.dataset.selectedVariant) quickAddProduct.selectedVariantId = card.dataset.selectedVariant; } catch { return; }
  const variants = (quickAddProduct.variants || []).filter((variant) => UUID.test(variant.id || ''));
  if (!variants.length) return;
  const requestedProduct = quickAddProduct;
  variants.forEach((variant) => { variant.available = false; });
  quickAddOpener = button;
  quickAddVariant = null;
  if (quickAddTitle) {
    quickAddTitle.textContent = quickAddProduct.title;
    quickAddTitle.href = localHref(quickAddProduct.url || `/products/${quickAddProduct.handle}`);
  }
  if (quickAddPrice) quickAddPrice.textContent = plainMoney(Math.min(...variants.map((variant) => Number(variant.price))));
  if (quickAddMedia) {
    quickAddMedia.replaceChildren();
    (quickAddProduct.images?.length ? quickAddProduct.images : [quickAddProduct.image]).filter(Boolean).forEach((src, index) => {
      const image = document.createElement('img');
      image.src = src;
      image.alt = quickAddProduct.imageAlts?.[index] || (index === 0 ? (quickAddProduct.imageAlt || quickAddProduct.title) : `${quickAddProduct.title} product image ${index + 1}`);
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
    const response = await fetch(sitePath(`/reai/availability?${query}`), { cache: 'no-store' });
    if (!response.ok) throw new Error('Availability unavailable');
    const result = await response.json();
    if (quickAddProduct !== requestedProduct || !quickAddDialog?.open) return;
    const available = new Set((result.variants || []).filter((variant) => variant.status === 'AVAILABLE').map((variant) => variant.variantId));
    variants.forEach((variant) => {
      variant.available = available.has(variant.id);
      const size = quickAddSizes?.querySelector(`[data-quick-variant="${variant.id}"]`);
      if (size) { size.disabled = !variant.available; size.classList.toggle('is-unavailable', !variant.available); }
    });
    if (quickAddProduct.selectedVariantId) {
      const selected = variants.find((variant) => variant.id === quickAddProduct.selectedVariantId);
      if (selected) selectQuickAddVariant(selected, quickAddSizes?.querySelector(`[data-quick-variant="${selected.id}"]`));
    }
    if (quickAddStatus && !quickAddVariant) quickAddStatus.textContent = available.size ? '' : 'These sizes are currently sold out.';
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
const checkoutButtons = [...document.querySelectorAll('[data-checkout-start]')];
let checkoutPending = false;
const renderCart = () => {
  if (!cartRoot) return;
  const items = readCart();
  const list = cartRoot.querySelector('[data-cart-items]');
  const subtotal = cartRoot.querySelector('[data-cart-subtotal]');
  if (!items.length) {
    list.innerHTML = `<div class="message-page"><h2>Your bag is empty</h2><p><a href="${sitePath('/collections/all')}">Continue shopping</a></p></div>`;
  } else {
    list.innerHTML = items.map((item, index) => `<article class="cart-line${checkoutStockIssues.has(item.variant) ? ' has-stock-issue' : ''}" data-cart-index="${index}">${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || `${item.title} product image`)}">` : '<div></div>'}<div><h2><a href="${escapeHtml(localHref(item.url || `/products/${item.handle}`))}">${escapeHtml(item.title)}</a></h2>${cartOptions(item) ? `<p>${escapeHtml(cartOptions(item))}</p>` : ''}<p>${money(item.price, item.currency || 'NOK')}</p><label>Qty <input type="number" min="1" max="20" value="${item.quantity}" data-cart-quantity></label>${cartStockNotice(item)}<button type="button" data-cart-remove>Remove</button></div><strong>${money(item.price * item.quantity, item.currency || 'NOK')}</strong></article>`).join('');
  }
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (subtotal) subtotal.textContent = cartRepricing ? 'Updating prices…' : cartPriceFailed || items.some((item) => unavailableMarketVariants.has(item.variant)) ? 'Price unavailable' : money(total);
  checkoutButtons.forEach((button) => { button.disabled = !items.length || checkoutPending || cartRepricing || cartPriceFailed || items.some((item) => unavailableMarketVariants.has(item.variant)); });
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

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-cart-stock-adjust]');
  if (!button || checkoutPending) return;
  const id = button.dataset.cartStockAdjust;
  const maximum = checkoutStockIssues.get(id)?.maximumQuantity;
  if (!Number.isInteger(maximum) || maximum < 1) return;
  writeCart(readCart().map((item) => item.variant === id ? { ...item, quantity: maximum } : item));
  renderCart();
});

checkoutButtons.forEach((checkout) => checkout.addEventListener('click', async () => {
  if (checkoutPending || cartRepricing || cartPriceFailed || unavailableMarketVariants.size) return;
  const checkoutError = checkout.parentElement.querySelector('[data-checkout-error]');
  const lines = readCart().filter((item) => UUID.test(item.variant) && item.quantity > 0).map((item) => ({ variantId: item.variant, quantity: item.quantity }));
  if (!lines.length) return;
  const submittedRevision = cartRevision;
  checkoutPending = true;
  const label = checkout.textContent;
  checkoutButtons.forEach((button) => { button.disabled = true; });
  checkout.textContent = 'Opening secure checkout…';
  if (checkoutError) checkoutError.hidden = true;
  try {
    const response = await fetch(sitePath('/reai/checkout/start'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ lines }) });
    const payload = await response.json().catch(() => ({}));
    if (submittedRevision !== cartRevision) throw new Error('Your bag changed. Please check out again.');
    if (response.status === 409 && payload.code === 'INSUFFICIENT_STOCK' && Array.isArray(payload.stockIssues)) {
      checkoutStockIssues = new Map(payload.stockIssues.filter((issue) => lines.some((line) => line.variantId === issue.variantId && line.quantity === issue.requestedQuantity) && Number.isInteger(issue.maximumQuantity) && issue.maximumQuantity >= 0 && issue.maximumQuantity < issue.requestedQuantity).map((issue) => [issue.variantId, issue]));
      const items = readCart().map((item) => {
        const issue = checkoutStockIssues.get(item.variant);
        return issue ? { ...item, title: issue.title || item.title, ...(Array.isArray(issue.options) ? { options: issue.options } : {}) } : item;
      });
      const serialized = JSON.stringify(items);
      if (localStorage.getItem(CART_KEY) !== serialized) localStorage.setItem(CART_KEY, serialized);
      renderDrawerCart(); renderCart();
      const affected = items.filter((item) => checkoutStockIssues.has(item.variant));
      if (affected.length) {
        const names = affected.map((item) => `${item.title}${cartOptions(item) ? ` (${cartOptions(item)})` : ''}`).join('; ');
        throw new Error(`Please update your bag: ${names}. See the highlighted items above.`);
      }
    }
    if (!response.ok || !payload.checkoutUrl) throw new Error(payload.detail || payload.error || 'Checkout could not be started.');
    location.assign(payload.checkoutUrl);
  } catch (error) {
    if (checkoutError) { checkoutError.textContent = error.message; checkoutError.hidden = false; }
    checkoutPending = false;
    checkoutButtons.forEach((button) => { button.disabled = !readCart().length || cartRepricing || cartPriceFailed || unavailableMarketVariants.size > 0; });
    checkout.textContent = label;
    const container = checkout.closest('[data-cart-drawer], [data-cart-root]');
    container?.querySelector('.has-stock-issue')?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }
}));

const activeView = document.body.dataset.view || '';
const searchUrl = (query) => sitePath(`/search?${new URLSearchParams({ q: query, ...(activeView ? { view: activeView } : {}) })}`);

const predictiveForm = document.querySelector('[data-predictive-search]');
const predictiveInput = predictiveForm?.querySelector('input[name="q"]');
const predictiveResults = document.querySelector('[data-predictive-results]');
const predictiveStatus = document.querySelector('[data-predictive-status]');
let predictiveSequence = 0;
let predictiveTimer;
let predictiveRequest;
const renderPredictiveSearch = async () => {
  const sequence = ++predictiveSequence;
  predictiveRequest?.abort();
  const controller = new AbortController();
  predictiveRequest = controller;
  const query = predictiveInput?.value.trim() || '';
  if (!query) {
    if (predictiveStatus) predictiveStatus.textContent = 'Start typing to search the live catalog.';
    if (predictiveResults) predictiveResults.innerHTML = '';
    return;
  }
  if (predictiveStatus) predictiveStatus.textContent = 'Searching…';
  try {
    const response = await fetch(sitePath(`/reai/search?${new URLSearchParams({ q: query, ...(activeView ? { view: activeView } : {}) })}`), { signal: controller.signal });
    if (!response.ok) throw new Error('Search unavailable');
    const store = await response.json();
    if (sequence !== predictiveSequence) return;
    const products = store.products;
    if (predictiveStatus) predictiveStatus.textContent = products.length ? `${products.length} suggested product${products.length === 1 ? '' : 's'}` : `No results for “${query}”`;
    if (predictiveResults) predictiveResults.innerHTML = products.map((item) => `<a class="predictive-item" href="${escapeHtml(localHref(item.url || `/products/${item.handle}`))}">${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || `${item.title} product image`)}" width="80" height="100">` : '<span></span>'}<b>${escapeHtml(item.title)}</b><small>${money(item.price, store.currency || 'NOK')}</small></a>`).join('');
  } catch {
    if (sequence !== predictiveSequence || controller.signal.aborted) return;
    if (predictiveStatus) predictiveStatus.textContent = 'The live catalog is temporarily unavailable.';
  }
};
predictiveInput?.addEventListener('input', () => {
  ++predictiveSequence; predictiveRequest?.abort(); clearTimeout(predictiveTimer);
  predictiveTimer = setTimeout(renderPredictiveSearch, 180);
});
predictiveForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = predictiveInput?.value.trim() || '';
  if (query) location.assign(searchUrl(query));
});

document.querySelector('[data-order-complete]') && localStorage.removeItem(CART_KEY);
let sortMenu = document.querySelector('[data-sort-menu]');
let filters = document.querySelector('[data-filters]');
let facetDetails = [];
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
let mobileFilterButton = document.querySelector('[data-mobile-filter]');
const mobileFilterViewport = matchMedia('(max-width: 900px)');
const setFilters = (open) => {
  if (!filters) return;
  filters.classList.toggle('is-open', open);
  filters.inert = mobileFilterViewport.matches && !open;
  filters.setAttribute('aria-hidden', String(filters.inert));
  mobileFilterButton?.setAttribute('aria-expanded', String(open));
};
const bindCollectionControls = () => {
  filters = document.querySelector('[data-filters]');
  sortMenu = document.querySelector('[data-sort-menu]');
  mobileFilterButton = document.querySelector('[data-mobile-filter]');
  facetDetails = filters ? [...filters.querySelectorAll('details')] : [];
  facetDetails.forEach((detail) => detail.addEventListener('toggle', () => {
    if (detail.open) facetDetails.forEach((other) => { if (other !== detail) other.open = false; });
  }));
  mobileFilterButton?.addEventListener('click', () => setFilters(!filters?.classList.contains('is-open')));
  filters?.querySelector('[data-close-filters]')?.addEventListener('click', () => { setFilters(false); mobileFilterButton?.focus(); });
  setFilters(false);
};
bindCollectionControls();
let collectionRequest;
let priceFilterTimer;
const updateCollection = async (url, pushHistory = true) => {
  clearTimeout(priceFilterTimer);
  collectionRequest?.abort();
  const controller = new AbortController();
  collectionRequest = controller;
  const section = document.querySelector('.collection-layout');
  if (!section) { location.assign(url); return; }
  section.setAttribute('aria-busy', 'true');
  const status = document.querySelector('[data-filter-status]');
  if (status) status.textContent = 'Updating products…';
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'text/html' } });
    if (!response.ok) throw new Error('Collection unavailable');
    const page = new DOMParser().parseFromString(await response.text(), 'text/html');
    const next = page.querySelector('.collection-layout');
    if (!next) throw new Error('Collection unavailable');
    if (controller.signal.aborted) return;
    const drawerOpen = filters?.classList.contains('is-open');
    const drawerScroll = filters?.scrollTop || 0;
    const openFacet = facetDetails.find((detail) => detail.open)?.querySelector('summary')?.textContent;
    const focused = document.activeElement;
    const focusName = focused?.getAttribute('name');
    const focusValue = focused?.getAttribute('value');
    section.replaceWith(next);
    bindCollectionControls();
    facetDetails.forEach((detail) => { detail.open = detail.querySelector('summary')?.textContent === openFacet; });
    setFilters(Boolean(drawerOpen));
    if (filters) filters.scrollTop = drawerScroll;
    if (focusName) {
      const match = [...next.querySelectorAll('[name]')].find((node) => node.getAttribute('name') === focusName && (!focusValue || node.getAttribute('value') === focusValue));
      match?.focus({ preventScroll: true });
    }
    initializeCardCarousels(next);
    if (pushHistory) history.pushState(null, '', url);
    if (status) status.textContent = `${next.querySelector('[data-filter-count]')?.textContent || 0} matching products.`;
  } catch (error) {
    if (error.name !== 'AbortError') location.assign(url);
  } finally {
    if (collectionRequest === controller) {
      section.removeAttribute('aria-busy');
      if (controller.signal.aborted && status) status.textContent = '';
    }
  }
};
const submitCollectionFilters = (form, submitter) => {
  if (!form.reportValidity()) return;
  const url = new URL(form.action);
  const parameters = new URLSearchParams(new FormData(form));
  if (submitter?.name) parameters.set(submitter.name, submitter.value);
  [...parameters.keys()].forEach((key) => { if (!parameters.get(key)?.trim()) parameters.delete(key); });
  url.search = parameters.toString();
  updateCollection(url);
};
document.addEventListener('change', (event) => {
  const form = event.target.closest('[data-collection-filter-form]');
  if (form && event.target.matches('input')) { clearTimeout(priceFilterTimer); submitCollectionFilters(form); }
});
document.addEventListener('input', (event) => {
  const form = event.target.closest('[data-collection-filter-form]');
  if (form && event.target.matches('input[type="number"]')) {
    clearTimeout(priceFilterTimer);
    collectionRequest?.abort();
    priceFilterTimer = setTimeout(() => submitCollectionFilters(form), 600);
  }
});
document.addEventListener('submit', (event) => {
  if (!event.target.matches('[data-collection-filter-form]')) return;
  event.preventDefault(); clearTimeout(priceFilterTimer);
  submitCollectionFilters(event.target, event.submitter);
});
document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-clear-filters],[data-remove-filter]');
  if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault(); clearTimeout(priceFilterTimer); updateCollection(link.href);
});
window.addEventListener('popstate', () => { if (document.querySelector('.collection-layout')) updateCollection(location.href, false); });
mobileFilterViewport.addEventListener('change', () => setFilters(false));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobileFilterViewport.matches && filters?.classList.contains('is-open')) {
    setFilters(false);
    mobileFilterButton?.focus();
  }
});
setFilters(false);
async function refreshCartPrices() {
  const requestId = ++cartPriceRequest;
  if (!readCart().length) { cartRepricing = false; cartPriceFailed = false; unavailableMarketVariants.clear(); return; }
  cartRepricing = true;
  renderCart(); renderDrawerCart();
  try {
    const response = await fetch(sitePath('/reai/catalog'));
    if (!response.ok) throw new Error('Catalog unavailable');
    const store = await response.json();
    if (requestId !== cartPriceRequest) return;
    if (store.currency !== activeCurrency || store.marketHandle !== activeMarket) throw new Error('Delivery country changed. Reload the page.');
    const variants = new Map((store.products || []).flatMap((product) => (product.variants || []).map((variant) => [variant.id, { product, variant }])));
    unavailableMarketVariants = new Set();
    const items = readCart().map((item) => {
      const current = variants.get(item.variant);
      if (!current) { unavailableMarketVariants.add(item.variant); return item; }
      return { ...item, title: current.product.title, imageAlt: current.product.imageAlt || item.imageAlt || current.product.title, price: Number(current.variant.price), options: current.variant.options, currency: activeCurrency, market: activeMarket };
    });
    writeCart(items);
    cartPriceFailed = false;
  } catch {
    if (requestId !== cartPriceRequest) return;
    cartPriceFailed = true;
    document.querySelectorAll('[data-checkout-error]').forEach((node) => { node.hidden = false; node.textContent = 'We could not update prices for your delivery country. Refresh the page to try again.'; });
  } finally { if (requestId === cartPriceRequest) { cartRepricing = false; renderCart(); renderDrawerCart(); } }
}
const updateCountryReturn = (form) => {
  const returnTo = form.querySelector('[name="returnTo"]');
  if (returnTo) returnTo.value = location.pathname + location.search;
};
document.querySelectorAll('[data-market-form]').forEach((form) => {
  form.addEventListener('submit', () => updateCountryReturn(form));
  form.querySelector('[data-market-select]')?.addEventListener('change', () => {
    updateCountryReturn(form);
    form.requestSubmit();
  });
});
const countryDialog = document.querySelector('#country-dialog');
const countryOpen = document.querySelector('[data-country-open]');
const countrySearch = document.querySelector('[data-country-search]');
if (countryDialog && countryOpen && countrySearch) {
  const filterCountries = () => {
    const query = countrySearch.value.trim().toLowerCase();
    let matches = 0;
    countryDialog.querySelectorAll('[data-country-option]').forEach((option) => {
      option.hidden = !option.dataset.search.includes(query);
      if (!option.hidden) matches++;
    });
    countryDialog.querySelector('[data-country-empty]').hidden = matches > 0;
  };
  countryOpen.hidden = false;
  countryOpen.addEventListener('click', () => {
    countrySearch.value = '';
    filterCountries();
    countryDialog.showModal();
    countrySearch.focus();
  });
  countryDialog.querySelector('[data-country-close]')?.addEventListener('click', () => countryDialog.close());
  countryDialog.addEventListener('close', () => countryOpen.focus());
  countryDialog.addEventListener('click', (event) => { if (event.target === countryDialog) countryDialog.close(); });
  countrySearch.addEventListener('input', filterCountries);
  countrySearch.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter') {
      const first = countryDialog.querySelector('[data-country-option]:not([hidden])');
      if (first) { event.preventDefault(); event.key === 'Enter' ? first.click() : first.focus(); }
    }
  });
}

window.addEventListener('storage', (event) => { if (event.key === CART_KEY) { updateCount(); refreshCartPrices(); renderCart(); renderDrawerCart(); } });
updateCount();
refreshCartPrices();
renderCart();
renderDrawerCart();

document.querySelectorAll('[data-newsletter-form]').forEach((newsletterForm) => newsletterForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!newsletterForm.reportValidity()) return;
  const button = newsletterForm.querySelector('button');
  const status = newsletterForm.querySelector('[data-newsletter-status]');
  if (button.disabled) return;
  const data = new FormData(newsletterForm);
  const name = String(data.get('name') || '').trim();
  const welcomeDiscount = data.get('welcomeDiscount') === 'true';
  button.disabled = true;
  button.textContent = 'Signing up…';
  status.hidden = true;
  try {
    const response = await fetch(sitePath('/reai/newsletter/subscribe'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: String(data.get('email') || '').trim(), ...(name ? { name } : {}), consent: true, ...(welcomeDiscount ? { welcomeDiscount: true } : {}) }),
    });
    if (!response.ok) throw new Error('Signup unavailable');
    status.textContent = welcomeDiscount
      ? "You're on the list. Check your email for your 5% welcome discount. If you've already requested it, you can use the code in your earlier email."
      : "You're on the list. Thanks for joining the New Movements community.";
    newsletterForm.reset();
  } catch {
    status.textContent = 'We could not save your signup. Please try again in a moment.';
  } finally {
    status.hidden = false;
    button.disabled = false;
    button.textContent = 'Sign up';
  }
}));

// Stock requests have their own explicit, item-scoped consent.
document.querySelectorAll('[data-stock-form]').forEach((form) => form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector('[data-stock-status]');
  const data = new FormData(form);
  button.disabled = true;
  status.textContent = 'Saving your request…';
  try {
    const response = await fetch(sitePath('/reai/stock/subscribe'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ variantId: data.get('variantId'), email: data.get('email'), consent: data.get('consent') === 'true' }) });
    if (!response.ok) throw new Error(response.status === 429 ? 'Please wait a minute before trying again.' : 'We could not save your request. Refresh the page and try again.');
    status.textContent = 'You’re on the list. We’ll email you once when this size is available.';
    form.elements.email.value = '';
    form.elements.consent.checked = false;
  } catch (error) { status.textContent = error.message; }
  finally { button.disabled = false; }
}));

const viewed=document.querySelector('[data-add-to-cart][data-id]');
if(viewed) track('product_view',{productId:viewed.dataset.id});

// The guide is ordinary server-rendered content. Product pages progressively
// enhance its link into a native modal; it still works without JavaScript.
const sizeGuideDialog = document.querySelector('[data-size-guide-dialog]');
if (sizeGuideDialog && typeof sizeGuideDialog.showModal === 'function') {
  const body = sizeGuideDialog.querySelector('[data-size-guide-body]');
  const close = sizeGuideDialog.querySelector('[data-size-guide-close]');
  let controller;
  let trigger;
  let generation = 0;
  const load = async (href, focusLabel = '') => {
    const current = ++generation;
    controller?.abort();
    controller = new AbortController();
    const active = controller;
    const timeout = setTimeout(() => active.abort(), 8000);
    body.setAttribute('aria-busy', 'true');
    if (!body.querySelector('[data-size-guide-content]')) body.innerHTML = '<p class="sg-loading" role="status">Opening your size guide…</p>';
    try {
      const response = await fetch(href, { signal: active.signal });
      if (!response.ok) throw new Error('Size guide unavailable');
      const content = new DOMParser().parseFromString(await response.text(), 'text/html').querySelector('[data-size-guide-content]');
      if (!content) throw new Error('Size guide unavailable');
      if (current !== generation || !sizeGuideDialog.open) return;
      body.replaceChildren(content);
      body.scrollTop = 0;
      if (focusLabel) [...body.querySelectorAll('nav a')].find(link => link.textContent.trim() === focusLabel)?.focus({ preventScroll: true });
    } catch {
      if (current === generation && sizeGuideDialog.open) window.location.assign(href);
    } finally {
      clearTimeout(timeout);
      if (current === generation) body.removeAttribute('aria-busy');
    }
  };
  document.querySelector('[data-size-guide-open]')?.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    trigger = event.currentTarget;
    sizeGuideDialog.showModal();
    document.body.classList.add('size-guide-open');
    close.focus();
    load(trigger.href);
  });
  body.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link || !link.closest('.sg-styles, .sg-audiences, .sg-units') || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    load(link.href, link.textContent.trim());
  });
  close.addEventListener('click', () => sizeGuideDialog.close());
  sizeGuideDialog.addEventListener('click', event => {
    const box = sizeGuideDialog.getBoundingClientRect();
    if (event.target === sizeGuideDialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) sizeGuideDialog.close();
  });
  sizeGuideDialog.addEventListener('close', () => {
    generation++;
    controller?.abort();
    document.body.classList.remove('size-guide-open');
    body.removeAttribute('aria-busy');
    trigger?.focus({ preventScroll: true });
  });
}

const mobilePurchase = document.querySelector('[data-mobile-purchase]');
const purchaseRow = document.querySelector('.purchase-row');
if (mobilePurchase && purchaseRow && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => { mobilePurchase.hidden = entry.isIntersecting; }).observe(purchaseRow);
}
document.querySelector('[data-mobile-purchase-action]')?.addEventListener('click', () => {
  if (variant?.value) add?.click();
  else { document.querySelector('.product-size-picker')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); document.querySelector('[data-variant-choice]')?.focus({ preventScroll: true }); }
});
const zoom = document.querySelector('[data-product-zoom]');
document.querySelector('[data-zoom-open]')?.addEventListener('click', () => {
  const image = document.querySelector('[data-gallery-main] img');
  const enlarged = zoom?.querySelector('img');
  if (!image || !enlarged) return;
  enlarged.src = image.src; enlarged.srcset = image.srcset; enlarged.sizes = '100vw'; enlarged.alt = image.alt;
  zoom.showModal();
});
document.querySelector('[data-zoom-close]')?.addEventListener('click', () => zoom?.close());
