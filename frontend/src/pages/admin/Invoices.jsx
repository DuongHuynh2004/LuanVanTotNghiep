import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Printer, ReceiptText } from "lucide-react";
import { api, money } from "../../api";
import { Field } from "../../components/StoreUI";

export function AdminInvoices() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api(`/admin/invoices/${id}`)
      .then(setInvoice)
      .catch((e) => setError(e.message));
  }, [id]);
  useEffect(() => {
    if (id) return;
    api(
      `/admin/invoices?q=${encodeURIComponent(search)}&type=${type}&page=${page}`,
    )
      .then(setResult)
      .catch((e) => setError(e.message));
  }, [id, search, type, page]);

  if (id) {
    if (error) return <p className="commerce-message error">{error}</p>;
    if (!invoice) return <p>Đang tải phiếu…</p>;
    const order = invoice.order;
    return (
      <div className="admin-invoice-view">
        <div className="invoice-toolbar no-print">
          <Link className="text-link" to="/admin/invoices">
            ← Danh sách phiếu
          </Link>
          <button className="button" onClick={() => window.print()}>
            <Printer size={17} /> In
          </button>
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
            Mã phiếu: <b>{invoice.invoice_number}</b> · Mã đơn:{" "}
            <b>{order.order_code}</b>
          </p>
          <p>
            Khách hàng: {order.customer_name} · {order.customer_email} ·{" "}
            {order.customer_phone}
          </p>
          <p>Địa chỉ: {order.shipping_address}</p>
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
                    <small>{item.sku}</small>
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
              <span>Giao hàng</span>
              <b>{money(order.shipping_fee)}</b>
            </p>
            <p>
              <span>Khuyến mãi</span>
              <b>−{money(order.discount_amount)}</b>
            </p>
            <p className="invoice-grand-total">
              <span>Tổng COD</span>
              <b>{money(order.total)}</b>
            </p>
          </div>
          <p className="invoice-footnote">
            Đây là phiếu nội bộ xác nhận đơn hàng, không phải hóa đơn VAT.
          </p>
        </article>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">BÁN HÀNG · CHỨNG TỪ</p>
          <h1>Quản lý phiếu mua hàng</h1>
          <p className="muted">
            Biên nhận COD và phiếu nội bộ phát hành khi đơn hoàn tất.
          </p>
        </div>
      </div>
      {error && <p className="commerce-message error">{error}</p>}
      <section className="panel admin-table-panel">
        <div className="table-toolbar">
          <Field
            label="Tìm mã phiếu, đơn hoặc khách"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            aria-label="Loại phiếu"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả loại phiếu</option>
            <option value="receipt">Biên nhận COD</option>
            <option value="final">Phiếu hoàn tất</option>
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã phiếu</th>
                <th>Đơn hàng</th>
                <th>Khách hàng</th>
                <th>Loại</th>
                <th>Tổng</th>
                <th>Phát hành</th>
                <th>Trạng thái đơn</th>
              </tr>
            </thead>
            <tbody>
              {result?.data?.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link
                      className="text-link"
                      to={`/admin/invoices/${row.id}`}
                    >
                      {row.invoice_number}
                    </Link>
                  </td>
                  <td>{row.order.order_code}</td>
                  <td>
                    {row.order.customer_name}
                    <small className="cell-detail">
                      {row.order.customer_email}
                    </small>
                  </td>
                  <td>
                    {row.document_type === "final"
                      ? "Phiếu hoàn tất"
                      : "Biên nhận COD"}
                  </td>
                  <td>{money(row.order.total)}</td>
                  <td>{new Date(row.issued_at).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <span className={`badge ${row.order.status}`}>
                      {row.order.status === "cancelled"
                        ? "Đơn đã hủy"
                        : "Đã phát hành"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!result?.data?.length && (
          <p className="empty">Chưa có phiếu mua hàng.</p>
        )}
        {result?.last_page > 1 && (
          <div className="pagination">
            <button
              disabled={result.current_page <= 1}
              onClick={() => setPage(result.current_page - 1)}
            >
              Trước
            </button>
            <span>
              Trang {result.current_page} / {result.last_page}
            </span>
            <button
              disabled={result.current_page >= result.last_page}
              onClick={() => setPage(result.current_page + 1)}
            >
              Sau
            </button>
          </div>
        )}
        <p className="invoice-footnote">
          Các phiếu này không phải hóa đơn VAT.
        </p>
      </section>
    </div>
  );
}
