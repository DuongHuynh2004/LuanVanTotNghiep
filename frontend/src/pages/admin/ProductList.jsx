import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Search, Package, Pencil, Trash2 } from "lucide-react";
import { api, money } from "../../api";
import { Notice, ProductImage } from "../../components/StoreUI";

export function ProductList() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    api("/admin/categories/options")
      .then((result) => setCategories(result.data))
      .catch(() => {});
  }, []);
  useEffect(() => {
    let alive = true;
    setError("");
    api("/admin/products?" + params)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [params, refresh]);
  async function remove() {
    setDeleting(true);
    try {
      await api("/admin/products/" + confirm.id, { method: "DELETE" });
      setConfirm(null);
      setRefresh((v) => v + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  }
  return (
    <>
      <div className="admin-heading">
        <div>
          <h1>Quản lý sản phẩm</h1>
        </div>
        <Link className="button" to="/admin/products/new">
          <Plus size={17} /> Thêm sản phẩm
        </Link>
      </div>
      <section className="panel">
        <form
          className="table-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            setParams(Object.fromEntries(new FormData(e.currentTarget)));
          }}
        >
          <div className="search">
            <Search size={18} />
            <input
              name="q"
              defaultValue={params.get("q") || ""}
              placeholder="Tìm tên sản phẩm…"
              aria-label="Tìm sản phẩm"
            />
          </div>
          <select
            name="status"
            defaultValue={params.get("status") || ""}
            aria-label="Trạng thái"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang hiển thị</option>
            <option value="inactive">Đã ẩn</option>
          </select>
          <button className="button secondary">Lọc</button>
          {categories.length > 0 && (
            <select
              name="category_id"
              aria-label="Lọc danh mục"
              defaultValue={params.get("category_id") || ""}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <span>{data?.total ?? 0} sản phẩm</span>
        </form>
        <Notice>{error}</Notice>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Giá bán</th>
                <th>Tồn kho</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link
                      className="table-product"
                      to={"/admin/products/" + p.id + "/edit"}
                    >
                      <ProductImage product={p} />
                      <div>
                        <b>{p.name}</b>
                        <small>
                          #{p.id} · {p.variants.length} biến thể
                        </small>
                        <small>{p.category?.name || "Chưa phân loại"}</small>
                      </div>
                    </Link>
                  </td>
                  <td>{money(p.price)}</td>
                  <td>{p.variants_sum_stock || 0}</td>
                  <td>
                    <span className={"badge " + p.status}>
                      {p.status === "active" ? "Đang hiển thị" : "Đã ẩn"}
                    </span>
                  </td>
                  <td>
                    <div className="actions">
                      <Link
                        aria-label={"Sửa " + p.name}
                        to={"/admin/products/" + p.id + "/edit"}
                      >
                        <Pencil size={17} />
                      </Link>
                      <button
                        aria-label={"Xóa " + p.name}
                        onClick={() => setConfirm(p)}
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
        {data?.data.length === 0 && (
          <div className="empty">
            <Package size={32} />
            <h3>Chưa có sản phẩm phù hợp</h3>
            <p>Thêm sản phẩm mới hoặc thay đổi bộ lọc.</p>
          </div>
        )}
        {!data && !error && <p className="empty">Đang tải sản phẩm…</p>}
        {data && (
          <div className="pagination">
            <button
              disabled={data.current_page <= 1}
              onClick={() =>
                setParams({
                  ...Object.fromEntries(params),
                  page: data.current_page - 1,
                })
              }
            >
              Trước
            </button>
            <span>
              Trang {data.current_page} / {data.last_page}
            </span>
            <button
              disabled={data.current_page >= data.last_page}
              onClick={() =>
                setParams({
                  ...Object.fromEntries(params),
                  page: data.current_page + 1,
                })
              }
            >
              Sau
            </button>
          </div>
        )}
      </section>
      {confirm && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">Xóa sản phẩm?</h2>
            <p>
              “{confirm.name}” và các ảnh, biến thể liên quan sẽ bị xóa khỏi
              danh mục. Thao tác này không thể hoàn tác.
            </p>
            <div className="actions">
              <button
                className="button secondary"
                disabled={deleting}
                onClick={() => setConfirm(null)}
              >
                Hủy
              </button>
              <button
                className="button danger"
                disabled={deleting}
                onClick={remove}
              >
                {deleting ? "Đang xóa…" : "Xóa sản phẩm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
