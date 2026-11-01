import { useState } from "react";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import { api } from "../../api";
import { Field, Notice } from "../../components/StoreUI";
import {
  useAdminList,
  ListFilters,
  ListPagination,
  AdminDialog,
  slugify,
} from "./AdminTools";
const blank = () => ({
  name: "",
  slug: "",
  status: "active",
  sort_order: 0,
});

export function Categories() {
  const list = useAdminList("categories");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const change = (key, value) => setEditing((f) => ({ ...f, [key]: value }));
  const open = (category) => {
    setError("");
    setEditing({ ...category });
  };
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/admin/categories" + (editing.id ? "/" + editing.id : ""), {
        method: editing.id ? "PUT" : "POST",
        body: JSON.stringify(editing),
      });
      setEditing(null);
      setMessage("Đã lưu danh mục.");
      list.refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setError("");
    try {
      const result = await api("/admin/categories/" + deleting.id, {
        method: "DELETE",
      });
      setDeleting(null);
      setMessage(result.message);
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
          <h1>Quản lý danh mục</h1>
        </div>
        <button
          className="button"
          disabled={!!list.error || !list.data}
          onClick={() => open(blank())}
        >
          <Plus size={17} /> Thêm danh mục
        </button>
      </div>
      <Notice>{message}</Notice>
      <section className="panel">
        <ListFilters
          list={list}
          placeholder="Tìm tên danh mục…"
          statuses={[
            ["active", "Đang hiển thị"],
            ["inactive", "Đã ẩn"],
          ]}
        />
        <Notice>{list.error}</Notice>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Danh mục</th>
                <th>Sản phẩm</th>
                <th>Thứ tự</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.data?.data.map((c) => (
                <tr key={c.id}>
                  <td>
                    <b>{c.name}</b>
                    <small className="cell-detail">/{c.slug}</small>
                  </td>
                  <td>{c.products_count}</td>
                  <td>{c.sort_order}</td>
                  <td>
                    <span className={"badge " + c.status}>
                      {c.status === "active" ? "Đang hiển thị" : "Đã ẩn"}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        aria-label={"Sửa " + c.name}
                        onClick={() => open(c)}
                      >
                        <Pencil size={17} />
                      </button>
                      <button
                        aria-label={"Xóa " + c.name}
                        onClick={() => {
                          setError("");
                          setDeleting(c);
                        }}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!list.data && !list.error && (
          <p className="empty">Đang tải danh mục…</p>
        )}
        {list.data?.data.length === 0 && (
          <div className="empty">
            <FolderTree size={30} />
            <h3>Chưa có danh mục phù hợp</h3>
            <p>Thêm danh mục đầu tiên hoặc thay đổi bộ lọc.</p>
          </div>
        )}
        <ListPagination list={list} />
      </section>
      {editing && (
        <AdminDialog
          title={editing.id ? "Chỉnh sửa danh mục" : "Thêm danh mục"}
          busy={busy}
          onClose={() => setEditing(null)}
        >
          <form onSubmit={save}>
            <Notice>{error}</Notice>
            <Field
              label="Tên danh mục *"
              required
              maxLength={150}
              value={editing.name}
              onChange={(e) => {
                const name = e.target.value;
                setEditing((f) => ({
                  ...f,
                  name,
                  ...(!f.id ? { slug: slugify(name) } : {}),
                }));
              }}
            />
            <Field
              label="Đường dẫn (slug) *"
              required
              maxLength={191}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              value={editing.slug}
              onChange={(e) => change("slug", e.target.value)}
            />
            <div className="form-grid">
              <Field
                label="Thứ tự hiển thị"
                type="number"
                required
                min="0"
                max="4294967295"
                value={editing.sort_order}
                onChange={(e) => change("sort_order", e.target.value)}
              />
              <label className="field">
                Trạng thái
                <select
                  value={editing.status}
                  onChange={(e) => change("status", e.target.value)}
                >
                  <option value="active">Đang hiển thị</option>
                  <option value="inactive">Đã ẩn</option>
                </select>
              </label>
            </div>
            <p className="muted">
              Số nhỏ hiển thị trước. Ẩn danh mục sẽ ẩn bộ lọc này ở cửa hàng,
              không thay đổi trạng thái sản phẩm.
            </p>
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
                {busy ? "Đang lưu…" : "Lưu danh mục"}
              </button>
            </div>
          </form>
        </AdminDialog>
      )}
      {deleting && (
        <AdminDialog
          title="Xóa danh mục?"
          busy={busy}
          onClose={() => setDeleting(null)}
        >
          <Notice>{error}</Notice>
          <p>
            Danh mục “{deleting.name}” sẽ bị xóa. {deleting.products_count} sản
            phẩm liên quan vẫn được giữ lại và chuyển thành chưa phân loại.
          </p>
          <div className="dialog-actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Hủy
            </button>
            <button className="button danger" disabled={busy} onClick={remove}>
              {busy ? "Đang xóa…" : "Xóa danh mục"}
            </button>
          </div>
        </AdminDialog>
      )}
    </>
  );
}
