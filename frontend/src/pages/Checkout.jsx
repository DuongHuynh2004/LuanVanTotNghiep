import { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Auth, Cart } from "../auth";
import { api, money } from "../api";
import { Field } from "../components/StoreUI";
import { DeliveryMap } from "../components/DeliveryMap";

export function Checkout() {
  const { user } = useContext(Auth);
  const { cart, setCart } = useContext(Cart);
  const navigate = useNavigate();
  const [products, setProducts] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shippingBusy, setShippingBusy] = useState(false);
  const [shipping, setShipping] = useState(null);
  const [point, setPoint] = useState(null);
  const quoteVersion = useRef(0);
  function changePoint(next) {
    quoteVersion.current++;
    setPoint(next);
    setShipping(null);
  }
  const [promoCode, setPromoCode] = useState("");
  const [promotion, setPromotion] = useState(null);
  const [promoMessage, setPromoMessage] = useState("");
  const [phone, setPhone] = useState(user.phone || "");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

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
    return {
      ...item,
      product,
      variant: product?.variants.find((v) => v.id === item.variantId),
    };
  });
  const subtotal = rows.reduce(
    (sum, row) => sum + Number(row.product?.price || 0) * row.quantity,
    0,
  );
  const discount = promotion?.discount_amount || 0;

  async function quoteShipping() {
    const quotedAddress = address.trim();
    if (!point) return;
    const version = ++quoteVersion.current;
    setError("");
    setShipping(null);
    setShippingBusy(true);
    try {
      const quote = await api("/shipping/quote", {
        method: "POST",
        body: JSON.stringify({ shipping_address: quotedAddress, ...point }),
      });
      if (quoteVersion.current === version) setShipping(quote);
    } catch (e) {
      if (quoteVersion.current === version) setError(e.message);
    } finally {
      setShippingBusy(false);
    }
  }

  async function applyPromotion() {
    setPromoMessage("");
    setPromotion(null);
    if (!promoCode.trim()) {
      setPromoMessage("Nhập mã khuyến mãi để áp dụng.");
      return;
    }
    try {
      const result = await api("/promotions/validate", {
        method: "POST",
        body: JSON.stringify({ code: promoCode, subtotal }),
      });
      setPromotion(result);
      setPromoCode(result.code);
      setPromoMessage(`Đã áp dụng mã ${result.code}.`);
    } catch (e) {
      setPromoMessage(e.message);
    }
  }

  async function placeOrder(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const order = await api("/checkout", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map(({ variantId, quantity }) => ({
            variant_id: variantId,
            quantity,
          })),
          customer_phone: phone,
          shipping_address: address,
          ...point,
          customer_note: note,
          promotion_code: promotion?.code || "",
        }),
      });
      setCart([]);
      navigate(`/tai-khoan/don-hang/${order.id}`);
    } catch (e) {
      setError(e.message);
      setShipping(null);
    } finally {
      setBusy(false);
    }
  }

  if (!cart.length) {
    return (
      <main className="section commerce-page">
        <h1>Thanh toán</h1>
        <p>Giỏ hàng đang trống.</p>
        <Link className="button" to="/san-pham">
          Xem sản phẩm
        </Link>
      </main>
    );
  }

  return (
    <main className="section commerce-page">
      <p className="eyebrow">LUMIQ · THANH TOÁN</p>
      <h1>Thông tin giao hàng</h1>
      <p className="muted">
        Thanh toán khi nhận hàng (COD). Đơn hàng chỉ được tạo sau khi hệ thống
        xác nhận tồn kho và phí giao hàng.
      </p>
      {error && (
        <p className="commerce-message error" role="alert">
          {error}
        </p>
      )}
      <form className="commerce-layout checkout-layout" onSubmit={placeOrder}>
        <div className="checkout-form">
          <div className="form-grid">
            <Field label="Họ tên" value={user.name} readOnly />
            <Field label="Email" value={user.email} readOnly />
          </div>
          <Field
            label="Số điện thoại"
            type="tel"
            inputMode="numeric"
            pattern="0[0-9]{9}"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <label className="field">
            Địa chỉ giao hàng
            <textarea
              rows="3"
              minLength="10"
              maxLength="1000"
              placeholder="Số nhà, tên đường, phường/xã, TP. Hồ Chí Minh"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setPoint(null);
                quoteVersion.current++;
                setShipping(null);
              }}
              required
            />
            <small className="checkout-address-note">
              LUMIQ giao quanh kho tại TP. Hồ Chí Minh, tối đa 40 km theo đường
              phố từ cửa hàng.
            </small>
          </label>
          <DeliveryMap point={point} onChange={changePoint} address={address} />
          <button
            className="button secondary"
            type="button"
            onClick={quoteShipping}
            disabled={
              address.trim().length < 10 || !point || shippingBusy || busy
            }
          >
            {shippingBusy ? "Đang xác định tuyến đường…" : "Tính phí giao hàng"}
          </button>
          {shipping && (
            <div className="shipping-quote">
              <p>
                Địa chỉ nằm trong phạm vi giao hàng. Tuyến đường{" "}
                {(shipping.distance_meters / 1000).toFixed(1)} km · Tính{" "}
                {shipping.kilometers_charged} km × {money(shipping.rate_per_km)}{" "}
                = <b>{money(shipping.shipping_fee)}</b>
              </p>
              <a href={shipping.map_url} target="_blank" rel="noreferrer">
                Xem tuyến đường trên OpenStreetMap
              </a>
            </div>
          )}
          <small className="checkout-map-attribution">
            Tọa độ được gửi tới dịch vụ OSRM để ước tính tuyến ô tô và phí giao.
          </small>
          <label className="field">
            Ghi chú đơn hàng (không bắt buộc)
            <textarea
              rows="2"
              maxLength="2000"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>
        <aside className="commerce-summary">
          <h2>Đơn hàng</h2>
          {rows.map((row) => (
            <p key={row.variantId}>
              <span>
                {row.product?.name || "Sản phẩm"} × {row.quantity}
              </span>
              <b>{money(Number(row.product?.price || 0) * row.quantity)}</b>
            </p>
          ))}
          <div className="promo-entry">
            <Field
              label="Mã khuyến mãi"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
            <button
              type="button"
              className="button secondary"
              onClick={applyPromotion}
            >
              Áp dụng
            </button>
          </div>
          {promoMessage && <small role="status">{promoMessage}</small>}
          <p>
            <span>Tạm tính</span>
            <b>{money(subtotal)}</b>
          </p>
          <p>
            <span>Khuyến mãi</span>
            <b>−{money(discount)}</b>
          </p>
          <p>
            <span>Giao hàng</span>
            <b>{shipping ? money(shipping.shipping_fee) : "Chưa tính"}</b>
          </p>
          <p className="checkout-total">
            <strong>Tổng thanh toán</strong>
            <strong>
              {money(subtotal - discount + (shipping?.shipping_fee || 0))}
            </strong>
          </p>
          <button
            className="button"
            disabled={busy || !shipping || rows.some((row) => !row.variant)}
          >
            {busy ? "Đang tạo đơn…" : "Đặt hàng COD"}
          </button>
          <Link className="text-link" to="/gio-hang">
            Quay lại giỏ hàng
          </Link>
        </aside>
      </form>
    </main>
  );
}
