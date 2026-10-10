/** Match whole filename tokens, using the original API URL when filename is absent. */
export function imageMatchesTokens(image, names) {
  let filename = image.filename;
  if (!filename) {
    try { filename = decodeURIComponent(new URL(image.url).pathname.split("/").pop()); } catch { filename = ""; }
  }
  const tokens = String(filename).toLowerCase().split(/[^a-z0-9]+/);
  return names.some((name) => tokens.includes(name));
}

/** Compose a merchandising view without changing product or variant identity. */
export function composeProductView(product, { option, values, imageTokens = [], excludedImageTokens = [], neutralImageTokens = [] }) {
  const variants = (product.variants || []).filter((variant) => {
    const selected = (variant.options || []).find((entry) => entry.name.toLowerCase() === option.toLowerCase());
    return selected && values.includes(selected.value);
  });
  if (!variants.length) return null;
  const images = product.images || [];
  const preferred = images.filter((image) => imageMatchesTokens(image, imageTokens) && !imageMatchesTokens(image, excludedImageTokens));
  const neutral = images.filter((image) => !imageMatchesTokens(image, imageTokens) && !imageMatchesTokens(image, excludedImageTokens)
    && (!neutralImageTokens.length || imageMatchesTokens(image, neutralImageTokens)));
  return { ...product, variants, images: [...preferred, ...neutral] };
}
