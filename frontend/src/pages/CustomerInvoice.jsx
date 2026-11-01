import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Printer } from "lucide-react";
import { api, money } from "../api";

export function CustomerInvoice() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api(`/my/invoices/${id}`)
      .then(setInvoice)
      .catch((e) => setError(e.message));
  }, [id]);

  if (error)
    return (
      <div className="profile-content commerce-page">
        <p className="commerce-message error">{error}</p>
      </div>
    );
  if (!invoice)
    return (
      <div className="profile-content commerce-page">
        <p>Đang tải phiếu…</p>
      </div>
    );
  const order = invoice.order;

  return (
    <div className="profile-content commerce-page">
      <div className="invoice-toolbar no-print">
        <Link className="text-link" to={`/tai-khoan/don-hang/${order.id}`}>
          ← Quay lại đơn hàng
        </Link>
        <button className="button" onClick={() => window.print()}>
          <Printer size={17} /> In phiếu
        </button>
      </div>
      <div className="profile-heading no-print">
        <div>
          <p className="eyebrow">MY LUMIQ</p>
          <h1>Phiếu mua hàng</h1>
          <p>Phiếu được lưu trong thông tin đơn hàng của bạn.</p>
        </div>
      </div>
      <article className="invoice-paper">
        <header>
          <div>
            <b>LUMIQ</b>
            <small>EVERYDAY, REDEFINED.</small>
          </div>
          <span>PHIẾU NỘI BỘ · KHÔNG PHẢI HÓA ĐƠN VAT</span>
        </header>
        <h1>
          {invoice.document_type === "final"
            ? "Phiếu mua hàng hoàn tất"
            : "Biên nhận đặt hàng COD"}
        </h1>
        {invoice.order.status === "cancelled" && (
          <p className="invoice-cancelled">
            <b>PHIẾU ĐÃ HỦY</b>
          </p>
        )}
        <p>
          Mã phiếu: <b>{invoice.invoice_number}</b>
        </p>
        <p>
          Mã đơn: <b>{order.order_code}</b>
        </p>
        <p>
          Ngày phát hành: {new Date(invoice.issued_at).toLocaleString("vi-VN")}
        </p>
        <hr />
        <h2>Thông tin khách hàng</h2>
        <p>
          {order.customer_name} · {order.customer_email}
        </p>
        <p>{order.customer_phone}</p>
        <p>{order.shipping_address}</p>
        <table>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>SL</th>
              <th>Đơn giá</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.product_name}
                  <small>
                    {item.sku}
                    {item.size ? ` · ${item.size}` : ""}
                    {item.color ? ` · ${item.color}` : ""}
                  </small>
                </td>
                <td>{item.quantity}</td>
                <td>{money(item.unit_price)}</td>
                <td>{money(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="invoice-totals">
          <p>
            <span>Tạm tính</span>
            <b>{money(order.subtotal)}</b>
          </p>
          <p>
            <span>Phí giao hàng</span>
            <b>{money(order.shipping_fee)}</b>
          </p>
          <p>
            <span>Khuyến mãi</span>
            <b>−{money(order.discount_amount)}</b>
          </p>
          <p className="invoice-grand-total">
            <span>Tổng thanh toán COD</span>
            <b>{money(order.total)}</b>
          </p>
        </div>
        <p className="invoice-footnote">
          Phiếu xác nhận giao dịch nội bộ. Đây không phải hóa đơn giá trị gia
          tăng (VAT).
        </p>
      </article>
    </div>
  );
}
