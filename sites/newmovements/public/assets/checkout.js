const root = document.body;
let state = JSON.parse(root.dataset.checkout);
const no = /^no|^nb|^nn/.test(state.locale);
const t = (en, nb) => no ? nb : en;
const money = (v) => new Intl.NumberFormat(no ? 'nb-NO' : 'en-GB', { style: 'currency', currency: state.currency }).format(Number(v));
const form = document.querySelector('[data-details-form]');
const errorBox = document.querySelector('[data-error]');
const status = document.querySelector('[data-save-status]');
const continueButton = document.querySelector('[data-continue]');
const delivery = document.querySelector('[data-delivery-options]');
const customerFields = ['email','phone','name','countryCode','addressPart1','addressPart2','postalCode','city','province'];
let chain = Promise.resolve(), timer, conflict = false, submitting = false;
let options = [], discovery = 0;
const apiPath = `/reai/checkout/${state.id}`;
const customer = () => Object.fromEntries(customerFields.map(name => [name, form?.elements.namedItem(name)?.value.trim() || '']));
const equal = (a,b) => JSON.stringify(a) === JSON.stringify(b);
function message(text = '') { if (errorBox) { errorBox.textContent = text; errorBox.hidden = !text; } }
function text(selector, value) { const node = document.querySelector(selector); if (node) node.textContent = value; }
function refresh(next) {
  state = next;
  text('[data-subtotal]', money(state.subtotal)); text('[data-total]', money(state.total)); text('[data-mobile-total]', money(state.total));
  text('[data-shipping-price]', state.shippingGross == null ? t('Choose delivery','Velg levering') : money(state.shippingGross));
  text('[data-discount-name]',state.discountCode || ''); text('[data-discount-amount]',money(-(state.discountGross || 0)));
  document.querySelector('[data-discount-row]').hidden = !state.discountCode;
  if (state.currency === 'NOK') text('[data-tax]', t('Including VAT','Inkludert MVA') + ' ' + money(state.vat));
}
async function api(suffix = '', method = 'GET', body, idempotencyKey) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(apiPath + suffix, { method, cache:'no-store', credentials:'same-origin', signal:controller.signal,
      ...(body ? { headers: { 'Content-Type': 'application/json', ...(suffix==='/change-country'?{'Idempotency-Key':idempotencyKey || crypto.randomUUID()}:{}) }, body: JSON.stringify(body) } : {}) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      let detail = result.detail || result.error || t('We could not update checkout. Please try again.','Vi kunne ikke oppdatere kassen. Prøv igjen.');
      if (response.status === 409) {
        conflict = true;
        detail = result.code === 'INSUFFICIENT_STOCK' ? (result.stockIssues || []).map(i=>`${i.title}: ${i.maximumQuantity === 0 ? t('sold out','utsolgt') : t('quantity unavailable','antallet er ikke tilgjengelig')}`).join('. ') || detail : t('Checkout changed in another tab or payment has started. Refresh this page to continue.','Kassen er endret i en annen fane eller betalingen har startet. Last inn siden på nytt for å fortsette.');
      }
      throw new Error(detail);
    }
    return result;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error(t('This is taking longer than expected. Refresh to check the saved checkout before trying again.','Dette tar lengre tid enn forventet. Last inn siden på nytt for å sjekke lagrede detaljer før du prøver igjen.'));
    throw error;
  } finally { clearTimeout(timeout); }
}
function enqueue(task) {
  const operation = chain.catch(()=>{}).then(task);
  chain = operation;
  return operation;
}
async function save(extra = {}, complete = false) {
  if (conflict) throw new Error(t('Refresh this page before continuing.','Last inn siden på nytt før du fortsetter.'));
  const c = customer();
  return enqueue(async () => {
    if (conflict) throw new Error(t('Refresh this page before continuing.','Last inn siden på nytt før du fortsetter.'));
    if (status) status.textContent = t('Saving…','Lagrer…');
    const next = await api('', 'PATCH', { revision:state.revision, customer:c, complete, ...extra });
    refresh(next);
    if (status) status.textContent = t('Details saved securely.','Detaljene er lagret sikkert.');
    return next;
  });
}
function addressComplete(c) { return ['name','addressPart1','postalCode','city','countryCode'].every(n=>c[n]); }
function error(error) { message(error.message); if (status) status.textContent = ''; }
function renderDelivery() {
  if (!delivery) return;
  delivery.replaceChildren();
  const methods = state.dynamicShipping ? options : state.shippingMethods;
  if (!methods.length) {
    const p=document.createElement('p'); p.textContent = t('No delivery options are available for this address. Check your address or contact us.','Ingen leveringsalternativer for denne adressen. Sjekk adressen eller kontakt oss.');delivery.append(p);return;
  }
  methods.forEach(o => {
    const dynamic = state.dynamicShipping;
    const label=document.createElement('label');label.className='co-option';
    const input=document.createElement('input');input.type='radio';input.name='delivery';input.value=dynamic?o.token:o.id;
    input.checked=dynamic ? o.token===state.selectedOptionToken : o.id===state.shippingMethodId;
    const title=document.createElement('span');title.textContent=o.name;
    const price=document.createElement('b');price.textContent=Number(o.gross)===0?t('Free','Gratis'):money(o.gross);
    label.append(input,title,price);delivery.append(label);
    input.addEventListener('change',async()=> {
      message();
      try {
        if (dynamic && o.pickupRequired) {
          await discover(o.token);
          renderDelivery();
          delivery.querySelector(`input[value="${CSS.escape(o.token)}"]`).checked=true;
        } else { await save(dynamic?{optionToken:o.token}:{shippingMethodId:o.id},true); renderDelivery(); warmPayment(); }
      } catch(e){error(e);}
    });
    if (dynamic && o.pickupRequired && o.pickups?.length) {
      const box=document.createElement('div');box.className='co-pickup';
      const pickLabel=document.createElement('label');pickLabel.textContent=t('Pickup point','Hentested');
      const select=document.createElement('select'); select.setAttribute('aria-label',pickLabel.textContent);
      select.add(new Option(t('Choose a pickup point','Velg hentested'),''));
      o.pickups.forEach(p=>select.add(new Option(`${p.name} · ${p.address}, ${p.postalCode} ${p.city}`,p.token)));
      select.value=state.selectedOptionToken===o.token?state.selectedPickupToken || '':'';
      select.addEventListener('change', async()=>{ if(!select.value)return;message();try {await save({optionToken:o.token,pickupToken:select.value},true);renderDelivery();warmPayment();}catch(e){error(e);}});
      pickLabel.append(select);box.append(pickLabel);delivery.append(box);
    }
  });
}
async function discover(optionToken, includeOtherOptions = false) {
  const generation=++discovery,c=customer();
  if (!addressComplete(c)) return;
  if (!optionToken) text('[data-delivery-options]', t('Finding delivery options…','Henter leveringsalternativer…'));
  const result = await api('/delivery-options','POST',{customer:c,includeOtherOptions,...(optionToken?{optionToken}:{})});
  if (generation !== discovery || !equal(c,customer())) return;
  if (result.error === 'OPTION_EXPIRED') {
    state.shippingMethodId=null;state.selectedOptionToken=null;state.selectedPickupToken=null;
    message(t('Please choose delivery again; the previous quote expired.','Velg levering på nytt; forrige tilbud har utløpt.'));
    return discover();
  }
  options=optionToken && options.length && !includeOtherOptions ? options.map(o => result.options.find(n => n.token===o.token) || o) : result.options;
  if (result.error && !options.length) throw new Error(t('Delivery options are temporarily unavailable. Check your address and try again.','Leveringsalternativer er ikke tilgjengelige nå. Sjekk adressen og prøv igjen.'));
  renderDelivery();
}
function warmPayment() {
  if (!form?.checkValidity() || state.shippingRequired && !state.shippingMethodId || conflict) return;
  const revision=state.revision;
  enqueue(async()=> {
    if (state.revision!==revision) return;
    const next=await api('/prepare-payment','POST',{revision});
    if (next.revision===revision) { refresh(next); }
  }).catch(()=>{});
}
form?.addEventListener('input',e=> {
  if (!customerFields.includes(e.target.name) || submitting) return;
  if(e.target.name==='countryCode' && !state.countries.includes(e.target.value)) return;
  clearTimeout(timer); discovery++;message();
  timer=setTimeout(async()=>{try {await save();if(state.dynamicShipping&&addressComplete(customer()))await discover();else if(!state.dynamicShipping)renderDelivery();warmPayment();}catch(e){error(e);}},650);
});
function provinceVisibility() {
  const node = document.querySelector('[data-province]');
  if(node) node.hidden=!['US','CA','AU'].includes(form?.elements.countryCode.value);
}
form?.elements.countryCode.addEventListener('change',async()=> {
  provinceVisibility();
  if(state.countries.includes(form.elements.countryCode.value))return;
  clearTimeout(timer);discovery++;continueButton.disabled=true;message();
  const c=customer();
  form.inert=true;
  try {
    const key=crypto.randomUUID();
    const next=await enqueue(async()=> {
      const body={revision:state.revision,customer:c};
      try{return await api('/change-country','POST',body,key);}
      catch{return api('/change-country','POST',body,key);}
    });
    // This quote belongs to its currency, tax and delivery market. The old draft is retired.
    location.assign(next.checkoutUrl);
  } catch(e){error(e);form.inert=false;form.elements.countryCode.value=state.customer.countryCode;continueButton.disabled=false;provinceVisibility();}
});
provinceVisibility();
form?.addEventListener('submit',async e=> {
  e.preventDefault(); if(submitting)return;
  if(!form.reportValidity())return;
  submitting=true;continueButton.disabled=true;clearTimeout(timer);message();
  const c=customer();
  try {
    await save({},true);
    if (state.shippingRequired && !state.shippingMethodId) throw new Error(t('Choose a delivery method before continuing.','Velg leveringsmåte før du fortsetter.'));
    const revision=state.revision;
    const next=await enqueue(()=>api('/prepare-payment','POST',{revision}));refresh(next);
    if(next.revision!==revision||!equal(c,customer()))throw new Error(t('Your details changed. Review them and continue again.','Detaljene er endret. Sjekk dem og fortsett igjen.'));
    location.assign(state.paymentUrl);
  } catch(e){error(e);submitting=false;continueButton.disabled=false;}
});
const discountForm=document.querySelector('[data-discount-form]');
discountForm?.addEventListener('submit',async e=>{e.preventDefault();const code=discountForm.elements.discountCode.value.trim();if(!code)return;const btn=discountForm.querySelector('button');btn.disabled=true;text('[data-discount-status]','');try{await save({discountCode:code});discountForm.reset();warmPayment();}catch(e){text('[data-discount-status]',e.message);}finally{btn.disabled=false;}});
document.querySelector('[data-remove-discount]')?.addEventListener('click',async()=>{try{await save({discountCode:''});warmPayment();}catch(e){error(e);}});
if (form) {
  if (!state.editable) { form.hidden=true; const p=document.createElement('p');p.textContent=state.phase==='expired'?t('This checkout has expired. Your bag is still available.','Denne kassen har utløpt. Handlekurven din er bevart.'):t('Payment is in progress. Continue on the secure payment page.','Betalingen er i gang. Fortsett på den sikre betalingssiden.');const link=document.createElement('a');link.className='co-button';link.href=state.phase==='expired'?'/cart':state.paymentUrl;link.textContent=state.phase==='expired'?t('Return to bag','Tilbake til handlekurven'):t('Continue payment','Fortsett betaling');form.before(p,link); }
  else {
    if(state.dynamicShipping&&addressComplete(customer())) {
      discover(state.selectedOptionToken||undefined,true).then(()=> {
        if(options.find(o=>o.token===state.selectedOptionToken)?.pickupRequired)return discover(state.selectedOptionToken);
      }).catch(error);
    }
    else if(!state.dynamicShipping)renderDelivery();
    warmPayment();
  }
}
if (root.dataset.cartReturn==='true') {
  let polls=0;
  const verify=async()=>{
    try {
      refresh(await api());
      if(state.phase==='complete') {
        // Only remove the purchased cart; items added in another tab remain.
        const key='newmovements-cart-v1';
        const clearedKey='newmovements-completed-checkouts';
        const cleared=JSON.parse(localStorage.getItem(clearedKey)||'[]');
        const cart=JSON.parse(localStorage.getItem(key)||'[]');
        const remaining=cart.flatMap(l=>{const bought=state.lines.find(b=>b.variantId===l.variant);const quantity=l.quantity-(bought?.quantity||0);return quantity>0?[{...l,quantity}]:[];});
        if(!cleared.includes(state.id)) {
          localStorage.setItem(key,JSON.stringify(remaining));
          localStorage.setItem(clearedKey,JSON.stringify([...cleared.slice(-19),state.id]));
        }
        text('.co-complete h1',t('Thank you for your order','Takk for bestillingen'));
        text('[data-result-message]',t('Your order is confirmed. We will send the details by email.','Bestillingen er bekreftet. Vi sender deg detaljene på e-post.'));
      } else if(state.phase==='failed'||state.phase==='expired'||state.phase==='details') {
        text('.co-complete h1',t('Your payment is not complete','Betalingen er ikke fullført'));
        text('[data-result-message]',t('Your bag has been kept. Return to checkout to try again.','Handlekurven er bevart. Gå tilbake til kassen for å prøve igjen.'));
        const link=document.querySelector('.co-complete .co-button');link.href=state.checkoutUrl;link.textContent=t('Return to checkout','Tilbake til kassen');
      } else if(++polls<30) setTimeout(verify,2000);
      else text('[data-result-message]',t('Confirmation is taking longer than usual. We will email you when your order is confirmed. Please avoid placing a second order.','Bekreftelsen tar lengre tid enn vanlig. Vi sender e-post når bestillingen er bekreftet. Unngå å legge inn en ny bestilling.'));
    } catch { if(++polls<30)setTimeout(verify,3000); }
  };verify();
}
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
if(matchMedia('(max-width:760px)').matches)document.querySelector('.co-summary-mobile').open=false;
