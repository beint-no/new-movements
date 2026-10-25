import { translator, isNorwegian, isGerman } from './locales.mjs';

// Presentation of the existing ReAI configuration; checkout owns eligibility and charging.
export function shippingCopy(store = {}) {
  const t = translator(store.locale);
  const market = store.markets?.find(m => m.handle === store.marketHandle);
  const country = store.customer?.countryCode || store.countryCode;
  const methods = (market?.shippingMethods || []).filter(m => !m.countries.length || m.countries.includes(country));
  const money = amount => new Intl.NumberFormat(isGerman(store.locale) ? 'de-DE' : isNorwegian(store.locale) ? 'nb-NO' : 'en-GB', {
    style: 'currency', currency: market.currency, minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(amount);
  const carrierNames = { bring: 'Bring', postnord: 'PostNord', dhl: 'DHL Express' };
  const freeMethods = methods.filter(m => Number(m.amount) === 0 && (m.amountAboveWeight == null || Number(m.amountAboveWeight) === 0));
  const free = freeMethods.length > 0;
  const freeCarriers = [...new Set(freeMethods.map(m => carrierNames[m.carrier]))];
  const freeCarrier = freeCarriers.length === 1 && freeCarriers[0];
  const thresholds = methods.filter(m => m.freeFromAmount != null).map(m => Number(m.freeFromAmount));
  const threshold = thresholds.length ? Math.min(...thresholds) : null;
  const summary = free || threshold === 0
    ? freeCarrier
      ? t(`Free delivery with ${freeCarrier}`, `Gratis levering med ${freeCarrier}`, `Kostenlose Lieferung mit ${freeCarrier}`)
      : t('Free delivery', 'Gratis levering', 'Kostenlose Lieferung')
    : threshold != null
      ? t(`Free delivery from ${money(threshold)}`, `Gratis levering fra ${money(threshold)}`, `Kostenlose Lieferung ab ${money(threshold)}`)
      : t('Shipping calculated at checkout', 'Frakt beregnes i kassen', 'Versandkosten werden im Checkout berechnet');
  const fixed = methods.length === 1 && methods[0].weightThresholdGrams == null;
  const carrierRates = methods.length > 1 && methods.every(m => carrierNames[m.carrier] && m.weightThresholdGrams == null && m.freeFromAmount == null)
    ? [...new Set(methods.map(m => `${carrierNames[m.carrier]}: ${Number(m.amount) === 0 ? t('free delivery', 'gratis levering', 'kostenlose Lieferung') : money(m.amount)}.`))].join(' ')
    : null;
  const detail = carrierRates || (threshold > 0 && fixed
    ? t(`Delivery costs ${money(methods[0].amount)} for orders below ${money(threshold)}. Free delivery from ${money(threshold)} after discounts.`,
        `Frakten koster ${money(methods[0].amount)} for bestillinger under ${money(threshold)}. Gratis levering fra ${money(threshold)} etter rabatter.`,
        `Die Lieferung kostet ${money(methods[0].amount)} bei Bestellungen unter ${money(threshold)}. Kostenlose Lieferung ab ${money(threshold)} nach Rabatten.`)
    : summary + '.');
  return { summary, detail };
}
