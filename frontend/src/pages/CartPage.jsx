import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Layers2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Cart } from "../auth";
import { api, money } from "../api";
import { ProductImage } from "../components/StoreUI";
import { countCartProducts } from "../cartUtils";

export function CartPage() {
  const { cart, setCart } = useContext(Cart);
  const [products, setProducts] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const ids = [...new Set(cart.map((item) => item.productId))];
    Promise.all(ids.map((id) => api(`/products/${id}`)))
      .then((records) => {
        if (active)
          setProducts(Object.fromEntries(records.map((p) => [p.id, p])));
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [cart]);

  const rows = cart.map((item) => {
    const product = products[item.productId];
    const variant = product?.variants.find((v) => v.id === item.variantId);
    return { ...item, product, variant };
  });
  const productGroups = rows.reduce((groups, row) => {
    const key = String(row.productId);
    let group = groups.find((entry) => entry.key === key);
    if (!group) {
      group = { key, productId: row.productId, product: row.product, rows: [] };
      groups.push(group);
    } else if (!group.product && row.product) {
      group.product = row.product;
    }
    group.rows.push(row);
    return groups;
  }, []);
  const subtotal = rows.reduce(
    (sum, row) => sum + Number(row.product?.price || 0) * row.quantity,
    0,
  );
  const productCount = countCartProducts(cart);
  function changeQuantity(variantId, quantity) {
    setCart((items) =>
      items
        .map((item) =>
          item.variantId === variantId ? { ...item, quantity } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  return (
    <main className="section commerce-page cart-page">
      <div className="cart-page-heading">
        <div>
          <p className="eyebrow">LUMIQ · GIỎ HÀNG</p>
          <h1>Giỏ hàng của bạn</h1>
          <p className="cart-page-intro">
            Kiểm tra các lựa chọn của bạn trước khi đến bước thanh toán.
          </p>
        </div>
        {!!productCount && (
          <span className="cart-count-pill">
            <ShoppingBag size={17} />
            {productCount} sản phẩm
          </span>
        )}
      </div>
      {error && <p className="commerce-message error">{error}</p>}
      {!cart.length ? (
        <div className="cart-empty-state">
          <span className="cart-empty-icon">
            <ShoppingBag size={34} strokeWidth={1.5} />
          </span>
          <p className="eyebrow">BẮT ĐẦU HÀNH TRÌNH CỦA BẠN</p>
          <h2>Giỏ hàng đang chờ món đồ bạn yêu thích.</h2>
          <p>Khám phá bộ sưu tập và chọn những món đồ phù hợp với bạn.</p>
          <Link className="button" to="/san-pham">
            Khám phá sản phẩm <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <div className="commerce-layout">
          <div className="cart-list">
            <div className="cart-list-heading">
              <div>
                <h2>Sản phẩm đã chọn</h2>
                <p>{productCount} sản phẩm trong giỏ hàng</p>
              </div>
              <Link className="cart-continue-link" to="/san-pham">
                Tiếp tục mua sắm <ArrowRight size={16} />
              </Link>
            </div>
            {productGroups.map((group) => (
              <article className="cart-product-group" key={group.key}>
                <div className="cart-image">
                  {group.product ? (
                    <ProductImage product={group.product} />
                  ) : (
                    <span>Đang tải…</span>
                  )}
                </div>
                <div className="cart-group-content">
                  <div className="cart-group-heading">
                    <div>
                      <Link to={`/san-pham/${group.productId}`}>
                        <b>{group.product?.name || "Sản phẩm"}</b>
                      </Link>
                      <strong className="cart-unit-price">
                        {group.product
                          ? money(group.product.price)
                          : "Đang tải…"}
                      </strong>
                    </div>
                    <Link
                      className="cart-add-variant-link"
                      to={`/san-pham/${group.productId}`}
                    >
                      <Layers2 size={16} />
                      Chọn thêm mẫu
                    </Link>
                  </div>
                  <div className="cart-variant-list">
                    {group.rows.map((row) => (
                      <div className="cart-variant-row" key={row.variantId}>
                        <div className="cart-variant-info">
                          {row.variant ? (
                            <>
                              <span className="cart-variant-badge">
                                {[row.variant.size, row.variant.color]
                                  .filter(Boolean)
                                  .join(" · ") || "Mẫu sản phẩm"}
                              </span>
                              {row.variant.sku && (
                                <small className="cart-sku">
                                  Mã: {row.variant.sku}
                                </small>
                              )}
                            </>
                          ) : (
                            <small className="commerce-error">
                              Biến thể đã ngừng bán hoặc không còn tồn tại.
                            </small>
                          )}
                        </div>
                        <div className="cart-variant-actions">
                          {row.variant && (
                            <div className="cart-quantity-row">
                              <span>Số lượng</span>
                              <div className="quantity-control">
                                <button
                                  type="button"
                                  aria-label={`Giảm số lượng ${row.product?.name || "sản phẩm"}`}
                                  onClick={() =>
                                    changeQuantity(
                                      row.variantId,
                                      row.quantity - 1,
                                    )
                                  }
                                >
                                  <Minus size={15} />
                                </button>
                                <span>{row.quantity}</span>
                                <button
                                  type="button"
                                  aria-label={`Tăng số lượng ${row.product?.name || "sản phẩm"}`}
                                  disabled={row.quantity >= row.variant.stock}
                                  onClick={() =>
                                    changeQuantity(
                                      row.variantId,
                                      row.quantity + 1,
                                    )
                                  }
                                >
                                  <Plus size={15} />
                                </button>
                              </div>
                            </div>
                          )}
                          <strong className="cart-line-price">
                            {row.product
                              ? money(Number(row.product.price) * row.quantity)
                              : "Đang tính…"}
                          </strong>
                          <button
                            className="icon-button cart-remove"
                            type="button"
                            title="Xóa lựa chọn"
                            aria-label={`Xóa lựa chọn ${row.variant?.size || ""} ${row.variant?.color || ""} khỏi giỏ hàng`}
                            onClick={() => changeQuantity(row.variantId, 0)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <aside className="commerce-summary">
            <p className="eyebrow">TÓM TẮT</p>
            <h2>Đơn hàng của bạn</h2>
            <p>
              <span>{productCount} sản phẩm</span>
              <b>{money(subtotal)}</b>
            </p>
            <Link className="button" to="/thanh-toan">
              Tiến hành thanh toán <ArrowRight size={18} />
            </Link>
            <div className="cart-secure-note">
              <ShieldCheck size={18} />
              <span>Thông tin đơn hàng được bảo vệ</span>
              <Check size={15} />
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
