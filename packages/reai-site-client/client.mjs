// @ts-check

/** @typedef {import("./site-api.d.ts").paths} SiteApiPaths */
/** @typedef {import("./site-api.d.ts").operations} SiteApiOperations */
/** @typedef {import("./site-api.d.ts").components["schemas"]["SiteDeliveryRes"]} SiteDelivery */
/** @typedef {import("./site-api.d.ts").components["schemas"]["SiteStorefrontRes"]} SiteStorefront */
/** @typedef {import("./site-api.d.ts").components["schemas"]["SiteCatalogRes"]} SiteCatalog */
/** @typedef {import("./site-api.d.ts").components["schemas"]["SiteDeliveryProductDetailRes"]} SiteProduct */
/** @typedef {import("./site-api.d.ts").components["schemas"]["SiteDeliveryCollectionsRes"]} SiteCollections */
/** @typedef {import("./site-api.d.ts").components["schemas"]["SiteDeliveryCollectionDetailRes"]} SiteCollection */
/** @typedef {import("./site-api.d.ts").components["schemas"]["SiteAvailabilityRes"]} SiteAvailability */
/** @typedef {import("./site-api.d.ts").components["schemas"]["SiteAvailabilitiesRes"]} SiteAvailabilities */
/** @typedef {import("./site-api.d.ts").components["schemas"]["SiteCheckoutSessionReq"]} SiteCheckoutSessionRequest */
/** @typedef {import("./site-api.d.ts").components["schemas"]["SiteCheckoutSessionRes"]} SiteCheckoutSession */
/** @typedef {{ market: string, locale: string }} DeliveryContext */
/** @typedef {{ baseUrl?: string, token: string, fetch?: typeof globalThis.fetch }} SiteApiClientOptions */

/** @type {keyof SiteApiPaths} */
const SITE_PATH = "/site/v1/site";
/** @type {keyof SiteApiPaths} */
const STOREFRONT_PATH = "/site/v1/commerce/storefront";
/** @type {keyof SiteApiPaths} */
const CATALOG_PATH = "/site/v1/commerce/catalog";
/** @type {keyof SiteApiPaths} */
const PRODUCT_PATH = "/site/v1/commerce/products/{handle}";
/** @type {keyof SiteApiPaths} */
const COLLECTIONS_PATH = "/site/v1/commerce/collections";
/** @type {keyof SiteApiPaths} */
const COLLECTION_PATH = "/site/v1/commerce/collections/{handle}";
/** @type {keyof SiteApiPaths} */
const AVAILABILITIES_PATH = "/site/v1/commerce/availability";
/** @type {keyof SiteApiPaths} */
const AVAILABILITY_PATH = "/site/v1/commerce/availability/{variantId}";
/** @type {keyof SiteApiPaths} */
const CHECKOUT_PATH = "/site/v1/commerce/checkout-sessions";

/**
 * @param {string} template
 * @param {Record<string, string>} parameters
 */
function expandPath(template, parameters) {
  return Object.entries(parameters).reduce(
    (path, [name, value]) => path.replace(`{${name}}`, encodeURIComponent(value)),
    template,
  );
}

/**
 * @template T
 */
export class SiteApiResponse {
  /**
   * @param {Response} response
   */
  constructor(response) {
    this.response = response;
  }

  /** @type {Response} */
  response;

  /** @returns {Promise<T>} */
  json() {
    return /** @type {Promise<T>} */ (this.response.json());
  }
}

