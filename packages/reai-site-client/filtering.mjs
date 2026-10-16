// @ts-check

/** @typedef {{ id: string, name?: string | null }} TaxonomyValue */
/** @typedef {{ id: string, label: string, taxonomyValues?: TaxonomyValue[], colors?: string[], aliases?: string[] }} AttributeValue */
/** @typedef {{ key: string, name: string, values: AttributeValue[] }} Attribute */
/** @typedef {{ id: string, price: string | number, options?: {name: string, value: string}[], attributes?: Attribute[] }} FilterVariant */
/** @typedef {{ id: string, title: string, productType?: string | null, displayProductType?: string | null, brand?: string | null, displayBrand?: string | null, attributes?: Attribute[], variants: FilterVariant[] }} FilterProduct */
/** @typedef {{ key: string, label: string, parameter: string, kind: 'availability' | 'option' | 'attribute' | 'product', optionName?: string, attributeKey?: string, productField?: 'productType' | 'brand' }} FacetDefinition */
/** @typedef {{ id: string, label: string, colors: string[], aliases: string[], count: number | null, selected: boolean, inputValue: string }} FacetValue */
// Warnings and errors are stable codes, not sentences: the storefront renders them in the
// shopper's language.
/** @typedef {{ values: Map<string, string[]>, minimum?: number, maximum?: number, sort: string, errors: string[] }} FilterRequest */

const priceMinimum = 'filter.v.price.gte';
const priceMaximum = 'filter.v.price.lte';
const sorts = new Set(['manual', 'title-ascending', 'title-descending', 'price-ascending', 'price-descending']);
const facetCollator = new Intl.Collator('en', { numeric: true });

/** @param {URLSearchParams} parameters @param {FacetDefinition[]} definitions @returns {FilterRequest} */
export function parseCollectionFilters(parameters, definitions) {
  const values = new Map(definitions.map((definition) => [definition.key,
    [...new Set(parameters.getAll(definition.parameter).flatMap((value) => value.split(',')).filter(Boolean))],
  ]));
  const allowed = new Set([priceMinimum, priceMaximum, ...definitions.map((definition) => definition.parameter)]);
  const errors = [...new Set([...parameters.keys()].filter((key) => key.startsWith('filter.') && !allowed.has(key)))]
    .map(() => 'This filter is not available. Clear filters to see the collection.');
  /** @param {string} parameter */
  const price = (parameter) => {
    const raw = parameters.get(parameter);
    if (!raw?.trim()) return undefined;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      errors.push('invalid-price');
      return undefined;
    }
    return value;
  };
  const minimum = price(priceMinimum);
  const maximum = price(priceMaximum);
  const sort = parameters.getAll('sort_by').at(-1) || 'manual';
  return { values, ...(minimum === undefined ? {} : { minimum }), ...(maximum === undefined ? {} : { maximum }), sort, errors };
}

/** @param {FilterProduct} product @param {FilterVariant} variant @param {FacetDefinition} definition @param {Record<string, boolean | null>} availability */
function candidateValues(product, variant, definition, availability) {
  if (definition.kind === 'availability') {
    const state = availability[variant.id];
    return state === true ? [{ id: '1', label: 'In stock', colors: [], aliases: [] }]
      : state === false ? [{ id: '0', label: 'Out of stock', colors: [], aliases: [] }] : [];
  }
  if (definition.kind === 'option') return (variant.options || [])
    .filter((option) => option.name.toLowerCase() === definition.optionName?.toLowerCase())
    .map((option) => ({ id: option.value, label: option.value, colors: [], aliases: [] }));
  if (definition.kind === 'product') {
    const value = definition.productField ? product[definition.productField] : null;
    const displayField = definition.productField === 'productType' ? 'displayProductType'
      : definition.productField === 'brand' ? 'displayBrand' : null;
    const label = displayField && product[displayField] ? product[displayField] : value;
    return value ? [{ id: value, label, colors: [], aliases: [] }] : [];
  }
  const entries = [...(product.attributes || []), ...(variant.attributes || [])]
    .filter((attribute) => attribute.key === definition.attributeKey).flatMap((attribute) => attribute.values);
  return entries.flatMap((entry) => {
    const aliases = [entry.id, ...(entry.aliases || [])];
    return entry.taxonomyValues?.length ? entry.taxonomyValues.map((value) => ({
      id: value.id, label: value.name || entry.label, colors: entry.colors || [], aliases,
    })) : [{ id: entry.id, label: entry.label, colors: entry.colors || [], aliases }];
  });
}

