import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, PackageCheck } from "lucide-react";
import { api, money } from "../api";

const statuses = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  shipped: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

function documentName(type) {
  return type === "final"
    ? "Phiếu mua hàng hoàn tất"
    : "Biên nhận đặt hàng COD";
}

export function CustomerOrders() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    api(id ? `/my/orders/${id}` : "/my/orders")
      .then((result) => active && setData(result))
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [id]);

  if (error)
    return (
      <div className="profile-content profile-order-page commerce-page">
        <div className="profile-heading">
          <div>
            <p className="eyebrow">MY LUMIQ</p>
            <h1>Đơn hàng</h1>
            <p className="commerce-message error">{error}</p>
          </div>
          <span className="profile-heading-mark" aria-hidden="true">
            <PackageCheck size={23} />
          </span>
        </div>
        <Link className="text-link" to="/tai-khoan/don-hang">
          Quay lại đơn hàng
        </Link>
      </div>
    );
  if (!data)
    return (
      <div className="profile-content profile-order-page commerce-page">
        <div className="profile-heading">
          <div>
            <p className="eyebrow">MY LUMIQ</p>
            <h1>{id ? "Chi tiết đơn hàng" : "Lịch sử đơn hàng"}</h1>
            <p>Đang tải đơn hàng…</p>
          </div>
          <span className="profile-heading-mark" aria-hidden="true">
            <PackageCheck size={23} />
          </span>
        </div>
      </div>
    );

  if (id) {
    return (
      <div className="profile-content profile-order-page commerce-page">
        <Link className="profile-back-link" to="/tai-khoan/don-hang">
          <ArrowLeft size={16} /> Tất cả đơn hàng
        </Link>
        <div className="profile-heading">
          <div>
            <p className="eyebrow">CHI TIẾT ĐƠN HÀNG</p>
            <h1>{data.order_code}</h1>
            <span className={`badge ${data.status}`}>
              {statuses[data.status] || data.status}
            </span>
          </div>
          <span className="profile-heading-mark" aria-hidden="true">
            <PackageCheck size={23} />
          </span>
        </div>
        <div className="commerce-layout order-detail-layout">
          <section className="cart-list">
            <h2>Sản phẩm</h2>
            {data.items.map((item) => (
              <article className="order-item" key={item.id}>
                <div>
                  <b>{item.product_name}</b>
                  <small>
                    {item.sku}
                    {item.size ? ` · Size ${item.size}` : ""}
                    {item.color ? ` · ${item.color}` : ""}
                  </small>
                  <small>Số lượng: {item.quantity}</small>
                </div>
                <strong>{money(item.line_total)}</strong>
              </article>
            ))}
            <div className="order-history">
              <h3>Lịch sử xử lý</h3>
              {data.status_histories.map((history) => (
                <p key={history.id}>
                  <b>{statuses[history.new_status] || history.new_status}</b>
                  <small>
                    {new Date(history.created_at).toLocaleString("vi-VN")}
                  </small>
                  {history.note && <span>{history.note}</span>}
                </p>
              ))}
            </div>
          </section>
          <aside className="commerce-summary">
            <h2>Thanh toán & giao hàng</h2>
            <p>
              <span>Tạm tính</span>
              <b>{money(data.subtotal)}</b>
            </p>
            <p>
              <span>Phí giao hàng</span>
              <b>{money(data.shipping_fee)}</b>
            </p>
            <p>
              <span>
                Khuyến mãi
                {data.promotion_redemption?.code
                  ? ` · ${data.promotion_redemption.code}`
                  : ""}
              </span>
              <b>−{money(data.discount_amount)}</b>
            </p>
            <p className="checkout-total">
              <strong>Tổng COD</strong>
              <strong>{money(data.total)}</strong>
            </p>
            <p>
              <span>Địa chỉ</span>
              <span>{data.shipping_address}</span>
            </p>
            <p>
              <span>Thanh toán</span>
              <span>Tiền mặt khi nhận (COD)</span>
            </p>
            <div className="invoice-links">
              <h3>Phiếu mua hàng</h3>
              {data.invoices.map((invoice) => (
                <Link key={invoice.id} to={`/tai-khoan/phieu/${invoice.id}`}>
                  {documentName(invoice.document_type)} ·{" "}
                  {invoice.invoice_number}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-content profile-order-page commerce-page">
      <div className="profile-heading">
        <div>
          <p className="eyebrow">MY LUMIQ</p>
          <h1>Lịch sử đơn hàng</h1>
          <p>Theo dõi trạng thái và thông tin các đơn hàng của bạn.</p>
        </div>
        <PackageCheck className="profile-heading-mark" aria-hidden="true" />
      </div>
      {data.data.length === 0 ? (
        <div className="profile-orders-empty">
          <p>Bạn chưa có đơn hàng.</p>
          <Link className="button" to="/san-pham">
            Khám phá sản phẩm <ArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <div className="order-list">
          {data.data.map((order) => (
            <Link
              className="customer-order-card"
              key={order.id}
              to={`/tai-khoan/don-hang/${order.id}`}
            >
              <div>
                <b>{order.order_code}</b>
                <small>
                  {new Date(order.created_at).toLocaleString("vi-VN")} ·{" "}
                  {order.items_count} sản phẩm
                </small>
              </div>
              <span className={`badge ${order.status}`}>
                {statuses[order.status] || order.status}
              </span>
              <strong>{money(order.total)}</strong>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
