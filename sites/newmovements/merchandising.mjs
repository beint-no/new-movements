import { composeProductView, imageMatchesTokens } from "../../packages/reai-site-client/merchandising.mjs";

export const CART_UPSELL_HANDLES = [
  "organotex-leather-wax",
  "organotex-shoe-cleaner",
  "organotex-waterproofing-spray",
];

export const VIEWS = {
  women: { label: "Women", minSize: 35, maxSize: 42, imageTokens: ["women", "woman", "female", "her"] },
  men: { label: "Men", minSize: 39, maxSize: 48, imageTokens: ["men", "man", "male", "him"] },
};

const PRODUCT_SHOT_TOKENS = ["side", "side2", "sidez", "back", "front", "front2", "insole"];
export const isProductShot = (image) => imageMatchesTokens(image, PRODUCT_SHOT_TOKENS)
  && !imageMatchesTokens(image, Object.values(VIEWS).flatMap((view) => view.imageTokens));

export const selectedView = (context, fallback = "") => {
  const value = context?.url?.searchParams.get("view");
  return value === "all" ? "" : Object.hasOwn(VIEWS, value || "") ? value : fallback;
};

export const sizeValue = (variant) => (variant.options || []).find((option) => option.name.toLowerCase() === "size")?.value || "";
export const sortProductSizes = (product) => ({ ...product, variants: [...(product.variants || [])].sort((left, right) => {
  const a = sizeValue(left), b = sizeValue(right);
  const numeric = (value) => Number(String(value).replace(",", ".").replace("½", ".5").replace("⅓", ".333").replace("⅔", ".667"));
  const an = numeric(a), bn = numeric(b);
  return a && b && Number.isFinite(an) && Number.isFinite(bn) ? an - bn : String(a).localeCompare(String(b), "en", { numeric: true });
}) });

export function productView(product, view) {
  product = sortProductSizes(product);
  const configuration = VIEWS[view];
  if (!configuration) return product;
  return composeProductView(product, {
    option: "Size",
    values: (product.variants || []).flatMap((variant) => variant.options || [])
      .filter((option) => option.name.toLowerCase() === "size" && Number(option.value) >= configuration.minSize && Number(option.value) <= configuration.maxSize)
      .map((option) => option.value),
    imageTokens: configuration.imageTokens,
    excludedImageTokens: Object.entries(VIEWS).filter(([key]) => key !== view).flatMap(([, value]) => value.imageTokens),
    neutralImageTokens: PRODUCT_SHOT_TOKENS,
  });
}

export const viewUrl = (path, view) => `${path}${view ? `?view=${view}` : ""}`;

export function productsForView(products, view) {
  return products.flatMap((product) => {
    const composed = productView(product, view);
    return composed ? [{ ...composed, view, url: viewUrl(`/products/${product.handle}`, view) }] : [];
  });
}
