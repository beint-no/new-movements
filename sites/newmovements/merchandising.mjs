import { composeProductView } from "../../packages/reai-site-client/merchandising.mjs";

export const VIEWS = {
  women: { label: "Women", sizes: ["35", "36", "37", "38", "39", "40", "41", "42"], imageTokens: ["women", "woman", "female", "her"] },
  men: { label: "Men", sizes: ["40", "41", "42", "43", "44", "45", "46", "47"], imageTokens: ["men", "man", "male", "him"] },
};

export const selectedView = (context, fallback = "") => {
  const value = context?.url?.searchParams.get("view");
  return value === "all" ? "" : Object.hasOwn(VIEWS, value || "") ? value : fallback;
};

export function productView(product, view) {
  const configuration = VIEWS[view];
  if (!configuration) return product;
  return composeProductView(product, {
    option: "Size",
    values: configuration.sizes,
    imageTokens: configuration.imageTokens,
    excludedImageTokens: Object.entries(VIEWS).filter(([key]) => key !== view).flatMap(([, value]) => value.imageTokens),
    neutralImageTokens: ["side", "side2", "sidez", "back", "front", "front2", "insole"],
  });
}

export const viewUrl = (path, view) => `${path}${view ? `?view=${view}` : ""}`;

export function productsForView(products, view) {
  return products.flatMap((product) => {
    const composed = productView(product, view);
    return composed ? [{ ...composed, view, url: viewUrl(`/products/${product.handle}`, view) }] : [];
  });
}
