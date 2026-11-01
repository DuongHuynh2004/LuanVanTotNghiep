export function matchingVariant(product, color, size) {
  return product.variants.find(
    (v) =>
      (!product.has_color || v.color === color) &&
      (!product.has_size || v.size === size),
  );
}
export function quantityInput(value, stock) {
  const digits = value.replace(/[^0-9]/g, "").replace(/^0+/, "");
  return digits ? String(Math.min(Number(digits), stock)) : "";
}
export function committedQuantity(value, stock) {
  return String(
    stock > 0 ? Math.max(1, Math.min(Number(value) || 1, stock)) : 0,
  );
}
