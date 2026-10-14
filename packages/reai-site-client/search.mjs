// A bounded, literal catalog search shared by full results and Worker suggestions.
const normalize = (value) => String(value || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/<[^>]*>/g, ' ').replace(/[^\p{L}\p{N}.]+/gu, ' ').trim();
const stem = (word) => word === 'grey' ? 'gray' : word.length > 3 && word.endsWith('s') && !word.endsWith('ss') ? word.slice(0, -1) : word;
const tokens = (value) => normalize(value).split(/\s+/).filter(Boolean).map(stem);
const attributeText = (attributes = []) => attributes.flatMap((attribute) => attribute.values.flatMap((value) => [value.label, ...(value.taxonomyValues || []).map((entry) => entry.name)])).join(' ');

export function searchProducts(products, query, limit = 100) {
  const terms = [...new Set(tokens(String(query).slice(0, 200)))].slice(0, 12);
  if (!terms.length) return [];
  return products.flatMap((product, position) => {
    const fields = [
      [product.title, 12], [product.productType, 9], [product.brand, 7],
      [[product.category?.name, product.material, product.searchTerms, ...(product.tags || []), attributeText(product.attributes)].join(' '), 6],
      [product.description || product.seoDescription, 1],
    ].map(([value, weight]) => ({ words: tokens(value), weight }));
    const numeric = terms.filter((term) => /^\d+(?:\.\d+)?$/.test(term) && !fields.some((field) => field.words.includes(term)));
    const variants = (product.variants || []).filter((variant) => numeric.every((term) => (variant.options || []).some((option) => normalize(option.value) === term)));
    if (!variants.length) return [];
    const variantWords = tokens(variants.flatMap((variant) => [variant.sku, ...(variant.options || []).map((option) => option.value), attributeText(variant.attributes)]).join(' '));
    let score = 0;
    for (const term of terms) {
      if (numeric.length && ['eu', 'size'].includes(term)) continue;
      const matches = fields.map(({ words, weight }) => words.some((word) => word === term) ? weight : words.some((word) => word.startsWith(term)) ? weight / 2 : 0);
      const best = Math.max(...matches, variantWords.includes(term) ? 4 : 0);
      if (!best) return [];
      score += best;
    }
    if (normalize(product.title) === normalize(query)) score += 30;
    return [{ product: { ...product, ...(numeric.length ? { variants, selectedVariantId: variants[0]?.id } : {}) }, score, position }];
  }).sort((a, b) => b.score - a.score || a.position - b.position).slice(0, Math.max(1, Math.min(limit, 100))).map((entry) => entry.product);
}
