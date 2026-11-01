import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  LockKeyhole,
  UnlockKeyhole,
  RotateCcw,
} from "lucide-react";
import { api } from "../../api";
import { Field, Notice } from "../../components/StoreUI";
import {
  useAdminList,
  ListFilters,
  ListPagination,
  AdminDialog,
  dateLabel,
} from "./AdminTools";
const blank = () => ({
  name: "",
  email: "",
  phone: "",
  status: "active",
  password: "",
  password_confirmation: "",
});

export function Customers() {
  const list = useAdminList("customers");
  const [editing, setEditing] = useState(null);
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const change = (key, value) => setEditing((f) => ({ ...f, [key]: value }));
  const open = (customer) => {
    setError("");
    setEditing({ ...customer, phone: customer.phone || "" });
  };
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = {
        name: editing.name,
        email: editing.email,
        phone: editing.phone,
        status: editing.status,
      };
      if (!editing.id)
        Object.assign(payload, {
          password: editing.password,
          password_confirmation: editing.password_confirmation,
        });
      await api("/admin/customers" + (editing.id ? "/" + editing.id : ""), {
        method: editing.id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      setEditing(null);
      setMessage("Đã lưu khách hàng.");
      list.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function execute() {
    setBusy(true);
    setError("");
    const { type, customer } = action;
    try {
      const path = "/admin/customers/" + customer.id;
      if (type === "delete") await api(path, { method: "DELETE" });
      else if (type === "restore")
        await api(path + "/restore", { method: "POST" });
      else
        await api(path + "/status", {
          method: "PATCH",
          body: JSON.stringify({
            status: type === "lock" ? "locked" : "active",
          }),
        });
      setAction(null);
      setMessage(
        type === "delete"
          ? "Đã chuyển khách hàng vào thùng rác. Có thể khôi phục từ bộ lọc Đã xóa."
          : "Đã cập nhật trạng thái khách hàng.",
      );
      list.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const ask = (type, customer) => {
    setError("");
    setAction({ type, customer });
  };
  const titles = {
    delete: "Xóa khách hàng?",
    restore: "Khôi phục khách hàng?",
    lock: "Khóa tài khoản?",
    unlock: "Mở khóa tài khoản?",
  };
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Quản lý khách hàng</h1>
        </div>
        <button className="button" onClick={() => open(blank())}>
          <Plus size={17} /> Thêm khách hàng
        </button>
      </div>
      <Notice>{message}</Notice>
      <section className="panel">
        <ListFilters
          list={list}
          placeholder="Tìm họ tên, email, số điện thoại…"
          statuses={[
            ["active", "Hoạt động"],
            ["locked", "Đã khóa"],
            ["deleted", "Đã xóa"],
          ]}
        />
        <Notice>{list.error}</Notice>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Số điện thoại</th>
                <th>Ngày đăng ký</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.data?.data.map((c) => (
                <tr key={c.id}>
                  <td>
                    <b>{c.name}</b>
                    <small className="cell-detail">{c.email}</small>
                  </td>
                  <td>{c.phone || "—"}</td>
                  <td>{dateLabel(c.created_at)}</td>
                  <td>
                    <span
                      className={
                        "badge " + (c.deleted_at ? "inactive" : c.status)
                      }
                    >
                      {c.deleted_at
                        ? "Đã xóa"
                        : c.status === "active"
                          ? "Hoạt động"
                          : "Đã khóa"}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      {c.deleted_at ? (
                        <button
                          aria-label={"Khôi phục " + c.name}
                          onClick={() => ask("restore", c)}
                        >
                          <RotateCcw size={17} /> Khôi phục
                        </button>
                      ) : (
                        <>
                          <button
                            aria-label={"Sửa " + c.name}
                            onClick={() => open(c)}
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            aria-label={
                              (c.status === "active" ? "Khóa " : "Mở khóa ") +
                              c.name
                            }
                            onClick={() =>
                              ask(c.status === "active" ? "lock" : "unlock", c)
                            }
                          >
                            {c.status === "active" ? (
                              <LockKeyhole size={17} />
                            ) : (
                              <UnlockKeyhole size={17} />
                            )}
                          </button>
                          <button
                            aria-label={"Xóa " + c.name}
                            onClick={() => ask("delete", c)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!list.data && !list.error && (
          <p className="empty">Đang tải khách hàng…</p>
        )}
        {list.data?.data.length === 0 && (
          <div className="empty">
            <Users size={30} />
            <h3>Không có khách hàng phù hợp</h3>
            <p>Thử thay đổi bộ lọc hoặc thêm khách hàng mới.</p>
          </div>
        )}
        <ListPagination list={list} />
      </section>
      {editing && (
        <AdminDialog
          title={editing.id ? "Thông tin khách hàng" : "Thêm khách hàng"}
          busy={busy}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save}>
            <Notice>{error}</Notice>
            <Field
              label="Họ và tên *"
              required
              maxLength={100}
              value={editing.name}
              onChange={(e) => change("name", e.target.value)}
            />
            <Field
              label="Email *"
              required
              type="email"
              maxLength={191}
              value={editing.email}
              onChange={(e) => change("email", e.target.value)}
            />
            <Field
              label="Số điện thoại"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              pattern="0[0-9]{9}"
              title="Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số."
              value={editing.phone}
              onChange={(e) => change("phone", e.target.value)}
            />
            <label className="field">
              Trạng thái
              <select
                value={editing.status}
                onChange={(e) => change("status", e.target.value)}
              >
                <option value="active">Hoạt động</option>
                <option value="locked">Đã khóa</option>
              </select>
            </label>
            {!editing.id && (
              <>
                <Field
                  label="Mật khẩu *"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={editing.password}
                  onChange={(e) => change("password", e.target.value)}
                />
                <small>Ít nhất 8 ký tự, gồm chữ và số.</small>
                <Field
                  label="Nhập lại mật khẩu *"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={editing.password_confirmation}
                  onChange={(e) =>
                    change("password_confirmation", e.target.value)
                  }
                />
              </>
            )}
            {editing.id && (
              <p className="muted">
                Thành viên từ {dateLabel(editing.created_at)}. Khách hàng tự đổi
                mật khẩu trong trang tài khoản.
              </p>
            )}
            <div className="dialog-actions">
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={() => setEditing(null)}
              >
                Hủy
              </button>
              <button className="button" disabled={busy}>
                {busy ? "Đang lưu…" : "Lưu khách hàng"}
              </button>
            </div>
          </form>
        </AdminDialog>
      )}
      {action && (
        <AdminDialog
          title={titles[action.type]}
          busy={busy}
          onClose={() => setAction(null)}
        >
          <Notice>{error}</Notice>
          <p>
            <b>{action.customer.name}</b> — {action.customer.email}
          </p>
          <p>
            {action.type === "delete"
              ? "Tài khoản sẽ bị ngừng truy cập và chuyển vào thùng rác. Bạn có thể khôi phục sau."
              : action.type === "lock"
                ? "Khách hàng sẽ không thể đăng nhập hoặc tiếp tục dùng các chức năng tài khoản cho đến khi được mở khóa."
                : action.type === "restore"
                  ? "Khôi phục tài khoản với trạng thái hoạt động hoặc đã khóa trước đó."
                  : "Khách hàng có thể đăng nhập lại sau khi mở khóa."}
          </p>
          <div className="dialog-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setAction(null)}
            >
              Hủy
            </button>
            <button
              className={"button " + (action.type === "delete" ? "danger" : "")}
              disabled={busy}
              onClick={execute}
            >
              {busy ? "Đang xử lý…" : "Xác nhận"}
            </button>
          </div>
        </AdminDialog>
      )}
    </>
  );
}
