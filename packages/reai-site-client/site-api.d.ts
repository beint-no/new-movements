/**
 * This file was generated from the ReAI Site OpenAPI document.
 * Run npm run generate:site-api instead of editing it.
 */

export interface paths {
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
         * @description Call this from a trusted backend or Worker with a Site credential and Idempotency-Key. The request supplies the frozen checkout lines and optional returnUrl. Keep the Site credential server-side; never send it to the browser. Open the returned checkoutUrl in the shopper's browser to complete contact, shipping, and payment. Submit bundle variant IDs and bundle counts without expanding components. Stock validation combines shared components across the whole cart and returns 409 INSUFFICIENT_STOCK with stockIssues when it cannot fit. Creating a session does not reserve stock; the components are atomically reserved when payment starts.
         */
        post: operations["createCheckoutSession"];
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
        /** @description A cart line exceeding the currently purchasable quantity. maximumQuantity keeps the other requested lines unchanged and accounts for shared bundle components. These per-line limits are not independent; recheck the adjusted cart on every checkout attempt. */
        CheckoutStockIssue: {
            /** Format: int32 */
            maximumQuantity?: number;
            /** Format: int32 */
            requestedQuantity?: number;
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
        SiteCheckoutLineReq: {
            /** Format: int32 */
            quantity: number;
            /** Format: uuid */
            variantId: string;
        };
        /** @description Checkout lines already selected by the store or application. Create this request from a trusted backend or Worker, never from the shopper's browser. */
        SiteCheckoutSessionReq: {
            lines: components["schemas"]["SiteCheckoutLineReq"][];
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
            description?: string | null;
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
            description?: string | null;
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
            brand?: string | null;
            /** Format: int32 */
            catalogVersion: number;
            currency: components["schemas"]["CurrencyCode"];
            description?: string | null;
            handle: string;
            /** Format: uuid */
            id: string;
            images: components["schemas"]["ProductImage"][];
            locale: string;
            marketHandle: string;
            /** Format: uuid */
            marketId: string;
            seoDescription?: string | null;
            seoTitle: string;
            title: string;
            variants: components["schemas"]["SiteDeliveryVariantRes"][];
        };
        SiteDeliveryProductRes: {
            brand?: string | null;
            description?: string | null;
            handle: string;
            /** Format: uuid */
            id: string;
            images: components["schemas"]["ProductImage"][];
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
            bundle?: components["schemas"]["SiteDeliveryBundleRes"] | null;
            compareAtPrice?: number | null;
            /** Format: uuid */
            id: string;
            options: components["schemas"]["SiteDeliveryOptionRes"][];
            price: number;
            sku: string;
            vatRate: number;
        };
        SiteStorefrontCollectionRes: {
            description?: string | null;
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
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
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
