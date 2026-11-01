import { useState } from "react";
import { Eye, PackageCheck, ShoppingBag } from "lucide-react";
import { api, money } from "../../api";
import { Notice } from "../../components/StoreUI";
import {
  AdminDialog,
  dateLabel,
  ListFilters,
  ListPagination,
  useAdminList,
} from "./AdminTools";

const statuses = [
  ["pending", "Chờ xử lý"],
  ["processing", "Đang xử lý"],
  ["shipped", "Đang giao"],
  ["completed", "Hoàn tất"],
  ["cancelled", "Đã hủy"],
];

const statusLabel = (status) =>
  statuses.find(([value]) => value === status)?.[1] || status;

const paymentStatusLabel = (status) =>
  ({
    unpaid: "Chưa thanh toán",
    pending_verification: "Chờ xác nhận",
    paid: "Đã thanh toán",
    refund_pending: "Chờ hoàn tiền",
    refunded: "Đã hoàn tiền",
  })[status] || status;

const dateTimeLabel = (value) =>
  value
    ? new Date(value).toLocaleString("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "—";

export function Orders() {
  const list = useAdminList("orders");
  const [selected, setSelected] = useState(null);
  const [nextStatus, setNextStatus] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function openOrder(order) {
    setError("");
    setMessage("");
    setSelected({ loading: true, order_code: order.order_code });
    try {
      const details = await api("/admin/orders/" + order.id);
      setSelected(details);
      setNextStatus(details.allowed_next_statuses[0] || "");
      setNote("");
    } catch (e) {
      setError(e.message);
      setSelected(null);
    }
  }

  async function updateStatus(e) {
    e.preventDefault();
    if (!selected || !nextStatus) return;
    setBusy(true);
    setError("");
    try {
      const updated = await api("/admin/orders/" + selected.id, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus, note }),
      });
      setSelected(updated);
      setNextStatus(updated.allowed_next_statuses[0] || "");
      setNote("");
      setMessage("Đã cập nhật trạng thái đơn hàng.");
      list.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">VẬN HÀNH CỬA HÀNG</p>
          <h1>Quản lý đơn hàng</h1>
          <p className="muted">
            Theo dõi đơn và cập nhật trạng thái xử lý. Thanh toán được quản lý
            riêng trong mục Thanh toán.
          </p>
        </div>
      </div>
      <Notice>{message}</Notice>
      <section className="panel">
        <ListFilters
          list={list}
          placeholder="Tìm mã đơn, tên, email hoặc số điện thoại…"
          statuses={statuses}
        />
        <Notice>{list.error}</Notice>
        {list.error.includes("create_orders.sql") && (
          <div className="empty">
            <ShoppingBag size={30} />
            <h3>Cần bật bảng quản lý đơn hàng</h3>
            <p>
              Chạy file <code>backend/database/create_orders.sql</code> trong
              phpMyAdmin, chọn database <code>lumiq</code>. Không cần chạy
              migration Laravel.
            </p>
          </div>
        )}
        {list.data && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Sản phẩm</th>
                    <th>Tổng tiền</th>
                    <th>Thanh toán</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.data.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <b>{order.order_code}</b>
                      </td>
                      <td>
                        <b>{order.customer_name}</b>
                        <small className="cell-detail">
                          {order.customer_email}
                        </small>
                      </td>
                      <td>{order.items_count}</td>
                      <td>{money(order.total)}</td>
                      <td>
                        {order.payment
                          ? `${order.payment.method === "cod" ? "COD" : "Chuyển khoản"} · ${paymentStatusLabel(order.payment.status)}`
                          : "Chưa có bản ghi"}
                      </td>
                      <td>
                        <span className={"badge " + order.status}>
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      <td>{dateLabel(order.created_at)}</td>
                      <td>
                        <button
                          className="icon-button"
                          aria-label={"Xem đơn " + order.order_code}
                          onClick={() => openOrder(order)}
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {list.data.data.length === 0 && (
              <div className="empty">
                <PackageCheck size={30} />
                <h3>Chưa có đơn hàng</h3>
                <p>Đơn đặt qua cửa hàng sẽ xuất hiện tại đây.</p>
              </div>
            )}
            <ListPagination list={list} />
          </>
        )}
        {!list.data && !list.error && (
          <p className="empty">Đang tải đơn hàng…</p>
        )}
      </section>
      {selected && (
        <AdminDialog
          className="order-dialog"
          title={
            selected.loading
              ? "Đang tải đơn hàng…"
              : "Đơn hàng " + selected.order_code
          }
          onClose={() => {
            if (!busy) setSelected(null);
          }}
          busy={busy}
        >
          {selected.loading ? (
            <p className="empty">Đang tải chi tiết…</p>
          ) : (
            <>
              <Notice>{error}</Notice>
              <Notice>{message}</Notice>
              <div className="order-customer">
                <b>{selected.customer_name}</b>
                <span>{selected.customer_email}</span>
                <span>{selected.customer_phone}</span>
                <span>{selected.shipping_address}</span>
                <small>Đặt lúc {dateTimeLabel(selected.created_at)}</small>
                <small>
                  Thanh toán:{" "}
                  {selected.payment
                    ? `${selected.payment.method === "cod" ? "COD" : "Chuyển khoản"} · ${paymentStatusLabel(selected.payment.status)}`
                    : "Chưa có bản ghi"}
                </small>
                {selected.payment?.transaction_reference && (
                  <small>
                    Mã giao dịch: {selected.payment.transaction_reference}
                  </small>
                )}
              </div>
              {selected.customer_note && (
                <p className="muted">Ghi chú khách: {selected.customer_note}</p>
              )}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>SKU / phân loại</th>
                      <th>SL</th>
                      <th>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.product_name}</td>
                        <td>
                          {item.sku}
                          <small className="cell-detail">
                            {[item.size, item.color]
                              .filter(Boolean)
                              .join(" · ") || "Không có phân loại"}
                          </small>
                        </td>
                        <td>{item.quantity}</td>
                        <td>{money(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="order-total">
                <span>Tạm tính</span>
                <b>{money(selected.subtotal)}</b>
                <span>Phí giao hàng</span>
                <b>{money(selected.shipping_fee)}</b>
                <span>Giảm giá</span>
                <b>
                  -{money(selected.discount_amount)}
                  {selected.promotion_redemption?.code
                    ? ` (${selected.promotion_redemption.code})`
                    : ""}
                </b>
                <strong>Tổng cộng</strong>
                <strong>{money(selected.total)}</strong>
              </div>
              <section className="order-history">
                <h3>Lịch sử trạng thái</h3>
                {selected.status_histories.map((history) => (
                  <div className="order-history-row" key={history.id}>
                    <span>
                      {history.old_status
                        ? statusLabel(history.old_status) + " → "
                        : ""}
                      {statusLabel(history.new_status)}
                    </span>
                    <small>
                      {dateTimeLabel(history.created_at)}
                      {history.changed_by?.name
                        ? " · " + history.changed_by.name
                        : ""}
                    </small>
                    {history.note && <p>{history.note}</p>}
                  </div>
                ))}
                {selected.status_histories.length === 0 && (
                  <p className="muted">Chưa có lịch sử cập nhật.</p>
                )}
              </section>
              {selected.allowed_next_statuses.length > 0 && (
                <form className="order-update" onSubmit={updateStatus}>
                  <label className="field">
                    Chuyển trạng thái từ {statusLabel(selected.status)}
                    <select
                      value={nextStatus}
                      required
                      onChange={(e) => setNextStatus(e.target.value)}
                    >
                      {selected.allowed_next_statuses.map((status) => (
                        <option key={status} value={status}>
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    Ghi chú xử lý (không bắt buộc)
                    <textarea
                      rows={2}
                      maxLength={2000}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </label>
                  <button className="button" disabled={busy}>
                    {busy ? "Đang lưu…" : "Cập nhật trạng thái"}
                  </button>
                </form>
              )}
            </>
          )}
        </AdminDialog>
      )}
    </>
  );
}
