// Black Week gift: one free waterproofing spray with any shoe purchase in the
// Norwegian (NOK) market, through 29 November 2026 (Europe/Oslo).
//
// ReAI has no gift-with-purchase rule, so the offer is a hidden discount code
// that the checkout applies automatically. The code is configured in ReAI as a
// fixed NOK amount equal to one spray, scoped to a collection that contains only
// the spray, so it can never discount more than one spray. ReAI's `endsAt`
// enforces the end date; the dates here only control what the storefront shows.
export const GIFT_OFFER = Object.freeze({
  handle: "organotex-waterproofing-spray",
  code: "GAVE-IMPREGNERING-BW26",
  currency: "NOK",
  // 30 Nov 2026 00:00 in Oslo (CET, UTC+1).
  endsAt: "2026-11-29T23:00:00Z",
});

export const giftOfferActive = (currency, now = Date.now()) =>
  currency === GIFT_OFFER.currency && now < Date.parse(GIFT_OFFER.endsAt);

// Browser-side configuration. Only rendered while the offer is active.
export const giftOfferAttribute = (currency, escape) =>
  giftOfferActive(currency)
    ? ` data-gift-offer="${escape(JSON.stringify({ handle: GIFT_OFFER.handle, code: GIFT_OFFER.code, currency: GIFT_OFFER.currency, endsAt: GIFT_OFFER.endsAt }))}"`
    : "";
