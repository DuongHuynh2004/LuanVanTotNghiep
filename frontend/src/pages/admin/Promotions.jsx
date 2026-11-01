import { useEffect, useState } from "react";
import { Plus, Tag } from "lucide-react";
import { api } from "../../api";
import { Field, Notice } from "../../components/StoreUI";

const emptyForm = {
  code: "",
  name: "",
  discount_percent: "10",
  minimum_subtotal: "0",
  per_customer_limit: "1",
  starts_at: "",
  ends_at: "",
  is_active: true,
};

const dateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

export function AdminPromotions() {
  const [result, setResult] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(page = 1) {
    try {
      setResult(await api(`/admin/promotions?page=${page}`));
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  function startEdit(promo) {
    setEditing(promo.id);
    setForm({
      code: promo.code,
      name: promo.name,
      discount_percent: promo.discount_percent,
      minimum_subtotal: promo.minimum_subtotal,
      per_customer_limit: promo.per_customer_limit,
      starts_at: dateInput(promo.starts_at),
      ends_at: dateInput(promo.ends_at),
      is_active: promo.is_active,
    });
    document
      .getElementById("promotion-form")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await api(
        editing ? `/admin/promotions/${editing}` : "/admin/promotions",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify({
            ...form,
            starts_at: new Date(form.starts_at).toISOString(),
            ends_at: new Date(form.ends_at).toISOString(),
          }),
        },
      );
      setForm(emptyForm);
      setEditing(null);
      setMessage("Đã lưu khuyến mãi.");
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(promo) {
    try {
      await api(`/admin/promotions/${promo.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !promo.is_active }),
      });
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">BÁN HÀNG · ƯU ĐÃI</p>
          <h1>Quản lý khuyến mãi</h1>
          <p className="muted">
            Mã giảm phần trăm, có thời hạn, giá trị tối thiểu và giới hạn mỗi
            khách.
          </p>
        </div>
      </div>
      <Notice>{error || message}</Notice>
      <form
        className="panel promotion-admin-form"
        id="promotion-form"
        onSubmit={submit}
      >
        <h2>{editing ? "Chỉnh sửa khuyến mãi" : "Tạo khuyến mãi"}</h2>
        <div className="form-grid">
          <Field
            label="Mã khuyến mãi"
            value={form.code}
            onChange={(e) =>
              setForm({ ...form, code: e.target.value.toUpperCase() })
            }
            maxLength="40"
            required
          />
          <Field
            label="Tên chương trình"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            maxLength="150"
            required
          />
          <Field
            label="Giảm (%)"
            type="number"
            min="0.01"
            max="100"
            step="0.01"
            value={form.discount_percent}
            onChange={(e) =>
              setForm({ ...form, discount_percent: e.target.value })
            }
            required
          />
          <Field
            label="Đơn tối thiểu (₫)"
            type="number"
            min="0"
            step="1000"
            value={form.minimum_subtotal}
            onChange={(e) =>
              setForm({ ...form, minimum_subtotal: e.target.value })
            }
            required
          />
          <Field
            label="Giới hạn mỗi khách"
            type="number"
            min="1"
            value={form.per_customer_limit}
            onChange={(e) =>
              setForm({ ...form, per_customer_limit: e.target.value })
            }
            required
          />
          <Field
            label="Bắt đầu"
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            required
          />
          <Field
            label="Kết thúc"
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            required
          />
          <label className="field promotion-active">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({ ...form, is_active: e.target.checked })
              }
            />{" "}
            Đang kích hoạt
          </label>
        </div>
        <div className="dialog-actions">
          {editing && (
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setEditing(null);
                setForm(emptyForm);
              }}
            >
              Hủy sửa
            </button>
          )}
          <button className="button" disabled={busy}>
            <Plus size={16} />
            {busy ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Tạo mã"}
          </button>
        </div>
      </form>
      <section className="panel admin-table-panel">
        <div className="section-heading">
          <h2>
            <Tag size={18} /> Danh sách mã
          </h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Chương trình</th>
                <th>Mức giảm</th>
                <th>Đơn tối thiểu</th>
                <th>Lượt dùng</th>
                <th>Thời hạn</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {result?.data?.map((promo) => (
                <tr key={promo.id}>
                  <td>
                    <b>{promo.code}</b>
                  </td>
                  <td>{promo.name}</td>
                  <td>{promo.discount_percent}%</td>
                  <td>
                    {Number(promo.minimum_subtotal).toLocaleString("vi-VN")}₫
                  </td>
                  <td>{promo.redemptions_count}</td>
                  <td>
                    {new Date(promo.starts_at).toLocaleDateString("vi-VN")} –{" "}
                    {new Date(promo.ends_at).toLocaleDateString("vi-VN")}
                  </td>
                  <td>
                    <span
                      className={`badge ${promo.is_active ? "active" : "locked"}`}
                    >
                      {promo.is_active ? "Đang bật" : "Đã tắt"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="text-link"
                      onClick={() => startEdit(promo)}
                    >
                      Sửa
                    </button>
                    <button className="text-link" onClick={() => toggle(promo)}>
                      {promo.is_active ? "Tắt" : "Bật"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      </section>
    </div>
  );
}
