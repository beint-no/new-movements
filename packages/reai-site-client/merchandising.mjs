/** Compose a merchandising view without changing product or variant identity. */
export function composeProductView(product, { option, values, imageTokens = [], excludedImageTokens = [], neutralImageTokens = [] }) {
  const tokens = (image) => {
    let filename = image.filename;
    if (!filename) {
      try { filename = decodeURIComponent(new URL(image.url).pathname.split("/").pop()); } catch { filename = ""; }
    }
    return String(filename).toLowerCase().split(/[^a-z0-9]+/);
  };
  const matches = (image, names) => names.some((name) => tokens(image).includes(name));
  const variants = (product.variants || []).filter((variant) => {
    const selected = (variant.options || []).find((entry) => entry.name.toLowerCase() === option.toLowerCase());
    return selected && values.includes(selected.value);
  });
  if (!variants.length) return null;
  const images = product.images || [];
  const preferred = images.filter((image) => matches(image, imageTokens) && !matches(image, excludedImageTokens));
  const neutral = images.filter((image) => !matches(image, imageTokens) && !matches(image, excludedImageTokens)
    && (!neutralImageTokens.length || matches(image, neutralImageTokens)));
  return { ...product, variants, images: [...preferred, ...neutral] };
}
