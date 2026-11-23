// @ts-check

const lang = document.documentElement.lang === "nb" ? "nb" : "en";
const prefix = document.body.dataset.pathPrefix || "";
const t = (en, nb) => (lang === "nb" ? nb : en);

const root = document.querySelector("[data-returns-portal]");
if (root) {
  initReturnsPortal(root);
}

/** @param {Element} portal */
function initReturnsPortal(portal) {
  const authView = portal.querySelector("[data-returns-auth]");
  const orderForm = portal.querySelector("[data-returns-order-form]");
  const linkForm = portal.querySelector("[data-returns-link-form]");
  const toggleLinkBtn = portal.querySelector("[data-returns-show-link]");
  const toggleOrderBtn = portal.querySelector("[data-returns-show-order]");
  const authStatus = portal.querySelector("[data-returns-auth-status]");
  const signedInView = portal.querySelector("[data-returns-signed-in]");
  const customerEmailEl = portal.querySelector("[data-returns-customer-email]");
  const logoutBtn = portal.querySelector("[data-returns-logout]");
  const ordersContainer = portal.querySelector("[data-returns-orders]");

  const apiUrl = (path) => `${prefix}${path}`;
  const productCache = new Map();
  let currentCustomer = null;
  let currentOrders = [];

  const formatMoney = (value, currency = "NOK") => {
    const amount = Number(value);
    const digits = amount % 1 ? 2 : 0;
    return new Intl.NumberFormat(lang === "nb" ? "nb-NO" : "en-NO", {
      style: "currency",
      currency,
      currencyDisplay: "code",
      maximumFractionDigits: digits,
    }).format(amount);
  };

  const formatDate = (iso) => {
    try {
      return new Intl.DateTimeFormat(lang === "nb" ? "nb-NO" : "en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(iso));
    } catch {
      return String(iso || "").slice(0, 10);
    }
  };

  const escapeHtml = (value = "") => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  function setAuthMessage(text, isError = false) {
    if (!authStatus) return;
    authStatus.textContent = text;
    authStatus.hidden = !text;
    authStatus.classList.toggle("is-error", isError);
    authStatus.classList.toggle("is-success", !isError && Boolean(text));
  }

  function showAuthMode(mode) {
    if (!orderForm || !linkForm) return;
    orderForm.hidden = mode !== "order";
    linkForm.hidden = mode !== "link";
    setAuthMessage("");
  }

  function showSignedOut() {
    currentCustomer = null;
    currentOrders = [];
    if (authView) authView.hidden = false;
    if (signedInView) signedInView.hidden = true;
  }

  function showSignedIn(customer, orders) {
    currentCustomer = customer;
    currentOrders = orders;
    if (authView) authView.hidden = true;
    if (signedInView) signedInView.hidden = false;
    if (customerEmailEl) {
      customerEmailEl.textContent = customer?.name
        ? `${customer.name} (${customer.email})`
        : (customer?.email || "");
    }
    renderOrders(orders);
  }

  async function extractError(response, fallback) {
    try {
      const data = await response.json();
      return data?.detail || data?.error || fallback;
    } catch {
      return fallback;
    }
  }

  async function loadSessionAndOrders(highlightReturnId = null) {
    const sessionRes = await fetch(apiUrl("/reai/customer/session"), { credentials: "same-origin" });
    if (sessionRes.status === 401) {
      showSignedOut();
      return false;
    }
    if (!sessionRes.ok) {
      showSignedOut();
      setAuthMessage(t("Could not load your orders right now. Please try again.", "Kunne ikke hente bestillingene dine akkurat nå. Prøv igjen."), true);
      return false;
    }
    const ordersRes = await fetch(apiUrl("/reai/customer/orders"), { credentials: "same-origin" });
    if (ordersRes.status === 401) {
      showSignedOut();
      return false;
    }
    if (!ordersRes.ok) {
      showSignedOut();
      setAuthMessage(t("Could not load your orders right now. Please try again.", "Kunne ikke hente bestillingene dine akkurat nå. Prøv igjen."), true);
      return false;
    }
    const customer = await sessionRes.json();
    const ordersData = await ordersRes.json();
    showSignedIn(customer, ordersData.orders || []);
    if (highlightReturnId) {
      const card = ordersContainer?.querySelector(`[data-return-id="${CSS.escape(highlightReturnId)}"]`);
      card?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return true;
  }

  /**
   * @param {string} handle
   * @returns {Promise<{ title: string, variants: Array<{ id: string, label: string, price: number | null, available: boolean | undefined }> }>}
   */
  async function loadExchangeOptions(handle) {
    if (productCache.has(handle)) return productCache.get(handle);
    const promise = (async () => {
      const productRes = await fetch(apiUrl(`/reai/products/${encodeURIComponent(handle)}`), { credentials: "same-origin" });
      if (!productRes.ok) return { title: "", variants: [] };
      const product = await productRes.json();
      const variants = product.variants || [];
      if (!variants.length) return { title: product.title || "", variants: [] };
      const params = new URLSearchParams();
      for (const variant of variants) params.append("variantId", variant.id);
      const availRes = await fetch(apiUrl(`/reai/availability?${params.toString()}`), { credentials: "same-origin" });
      const availability = {};
      if (availRes.ok) {
        const availData = await availRes.json();
        for (const item of availData.variants || []) {
          availability[item.variantId] = item.status === "AVAILABLE";
        }
      }
      return {
        title: product.title || "",
        variants: variants.map((variant) => {
          const label = variant.options?.map((option) => option.value).filter(Boolean).join(" / ") || variant.sku || t("Default", "Standard");
          const numericPrice = Number(variant.price);
          return {
            id: variant.id,
            label,
            price: Number.isFinite(numericPrice) ? numericPrice : null,
            available: availability[variant.id],
          };
        }),
      };
    })().catch(() => ({ title: "", variants: [] }));
    productCache.set(handle, promise);
    return promise;
  }

  /**
   * @param {string} query
   * @param {AbortSignal} [signal]
   * @returns {Promise<{ currency: string, products: Array<{ title: string, handle: string, image: string, price: number | null }> }>}
   */
  async function searchExchangeProducts(query, signal) {
    const res = await fetch(apiUrl(`/reai/search?q=${encodeURIComponent(query)}`), {
      credentials: "same-origin",
      signal,
    });
    if (!res.ok) return { currency: "NOK", products: [] };
    const data = await res.json();
    const products = (data.products || []).map((item) => {
      const match = String(item.url || "").match(/\/products\/([^/?#]+)/);
      const handle = match ? decodeURIComponent(match[1]) : "";
      const price = Number(item.price);
      return {
        title: item.title || "",
        handle,
        image: item.image || "",
        price: Number.isFinite(price) ? price : null,
      };
    }).filter((item) => item.handle);
    return { currency: data.currency || "NOK", products };
  }

  function reasonOptionsHtml() {
    const reasons = [
      ["", t("Select reason (optional)", "Velg årsak (valgfritt)")],
      [t("Too small", "For liten"), t("Too small", "For liten")],
      [t("Too large", "For stor"), t("Too large", "For stor")],
      [t("Not as expected", "Ikke som forventet"), t("Not as expected", "Ikke som forventet")],
      [t("Changed my mind", "Ombestemte meg"), t("Changed my mind", "Ombestemte meg")],
      [t("Defective or damaged", "Feil eller skade på varen"), t("Defective or damaged", "Feil eller skade på varen")],
    ];
    return reasons.map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("");
  }

  function orderStatusLabel(status) {
    if (status === "COMPLETED") return t("Completed", "Fullført");
    if (status === "CONFIRMED") return t("Confirmed", "Bekreftet");
    if (status === "CANCELLED") return t("Cancelled", "Kansellert");
    return status;
  }

  function renderReturnCard(ret) {
    const isExchange = ret.type === "EXCHANGE";
    const typeBadge = isExchange ? t("Exchange", "Bytte") : t("Return", "Retur");
    const itemsHtml = (ret.items || []).map((item) => {
      const exchangeLine = item.exchangeTitle
        ? `<span class="returns-exchange-target">${escapeHtml(t("Requested exchange:", "Ønsket bytte til:"))} <strong>${escapeHtml(item.exchangeTitle)}</strong></span>`
        : "";
      const reasonLine = item.reason ? `<span class="returns-item-meta">${escapeHtml(item.reason)}</span>` : "";
      return `<li><span>${item.quantity} × ${escapeHtml(item.title)}</span>${reasonLine}${exchangeLine}</li>`;
    }).join("");

    let shippingHtml = "";
    const ship = ret.shipping;
    if (ship?.status === "READY" && ship.format === "QR" && ship.printCode) {
      const labelHref = apiUrl(`/reai/customer/returns/${encodeURIComponent(ret.id)}/label`);
      shippingHtml = `
        <div class="returns-qr-box">
          <div class="returns-qr-header">
            <strong>${escapeHtml(t("PostNord QR return code", "PostNord QR-kode for retur"))}</strong>
            <span>${escapeHtml(t("No printer needed", "Ingen skriver nødvendig"))}</span>
          </div>
          ${ship.qrCodeDataUrl ? `<img class="returns-qr-img" src="${escapeHtml(ship.qrCodeDataUrl)}" alt="${escapeHtml(t("PostNord return QR code", "PostNord QR-kode for retur"))}" width="180" height="180">` : ""}
          <p class="returns-qr-code" aria-label="${escapeHtml(t("Return code", "Returkode"))}">${escapeHtml(ship.printCode)}</p>
          <p class="returns-qr-instructions">${escapeHtml(t(
            "Pack the shoes in their original box inside protective outer packaging. Show this QR code or 6-character code at any PostNord service point — they will print and attach the return label for you. A copy has also been sent to your email.",
            "Pakk skoene i originalemballasjen med beskyttende ytteremballasje. Vis denne QR-koden eller koden på 6 tegn hos et PostNord-innleveringssted, så skriver de ut og fester returetiketten for deg. En kopi er også sendt på e-post.",
          ))}</p>
          <div class="returns-qr-actions">
            <a class="returns-secondary-btn" href="${escapeHtml(labelHref)}">${escapeHtml(t("Download QR sheet (PDF)", "Last ned QR-ark (PDF)"))}</a>
            ${ship.trackingUrl ? `<a class="returns-link-btn" href="${escapeHtml(ship.trackingUrl)}" target="_blank" rel="noopener">${escapeHtml(t("Track return ↗", "Spor retur ↗"))}</a>` : ""}
          </div>
        </div>
      `;
    } else if (ship?.status === "READY" && ship.labelAvailable) {
      const labelHref = apiUrl(`/reai/customer/returns/${encodeURIComponent(ret.id)}/label`);
      shippingHtml = `
        <div class="returns-shipping-note">
          <p>${escapeHtml(t("Your prepaid return label is ready. A copy has also been sent to your email.", "Den forhåndsbetalte returetiketten din er klar. En kopi er også sendt på e-post."))}</p>
          <a class="returns-secondary-btn" href="${escapeHtml(labelHref)}">${escapeHtml(t("Download return label (PDF)", "Last ned returetikett (PDF)"))}</a>
        </div>
      `;
    } else {
      shippingHtml = `
        <div class="returns-shipping-note">
          <p>${escapeHtml(t(
            "Your request has been registered. Our team will email you return instructions shortly.",
            "Forespørselen din er registrert. Vi sender deg instruksjoner for retur på e-post så snart som mulig.",
          ))}</p>
        </div>
      `;
    }

    return `
      <article class="returns-submitted-card" data-return-id="${escapeHtml(ret.id)}">
        <header>
          <span class="returns-pill${isExchange ? " is-exchange" : ""}">${escapeHtml(typeBadge)}</span>
          <time datetime="${escapeHtml(ret.createdAt)}">${escapeHtml(formatDate(ret.createdAt))}</time>
        </header>
        <ul class="returns-submitted-items">${itemsHtml}</ul>
        ${ret.comment ? `<p class="returns-submitted-comment">${escapeHtml(ret.comment)}</p>` : ""}
        ${shippingHtml}
      </article>
    `;
  }

  function renderOrderForm(order) {
    const returnableLines = (order.lines || []).filter((line) => line.returnableQuantity > 0);
    if (!returnableLines.length) return "";
    const defaultSelected = returnableLines.length === 1;
    const rowsHtml = returnableLines.map((line) => {
      const optionSummary = (line.options || []).map((opt) => `${opt.name}: ${opt.value}`).join(" · ");
      const qtySelect = line.returnableQuantity > 1
        ? `<label class="returns-qty-field"><span>${escapeHtml(t("Qty", "Antall"))}</span><select data-item-qty="${line.lineNumber}">${Array.from({ length: line.returnableQuantity }, (_, idx) => `<option value="${idx + 1}">${idx + 1}</option>`).join("")}</select></label>`
        : `<input type="hidden" data-item-qty="${line.lineNumber}" value="1">`;
      const hasOriginalProduct = Boolean(line.productHandle);
      const originalHandle = line.productHandle || "";
      const originalDisplayTitle = line.title.replace(/\s+[—–-]\s+[^—–-]+$/, "").trim() || line.title;
      const exchangeRow = `
        <div class="returns-exchange-panel" data-exchange-field="${line.lineNumber}" hidden>
          <div class="returns-exchange-product-bar">
            <div class="returns-exchange-product-current">
              <span class="returns-exchange-kicker">${escapeHtml(t("Exchange for", "Bytt til"))}</span>
              <strong data-exchange-product-name="${line.lineNumber}">${escapeHtml(hasOriginalProduct ? originalDisplayTitle : t("Choose a product", "Velg et produkt"))}</strong>
            </div>
            <div class="returns-exchange-product-actions">
              <button type="button" class="returns-exchange-action" data-exchange-change-product="${line.lineNumber}">${escapeHtml(hasOriginalProduct ? t("Choose different product", "Velg annet produkt") : t("Search products", "Søk produkter"))}</button>
              ${hasOriginalProduct ? `<button type="button" class="returns-exchange-action" data-exchange-reset-product="${line.lineNumber}" hidden>${escapeHtml(t("Same product", "Samme produkt"))}</button>` : ""}
            </div>
          </div>
          <div class="returns-exchange-search" data-exchange-search="${line.lineNumber}"${hasOriginalProduct ? " hidden" : ""}>
            <input type="search" data-exchange-search-input="${line.lineNumber}" autocomplete="off" maxlength="120" aria-label="${escapeHtml(t("Search replacement product", "Søk etter erstatningsprodukt"))}" placeholder="${escapeHtml(t("Search model or color (e.g. Cloud Boot, Allrounder, Zen)", "Søk etter modell eller farge (f.eks. Cloud Boot, Allrounder, Zen)"))}">
            <div class="returns-exchange-results" data-exchange-results="${line.lineNumber}" role="listbox" hidden></div>
          </div>
          <label class="returns-exchange-field" data-exchange-size-wrap="${line.lineNumber}"${hasOriginalProduct ? "" : " hidden"}>
            <span>${escapeHtml(t("New size / variant", "Ny størrelse / variant"))}</span>
            <select data-exchange-select="${line.lineNumber}" data-product-handle="${escapeHtml(originalHandle)}" data-original-handle="${escapeHtml(originalHandle)}" data-original-title="${escapeHtml(originalDisplayTitle)}" data-original-price="${escapeHtml(line.unitPrice)}" data-currency="${escapeHtml(order.currency)}" data-current-variant="${escapeHtml(line.variantId || "")}">
              <option value="">${escapeHtml(t("Loading sizes…", "Laster størrelser …"))}</option>
            </select>
          </label>
          <p class="returns-exchange-price-note" data-exchange-price-note="${line.lineNumber}" hidden></p>
        </div>
      `;
      return `
        <div class="returns-form-item" data-form-line="${line.lineNumber}">
          <label class="returns-check-row">
            <input type="checkbox" data-item-check="${line.lineNumber}"${defaultSelected ? " checked" : ""}>
            <span>
              <strong>${escapeHtml(line.title)}</strong>
              ${optionSummary ? `<small>${escapeHtml(optionSummary)}</small>` : ""}
            </span>
            <span class="returns-item-price">${escapeHtml(formatMoney(line.lineTotal, order.currency))}</span>
          </label>
          <div class="returns-item-controls" data-item-controls="${line.lineNumber}"${defaultSelected ? "" : " hidden"}>
            ${qtySelect}
            <label class="returns-reason-field">
              <span>${escapeHtml(t("Reason", "Årsak"))}</span>
              <select data-item-reason="${line.lineNumber}">${reasonOptionsHtml()}</select>
            </label>
            ${exchangeRow}
          </div>
        </div>
      `;
    }).join("");

    return `
      <form class="returns-composer" data-return-composer="${escapeHtml(order.id)}" hidden>
        <fieldset class="returns-type-fieldset">
          <legend>${escapeHtml(t("What would you like to do?", "Hva ønsker du å gjøre?"))}</legend>
          <div class="returns-type-options">
            <label class="returns-type-option">
              <input type="radio" name="returnType-${escapeHtml(order.id)}" value="EXCHANGE" checked>
              <span><strong>${escapeHtml(t("Exchange", "Bytte"))}</strong><small>${escapeHtml(t("Free size or item exchange", "Gratis bytte av størrelse eller vare"))}</small></span>
            </label>
            <label class="returns-type-option">
              <input type="radio" name="returnType-${escapeHtml(order.id)}" value="RETURN">
              <span><strong>${escapeHtml(t("Return for refund", "Retur for refusjon"))}</strong><small>${escapeHtml(t("Free return within 30 days", "Gratis retur innen 30 dager"))}</small></span>
            </label>
          </div>
        </fieldset>
        <div class="returns-form-items">${rowsHtml}</div>
        <label class="returns-comment-field">
          <span>${escapeHtml(t("Note (optional)", "Kommentar (valgfritt)"))}</span>
          <textarea data-return-comment rows="2" maxlength="500" placeholder="${escapeHtml(t("Add any details about your return or preferred exchange", "Legg til eventuelle detaljer om returen eller byttet"))}"></textarea>
        </label>
        <p class="returns-form-error" data-return-error role="alert" hidden></p>
        <div class="returns-form-actions">
          <button type="submit" class="returns-primary-btn" data-return-submit>${escapeHtml(t("Submit exchange", "Send bytteforespørsel"))}</button>
          <button type="button" class="returns-ghost-btn" data-cancel-composer>${escapeHtml(t("Cancel", "Avbryt"))}</button>
        </div>
      </form>
    `;
  }

  function renderOrders(orders) {
    if (!ordersContainer) return;
    if (!orders.length) {
      ordersContainer.innerHTML = `<p class="returns-empty">${escapeHtml(t("We could not find any orders for this email address.", "Vi fant ingen bestillinger for denne e-postadressen."))}</p>`;
      return;
    }

    ordersContainer.innerHTML = orders.map((order) => {
      const linesHtml = (order.lines || []).map((line) => {
        const returnedNote = line.returnedQuantity > 0
          ? `<span class="returns-line-badge">${escapeHtml(t(`${line.returnedQuantity} returned`, `${line.returnedQuantity} registrert i retur`))}</span>`
          : "";
        return `
          <li>
            <div>
              <strong>${escapeHtml(line.title)}</strong>
              <span class="returns-item-meta">${line.quantity} × ${escapeHtml(formatMoney(line.unitPrice, order.currency))}</span>
              ${returnedNote}
            </div>
            <span>${escapeHtml(formatMoney(line.lineTotal, order.currency))}</span>
          </li>
        `;
      }).join("");

      const trackingHtml = (order.shipments || []).filter((s) => s.trackingNumber).map((s) => (
        s.trackingUrl
          ? `<a class="returns-link-btn" href="${escapeHtml(s.trackingUrl)}" target="_blank" rel="noopener">${escapeHtml(s.carrierName)}: ${escapeHtml(s.trackingNumber)} ↗</a>`
          : `<span class="returns-item-meta">${escapeHtml(s.carrierName)}: ${escapeHtml(s.trackingNumber)}</span>`
      )).join(" ");

      const returnsHtml = (order.returns || []).length
        ? `<div class="returns-existing-list">${order.returns.map(renderReturnCard).join("")}</div>`
        : "";

      const actionHtml = order.canReturn
        ? `<button type="button" class="returns-primary-btn" data-open-composer="${escapeHtml(order.id)}">${escapeHtml(t("Return or exchange", "Registrer retur eller bytte"))}</button>`
        : `<p class="returns-blocked-note">${escapeHtml(
          order.returnBlockedReason === "CANCELLED"
            ? t("Cancelled orders cannot be returned.", "Kansellerte bestillinger kan ikke returneres.")
            : order.returnBlockedReason === "ALREADY_RETURNED"
              ? t("All items on this order are already registered for return.", "Alle varer i denne bestillingen er allerede registrert for retur.")
              : t("This order is not yet eligible for return.", "Denne bestillingen er ikke klar for retur ennå."),
        )}</p>`;

      return `
        <section class="returns-order-card" data-order-card="${escapeHtml(order.id)}">
          <header class="returns-order-header">
            <div>
              <h2>${escapeHtml(t("Order", "Ordre"))} ${escapeHtml(order.orderNumber)}</h2>
              <p class="returns-order-meta">
                <time datetime="${escapeHtml(order.orderedAt)}">${escapeHtml(formatDate(order.orderedAt))}</time>
                · ${escapeHtml(orderStatusLabel(order.status))}
              </p>
            </div>
            <strong class="returns-order-total">${escapeHtml(formatMoney(order.total, order.currency))}</strong>
          </header>
          <ul class="returns-order-lines">${linesHtml}</ul>
          ${trackingHtml ? `<div class="returns-order-tracking">${trackingHtml}</div>` : ""}
          ${returnsHtml}
          <div class="returns-order-footer">${actionHtml}</div>
          ${order.canReturn ? renderOrderForm(order) : ""}
        </section>
      `;
    }).join("");

    // Bind composer interactions for each order
    for (const order of orders) {
      if (!order.canReturn) continue;
      const card = ordersContainer.querySelector(`[data-order-card="${CSS.escape(order.id)}"]`);
      const openBtn = card?.querySelector(`[data-open-composer="${CSS.escape(order.id)}"]`);
      const form = card?.querySelector(`[data-return-composer="${CSS.escape(order.id)}"]`);
      const cancelBtn = form?.querySelector("[data-cancel-composer]");
      const submitBtn = form?.querySelector("[data-return-submit]");
      const errorEl = form?.querySelector("[data-return-error]");
      if (!form || !openBtn) continue;

      let idempotencyKey = crypto.randomUUID();

      const currentType = () => form.querySelector(`input[name="returnType-${CSS.escape(order.id)}"]:checked`)?.value || "RETURN";

      const updatePriceDifference = (select) => {
        const lineNumber = select.getAttribute("data-exchange-select");
        const noteEl = form.querySelector(`[data-exchange-price-note="${lineNumber}"]`);
        if (!noteEl) return;
        const selectedOption = select.selectedOptions?.[0];
        const newPrice = Number(selectedOption?.getAttribute("data-price"));
        const originalPrice = Number(select.getAttribute("data-original-price"));
        const currency = select.getAttribute("data-currency") || order.currency || "NOK";
        if (!select.value || !Number.isFinite(newPrice) || !Number.isFinite(originalPrice) || Math.abs(newPrice - originalPrice) < 0.01) {
          noteEl.textContent = "";
          noteEl.hidden = true;
          return;
        }
        const diff = newPrice - originalPrice;
        const absFormatted = formatMoney(Math.abs(diff), currency);
        const newFormatted = formatMoney(newPrice, currency);
        noteEl.textContent = diff > 0
          ? t(
            `Selected item costs ${newFormatted} (+${absFormatted} vs. original item). Our team will follow up on the difference.`,
            `Valgt vare koster ${newFormatted} (+${absFormatted} sammenlignet med opprinnelig vare). Vi følger opp mellomlegget med deg.`,
          )
          : t(
            `Selected item costs ${newFormatted} (−${absFormatted} vs. original item). We will refund the difference once received.`,
            `Valgt vare koster ${newFormatted} (−${absFormatted} sammenlignet med opprinnelig vare). Vi refunderer mellomlegget når returen er mottatt.`,
          );
        noteEl.hidden = false;
      };

      /** @param {HTMLSelectElement} select */
      const populateExchangeSelect = async (select) => {
        const lineNumber = select.getAttribute("data-exchange-select");
        const handle = select.getAttribute("data-product-handle") || "";
        const sizeWrap = form.querySelector(`[data-exchange-size-wrap="${lineNumber}"]`);
        if (!handle) {
          if (sizeWrap) /** @type {HTMLElement} */ (sizeWrap).hidden = true;
          select.innerHTML = `<option value="">${escapeHtml(t("Choose a product above first", "Velg et produkt ovenfor først"))}</option>`;
          updatePriceDifference(select);
          return;
        }
        if (sizeWrap) /** @type {HTMLElement} */ (sizeWrap).hidden = false;
        if (select.dataset.loadedHandle === handle) return;
        select.dataset.loadedHandle = handle;
        select.innerHTML = `<option value="">${escapeHtml(t("Loading sizes…", "Laster størrelser …"))}</option>`;
        updatePriceDifference(select);
        const currentVariantId = select.getAttribute("data-current-variant");
        const productData = await loadExchangeOptions(handle);
        if (select.getAttribute("data-product-handle") !== handle) return;
        const nameEl = form.querySelector(`[data-exchange-product-name="${lineNumber}"]`);
        if (nameEl && productData.title) nameEl.textContent = productData.title;
        const variants = productData.variants || [];
        const availableVariants = variants.filter((v) => v.available !== false);
        const autoSelectId = variants.length === 1 && availableVariants.length === 1 && variants[0].id !== currentVariantId
          ? variants[0].id
          : "";
        const options = [
          `<option value="">${escapeHtml(t("Choose a new size (or describe in note)", "Velg ny størrelse (eller skriv i kommentarfeltet)"))}</option>`,
          ...variants.map((variant) => {
            const isCurrent = variant.id === currentVariantId;
            const soldOut = variant.available === false;
            const suffix = isCurrent
              ? t(" (current size)", " (nåværende størrelse)")
              : soldOut
                ? t(" — Sold out", " – utsolgt")
                : "";
            const selected = variant.id === autoSelectId ? " selected" : "";
            const priceAttr = variant.price != null ? ` data-price="${escapeHtml(variant.price)}"` : "";
            return `<option value="${escapeHtml(variant.id)}"${priceAttr}${soldOut ? " disabled" : ""}${selected}>${escapeHtml(variant.label + suffix)}</option>`;
          }),
        ];
        select.innerHTML = options.join("");
        updatePriceDifference(select);
      };

      const syncExchangeVisibility = async () => {
        const isExchange = currentType() === "EXCHANGE";
        if (submitBtn) {
          submitBtn.textContent = isExchange
            ? t("Submit exchange", "Send bytteforespørsel")
            : t("Submit return", "Send returforespørsel");
        }
        const selects = /** @type {NodeListOf<HTMLSelectElement>} */ (form.querySelectorAll("[data-exchange-select]"));
        for (const select of selects) {
          const lineNumber = select.getAttribute("data-exchange-select");
          const field = /** @type {HTMLElement | null} */ (form.querySelector(`[data-exchange-field="${lineNumber}"]`));
          const checked = /** @type {HTMLInputElement | null} */ (form.querySelector(`[data-item-check="${lineNumber}"]`))?.checked;
          if (field) field.hidden = !isExchange || !checked;
          if (isExchange && checked) {
            populateExchangeSelect(select);
          }
        }
      };

      /** @type {Map<string, { timer: ReturnType<typeof setTimeout> | null, controller: AbortController | null }>} */
      const searchState = new Map();

      const setExchangeProduct = (lineNumber, handle, title) => {
        const select = /** @type {HTMLSelectElement | null} */ (form.querySelector(`[data-exchange-select="${lineNumber}"]`));
        const nameEl = form.querySelector(`[data-exchange-product-name="${lineNumber}"]`);
        const searchBox = /** @type {HTMLElement | null} */ (form.querySelector(`[data-exchange-search="${lineNumber}"]`));
        const searchInput = /** @type {HTMLInputElement | null} */ (form.querySelector(`[data-exchange-search-input="${lineNumber}"]`));
        const resultsEl = /** @type {HTMLElement | null} */ (form.querySelector(`[data-exchange-results="${lineNumber}"]`));
        const resetBtn = /** @type {HTMLElement | null} */ (form.querySelector(`[data-exchange-reset-product="${lineNumber}"]`));
        if (!select) return;
        const originalHandle = select.getAttribute("data-original-handle") || "";
        select.setAttribute("data-product-handle", handle);
        delete select.dataset.loadedHandle;
        if (nameEl) nameEl.textContent = title || select.getAttribute("data-original-title") || "";
        if (resetBtn) resetBtn.hidden = !originalHandle || handle === originalHandle;
        if (searchBox) searchBox.hidden = true;
        if (searchInput) searchInput.value = "";
        if (resultsEl) {
          resultsEl.innerHTML = "";
          resultsEl.hidden = true;
        }
        idempotencyKey = crypto.randomUUID();
        populateExchangeSelect(select);
      };

      form.addEventListener("click", (event) => {
        const target = /** @type {HTMLElement | null} */ (event.target);
        const changeBtn = target?.closest("[data-exchange-change-product]");
        if (changeBtn) {
          const lineNumber = changeBtn.getAttribute("data-exchange-change-product");
          const searchBox = /** @type {HTMLElement | null} */ (form.querySelector(`[data-exchange-search="${lineNumber}"]`));
          const searchInput = /** @type {HTMLInputElement | null} */ (form.querySelector(`[data-exchange-search-input="${lineNumber}"]`));
          if (searchBox) {
            searchBox.hidden = !searchBox.hidden;
            if (!searchBox.hidden) searchInput?.focus();
          }
          return;
        }
        const resetBtn = target?.closest("[data-exchange-reset-product]");
        if (resetBtn) {
          const lineNumber = resetBtn.getAttribute("data-exchange-reset-product");
          const select = form.querySelector(`[data-exchange-select="${lineNumber}"]`);
          const originalHandle = select?.getAttribute("data-original-handle") || "";
          const originalTitle = select?.getAttribute("data-original-title") || "";
          if (lineNumber && originalHandle) setExchangeProduct(lineNumber, originalHandle, originalTitle);
          return;
        }
        const resultBtn = target?.closest("[data-exchange-pick-handle]");
        if (resultBtn) {
          const lineNumber = resultBtn.getAttribute("data-exchange-pick-line");
          const handle = resultBtn.getAttribute("data-exchange-pick-handle") || "";
          const title = resultBtn.getAttribute("data-exchange-pick-title") || "";
          if (lineNumber && handle) setExchangeProduct(lineNumber, handle, title);
        }
      });

      form.addEventListener("input", (event) => {
        const target = /** @type {HTMLElement | null} */ (event.target);
        if (!target?.matches("[data-exchange-search-input]")) return;
        const input = /** @type {HTMLInputElement} */ (target);
        const lineNumber = input.getAttribute("data-exchange-search-input") || "";
        const resultsEl = /** @type {HTMLElement | null} */ (form.querySelector(`[data-exchange-results="${lineNumber}"]`));
        if (!resultsEl) return;
        const state = searchState.get(lineNumber) || { timer: null, controller: null };
        if (state.timer) clearTimeout(state.timer);
        if (state.controller) state.controller.abort();
        const query = input.value.trim();
        if (query.length < 2) {
          resultsEl.innerHTML = "";
          resultsEl.hidden = true;
          searchState.set(lineNumber, { timer: null, controller: null });
          return;
        }
        const timer = setTimeout(async () => {
          const controller = new AbortController();
          searchState.set(lineNumber, { timer: null, controller });
          try {
            const { currency, products } = await searchExchangeProducts(query, controller.signal);
            if (controller.signal.aborted) return;
            if (!products.length) {
              resultsEl.innerHTML = `<p class="returns-exchange-empty">${escapeHtml(t("No matching products found.", "Fant ingen produkter som passer."))}</p>`;
              resultsEl.hidden = false;
              return;
            }
            resultsEl.innerHTML = products.map((product) => `
              <button type="button" class="returns-exchange-result" role="option" data-exchange-pick-line="${escapeHtml(lineNumber)}" data-exchange-pick-handle="${escapeHtml(product.handle)}" data-exchange-pick-title="${escapeHtml(product.title)}">
                ${product.image ? `<img src="${escapeHtml(product.image)}" alt="" width="48" height="48" loading="lazy">` : `<span class="returns-exchange-thumb-placeholder" aria-hidden="true"></span>`}
                <span class="returns-exchange-result-copy">
                  <strong>${escapeHtml(product.title)}</strong>
                  ${product.price != null ? `<small>${escapeHtml(formatMoney(product.price, currency))}</small>` : ""}
                </span>
              </button>
            `).join("");
            resultsEl.hidden = false;
          } catch (error) {
            if (/** @type {Error} */ (error)?.name !== "AbortError") {
              resultsEl.innerHTML = `<p class="returns-exchange-empty">${escapeHtml(t("Could not search products right now.", "Kunne ikke søke i produkter akkurat nå."))}</p>`;
              resultsEl.hidden = false;
            }
          }
        }, 180);
        searchState.set(lineNumber, { timer, controller: null });
      });

      const footer = openBtn.closest(".returns-order-footer");
      openBtn.addEventListener("click", () => {
        form.hidden = false;
        openBtn.hidden = true;
        if (footer) /** @type {HTMLElement} */ (footer).hidden = true;
        idempotencyKey = crypto.randomUUID();
        syncExchangeVisibility();
      });

      cancelBtn?.addEventListener("click", () => {
        form.hidden = true;
        openBtn.hidden = false;
        if (footer) /** @type {HTMLElement} */ (footer).hidden = false;
        if (errorEl) {
          errorEl.textContent = "";
          errorEl.hidden = true;
        }
      });

      form.addEventListener("change", (event) => {
        const target = /** @type {HTMLElement} */ (event.target);
        if (target?.matches("[data-item-check]")) {
          const lineNumber = target.getAttribute("data-item-check");
          const controls = form.querySelector(`[data-item-controls="${lineNumber}"]`);
          if (controls) controls.hidden = !/** @type {HTMLInputElement} */ (target).checked;
        }
        if (target?.matches("[data-exchange-select]")) {
          updatePriceDifference(/** @type {HTMLSelectElement} */ (target));
        }
        idempotencyKey = crypto.randomUUID();
        syncExchangeVisibility();
      });

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (errorEl) {
          errorEl.textContent = "";
          errorEl.hidden = true;
        }
        const type = currentType();
        const checkedBoxes = [...form.querySelectorAll("[data-item-check]:checked")];
        if (!checkedBoxes.length) {
          if (errorEl) {
            errorEl.textContent = t("Select at least one item.", "Velg minst én vare.");
            errorEl.hidden = false;
          }
          return;
        }
        const items = checkedBoxes.map((checkbox) => {
          const lineNumber = Number(checkbox.getAttribute("data-item-check"));
          const qtyEl = /** @type {HTMLInputElement | HTMLSelectElement | null} */ (form.querySelector(`[data-item-qty="${lineNumber}"]`));
          const reasonEl = /** @type {HTMLSelectElement | null} */ (form.querySelector(`[data-item-reason="${lineNumber}"]`));
          const exchangeEl = /** @type {HTMLSelectElement | null} */ (form.querySelector(`[data-exchange-select="${lineNumber}"]`));
          const quantity = Number(qtyEl?.value || 1);
          const reason = reasonEl?.value?.trim() || undefined;
          const exchangeVariantId = type === "EXCHANGE" && exchangeEl?.value ? exchangeEl.value : undefined;
          return {
            lineNumber,
            quantity,
            ...(reason ? { reason } : {}),
            ...(exchangeVariantId ? { exchangeVariantId } : {}),
          };
        });
        const commentEl = /** @type {HTMLTextAreaElement | null} */ (form.querySelector("[data-return-comment]"));
        const comment = commentEl?.value?.trim() || undefined;

        if (submitBtn) submitBtn.disabled = true;
        try {
          const response = await fetch(apiUrl("/reai/customer/returns"), {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "Content-Type": "application/json",
              "Idempotency-Key": idempotencyKey,
            },
            body: JSON.stringify({
              orderId: order.id,
              type,
              items,
              ...(comment ? { comment } : {}),
            }),
          });
          if (response.status === 401) {
            showSignedOut();
            setAuthMessage(t("Your session expired. Please sign in again.", "Økten din er utløpt. Logg inn på nytt."), true);
            return;
          }
          if (!response.ok) {
            const msg = await extractError(response, t("Could not submit your request. Please try again.", "Kunne ikke sende forespørselen. Prøv igjen."));
            if (errorEl) {
              errorEl.textContent = msg;
              errorEl.hidden = false;
            }
            return;
          }
          const created = await response.json();
          await loadSessionAndOrders(created.id);
        } catch {
          if (errorEl) {
            errorEl.textContent = t("Connection error. Please try again.", "Tilkoblingsfeil. Prøv igjen.");
            errorEl.hidden = false;
          }
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }
  }

  toggleLinkBtn?.addEventListener("click", () => showAuthMode("link"));
  toggleOrderBtn?.addEventListener("click", () => showAuthMode("order"));

  orderForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setAuthMessage("");
    const data = new FormData(/** @type {HTMLFormElement} */ (orderForm));
    const email = String(data.get("email") || "").trim();
    const orderNumber = String(data.get("orderNumber") || "").trim();
    const button = /** @type {HTMLButtonElement | null} */ (orderForm.querySelector('button[type="submit"]'));
    if (button) button.disabled = true;
    try {
      const response = await fetch(apiUrl("/reai/customer/login"), {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, orderNumber }),
      });
      if (!response.ok) {
        const message = response.status === 401
          ? t("We couldn’t match that email and order number. Check your order confirmation or request a sign-in link by email.", "Vi fant ingen bestilling som passer med denne e-postadressen og ordrenummeret. Sjekk ordrebekreftelsen eller be om en innloggingslenke på e-post.")
          : await extractError(response, t("Could not sign in. Please try again.", "Kunne ikke logge inn. Prøv igjen."));
        setAuthMessage(message, true);
        return;
      }
      await loadSessionAndOrders();
    } catch {
      setAuthMessage(t("Connection error. Please try again.", "Tilkoblingsfeil. Prøv igjen."), true);
    } finally {
      if (button) button.disabled = false;
    }
  });

  linkForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    setAuthMessage("");
    const data = new FormData(/** @type {HTMLFormElement} */ (linkForm));
    const email = String(data.get("email") || "").trim();
    const button = /** @type {HTMLButtonElement | null} */ (linkForm.querySelector('button[type="submit"]'));
    if (button) button.disabled = true;
    try {
      const response = await fetch(apiUrl("/reai/customer/login-link"), {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const message = await extractError(response, t("Could not send the sign-in link. Please try again.", "Kunne ikke sende innloggingslenken. Prøv igjen."));
        setAuthMessage(message, true);
        return;
      }
      setAuthMessage(t(
        "Check your email. If we found orders for this address, we’ve sent a one-time sign-in link valid for 30 minutes.",
        "Sjekk e-posten din. Hvis vi fant bestillinger for denne adressen, har vi sendt en engangslenke som er gyldig i 30 minutter.",
      ), false);
    } catch {
      setAuthMessage(t("Connection error. Please try again.", "Tilkoblingsfeil. Prøv igjen."), true);
    } finally {
      if (button) button.disabled = false;
    }
  });

  logoutBtn?.addEventListener("click", async () => {
    await fetch(apiUrl("/reai/customer/logout"), { method: "POST", credentials: "same-origin" }).catch(() => null);
    showSignedOut();
    showAuthMode("order");
  });

  const url = new URL(window.location.href);
  if (url.searchParams.get("loginError") === "expired") {
    setAuthMessage(t("That sign-in link has expired or was already used. Sign in below or request a new link.", "Innloggingslenken er utløpt eller allerede brukt. Logg inn nedenfor eller be om en ny lenke."), true);
    url.searchParams.delete("loginError");
    window.history.replaceState({}, "", url.pathname + url.search);
  }

  // Silently check for an active customer session cookie
  loadSessionAndOrders();
}
