#!/usr/bin/env bash
set -euo pipefail

node "$(dirname "${BASH_SOURCE[0]}")/tools/check-storefront.mjs"
node --test "$(dirname "${BASH_SOURCE[0]}")/tools/routes.test.mjs"

for page in index.html cart/index.html search/index.html order/complete/index.html 404.html pages/evensen-story/index.html pages/our-philosophy/index.html pages/recycle/index.html pages/materials/index.html pages/contact-us/index.html pages/returns/index.html pages/size-guide/index.html pages/terms-and-conditions/index.html policies/privacy-policy/index.html policies/refund-policy/index.html policies/shipping-policy/index.html; do
  test -f "public/$page"
done

! test -e public/products
! test -e public/collections
! test -e public/data/catalog.json
! test -e public/assets/products
! grep -R -q 'cdn.shopify.com' public storefront.mjs --include='*.html' --include='*.js' --include='*.mjs'
! grep -R -q '/site/v1/' public --include='*.html' --include='*.js'
grep -q '/reai/catalog' public/assets/store.js
grep -q '/reai/checkout/start' public/assets/store.js
grep -q 'data-cart-root' public/cart/index.html
grep -q 'data-search-results' public/search/index.html
grep -q 'data-order-complete' public/order/complete/index.html
grep -q 'createReaiStorefrontWorker' worker.js
grep -q 'checkoutReturnPath: "/order/complete"' worker.js
grep -q 'REAI_SITE_TOKEN' ../../packages/reai-cloudflare-storefront/worker.mjs

echo "New Movements static checks passed."
