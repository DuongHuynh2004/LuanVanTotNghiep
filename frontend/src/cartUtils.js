export function countCartProducts(cart) {
  return new Set(cart.map((item) => String(item.productId))).size;
}
