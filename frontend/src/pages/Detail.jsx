import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, Leaf, Minus, Plus } from "lucide-react";
import { api, money } from "../api";
import { Cart } from "../auth";
import { Notice, ProductImage } from "../components/StoreUI";
import {
  matchingVariant,
  quantityInput,
  committedQuantity,
} from "../productSelection";

export function Detail() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [error, setError] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [image, setImage] = useState(0);
  const { cart, setCart } = useContext(Cart);
  const [cartMessage, setCartMessage] = useState("");
  useEffect(() => {
    let active = true;
    setP(null);
    setError("");
    setImage(0);
    setColor("");
    setSize("");
    setQuantity("1");
    api("/products/" + id)
      .then((product) => {
        if (!active) return;
        const first =
          product.variants.find((v) => v.stock > 0) || product.variants[0];
        const firstColor = product.has_color ? first?.color || "" : "";
        const sizes = [
          ...new Set(
            product.variants
              .filter((v) => !product.has_color || v.color === firstColor)
              .map((v) => v.size)
              .filter(Boolean),
          ),
        ];
        setColor(firstColor);
        setSize(sizes.length === 1 ? sizes[0] : "");
        setP(product);
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [id]);
  const colors = p
    ? [...new Set(p.variants.map((v) => v.color).filter(Boolean))]
    : [];
  const sizes = p
    ? [...new Set(p.variants.map((v) => v.size).filter(Boolean))].sort(
        (a, b) => {
          const order = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL"];
          return order.includes(a) && order.includes(b)
            ? order.indexOf(a) - order.indexOf(b)
            : a.localeCompare(b, "vi", { numeric: true });
        },
      )
    : [];
  const selected = p ? matchingVariant(p, color, size) : null;
  const stock = selected?.stock || 0;
  const displayedImage = p?.images[image];
  function chooseColor(value) {
    setColor(value);
    const available = p.variants.filter((v) => v.color === value);
    if (!available.some((v) => v.size === size && v.stock > 0)) {
      const choices = [
        ...new Set(available.map((v) => v.size).filter(Boolean)),
      ];
      setSize(choices.length === 1 ? choices[0] : "");
    }
    setQuantity("1");
  }
  function addToCart() {
    if (!selected || stock < Number(quantity)) return;
    const variantId = Number(selected.id);
    setCart((items) => {
      const existing = items.find((item) => item.variantId === variantId);
      if (existing) {
        return items.map((item) =>
          item.variantId === variantId
            ? {
                ...item,
                quantity: Math.min(item.quantity + Number(quantity), stock),
              }
            : item,
        );
      }
      return [
        ...items,
        { productId: Number(p.id), variantId, quantity: Number(quantity) },
      ];
    });
    setCartMessage("Đã thêm sản phẩm vào giỏ hàng.");
  }
  return (
    <main className="section">
      <Link className="text-link" to="/san-pham">
        <ChevronLeft size={16} /> Tất cả sản phẩm
      </Link>
      <Notice>{error}</Notice>
      {p ? (
        <div className="detail">
          <div>
            <div className="detail-photo">
              {displayedImage ? (
                <img src={displayedImage.image_path} alt={p.name} />
              ) : (
                <ProductImage product={p} />
              )}
            </div>
            <div className="thumbnails">
              {p.images.map((im, i) => (
                <button
                  type="button"
                  key={im.id}
                  onClick={() => {
                    setImage(i);
                  }}
                  aria-label={"Xem ảnh " + (i + 1)}
                  aria-pressed={displayedImage === im}
                >
                  <img src={im.image_path} alt="" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="eyebrow">LUMIQ ESSENTIALS</p>
            <h1>{p.name}</h1>
            <h2>{money(p.price)}</h2>
            <p className="description">
              {p.description || "Thiết kế tinh giản cho cuộc sống mỗi ngày."}
            </p>
            <div className="product-options">
              {!!p.has_color && colors.length > 0 && (
                <div className="product-option-row">
                  <span id="product-color-label" className="option-label">
                    Màu
                  </span>
                  {colors.length === 1 ? (
                    <span className="single-color">{colors[0]}</span>
                  ) : (
                    <div
                      className="option-buttons"
                      role="group"
                      aria-labelledby="product-color-label"
                    >
                      {colors.map((value) => (
                        <button
                          type="button"
                          className="option-button"
                          key={value}
                          aria-pressed={color === value}
                          onClick={() => chooseColor(value)}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!!p.has_size && sizes.length > 0 && (
                <div className="product-option-row">
                  <span id="product-size-label" className="option-label">
                    Size
                  </span>
                  <div
                    className="option-buttons"
                    role="group"
                    aria-labelledby="product-size-label"
                  >
                    {sizes.map((value) => {
                      const candidate = matchingVariant(p, color, value);
                      return (
                        <button
                          type="button"
                          className="option-button size-button"
                          key={value}
                          aria-pressed={size === value}
                          disabled={!candidate || candidate.stock <= 0}
                          title={
                            !candidate || candidate.stock <= 0
                              ? "Hết hàng"
                              : undefined
                          }
                          onClick={() => {
                            setSize(value);
                            setQuantity("1");
                          }}
                        >
                          {value}
                        </button>
                      );
                    })}
                  </div>
                  {!selected && p.variants.some((v) => v.stock > 0) && (
                    <p
                      className="selection-status size-selection-hint"
                      role="status"
                    >
                      Vui lòng chọn kích thước phù hợp.
                    </p>
                  )}
                </div>
              )}
              <div className="product-option-row">
                <label className="option-label" htmlFor="product-quantity">
                  Số lượng
                </label>
                <div className="quantity-control">
                  <button
                    type="button"
                    aria-label="Giảm số lượng"
                    disabled={!stock || Number(quantity) <= 1}
                    onClick={() =>
                      setQuantity(
                        committedQuantity(Number(quantity) - 1, stock),
                      )
                    }
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    id="product-quantity"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    value={selected ? (stock ? quantity : "0") : "1"}
                    disabled={!stock}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      setQuantity(quantityInput(e.target.value, stock))
                    }
                    onBlur={() =>
                      setQuantity(committedQuantity(quantity, stock))
                    }
                  />
                  <button
                    type="button"
                    aria-label="Tăng số lượng"
                    disabled={!stock || Number(quantity) >= stock}
                    onClick={() =>
                      setQuantity(
                        committedQuantity(Number(quantity) + 1, stock),
                      )
                    }
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              {(selected || !p.variants.some((v) => v.stock > 0)) && (
                <p className="selection-status" role="status">
                  {stock > 0 ? "Còn hàng" : "Hết hàng"}
                </p>
              )}
            </div>
            <div className="detail-note">
              <Leaf size={20} /> Dễ kết hợp. Thoải mái mỗi ngày.
            </div>
            <button
              className="button cart-add-button"
              disabled={!selected || !stock}
              onClick={addToCart}
            >
              Thêm vào giỏ hàng
            </button>
            <p className="selection-status" role="status">
              {cartMessage}
            </p>
          </div>
        </div>
      ) : (
        !error && <p className="empty">Đang tải…</p>
      )}
    </main>
  );
}