/** @param {FilterProduct} product @param {FilterVariant} variant @param {FacetDefinition[]} definitions @param {FilterRequest} request @param {Record<string, boolean | null>} availability @param {string} [omitFacet] */
function matchesVariant(product, variant, definitions, request, availability, omitFacet) {
  const price = Number(variant.price);
  return Number.isFinite(price) && price >= (request.minimum ?? 0) && price <= (request.maximum ?? Infinity)
    && definitions.every((definition) => {
      const selected = request.values.get(definition.key) || [];
      if (definition.key === omitFacet || !selected.length) return true;
      return candidateValues(product, variant, definition, availability)
        .some((value) => selected.some((id) => id === value.id || value.aliases.includes(id)));
    });
}

/**
 * Product predicates combine with one variant that satisfies every option, price and stock predicate.
 * Attributes remain authoritative API values; display names never become inferred product facts.
 * @template {FilterProduct} T
 * @param {T[]} products
 * @param {FacetDefinition[]} definitions
 * @param {FilterRequest} request
 * @param {Record<string, boolean | null>} [availability]
 */
export function filterCollection(products, definitions, request, availability = {}) {
  const warnings = [...request.errors];
  const usesAvailability = definitions.some((definition) => definition.kind === 'availability' && request.values.get(definition.key)?.length);
  if (usesAvailability && products.some((product) => product.variants.some((variant) => availability[variant.id] == null))) {
    warnings.push('stock-unchecked');
  }
  if (!sorts.has(request.sort)) warnings.push('sort-unavailable');
  const matched = request.errors.length ? [] : products.flatMap((product) => {
    const variants = product.variants.filter((variant) => matchesVariant(product, variant, definitions, request, availability));
    return variants.length ? [{ ...product, variants }] : [];
  });
  const featuredOrder = new Map(matched.map((product, index) => [product.id, index]));
  /** @param {FilterProduct} product */
  const minimumPrice = (product) => Math.min(...product.variants.map((variant) => Number(variant.price)));
  matched.sort((left, right) => {
    let comparison = 0;
    if (request.sort === 'title-ascending') comparison = left.title.localeCompare(right.title);
    if (request.sort === 'title-descending') comparison = right.title.localeCompare(left.title);
    if (request.sort === 'price-ascending') comparison = minimumPrice(left) - minimumPrice(right);
    if (request.sort === 'price-descending') comparison = minimumPrice(right) - minimumPrice(left);
    return comparison || (featuredOrder.get(left.id) || 0) - (featuredOrder.get(right.id) || 0);
  });
  const facets = definitions.map((definition) => {
    /** @type {Map<string, FacetValue>} */
    const choices = new Map();
    const selected = request.values.get(definition.key) || [];
    products.forEach((product) => product.variants.forEach((variant) => candidateValues(product, variant, definition, availability).forEach((value) => {
      const existing = choices.get(value.id);
      const aliases = [...new Set([...(existing?.aliases || []), ...value.aliases])];
      const active = selected.filter((id) => id === value.id || aliases.includes(id));
      choices.set(value.id, { ...value, aliases, count: 0, selected: active.length > 0, inputValue: active.join(',') || value.id });
    })));
    if (definition.kind === 'availability' && !Object.keys(availability).length) {
      choices.set('1', { id: '1', label: 'In stock', colors: [], aliases: [], count: null, selected: selected.includes('1'), inputValue: '1' });
      choices.set('0', { id: '0', label: 'Out of stock', colors: [], aliases: [], count: null, selected: selected.includes('0'), inputValue: '0' });
    } else {
      products.forEach((product) => {
        const counted = new Set();
        product.variants.filter((variant) => matchesVariant(product, variant, definitions, request, availability, definition.key))
          .forEach((variant) => candidateValues(product, variant, definition, availability).forEach((value) => counted.add(value.id)));
        counted.forEach((id) => { const value = choices.get(id); if (value) value.count = (value.count || 0) + 1; });
      });
    }
    selected.filter((id) => ![...choices.values()].some((value) => value.id === id || value.aliases.includes(id)))
      .forEach((id) => choices.set(id, { id, label: 'Unavailable selection', colors: [], aliases: [], count: 0, selected: true, inputValue: id }));
    return { ...definition, values: [...choices.values()].sort((left, right) => facetCollator.compare(left.label, right.label)) };
  }).filter((facet) => facet.values.length);
  return { products: matched, facets, warnings: [...new Set(warnings)] };
}
