import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  ArrowUpRight,
  Package,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { api, money } from "../api";
import { Notice, ProductImage } from "../components/StoreUI";

export function Catalog({ home = false }) {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [categoriesError, setCategoriesError] = useState("");
  useEffect(() => {
    if (home) return undefined;
    let alive = true;
    setCategoriesError("");
    api("/categories")
      .then((result) => alive && setCategories(result.data))
      .catch((e) => alive && setCategoriesError(e.message));
    return () => {
      alive = false;
    };
  }, [home]);
  const query = home ? "" : params.toString();
  useEffect(() => {
    let alive = true;
    setData(null);
    setError("");
    api("/products?" + query)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [query]);
  return (
    <>
      <section
        id={home ? undefined : "catalog-list"}
        className={`catalog section${home ? " catalog-home" : " catalog-page"}`}
      >
        <div className="section-heading catalog-heading">
          <div className="catalog-heading-copy">
            {home && <p className="eyebrow">THE EVERYDAY EDIT</p>}
            {!home && (
              <span className="catalog-kicker">
                <SlidersHorizontal size={16} /> BỘ SƯU TẬP LUMIQ
              </span>
            )}
            <h2>
              {home ? "Thiết yếu, theo cách của bạn." : "Khám phá sản phẩm"}
            </h2>
            {!home && (
              <p className="catalog-intro">
                Tìm món đồ phù hợp cho phong cách và nhịp sống của bạn.
              </p>
            )}
          </div>
          {home && (
            <Link className="text-link" to="/san-pham">
              Xem tất cả <ArrowUpRight size={17} />
            </Link>
          )}
        </div>
        {!home && (
          <form
            className="catalog-search"
            onSubmit={(e) => {
              e.preventDefault();
              setParams(Object.fromEntries(new FormData(e.currentTarget)));
            }}
          >
            <label className="search catalog-search-input">
              <Search size={20} aria-hidden="true" />
              <input
                key={params.get("q") || ""}
                name="q"
                defaultValue={params.get("q") || ""}
                placeholder="Tìm theo tên sản phẩm…"
                aria-label="Tìm theo tên"
              />
            </label>
            {categories.length > 0 && (
              <select
                name="category_id"
                aria-label="Danh mục sản phẩm"
                value={params.get("category_id") || ""}
                onChange={(e) => {
                  setParams(
                    Object.fromEntries(new FormData(e.currentTarget.form)),
                  );
                }}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <button className="button">
              <Search size={17} /> Tìm kiếm
            </button>
          </form>
        )}
        {!home && categories.length > 0 && (
          <nav className="catalog-category-links" aria-label="Lọc danh mục">
            <button
              type="button"
              className={!params.get("category_id") ? "active" : ""}
              aria-pressed={!params.get("category_id")}
              onClick={() => {
                const next = Object.fromEntries(params);
                delete next.category_id;
                delete next.page;
                setParams(next);
              }}
            >
              Tất cả
            </button>
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                className={
                  params.get("category_id") === String(category.id)
                    ? "active"
                    : ""
                }
                aria-pressed={params.get("category_id") === String(category.id)}
                onClick={() => {
                  const next = Object.fromEntries(params);
                  next.category_id = category.id;
                  delete next.page;
                  setParams(next);
                }}
              >
                {category.name}
              </button>
            ))}
          </nav>
        )}
        {!home && <Notice>{categoriesError}</Notice>}
        {!home && data && !error && (
          <div className="catalog-result-meta" aria-live="polite">
            <span>
              {data.total === 1
                ? "1 sản phẩm"
                : `${Number(data.total ?? data.data.length).toLocaleString("vi-VN")} sản phẩm`}
              {params.get("q") && (
                <>
                  {" "}
                  cho <strong>“{params.get("q")}”</strong>
                </>
              )}
            </span>
            {params.size > 0 && (
              <Link className="catalog-clear-link" to="/san-pham">
                Xóa bộ lọc
              </Link>
            )}
          </div>
        )}
        <Notice>{error}</Notice>
        {!data && !error ? (
          <p className="empty">Đang tải sản phẩm…</p>
        ) : data?.data.length ? (
          <>
            <div className="product-grid">
              {data.data.slice(0, home ? 4 : 12).map((p) => (
                <Link
                  className="product-card"
                  to={"/san-pham/" + p.id}
                  key={p.id}
                >
                  <div className="product-photo">
                    <ProductImage product={p} />
                    <ArrowUpRight size={20} />
                  </div>
                  <h3>{p.name}</h3>
                  <strong>{money(p.price)}</strong>
                </Link>
              ))}
            </div>
            {!home && data.last_page > 1 && (
              <div className="pagination">
                <button
                  disabled={data.current_page === 1}
                  onClick={() =>
                    setParams({
                      ...Object.fromEntries(params),
                      page: data.current_page - 1,
                    })
                  }
                >
                  <ChevronLeft />
                </button>
                <span>
                  {data.current_page} / {data.last_page}
                </span>
                <button
                  disabled={data.current_page === data.last_page}
                  onClick={() =>
                    setParams({
                      ...Object.fromEntries(params),
                      page: data.current_page + 1,
                    })
                  }
                >
                  <ChevronRight />
                </button>
              </div>
            )}
          </>
        ) : (
          data && (
            <div className="empty">
              <Package size={30} />
              <h3>
                {params.get("q") || params.get("category_id")
                  ? "Không tìm thấy sản phẩm phù hợp"
                  : "Bộ sưu tập đang được chuẩn bị"}
              </h3>
              <p>
                {params.get("q") || params.get("category_id")
                  ? "Thử đổi từ khóa hoặc chọn danh mục khác nhé."
                  : "Những thiết kế mới sẽ sớm có mặt tại đây."}
              </p>
            </div>
          )
        )}
      </section>
    </>
  );
}
