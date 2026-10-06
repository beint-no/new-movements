const root = document.querySelector('[data-merchant-checkout]');
const form = root.querySelector('[data-customer-form]');
const message = root.querySelector('[data-checkout-message]');
const pay = root.querySelector('[data-payment-handoff]');
const isConfirmation = new URL(location.href).searchParams.has('confirmation');
const shippingRoot = root.querySelector('[data-checkout-shipping]');
let checkout;
let selection = {};
let reviewedCustomer;
let busy = false;
const money = value => new Intl.NumberFormat('en-NO', { style: 'currency', currency: checkout.currency }).format(value);
const customer = () => Object.fromEntries(new FormData(form));
const showMessage = value => { message.textContent = value; message.hidden = !value; };
function textElement(tag, text) { const element = document.createElement(tag); element.textContent = text; return element; }
async function api(action, body) {
  const response = await fetch(`/reai/checkout/${action}`, { method: body ? 'POST' : 'GET', credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : {}, ...(body ? { body: JSON.stringify(body) } : {}) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.detail || result.error || 'Checkout is temporarily unavailable. Please try again.');
  return result;
}
function totals() {
  root.querySelector('[data-checkout-lines]').replaceChildren(...checkout.lines.map(line => textElement('p', `${line.title} ${line.options} × ${line.quantity} — ${money(line.total)}`)));
  const entries = [['Discount', checkout.discount], ['Delivery', checkout.shipping], ['VAT included', checkout.vat], ['Total', checkout.total]];
  root.querySelector('[data-checkout-totals]').replaceChildren(...entries.flatMap(([name, value]) => [textElement('dt', name), textElement('dd', value === null ? 'Select delivery' : money(value))]));
  root.querySelector('[data-discount-form] input').value = checkout.discountCode || '';
  root.querySelector('[data-business-field]').hidden = !checkout.businessSalesEnabled;
  pay.disabled = busy || !reviewedCustomer || reviewedCustomer !== JSON.stringify(customer()) || checkout.expired || checkout.completed || (checkout.shippingRequired && checkout.shipping === null);
}
async function run(action) {
  if (busy) return;
  busy = true;
  root.querySelector('[data-checkout-layout]').inert = true;
  root.querySelectorAll('button').forEach(button => { button.disabled = true; });
  showMessage('');
  try { await action(); } catch (error) { showMessage(error.message); }
  finally { busy = false; root.querySelector('[data-checkout-layout]').inert = false; root.querySelectorAll('button').forEach(button => { button.disabled = false; }); if (checkout) totals(); }
}
function shippingChoices(result) {
  shippingRoot.replaceChildren();
  for (const method of checkout.shippingMethods) {
    const label = textElement('label', `${method.name} — ${money(method.price)}${method.pickupDetails ? ` · ${method.pickupDetails}` : ''}`);
    const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'delivery'; radio.checked = selection.methodId === method.id;
    radio.addEventListener('change', () => run(() => selectShipping({ methodId: method.id })));
    label.prepend(radio); shippingRoot.append(label);
  }
  for (const option of result.options || []) {
    const label = textElement('label', `${option.name} — ${money(option.price)}`);
    const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'delivery'; radio.checked = result.selectedOptionToken === option.token;
    radio.addEventListener('change', () => run(() => selectShipping({ optionToken: option.token })));
    label.prepend(radio); shippingRoot.append(label);
    if (radio.checked && option.pickupRequired) {
      const select = document.createElement('select'); select.setAttribute('aria-label', 'Pickup location');
      const placeholder = textElement('option', 'Choose pickup location'); placeholder.value = ''; select.append(placeholder);
      for (const pickup of option.pickups) { const entry = textElement('option', `${pickup.name} · ${pickup.address}`); entry.value = pickup.token; select.append(entry); }
      select.value = result.selectedPickupToken || '';
      select.addEventListener('change', () => run(() => selectShipping({ optionToken: option.token, pickupToken: select.value || null })));
      shippingRoot.append(select);
    }
  }
  if (result.error) showMessage(shippingError(result.error));
}
function shippingError(code) {
  return ({ address_incomplete: 'Complete your delivery address.', option_expired: 'Delivery options have expired. Please choose again.',
    pickup_selection_invalid: 'Choose a valid pickup location.', temporary_provider_failure: 'Delivery options are temporarily unavailable. Please try again.',
    no_shipping_option_available: 'No delivery options are available for this address.' })[code] || 'Delivery could not be confirmed. Please check your details or contact us.';
}
async function selectShipping(nextSelection = {}) {
  const details = customer();
  const result = await api('shipping', { customer: details, ...nextSelection });
  checkout = result.checkout;
  selection = nextSelection.methodId ? nextSelection : { optionToken: result.selectedOptionToken, pickupToken: result.selectedPickupToken };
  reviewedCustomer = result.error ? null : JSON.stringify(details);
  shippingChoices(result); totals();
}
form.addEventListener('input', () => {
  reviewedCustomer = null; selection = {}; shippingRoot.replaceChildren(); pay.disabled = true;
});
form.addEventListener('submit', event => { event.preventDefault(); run(() => selectShipping()); });
const discountForm = root.querySelector('[data-discount-form]');
async function discount(code) {
  checkout = await api('discount', { code }); reviewedCustomer = null; selection = {}; shippingRoot.replaceChildren(); totals();
  showMessage('Discount updated. Confirm your delivery options again.');
}
discountForm.addEventListener('submit', event => { event.preventDefault(); run(() => discount(new FormData(discountForm).get('code'))); });
root.querySelector('[data-remove-discount]').addEventListener('click', () => run(() => discount(null)));
pay.addEventListener('click', () => run(async () => {
  if (!form.reportValidity() || reviewedCustomer !== JSON.stringify(customer())) throw new Error('Confirm delivery after editing your details.');
  const result = await api('payment', { shipping: { customer: customer(), ...selection }, displayedAmountValue: Math.round(Number(checkout.total) * 100), displayedCurrency: checkout.currency });
  const target = new URL(result.paymentUrl);
  if (target.origin !== 'https://app.reai.no' || !/^\/checkout\/session\/[a-f0-9]{32}$/.test(target.pathname)) throw new Error('Invalid payment destination.');
  location.assign(target.href);
}));
run(async () => {
  checkout = await api('read');
  if (isConfirmation) {
    if (checkout.completed) {
      root.querySelector('h1').textContent = 'Thank you';
      showMessage('Your order is confirmed. Confirmation and delivery details will be sent to your email.');
      localStorage.removeItem('newmovements-cart-v1');
    } else showMessage('Payment has not yet been confirmed. Return to checkout or check your confirmation email.');
    return;
  }
  if (checkout.completed) { showMessage('This checkout has already been submitted. Please check your confirmation email.'); return; }
  if (checkout.expired) { showMessage('Your checkout has expired. Return to your bag to start again.'); return; }
  for (const [name, value] of Object.entries(checkout.customer || {})) { const input = form.elements.namedItem(name); if (input) input.value = value || ''; }
  root.querySelector('[data-checkout-layout]').hidden = false; totals();
});
