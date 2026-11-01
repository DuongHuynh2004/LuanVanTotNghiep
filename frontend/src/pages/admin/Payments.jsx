import { useEffect, useState } from "react";
import { CreditCard } from "lucide-react";
import { api, money } from "../../api";
import { Field, Notice } from "../../components/StoreUI";

const statuses = [
  ["unpaid", "Chưa thanh toán"],
  ["pending_verification", "Chờ xác nhận"],
  ["paid", "Đã thanh toán"],
  ["refund_pending", "Chờ hoàn tiền"],
  ["refunded", "Đã hoàn tiền"],
];

const orderStatusLabel = (status) =>
  ({
    pending: "Chờ xử lý",
    processing: "Đang xử lý",
    shipped: "Đang giao",
    completed: "Hoàn tất",
    cancelled: "Đã hủy",
  })[status] || status;

export function Payments() {
  const [result, setResult] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function load(page = 1) {
    try {
      const params = new URLSearchParams({
        q: search,
        status: statusFilter,
        method: methodFilter,
        page: String(page),
      });
      setResult(await api(`/admin/payments?${params}`));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, [search, statusFilter, methodFilter]);

  function draftFor(payment) {
    return (
      drafts[payment.id] || {
        status: payment.status,
        transaction_reference: payment.transaction_reference || "",
      }
    );
  }

  async function save(payment) {
    const draft = draftFor(payment);
    setBusyId(payment.id);
    setError("");
    setMessage("");
    try {
      await api(`/admin/payments/${payment.id}`, {
        method: "PATCH",
        body: JSON.stringify(draft),
      });
      setMessage(`Đã cập nhật thanh toán đơn ${payment.order.order_code}.`);
      setDrafts((existing) => {
        const next = { ...existing };
        delete next[payment.id];
        return next;
      });
      await load(result?.current_page || 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">BÁN HÀNG · ĐỐI SOÁT</p>
          <h1>Quản lý thanh toán</h1>
          <p className="muted">
            Theo dõi COD/chuyển khoản và cập nhật trạng thái thu tiền, hoàn
            tiền.
          </p>
        </div>
      </div>
      <Notice>{error || message}</Notice>
      <section className="panel admin-table-panel">
        <div className="table-toolbar">
          <Field
            label="Tìm mã đơn hoặc khách hàng"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            aria-label="Lọc trạng thái thanh toán"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">Mọi trạng thái</option>
            {statuses.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="Lọc phương thức thanh toán"
            value={methodFilter}
            onChange={(event) => setMethodFilter(event.target.value)}
          >
            <option value="">Mọi phương thức</option>
            <option value="cod">COD</option>
            <option value="bank_transfer">Chuyển khoản</option>
          </select>
        </div>
        <Notice>{result ? "" : "Đang tải thanh toán…"}</Notice>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Phương thức</th>
                <th>Số tiền</th>
                <th>Trạng thái đơn</th>
                <th>Trạng thái thanh toán</th>
                <th>Mã giao dịch</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {result?.data?.map((payment) => {
                const draft = draftFor(payment);
                const changed =
                  draft.status !== payment.status ||
                  draft.transaction_reference !==
                    (payment.transaction_reference || "");
                return (
                  <tr key={payment.id}>
                    <td>
                      <b>{payment.order.order_code}</b>
                    </td>
                    <td>
                      {payment.order.customer_name}
                      <small className="cell-detail">
                        {payment.order.customer_email}
                      </small>
                    </td>
                    <td>{payment.method === "cod" ? "COD" : "Chuyển khoản"}</td>
                    <td>{money(payment.order.total)}</td>
                    <td>{orderStatusLabel(payment.order.status)}</td>
                    <td>
                      <select
                        aria-label={`Trạng thái thanh toán ${payment.order.order_code}`}
                        value={draft.status}
                        onChange={(event) =>
                          setDrafts({
                            ...drafts,
                            [payment.id]: {
                              ...draft,
                              status: event.target.value,
                            },
                          })
                        }
                      >
                        {statuses.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        aria-label={`Mã giao dịch ${payment.order.order_code}`}
                        maxLength={100}
                        value={draft.transaction_reference}
                        onChange={(event) =>
                          setDrafts({
                            ...drafts,
                            [payment.id]: {
                              ...draft,
                              transaction_reference: event.target.value,
                            },
                          })
                        }
                      />
                      {payment.paid_at && (
                        <small className="cell-detail">
                          Thu lúc{" "}
                          {new Date(payment.paid_at).toLocaleString("vi-VN")}
                        </small>
                      )}
                    </td>
                    <td>
                      <button
                        className="button secondary payment-save"
                        disabled={!changed || busyId === payment.id}
                        onClick={() => save(payment)}
                      >
                        {busyId === payment.id ? "Đang lưu…" : "Lưu"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {result?.data?.length === 0 && (
          <div className="empty">
            <CreditCard size={26} />
            <p>Chưa có thanh toán phù hợp với bộ lọc.</p>
          </div>
        )}
        {result?.last_page > 1 && (
          <div className="pagination">
            <button
              disabled={result.current_page <= 1}
              onClick={() => load(result.current_page - 1)}
            >
              Trước
            </button>
            <span>
              Trang {result.current_page} / {result.last_page}
            </span>
            <button
              disabled={result.current_page >= result.last_page}
              onClick={() => load(result.current_page + 1)}
            >
              Sau
            </button>
          </div>
        )}
        <p className="invoice-footnote">
          Chỉ xác nhận “Đã thanh toán” sau khi kiểm tra tiền thực nhận.
        </p>
      </section>
    </div>
  );
}
