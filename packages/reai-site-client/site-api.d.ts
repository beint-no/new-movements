/**
 * This file was generated from the ReAI Site OpenAPI document.
 * Run npm run generate:site-api instead of editing it.
 */

export interface paths {
    "/site/v1/analytics/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Record anonymous storefront events
         * @description Up to 25 events per batch, deduplicated by Site and event UUID. No email, address, arbitrary properties or URL query strings. Server receipt time is authoritative. Browser events are untrusted funnel signals; checkout/order counts come from ReAI sessions. Never send personal data. Raw events retained 180 days.
         */
        post: operations["record"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/site/v1/commerce/availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get coarse availability for up to 100 published variants */
        get: operations["availabilities"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/site/v1/commerce/availability/{variantId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get coarse availability for a published variant */
        get: operations["availability"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/site/v1/commerce/catalog": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get the published catalog */
        get: operations["catalog"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/site/v1/commerce/checkout-sessions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Create an immutable checkout snapshot
         * @description Call this from a trusted backend or Worker with a Site credential and Idempotency-Key. The request supplies the frozen checkout lines and optional returnUrl and delivery countryCode within the selected market. Keep the Site credential server-side; never send it to the browser. Open the returned checkoutUrl in the shopper's browser to complete contact, shipping, and payment. Submit bundle variant IDs and bundle counts without expanding components. Stock validation combines shared components across the whole cart and returns 409 INSUFFICIENT_STOCK with stockIssues when it cannot fit. Creating a session does not reserve stock; the components are atomically reserved when payment starts.
         */
        post: operations["createCheckoutSession"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/site/v1/commerce/checkout-sessions/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Resume a merchant checkout
         * @description Server-side Site credential and opaque checkout ID required. Contains personal data: never cache or log the response. Hosted checkouts are deliberately excluded.
         */
        get: operations["read"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        /**
         * Save merchant checkout details
         * @description Uses optimistic revision locking. Set complete for final contact/address validation. Empty discountCode removes a discount. Changing the address clears delivery selection. Locked payments cannot be edited.
         */
        patch: operations["update"];
        trace?: never;
    };
    "/site/v1/commerce/checkout-sessions/{id}/address-suggestions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Suggest a Norwegian delivery address
         * @description Optional autocomplete with a minimum of three characters. Returns streetAddress, postalCode and city. Country must belong to this checkout market; other supported countries return an empty list and use manual entry. Provider credentials remain server-side. Never cache or log address queries.
         */
        get: operations["addresses"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/site/v1/commerce/checkout-sessions/{id}/change-country": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Change the delivery country
         * @description Uses configured countries and currency prices. For a different market, creates a fresh quote and retires the previous draft atomically. Idempotency-Key is required. Contact/address are retained; shipping and discounts must be selected again.
         */
        post: operations["country"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/site/v1/commerce/checkout-sessions/{id}/delivery-options": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Find delivery options and pickup points
         * @description Read-only discovery for the supplied address. Returns localized service names/descriptions, carrier identity/logo, pickup label, location type and optional distance in meters. Pass an optionToken to fetch only its pickup points; filter name/address/postalCode/city locally without further carrier calls. Persist selection with PATCH and the current revision.
         */
        post: operations["options"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/site/v1/commerce/checkout-sessions/{id}/prepare-payment": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Prepare payment for a merchant checkout
         * @description Validates complete details and prepares an unpayable provider session. Returns a ReAI paymentUrl; no provider credentials or sessionData are delivered to the merchant. ReAI reserves stock and finalizes payment on the payment page.
         */
        post: operations["prepare"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/site/v1/commerce/collections": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List published collections */
        get: operations["collections"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/site/v1/commerce/collections/{handle}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a published collection with ordered published products */
        get: operations["collection"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/site/v1/commerce/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List published products */
        get: operations["products"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/site/v1/commerce/products/{handle}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a published product */
        get: operations["product"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/site/v1/commerce/stock-subscriptions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Request one back-in-stock email for a published variant
         * @description Requires explicit consent for one notification. Only currently unavailable published variants qualify. Does not grant newsletter consent. Repeated waiting requests are idempotent. Requests expire after 180 days. Requires the configured back-in-stock flow.
         */
        post: operations["subscribeStock"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/site/v1/commerce/storefront": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get the complete published storefront snapshot */
        get: operations["storefront"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/site/v1/newsletter/subscriptions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Subscribe to the Site owner's newsletter
         * @description Accepts an email and optional name with explicit newsletter consent. Reuses the tenant's customer consent records without changing existing customer details. Repeated submissions are idempotent. Returns the same receipt for new and existing contacts; queues the configured welcome flow only after new consent. Explicit welcomeDiscount=true selects the separately enabled welcome_discount flow instead, at most once per email and store even for existing subscribers. An unavailable offer rejects the request without saving consent. Does not create a discount.
         */
        post: operations["subscribeNewsletter"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/site/v1/site": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get the authenticated site */
        get: operations["site"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        /** @description A requested cart line exceeding the currently purchasable quantity. title and options identify the item in the resolved delivery locale. maximumQuantity is zero for an unavailable line, or the permitted cart quantity when only part of the request can be fulfilled. It keeps the other requested lines unchanged and accounts for shared bundle components. These per-line limits are not independent; recheck the adjusted cart on every checkout attempt. */
        CheckoutStockIssue: {
            /** Format: int32 */
            maximumQuantity?: number;
            options?: components["schemas"]["SiteDeliveryOptionRes"][];
            /** Format: int32 */
            requestedQuantity?: number;
            /** @example Allrounder Y (White Leather) */
            title?: string;
            /** Format: uuid */
            variantId?: string;
        };
        /**
         * @description ISO 4217 three-letter currency code.
         * @example NOK
         */
        CurrencyCode: string;
        FieldError: {
            /** @example lines */
            field?: string;
            /** @example must not be empty */
            message?: string;
        };
        /** @description RFC 9457 problem response */
        ProblemDetail: {
            /** @example INSUFFICIENT_STOCK */
            code?: string | null;
            /** @example variantId is not published on this site */
            detail?: string | null;
            /** @example variantId is not published on this site */
            error?: string | null;
            fieldErrors?: components["schemas"]["FieldError"][];
            /** @example /site/v1/commerce/checkout-sessions */
            instance?: string | null;
            /**
             * Format: int32
             * @example 400
             */
            status?: number;
            stockIssues?: components["schemas"]["CheckoutStockIssue"][];
            /** @example Invalid request */
            title?: string | null;
            type?: string | null;
        };
        ProductAttributeDto: {
            key: string;
            name: string;
            values: components["schemas"]["ProductAttributeValueDto"][];
        };
        ProductAttributeTaxonomyValueDto: {
            id: string;
            name?: string | null;
        };
        ProductAttributeValueDto: {
            aliases: string[];
            colors: string[];
            /** Format: uuid */
            id: string;
            label: string;
            taxonomyValues: components["schemas"]["ProductAttributeTaxonomyValueDto"][];
        };
        /** @description Public product image. Fetch bytes from url; catalog JSON never includes image data. */
        ProductImage: {
            /** @example RAW Classic rolling papers */
            alt?: string | null;
            /**
             * Format: int32
             * @example 1200
             */
            height?: number;
            renditions?: components["schemas"]["ProductImageRendition"][];
            /** @example https://app.reai.no/media/product-images/018f3c2e-8b1a-7d3e-9c4f-5a6b7c8d9e0f/macbook-air-13-inch.avif */
            url?: string;
            /**
             * Format: int32
             * @example 1200
             */
            width?: number;
        };
        ProductImageRendition: {
            /** Format: int32 */
            height: number;
            url: string;
            /** Format: int32 */
            width: number;
        };
        SiteAnalyticsBatchDto: {
            events: components["schemas"]["SiteAnalyticsEventDto"][];
        };
        SiteAnalyticsEventDto: {
            /** Format: uuid */
            id: string;
            /** @enum {string} */
            kind: "page_view" | "product_view" | "add_to_cart" | "remove_from_cart" | "checkout_view";
            path: string;
            /** Format: uuid */
            productId?: string | null;
            /** Format: int32 */
            quantity?: number | null;
            /** Format: uuid */
            sessionId: string;
            /** Format: uuid */
            variantId?: string | null;
        };
        SiteAvailabilitiesRes: {
            currency: components["schemas"]["CurrencyCode"];
            locale: string;
            marketHandle: string;
            /** Format: uuid */
            marketId: string;
            variants: components["schemas"]["SiteVariantAvailabilityRes"][];
        };
        SiteAvailabilityRes: {
            currency: components["schemas"]["CurrencyCode"];
            locale: string;
            marketHandle: string;
            /** Format: uuid */
            marketId: string;
            /** @enum {string} */
            status: "AVAILABLE" | "OUT_OF_STOCK";
            /** Format: uuid */
            variantId: string;
        };
        SiteCatalogRes: {
            /** Format: int32 */
            catalogVersion: number;
            currency: components["schemas"]["CurrencyCode"];
            locale: string;
            marketHandle: string;
            /** Format: uuid */
            marketId: string;
            products: components["schemas"]["SiteDeliveryProductRes"][];
        };
        SiteCheckoutAddressDto: {
            city: string;
            postalCode: string;
            streetAddress: string;
        };
        SiteCheckoutCountryReq: {
            customer: components["schemas"]["SiteCheckoutCustomerDto"];
            /** Format: int32 */
            revision: number;
        };
        SiteCheckoutCustomerDto: {
            addressPart1?: string;
            addressPart2?: string;
            city?: string;
            countryCode?: string;
            email?: string;
            name?: string;
            phone?: string;
            postalCode?: string;
            province?: string;
        };
        SiteCheckoutDeliveryMethodDto: {
            carrierCode?: string | null;
            carrierLogoUrl?: string | null;
            carrierName?: string | null;
            gross: number;
            /** Format: uuid */
            id: string;
            name: string;
            pickupDetails?: string | null;
        };
        SiteCheckoutDeliveryOptionDto: {
            carrierCode: string;
            carrierLogoUrl?: string | null;
            carrierName: string;
            deliveryMethod: string;
            description: string;
            gross: number;
            name: string;
            pickupLabel: string;
            pickupRequired: boolean;
            pickups: components["schemas"]["SiteCheckoutPickupDto"][];
            token: string;
        };
        SiteCheckoutDeliveryOptionsDto: {
            error?: string | null;
            options: components["schemas"]["SiteCheckoutDeliveryOptionDto"][];
        };
        SiteCheckoutDestinationDto: {
            countryCode: string;
            currency: string;
            marketHandle: string;
        };
        SiteCheckoutDetailsDto: {
            checkoutUrl: string;
            countries: string[];
            currency: string;
            customer: components["schemas"]["SiteCheckoutCustomerDto"];
            destinations: components["schemas"]["SiteCheckoutDestinationDto"][];
            discountCode?: string | null;
            discountGross?: number | null;
            dynamicShipping: boolean;
            editable: boolean;
            /** Format: date-time */
            expiresAt: string;
            id: string;
            lines: components["schemas"]["SiteCheckoutDetailsLineDto"][];
            locale: string;
            marketHandle: string;
            paymentUrl: string;
            phase: string;
            returnUrl: string;
            /** Format: int32 */
            revision: number;
            selectedOptionToken?: string | null;
            selectedPickupToken?: string | null;
            shippingGross?: number | null;
            /** Format: uuid */
            shippingMethodId?: string | null;
            shippingMethods: components["schemas"]["SiteCheckoutDeliveryMethodDto"][];
            shippingName?: string | null;
            shippingRequired: boolean;
            subtotal: number;
            total: number;
            vat: number;
        };
        SiteCheckoutDetailsLineDto: {
            gross: number;
            imageUrl: string;
            options: components["schemas"]["SiteVariantOption"][];
            /** Format: int32 */
            quantity: number;
            title: string;
            variantId: string;
        };
        SiteCheckoutLineReq: {
            /** Format: int32 */
            quantity: number;
            /** Format: uuid */
            variantId: string;
        };
        SiteCheckoutOptionsReq: {
            customer: components["schemas"]["SiteCheckoutCustomerDto"];
            includeOtherOptions?: boolean;
            optionToken?: string | null;
        };
        SiteCheckoutPickupDto: {
            address: string;
            city: string;
            /** Format: int32 */
            distanceMeters?: number | null;
            name: string;
            postalCode: string;
            token: string;
            type: string;
            typeLabel: string;
        };
        SiteCheckoutPrepareReq: {
            /** Format: int32 */
            revision: number;
        };
        /** @description Checkout lines already selected by the store or application. Create this request from a trusted backend or Worker, never from the shopper's browser. */
        SiteCheckoutSessionReq: {
            /** @description ISO 3166-1 alpha-2 delivery country within the selected market. Defaults to its first country when omitted. */
            countryCode?: string | null;
            lines: components["schemas"]["SiteCheckoutLineReq"][];
            /** @description Optional HTTPS details-page URL on the registered site domain. Opts into merchant checkout; ReAI appends the opaque checkout parameter. Omit for complete hosted checkout. */
            merchantCheckoutUrl?: string | null;
            returnUrl?: string | null;
        };
        /** @description Created checkout session. Open checkoutUrl in the shopper's browser. Do not expose the Site credential to the browser. */
        SiteCheckoutSessionRes: {
            checkoutUrl: string;
            currency: components["schemas"]["CurrencyCode"];
            /** Format: date-time */
            expiresAt: string;
            id: string;
            locale: string;
            marketHandle: string;
            /** Format: uuid */
            marketId: string;
            total: components["schemas"]["SiteCheckoutTotalRes"];
        };
        SiteCheckoutTotalRes: {
            gross: number;
            net: number;
            vat: number;
        };
        SiteCheckoutUpdateReq: {
            complete?: boolean;
            customer?: components["schemas"]["SiteCheckoutCustomerDto"] | null;
            discountCode?: string | null;
            optionToken?: string | null;
            pickupToken?: string | null;
            /** Format: int32 */
            revision: number;
            /** Format: uuid */
            shippingMethodId?: string | null;
        };
        SiteDeliveryBundleItemRes: {
            options: components["schemas"]["SiteDeliveryOptionRes"][];
            /** Format: int32 */
            quantity: number;
            sku: string;
            title: string;
        };
        SiteDeliveryBundleRes: {
            items: components["schemas"]["SiteDeliveryBundleItemRes"][];
        };
        SiteDeliveryCollectionDetailRes: {
            /** Format: int32 */
            catalogVersion: number;
            currency: components["schemas"]["CurrencyCode"];
            /** @description Plain text for cards and previews, derived from the stored description in the selected locale. HTML markup is removed. Common HTML entities and numeric character references are decoded; other named entities remain literal text. */
            description?: string | null;
            /** @description Sanitized HTML body fragment for product or collection content. Plain descriptions are escaped and line breaks are preserved. Supports paragraphs, headings, lists, emphasis, links and simple tables; scripts, styles and event handlers are removed. Insert only into an HTML body container, never an attribute or script. */
            descriptionHtml?: string | null;
            handle: string;
            /** Format: uuid */
            id: string;
            imageUrl?: string | null;
            locale: string;
            marketHandle: string;
            /** Format: uuid */
            marketId: string;
            products: components["schemas"]["SiteDeliveryCollectionProductRes"][];
            seoDescription?: string | null;
            seoTitle: string;
            title: string;
        };
        SiteDeliveryCollectionProductRes: {
            brand?: string | null;
            handle: string;
            /** Format: uuid */
            id: string;
            price: number;
            title: string;
        };
        SiteDeliveryCollectionRes: {
            /** @description Plain text for cards and previews, derived from the stored description in the selected locale. HTML markup is removed. Common HTML entities and numeric character references are decoded; other named entities remain literal text. */
            description?: string | null;
            /** @description Sanitized HTML body fragment for product or collection content. Plain descriptions are escaped and line breaks are preserved. Supports paragraphs, headings, lists, emphasis, links and simple tables; scripts, styles and event handlers are removed. Insert only into an HTML body container, never an attribute or script. */
            descriptionHtml?: string | null;
            handle: string;
            /** Format: uuid */
            id: string;
            imageUrl?: string | null;
            seoDescription?: string | null;
            seoTitle: string;
            title: string;
        };
        SiteDeliveryCollectionsRes: {
            /** Format: int32 */
            catalogVersion: number;
            collections: components["schemas"]["SiteDeliveryCollectionRes"][];
            currency: components["schemas"]["CurrencyCode"];
            locale: string;
            marketHandle: string;
            /** Format: uuid */
            marketId: string;
        };
        SiteDeliveryMarketRes: {
            countries: string[];
            currency: string;
            defaultLocale: string;
            handle: string;
            /** Format: uuid */
            id: string;
            isDefault: boolean;
            locales: string[];
            name: string;
        };
        SiteDeliveryOptionRes: {
            name: string;
            value: string;
        };
        SiteDeliveryProductDetailRes: {
            attributes: components["schemas"]["ProductAttributeDto"][];
            brand?: string | null;
            /** Format: int32 */
            catalogVersion: number;
            category?: components["schemas"]["SiteProductCategoryRecord"] | null;
            currency: components["schemas"]["CurrencyCode"];
            /** @description Plain text for cards and previews, derived from the stored description in the selected locale. HTML markup is removed. Common HTML entities and numeric character references are decoded; other named entities remain literal text. */
            description?: string | null;
            /** @description Sanitized HTML body fragment for product or collection content. Plain descriptions are escaped and line breaks are preserved. Supports paragraphs, headings, lists, emphasis, links and simple tables; scripts, styles and event handlers are removed. Insert only into an HTML body container, never an attribute or script. */
            descriptionHtml?: string | null;
            handle: string;
            /** Format: uuid */
            id: string;
            images: components["schemas"]["ProductImage"][];
            locale: string;
            marketHandle: string;
            /** Format: uuid */
            marketId: string;
            productType?: string | null;
            seoDescription?: string | null;
            seoTitle: string;
            title: string;
            variants: components["schemas"]["SiteDeliveryVariantRes"][];
        };
        SiteDeliveryProductRes: {
            /** @description Public product-wide categorical attributes. Stable entry IDs preserve merchant labels; taxonomyValues carry standard meanings. Variant-linked attributes are on each variant. */
            attributes: components["schemas"]["ProductAttributeDto"][];
            brand?: string | null;
            category?: components["schemas"]["SiteProductCategoryRecord"] | null;
            /** @description Plain text for cards and previews, derived from the stored description in the selected locale. HTML markup is removed. Common HTML entities and numeric character references are decoded; other named entities remain literal text. */
            description?: string | null;
            /** @description Sanitized HTML body fragment for product or collection content. Plain descriptions are escaped and line breaks are preserved. Supports paragraphs, headings, lists, emphasis, links and simple tables; scripts, styles and event handlers are removed. Insert only into an HTML body container, never an attribute or script. */
            descriptionHtml?: string | null;
            handle: string;
            /** Format: uuid */
            id: string;
            images: components["schemas"]["ProductImage"][];
            productType?: string | null;
            seoDescription?: string | null;
            seoTitle: string;
            title: string;
            variants: components["schemas"]["SiteDeliveryVariantRes"][];
        };
        SiteDeliveryRes: {
            activeDomain?: string | null;
            /** Format: uuid */
            id: string;
            markets: components["schemas"]["SiteDeliveryMarketRes"][];
            name: string;
            sourceLocale: string;
            /** @enum {string} */
            status: "enabled" | "disabled";
        };
        SiteDeliveryVariantRes: {
            /** @description Attributes bound to this variant's selected option values. Combine with product-wide attributes when filtering; keep size, price and availability predicates on the same variant. */
            attributes: components["schemas"]["ProductAttributeDto"][];
            bundle?: components["schemas"]["SiteDeliveryBundleRes"] | null;
            compareAtPrice?: number | null;
            /** Format: uuid */
            id: string;
            options: components["schemas"]["SiteDeliveryOptionRes"][];
            price: number;
            sku: string;
            vatRate: number;
        };
        SiteNewsletterSubscriptionReq: {
            /** @description Must be true. The shopper explicitly requested newsletter email from this business. */
            consent: boolean;
            /** Format: email */
            email: string;
            locale?: string | null;
            name?: string | null;
            /** @description Explicitly request the enabled welcome_discount flow instead of the ordinary welcome. Defaults to false. Sends at most once per email and store, including existing subscribers. Its editable template must refer to an existing discount code; no codes are created. */
            welcomeDiscount?: boolean;
        };
        SiteNewsletterSubscriptionRes: {
            accepted: boolean;
        };
        SiteProductCategoryRecord: {
            id: string;
            name?: string | null;
        };
        SiteStockSubscriptionReq: {
            consent: boolean;
            /** Format: email */
            email: string;
            locale?: string | null;
            name?: string | null;
            /** Format: uuid */
            variantId: string;
        };
        SiteStockSubscriptionRes: {
            accepted: boolean;
        };
        SiteStorefrontCollectionRes: {
            /** @description Plain text for cards and previews, derived from the stored description in the selected locale. HTML markup is removed. Common HTML entities and numeric character references are decoded; other named entities remain literal text. */
            description?: string | null;
            /** @description Sanitized HTML body fragment for product or collection content. Plain descriptions are escaped and line breaks are preserved. Supports paragraphs, headings, lists, emphasis, links and simple tables; scripts, styles and event handlers are removed. Insert only into an HTML body container, never an attribute or script. */
            descriptionHtml?: string | null;
            handle: string;
            /** Format: uuid */
            id: string;
            imageUrl?: string | null;
            products: components["schemas"]["SiteDeliveryCollectionProductRes"][];
            seoDescription?: string | null;
            seoTitle: string;
            title: string;
        };
        SiteStorefrontRes: {
            /** Format: int32 */
            catalogVersion: number;
            collections: components["schemas"]["SiteStorefrontCollectionRes"][];
            currency: components["schemas"]["CurrencyCode"];
            locale: string;
            marketHandle: string;
            /** Format: uuid */
            marketId: string;
            products: components["schemas"]["SiteDeliveryProductRes"][];
        };
        SiteVariantAvailabilityRes: {
            /** @enum {string} */
            status: "AVAILABLE" | "OUT_OF_STOCK";
            /** Format: uuid */
            variantId: string;
        };
        SiteVariantOption: {
            name: string;
            value: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    record: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SiteAnalyticsBatchDto"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    availabilities: {
        parameters: {
            query: {
                variantId: string[];
                /**
                 * @description Market handle. Omit to use the default market.
                 * @example international
                 */
                market?: string | null;
                /**
                 * @description Canonical BCP 47 locale enabled for the selected market.
                 * @example en
                 */
                locale?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteAvailabilitiesRes"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    availability: {
        parameters: {
            query?: {
                /**
                 * @description Market handle. Omit to use the default market.
                 * @example international
                 */
                market?: string | null;
                /**
                 * @description Canonical BCP 47 locale enabled for the selected market.
                 * @example en
                 */
                locale?: string | null;
            };
            header?: never;
            path: {
                variantId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteAvailabilityRes"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    catalog: {
        parameters: {
            query?: {
                /**
                 * @description Market handle. Omit to use the default market.
                 * @example international
                 */
                market?: string | null;
                /**
                 * @description Canonical BCP 47 locale enabled for the selected market.
                 * @example en
                 */
                locale?: string | null;
            };
            header?: {
                /** @description ETag from an earlier response for the same URL. A match returns 304 without a response body. */
                "If-None-Match"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteCatalogRes"];
                };
            };
            /** @description Catalog unchanged for the supplied If-None-Match validator */
            304: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    createCheckoutSession: {
        parameters: {
            query?: {
                /**
                 * @description Market handle. Omit to use the default market.
                 * @example international
                 */
                market?: string | null;
                /**
                 * @description Canonical BCP 47 locale enabled for the selected market.
                 * @example en
                 */
                locale?: string | null;
            };
            header: {
                "Idempotency-Key": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SiteCheckoutSessionReq"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteCheckoutSessionRes"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    read: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteCheckoutDetailsDto"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    update: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SiteCheckoutUpdateReq"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteCheckoutDetailsDto"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    addresses: {
        parameters: {
            query: {
                query: string;
                /** @example NO */
                countryCode: string;
            };
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteCheckoutAddressDto"][];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    country: {
        parameters: {
            query?: never;
            header: {
                "Idempotency-Key": string;
            };
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SiteCheckoutCountryReq"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteCheckoutDetailsDto"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    options: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SiteCheckoutOptionsReq"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteCheckoutDeliveryOptionsDto"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    prepare: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SiteCheckoutPrepareReq"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteCheckoutDetailsDto"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    collections: {
        parameters: {
            query?: {
                /**
                 * @description Market handle. Omit to use the default market.
                 * @example international
                 */
                market?: string | null;
                /**
                 * @description Canonical BCP 47 locale enabled for the selected market.
                 * @example en
                 */
                locale?: string | null;
            };
            header?: {
                /** @description ETag from an earlier response for the same URL. A match returns 304 without a response body. */
                "If-None-Match"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteDeliveryCollectionsRes"];
                };
            };
            /** @description Collections unchanged for the supplied If-None-Match validator */
            304: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    collection: {
        parameters: {
            query?: {
                /**
                 * @description Market handle. Omit to use the default market.
                 * @example international
                 */
                market?: string | null;
                /**
                 * @description Canonical BCP 47 locale enabled for the selected market.
                 * @example en
                 */
                locale?: string | null;
            };
            header?: {
                /** @description ETag from an earlier response for the same URL. A match returns 304 without a response body. */
                "If-None-Match"?: string | null;
            };
            path: {
                handle: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteDeliveryCollectionDetailRes"];
                };
            };
            /** @description Collection unchanged for the supplied If-None-Match validator */
            304: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    products: {
        parameters: {
            query?: {
                /**
                 * @description Market handle. Omit to use the default market.
                 * @example international
                 */
                market?: string | null;
                /**
                 * @description Canonical BCP 47 locale enabled for the selected market.
                 * @example en
                 */
                locale?: string | null;
            };
            header?: {
                /** @description ETag from an earlier response for the same URL. A match returns 304 without a response body. */
                "If-None-Match"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteCatalogRes"];
                };
            };
            /** @description Products unchanged for the supplied If-None-Match validator */
            304: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    product: {
        parameters: {
            query?: {
                /**
                 * @description Market handle. Omit to use the default market.
                 * @example international
                 */
                market?: string | null;
                /**
                 * @description Canonical BCP 47 locale enabled for the selected market.
                 * @example en
                 */
                locale?: string | null;
            };
            header?: {
                /** @description ETag from an earlier response for the same URL. A match returns 304 without a response body. */
                "If-None-Match"?: string | null;
            };
            path: {
                handle: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteDeliveryProductDetailRes"];
                };
            };
            /** @description Product unchanged for the supplied If-None-Match validator */
            304: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    subscribeStock: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SiteStockSubscriptionReq"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteStockSubscriptionRes"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    storefront: {
        parameters: {
            query?: {
                /**
                 * @description Market handle. Omit to use the default market.
                 * @example international
                 */
                market?: string | null;
                /**
                 * @description Canonical BCP 47 locale enabled for the selected market.
                 * @example en
                 */
                locale?: string | null;
            };
            header?: {
                /** @description ETag from an earlier response for the same URL. A match returns 304 without a response body. */
                "If-None-Match"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteStorefrontRes"];
                };
            };
            /** @description Storefront snapshot unchanged for the supplied If-None-Match validator */
            304: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    subscribeNewsletter: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SiteNewsletterSubscriptionReq"];
            };
        };
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteNewsletterSubscriptionRes"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
    site: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SiteDeliveryRes"];
                };
            };
            /** @description Bad request */
            400: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Unauthorized */
            401: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Forbidden */
            403: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Conflict */
            409: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
            /** @description Internal server error */
            500: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/problem+json": components["schemas"]["ProblemDetail"];
                };
            };
        };
    };
}