export class ReaiSiteClient {
  /**
   * @param {SiteApiClientOptions} options
   */
  constructor(options) {
    if (!options.token) throw new TypeError("token is required");
    this.#baseUrl = (options.baseUrl || "https://app.reai.no").replace(/\/$/, "");
    this.#token = String(options.token).trim();
    if (!this.#token) throw new TypeError("token is required");
    const fetchImpl = options.fetch || globalThis.fetch.bind(globalThis);
    this.#fetch = (input, init) => fetchImpl(input, init);
  }

  /** @type {string} */
  #baseUrl;
  /** @type {string} */
  #token;
  /** @type {typeof globalThis.fetch} */
  #fetch;

  /**
   * @param {string} pathname
   * @param {object | undefined} [query]
   * @param {RequestInit} [init]
   */
  async #request(pathname, query, init = {}) {
    const url = new URL(pathname, this.#baseUrl);
    for (const [name, rawValue] of Object.entries(query || {})) {
      if (rawValue == null) continue;
      const values = Array.isArray(rawValue) ? rawValue : [rawValue];
      for (const value of values) url.searchParams.append(name, String(value));
    }
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    headers.set("Authorization", `Bearer ${this.#token}`);
    return this.#fetch(url.href, { ...init, headers });
  }

  /** @returns {Promise<SiteApiResponse<SiteDelivery>>} */
  async site() {
    return new SiteApiResponse(await this.#request(SITE_PATH));
  }

  /**
   * @param {DeliveryContext} context
   * @param {string | null} [ifNoneMatch]
   * @returns {Promise<SiteApiResponse<SiteStorefront>>}
   */
  async storefront(context, ifNoneMatch = null) {
    /** @type {SiteApiOperations["storefront"]["parameters"]["query"]} */
    const query = context;
    /** @type {NonNullable<SiteApiOperations["storefront"]["parameters"]["header"]>} */
    const operationHeaders = ifNoneMatch ? { "If-None-Match": ifNoneMatch } : {};
    const headers = new Headers();
    if (operationHeaders["If-None-Match"]) headers.set("If-None-Match", operationHeaders["If-None-Match"]);
    return new SiteApiResponse(await this.#request(STOREFRONT_PATH, query, { headers }));
  }

  /**
   * @param {DeliveryContext} context
   * @param {string | null} [ifNoneMatch]
   * @returns {Promise<SiteApiResponse<SiteCatalog>>}
   */
  async catalog(context, ifNoneMatch = null) {
    /** @type {SiteApiOperations["catalog"]["parameters"]["query"]} */
    const query = context;
    /** @type {NonNullable<SiteApiOperations["catalog"]["parameters"]["header"]>} */
    const operationHeaders = ifNoneMatch ? { "If-None-Match": ifNoneMatch } : {};
    const headers = new Headers();
    if (operationHeaders["If-None-Match"]) headers.set("If-None-Match", operationHeaders["If-None-Match"]);
    return new SiteApiResponse(await this.#request(CATALOG_PATH, query, { headers }));
  }

  /**
   * @param {string} handle
   * @param {DeliveryContext} context
   * @returns {Promise<SiteApiResponse<SiteProduct>>}
   */
  async product(handle, context) {
    /** @type {SiteApiOperations["product"]["parameters"]["path"]} */
    const path = { handle };
    /** @type {SiteApiOperations["product"]["parameters"]["query"]} */
    const query = context;
    return new SiteApiResponse(await this.#request(expandPath(PRODUCT_PATH, path), query));
  }

  /**
   * @param {DeliveryContext} context
   * @returns {Promise<SiteApiResponse<SiteCollections>>}
   */
  async collections(context) {
    /** @type {SiteApiOperations["collections"]["parameters"]["query"]} */
    const query = context;
    return new SiteApiResponse(await this.#request(COLLECTIONS_PATH, query));
  }

  /**
   * @param {string} handle
   * @param {DeliveryContext} context
   * @returns {Promise<SiteApiResponse<SiteCollection>>}
   */
  async collection(handle, context) {
    /** @type {SiteApiOperations["collection"]["parameters"]["path"]} */
    const path = { handle };
    /** @type {SiteApiOperations["collection"]["parameters"]["query"]} */
    const query = context;
    return new SiteApiResponse(await this.#request(expandPath(COLLECTION_PATH, path), query));
  }

  /**
   * @param {string[]} variantIds
   * @param {DeliveryContext} context
   * @returns {Promise<SiteApiResponse<SiteAvailabilities>>}
   */
  async availabilities(variantIds, context) {
    /** @type {SiteApiOperations["availabilities"]["parameters"]["query"]} */
    const query = { ...context, variantId: variantIds };
    return new SiteApiResponse(await this.#request(AVAILABILITIES_PATH, query));
  }

  /**
   * @param {string} variantId
   * @param {DeliveryContext} context
   * @returns {Promise<SiteApiResponse<SiteAvailability>>}
   */
  async availability(variantId, context) {
    /** @type {SiteApiOperations["availability"]["parameters"]["path"]} */
    const path = { variantId };
    /** @type {SiteApiOperations["availability"]["parameters"]["query"]} */
    const query = context;
    return new SiteApiResponse(await this.#request(expandPath(AVAILABILITY_PATH, path), query));
  }

  /**
   * @param {SiteCheckoutSessionRequest} body
   * @param {DeliveryContext} context
   * @param {string} idempotencyKey
   * @returns {Promise<SiteApiResponse<SiteCheckoutSession>>}
   */
  async createCheckoutSession(body, context, idempotencyKey) {
    /** @type {SiteApiOperations["createCheckoutSession"]["parameters"]["query"]} */
    const query = context;
    /** @type {SiteApiOperations["createCheckoutSession"]["parameters"]["header"]} */
    const operationHeaders = { "Idempotency-Key": idempotencyKey };
    const headers = new Headers({ ...operationHeaders, "Content-Type": "application/json" });
    return new SiteApiResponse(await this.#request(CHECKOUT_PATH, query, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }));
  }
}
