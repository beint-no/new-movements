// Black Week gift: one free waterproofing spray with any shoe purchase in every
// market, through 29 November 2026 (Europe/Oslo).
//
// ReAI has no gift-with-purchase rule, so the offer is a hidden discount code
// that the checkout applies automatically. The code exists in each ReAI market as
// a fixed amount equal to one spray in that market's currency, scoped to a collection that contains only
// the spray, so it can never discount more than one spray. ReAI's `endsAt`
// enforces the end date; the dates here only control what the storefront shows.
export const GIFT_OFFER = Object.freeze({
  handle: "organotex-waterproofing-spray",
  code: "GAVE-IMPREGNERING-BW26",
  // Markets with the ReAI code. Add a currency here only after creating its code.
  currencies: Object.freeze(["NOK", "DKK", "SEK", "EUR", "GBP", "CHF", "USD", "CZK", "PLN", "HUF", "RON"]),
  // 30 Nov 2026 00:00 in Oslo (CET, UTC+1).
  endsAt: "2026-11-29T23:00:00Z",
});

export const giftOfferActive = (currency, now = Date.now()) =>
  GIFT_OFFER.currencies.includes(currency) && now < Date.parse(GIFT_OFFER.endsAt);

// Browser-side configuration. Only rendered while the offer is active.
// careHandles lets checkout tell shoes from shoe-care lines in any currency.
export const giftOfferAttribute = (currency, escape, careHandles = []) =>
  giftOfferActive(currency)
    ? ` data-gift-offer="${escape(JSON.stringify({ handle: GIFT_OFFER.handle, code: GIFT_OFFER.code, currency, endsAt: GIFT_OFFER.endsAt, careHandles }))}"`
    : "";
