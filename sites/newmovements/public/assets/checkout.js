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
let options = [], discovery = 0, choosingOption = null;
const deliveryAddress = c => JSON.stringify(['name','countryCode','addressPart1','addressPart2','postalCode','city','province'].map(n=>c[n]));
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
async function api(suffix = '', method = 'GET', body, idempotencyKey, signal) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(apiPath + suffix, { method, cache:'no-store', credentials:'same-origin', signal:signal ? AbortSignal.any([signal,controller.signal]) : controller.signal,
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
    if (signal?.aborted) throw error;
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
    if (status) status.textContent = t('Saved','Lagret');
    return next;
  });
}
function addressComplete(c) { return ['name','addressPart1','postalCode','city','countryCode'].every(n=>c[n]); }
function error(error) { message(error.message); if (status) status.textContent = ''; }
// A small ARIA combobox shared by address suggestions and local pickup search.
// Input keeps focus; options never need a second network request or browser window.
let comboSequence = 0;
function combobox(input, { search, choose, draw, empty, restore }) {
  const wrap = document.createElement('div'); wrap.className='co-combobox'; input.replaceWith(wrap); wrap.append(input);
  const list=document.createElement('div');list.className='co-listbox';list.id=`co-list-${++comboSequence}`;list.role='listbox';list.hidden=true;wrap.append(list);
  const announcement=document.createElement('span');announcement.className='sr-only';announcement.role='status';wrap.append(announcement);
  input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',list.id);input.setAttribute('aria-expanded','false');
  let items=[], active=-1, generation=0, pending, controller, selecting=false;
  function close() { list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1; }
  function highlight(index) {
    active=index;[...list.children].forEach((el,i)=>el.setAttribute('aria-selected',String(i===index)));
    if(index<0)input.removeAttribute('aria-activedescendant');
    else {input.setAttribute('aria-activedescendant',list.children[index].id);list.children[index].scrollIntoView({block:'nearest'});}
  }
  function select(index) { if(!items[index])return;generation++;controller?.abort();clearTimeout(pending);selecting=true;choose(items[index]);selecting=false;close(); }
  async function update() {
    const current=++generation;controller?.abort();controller=new AbortController();
    try {
      const results=await search(input.value,controller.signal);
      if(current!==generation||document.activeElement!==input)return;
      items=results;list.replaceChildren();active=-1;input.removeAttribute('aria-activedescendant');
      items.forEach((item,i)=> {
        const row=document.createElement('div');row.role='option';row.id=`${list.id}-${i}`;row.className='co-choice';row.setAttribute('aria-selected','false');draw(row,item);
        row.addEventListener('pointerdown',e=>e.preventDefault());
        // Options sit inside the field's label. Cancel its default input click,
        // which would reopen the list after selection; keep keyboard focus.
        row.addEventListener('click',e=>{e.preventDefault();select(i);});list.append(row);
      });
      if(!items.length && empty && input.value.trim()) {const p=document.createElement('p');p.className='co-empty';p.textContent=empty;list.append(p);}
      list.hidden=!list.childElementCount;input.setAttribute('aria-expanded',String(!list.hidden));
      announcement.textContent=items.length ? t(`${items.length} suggestions available. Use the arrow keys to choose.`,`${items.length} forslag. Bruk piltastene for å velge.`) : '';
    } catch { if(current===generation)close(); } // Lookup failure never prevents manual address entry.
  }
  input.addEventListener('input',()=> {if(selecting)return;generation++;controller?.abort();clearTimeout(pending);close();pending=setTimeout(update,180);});
  input.addEventListener('focus',()=>{if(input.dataset.skipOpen){delete input.dataset.skipOpen;return;}if(restore)input.value='';update();});
  input.addEventListener('click',()=>{if(list.hidden){if(restore)input.value='';update();}});
  input.addEventListener('keydown',async e=> {
    if(e.key==='ArrowDown'&&list.hidden){e.preventDefault();if(restore)input.value='';await update();if(items.length&&!list.hidden)highlight(0);return;}
    if(e.key==='Escape'){generation++;controller?.abort();clearTimeout(pending);close();e.preventDefault();return;}
    if(e.key==='Enter'&&!list.hidden){e.preventDefault();if(active>=0)select(active);return;}
    if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)&&!list.hidden&&items.length) {
      e.preventDefault();highlight(e.key==='Home'?0:e.key==='End'?items.length-1:e.key==='ArrowDown'?(active+1)%items.length:(active-1+items.length)%items.length);
    }
  });
  wrap.addEventListener('focusout',()=>queueMicrotask(()=>{if(!wrap.contains(document.activeElement)){generation++;controller?.abort();clearTimeout(pending);close();if(restore)input.value=restore();}}));
  return input;
}
function distance(meters) {
  if(meters==null)return '';
  return meters<1000 ? `${meters} m` : `${new Intl.NumberFormat(no?'nb-NO':'en-GB',{maximumFractionDigits:1}).format(meters/1000)} km`;
}
function pickupDisplay(row,p) {
  const name=document.createElement('span');name.className='co-choice-name';name.textContent=p.name;
  const badge=document.createElement('span');badge.className='co-distance';badge.textContent=distance(p.distanceMeters);if(badge.textContent)name.append(badge);
  const address=document.createElement('small');address.textContent=`${p.address}, ${p.postalCode} ${p.city}`;
  const kind=document.createElement('small');kind.className='co-choice-type';kind.textContent=p.typeLabel || '';
  row.append(name,address);if(kind.textContent)row.append(kind);
}
function renderDelivery() {
  if (!delivery) return;
  delivery.replaceChildren();
  const methods = state.dynamicShipping ? options : state.shippingMethods;
  if (!methods.length) {
    const p=document.createElement('p'); p.textContent = t('No delivery options are available for this address. Check your address or contact us.','Ingen leveringsalternativer for denne adressen. Sjekk adressen eller kontakt oss.');delivery.append(p);return;
  }
  methods.forEach(o => {
    const dynamic = state.dynamicShipping;
    const selected=dynamic ? o.token===(choosingOption || state.selectedOptionToken) : o.id===state.shippingMethodId;
    const card=document.createElement('div');card.className='co-delivery-card';card.classList.toggle('is-selected',selected);
    const label=document.createElement('label');label.className='co-option';
    const input=document.createElement('input');input.type='radio';input.name='delivery';input.value=dynamic?o.token:o.id;input.checked=selected;
    const content=document.createElement('span');content.className='co-option-content';
    const title=document.createElement('strong');title.textContent=o.name;content.append(title);
    if(o.carrierLogoUrl) {const logo=document.createElement('img');logo.src=o.carrierLogoUrl;logo.alt=o.carrierName;logo.className='co-carrier';logo.width=84;logo.height=28;content.append(logo);}
    else if(o.carrierName){const carrier=document.createElement('small');carrier.textContent=o.carrierName;content.append(carrier);}
    if(o.description){const description=document.createElement('small');description.textContent=o.description;content.append(description);}
    const price=document.createElement('b');price.textContent=Number(o.gross)===0?t('Free','Gratis'):money(o.gross);
    label.append(input,content,price);card.append(label);delivery.append(card);
    input.addEventListener('change',async()=> {
      message();choosingOption=dynamic?o.token:null;
      try {
        if (dynamic && o.pickupRequired) {
          renderDelivery();await discover(o.token);
          if(choosingOption===o.token)delivery.querySelector(`[data-pickup-option="${CSS.escape(o.token)}"]`)?.focus();
        } else { await save(dynamic?{optionToken:o.token}:{shippingMethodId:o.id},true);choosingOption=null;renderDelivery();warmPayment(); }
      } catch(e){error(e);}
    });
    if (dynamic && o.pickupRequired && selected) {
      const box=document.createElement('div');box.className='co-pickup';card.append(box);
      if(!o.pickups?.length){const p=document.createElement('p');p.textContent=o.pickupsLoaded?t('No pickup locations found. Check the address or choose another delivery method.','Fant ingen hentesteder. Sjekk adressen eller velg en annen leveringsmåte.'):t('Finding pickup locations…','Henter hentesteder…');box.append(p);if(o.pickupsLoaded){const retry=document.createElement('button');retry.type='button';retry.className='co-retry';retry.textContent=t('Try again','Prøv igjen');retry.addEventListener('click',()=>discover(o.token).catch(error));box.append(retry);}return;}
      const selectedPickup=()=>state.selectedOptionToken===o.token?o.pickups.find(p=>p.token===state.selectedPickupToken):null;
      const pickLabel=document.createElement('label');pickLabel.textContent=o.pickupLabel || t('Pickup point','Hentested');
      const search=document.createElement('input');search.type='text';search.autocomplete='off';search.maxLength=254;search.dataset.pickupOption=o.token;
      search.placeholder=t('Search name, street, postal code or city','Søk på navn, gate, postnummer eller sted');search.value=selectedPickup()?.name || '';
      pickLabel.append(search);box.append(pickLabel);
      combobox(search,{
        search:query=>{const q=query.trim().toLocaleLowerCase(no?'nb-NO':'en');return o.pickups.filter(p=>[p.name,p.address,p.postalCode,p.city].join(' ').toLocaleLowerCase(no?'nb-NO':'en').includes(q));},
        draw:pickupDisplay,empty:t('No matching pickup locations. Try another street or name.','Ingen hentesteder matcher. Prøv en annen gate eller et annet navn.'),
        restore:()=>selectedPickup()?.name || '',
        choose:async p=> {search.value=p.name;search.disabled=true;message();try{await save({optionToken:o.token,pickupToken:p.token},true);choosingOption=null;renderDelivery();const next=delivery.querySelector(`[data-pickup-option="${CSS.escape(o.token)}"]`);if(next){next.dataset.skipOpen='true';next.focus({preventScroll:true});}warmPayment();}catch(e){error(e);search.disabled=false;}}
      });
      const chosen=selectedPickup();if(chosen){const address=document.createElement('p');address.className='co-selected-address';address.textContent=`${chosen.address}, ${chosen.postalCode} ${chosen.city}`;box.append(address);}
    }
  });
}
function enhanceAddress() {
  const input=form?.elements.addressPart1;if(!input)return;
  combobox(input,{
    search:(query,signal)=> form.elements.countryCode.value==='NO' && query.trim().length>=3 ? api('/address-suggestions?'+new URLSearchParams({query:query.trim(),countryCode:'NO'}),'GET',undefined,undefined,signal) : [],
    draw:(row,p)=> {const title=document.createElement('span');title.className='co-choice-name';title.textContent=p.streetAddress;const address=document.createElement('small');address.textContent=`${p.postalCode} ${p.city}`;row.append(title,address);},
    choose:p=> {input.value=p.streetAddress;form.elements.postalCode.value=p.postalCode;form.elements.city.value=p.city;input.dispatchEvent(new Event('input',{bubbles:true}));},
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
  if(optionToken)result.options.forEach(o=>{if(o.token===optionToken)o.pickupsLoaded=true;});
  options=optionToken && options.length && !includeOtherOptions ? options.map(o => result.options.find(n => n.token===o.token) || o) : result.options;
  if (result.error && !options.length) throw new Error(t('Delivery options are temporarily unavailable. Check your address and try again.','Leveringsalternativer er ikke tilgjengelige nå. Sjekk adressen og prøv igjen.'));
  if(result.error && optionToken){renderDelivery();throw new Error(t('Pickup locations are temporarily unavailable. Select delivery again to retry.','Hentesteder er ikke tilgjengelige nå. Velg levering på nytt for å prøve igjen.'));}
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
  const addressChanged=deliveryAddress(state.customer)!==deliveryAddress(customer());
  clearTimeout(timer);if(addressChanged){discovery++;choosingOption=null;}message();
  timer=setTimeout(async()=>{try {await save();if(state.dynamicShipping&&addressChanged&&addressComplete(customer()))await discover();else if(!state.dynamicShipping)renderDelivery();warmPayment();}catch(e){error(e);}},650);
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
enhanceAddress();
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
