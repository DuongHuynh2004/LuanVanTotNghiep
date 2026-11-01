import { test } from "node:test";
import assert from "node:assert/strict";
import {
  matchingVariant,
  quantityInput,
  committedQuantity,
} from "./productSelection.js";
import { countCartProducts } from "./cartUtils.js";

test("cart count counts distinct products, not quantities or variants", () => {
  assert.equal(
    countCartProducts([
      { productId: 12, variantId: 1, quantity: 5 },
      { productId: "12", variantId: 2, quantity: 2 },
      { productId: 27, variantId: 3, quantity: 1 },
    ]),
    2,
  );
  assert.equal(countCartProducts([]), 0);
});

test("size and color resolve only the matching variant", () => {
  const product = {
    has_size: true,
    has_color: true,
    variants: [
      { size: "M", color: "Đỏ", stock: 2 },
      { size: "L", color: "Xanh", stock: 5 },
    ],
  };
  assert.equal(matchingVariant(product, "Đỏ", "M").stock, 2);
  assert.equal(matchingVariant(product, "Đỏ", "L"), undefined);
  assert.equal(
    matchingVariant({ ...product, has_size: false }, "Xanh", "").stock,
    5,
  );
});
test("quantity editing clears zero and clamps to stock", () => {
  assert.equal(quantityInput("0", 20), "");
  assert.equal(quantityInput("005", 20), "5");
  assert.equal(quantityInput("", 20), "");
  assert.equal(quantityInput("999", 20), "20");
  assert.equal(quantityInput("abc", 20), "");
  assert.equal(committedQuantity("", 20), "1");
  assert.equal(committedQuantity("0", 20), "1");
  assert.equal(committedQuantity("20", 2), "2");
  assert.equal(committedQuantity("1", 0), "0");
});
