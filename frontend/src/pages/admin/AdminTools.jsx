import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { api } from "../../api";

export function useAdminList(resource) {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const query = params.toString();
  useEffect(() => {
    let alive = true;
    setError("");
    setData(null);
    api(`/admin/${resource}?${query}`)
      .then((result) => {
        if (!alive) return;
        if (result.current_page > result.last_page) {
          setParams({
            ...Object.fromEntries(new URLSearchParams(query)),
            page: result.last_page,
          });
        } else setData(result);
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [resource, query, revision, setParams]);
  return {
    data,
    error,
    params,
    setParams,
    refresh: () => setRevision((v) => v + 1),
  };
}

export function ListFilters({ list, statuses, placeholder }) {
  return (
    <form
      key={list.params.toString()}
      className="table-toolbar"
      onSubmit={(e) => {
        e.preventDefault();
        list.setParams(Object.fromEntries(new FormData(e.currentTarget)));
      }}
    >
      <div className="search">
        <Search size={18} />
        <input
          name="q"
          aria-label="Tìm kiếm"
          defaultValue={list.params.get("q") || ""}
          placeholder={placeholder}
        />
      </div>
      <select
        name="status"
        aria-label="Lọc trạng thái"
        defaultValue={list.params.get("status") || ""}
      >
        <option value="">Tất cả trạng thái</option>
        {statuses.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button className="button secondary">Lọc</button>
      <span>{list.data?.total ?? 0} kết quả</span>
    </form>
  );
}

export function ListPagination({ list }) {
  const { data, params, setParams } = list;
  if (!data) return null;
  const go = (page) => setParams({ ...Object.fromEntries(params), page });
  return (
    <div className="pagination">
      <button
        disabled={data.current_page <= 1}
        onClick={() => go(data.current_page - 1)}
      >
        Trước
      </button>
      <span>
        Trang {data.current_page} / {data.last_page}
      </span>
      <button
        disabled={data.current_page >= data.last_page}
        onClick={() => go(data.current_page + 1)}
      >
        Sau
      </button>
    </div>
  );
}

export function AdminDialog({
  title,
  children,
  onClose,
  busy = false,
  className = "",
}) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={"admin-dialog " + className}
      aria-labelledby="admin-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="dialog-heading">
        <h2 id="admin-dialog-title">{title}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Đóng"
          disabled={busy}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export const slugify = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const dateLabel = (value) =>
  value ? new Date(value).toLocaleDateString("vi-VN") : "—";
