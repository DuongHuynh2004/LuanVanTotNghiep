import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, Save, ArrowLeft, Upload, X } from "lucide-react";
import { api } from "../../api";
import { Notice, Field } from "../../components/StoreUI";

export const emptyVariant = () => ({
  size: "",
  color: "",
  sku: "",
  stock: 0,
  is_active: true,
});

const uniqueValues = (values) => [
  ...new Map(
    values
      .filter(Boolean)
      .map((value) => [value.trim().toLocaleLowerCase(), value.trim()]),
  ).values(),
];

const variantKey = (variant) =>
  JSON.stringify([variant.size || "", variant.color || ""]);

const skuPart = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "D")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase() || "X";

const suggestedSku = (product, size, color) =>
  [
    product.id ? `P${product.id}` : skuPart(product.name).slice(0, 40),
    size && skuPart(size),
    color && skuPart(color),
  ]
    .filter(Boolean)
    .join("-")
    .slice(0, 100);

export const blank = () => ({
  name: "",
  description: "",
  price: "",
  status: "active",
  has_size: true,
  has_color: true,
  variants: [],
  images: [],
});

export function ProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState(null);
  const [categoryError, setCategoryError] = useState("");
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [sizeDraft, setSizeDraft] = useState("");
  const [colorDraft, setColorDraft] = useState("");
  const [bulkStock, setBulkStock] = useState("0");
  const [variantsDirty, setVariantsDirty] = useState(false);
  useEffect(() => {
    api("/admin/categories/options")
      .then(setCategories)
      .catch((e) => setCategoryError(e.message));
  }, []);
  useEffect(() => {
    if (id)
      api("/admin/products/" + id)
        .then((product) => {
          setForm(product);
          setSizes(uniqueValues(product.variants.map((v) => v.size || "")));
          setColors(uniqueValues(product.variants.map((v) => v.color || "")));
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
  }, [id]);
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const changeVariant = (i, key, value) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, n) =>
        n === i ? { ...v, [key]: value } : v,
      ),
    }));
  const addValue = (axis) => {
    const value = (axis === "size" ? sizeDraft : colorDraft).trim();
    const values = axis === "size" ? sizes : colors;
    if (!value) return;
    if (
      values.some(
        (item) => item.toLocaleLowerCase() === value.toLocaleLowerCase(),
      )
    ) {
      setError("Giá trị này đã có trong danh sách.");
      return;
    }
    if (value.length > (axis === "size" ? 20 : 50)) {
      setError(
        axis === "size"
          ? "Kích thước không được dài quá 20 ký tự."
          : "Tên màu không được dài quá 50 ký tự.",
      );
      return;
    }
    (axis === "size" ? setSizes : setColors)((current) => [...current, value]);
    (axis === "size" ? setSizeDraft : setColorDraft)("");
    setVariantsDirty(true);
    setError("");
  };
  const removeValue = (axis, value) => {
    (axis === "size" ? setSizes : setColors)((current) =>
      current.filter((item) => item !== value),
    );
    setVariantsDirty(true);
  };
  const hasSizeValues = !form.has_size || sizes.length > 0;
  const hasColorValues = !form.has_color || colors.length > 0;
  const combinationCount =
    hasSizeValues && hasColorValues
      ? (form.has_size ? sizes.length : 1) *
        (form.has_color ? colors.length : 1)
      : 0;
  const generateVariants = () => {
    if (form.has_size && sizes.length === 0) {
      setError("Vui lòng thêm ít nhất một kích thước.");
      return;
    }
    if (form.has_color && colors.length === 0) {
      setError("Vui lòng thêm ít nhất một màu sắc.");
      return;
    }
    if (combinationCount > 100) {
      setError("Tối đa 100 tổ hợp cho mỗi sản phẩm.");
      return;
    }
    const existing = new Map(
      form.variants.map((variant) => [variantKey(variant), variant]),
    );
    const usedSkus = new Set();
    const nextVariants = (form.has_size ? sizes : [""]).flatMap((size) =>
      (form.has_color ? colors : [""]).map((color) => {
        const previous = existing.get(variantKey({ size, color }));
        const variant = previous || {
          ...emptyVariant(),
          size,
          color,
          sku: suggestedSku(form, size, color),
        };
        let sku = variant.sku;
        let suffix = 2;
        while (usedSkus.has(sku.toLocaleLowerCase())) {
          const suffixText = `-${suffix++}`;
          sku = `${variant.sku.slice(0, 100 - suffixText.length)}${suffixText}`;
        }
        usedSkus.add(sku.toLocaleLowerCase());
        return { ...variant, size, color, sku };
      }),
    );
    set("variants", nextVariants);
    setVariantsDirty(false);
    setError("");
  };
  const applyBulkStock = () => {
    const stock = Number(bulkStock);
    if (!Number.isInteger(stock) || stock < 0 || stock > 4294967295) {
      setError("Tồn kho phải là số nguyên từ 0 đến 4294967295.");
      return;
    }
    set(
      "variants",
      form.variants.map((variant) => ({ ...variant, stock })),
    );
    setError("");
  };
  async function save(e) {
    e.preventDefault();
    if (variantsDirty) {
      setError(
        "Danh sách size hoặc màu đã thay đổi. Hãy tạo/cập nhật tổ hợp trước khi lưu.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (form.variants.length === 0) {
      setError("Hãy tạo ít nhất một tổ hợp biến thể trước khi lưu sản phẩm.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api("/admin/products" + (id ? "/" + id : ""), {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(form),
      });
      navigate("/admin/products");
    } catch (e) {
      setError(e.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setBusy(false);
    }
  }
  async function upload(e) {
    const files = [...e.target.files];
    e.target.value = "";
    if (form.images.length + files.length > 12) {
      setError("Tối đa 12 ảnh.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      for (const file of files) {
        const body = new FormData();
        body.append("image", file);
        const image = await api("/admin/upload", { method: "POST", body });
        setForm((f) => ({ ...f, images: [...f.images, image] }));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }
  if (loading) return <p>Đang tải…</p>;
  return (
    <form onSubmit={save}>
      <Link className="text-link" to="/admin/products">
        <ArrowLeft size={16} /> Danh sách sản phẩm
      </Link>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">LUMIQ PRODUCT STUDIO</p>
          <h1>{id ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h1>
        </div>
      </div>
      <Notice>{error}</Notice>
      <div className="editor-grid">
        <div>
          <section className="panel">
            <h3>Thông tin cơ bản</h3>
            <Field
              label="Tên sản phẩm *"
              required
              value={form.name}
              maxLength={255}
              onChange={(e) => set("name", e.target.value)}
            />
            <label className="field">
              Mô tả
              <textarea
                rows={5}
                value={form.description || ""}
                onChange={(e) => set("description", e.target.value)}
                maxLength={20000}
              />
            </label>
            {categories?.ready ? (
              <label className="field">
                Danh mục
                <select
                  value={form.category_id ?? ""}
                  onChange={(e) =>
                    set(
                      "category_id",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                >
                  <option value="">Chưa phân loại</option>
                  {categories.data.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.status === "inactive" ? " (đã ẩn)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="muted">
                {categoryError ||
                  (categories
                    ? "Nhập database/add_categories.sql để bật lựa chọn danh mục."
                    : "Đang tải danh mục…")}
              </p>
            )}
            <div className="form-grid">
              <Field
                label="Giá bán (₫) *"
                type="number"
                min="0"
                step="0.01"
                max="9999999999.99"
                required
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
              <label className="field">
                Trạng thái
                <select
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  <option value="active">Đang hiển thị</option>
                  <option value="inactive">Đã ẩn</option>
                </select>
              </label>
            </div>
          </section>
          <section className="panel">
            <div className="section-heading">
              <h3>Biến thể & tồn kho</h3>
            </div>
            <div className="checks">
              <label>
                <input
                  type="checkbox"
                  checked={!!form.has_size}
                  onChange={(e) => {
                    set("has_size", e.target.checked);
                    setVariantsDirty(true);
                  }}
                />{" "}
                Có kích thước
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={!!form.has_color}
                  onChange={(e) => {
                    set("has_color", e.target.checked);
                    setVariantsDirty(true);
                  }}
                />{" "}
                Có màu sắc
              </label>
            </div>
            <p className="variant-intro">
              Thêm size và màu một lần, sau đó tạo tổ hợp tự động để quản lý tồn
              kho.
            </p>
            {form.has_size && (
              <div className="variant-axis">
                <strong className="variant-axis-label">Size</strong>
                <div className="variant-chips">
                  {sizes.map((size) => (
                    <span className="variant-chip" key={size}>
                      {size}
                      <button
                        type="button"
                        aria-label={"Xóa size " + size}
                        onClick={() => removeValue("size", size)}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                  <input
                    className="variant-axis-input"
                    value={sizeDraft}
                    maxLength={20}
                    placeholder="Nhập size rồi nhấn Enter"
                    aria-label="Thêm size"
                    onChange={(e) => setSizeDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addValue("size");
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="variant-add-button"
                    onClick={() => addValue("size")}
                  >
                    <Plus size={14} /> Thêm size
                  </button>
                </div>
              </div>
            )}
            {form.has_color && (
              <div className="variant-axis">
                <strong className="variant-axis-label">Màu sắc</strong>
                <div className="variant-chips">
                  {colors.map((color) => (
                    <span className="variant-chip" key={color}>
                      {color}
                      <button
                        type="button"
                        aria-label={"Xóa màu " + color}
                        onClick={() => removeValue("color", color)}
                      >
                        <X size={13} />
                      </button>
                    </span>
                  ))}
                  <input
                    className="variant-axis-input"
                    value={colorDraft}
                    maxLength={50}
                    placeholder="Nhập màu rồi nhấn Enter"
                    aria-label="Thêm màu sắc"
                    onChange={(e) => setColorDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addValue("color");
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="variant-add-button"
                    onClick={() => addValue("color")}
                  >
                    <Plus size={14} /> Thêm màu
                  </button>
                </div>
              </div>
            )}
            <p className="variant-hint">
              {form.has_size || form.has_color
                ? "Nhập giá trị rồi nhấn Enter. Thay đổi danh sách cần tạo/cập nhật lại tổ hợp."
                : "Sản phẩm không có size hoặc màu sẽ có một biến thể duy nhất."}
            </p>
            <div className="variant-toolbar">
              <button
                type="button"
                className="button"
                disabled={combinationCount === 0 || combinationCount > 100}
                onClick={generateVariants}
              >
                {form.variants.length ? "Cập nhật" : "Tạo"} {combinationCount}{" "}
                tổ hợp
              </button>
              <label className="variant-bulk-stock">
                Đặt tồn kho cho tất cả
                <input
                  type="number"
                  min="0"
                  max="4294967295"
                  value={bulkStock}
                  onChange={(e) => setBulkStock(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="button secondary"
                disabled={form.variants.length === 0}
                onClick={applyBulkStock}
              >
                Áp dụng
              </button>
              <span className="variant-count">
                {form.variants.length} biến thể
                {variantsDirty ? " · cần cập nhật" : ""}
              </span>
            </div>
            {combinationCount > 100 && (
              <p className="variant-warning">
                Tối đa 100 tổ hợp. Hãy giảm số size hoặc màu.
              </p>
            )}
            {form.variants.length > 0 ? (
              <div className="variant-table-wrap">
                <table className="variant-table">
                  <thead>
                    <tr>
                      {form.has_size && <th>Size</th>}
                      {form.has_color && <th>Màu sắc</th>}
                      <th>SKU *</th>
                      <th>Tồn kho</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.variants.map((variant, i) => (
                      <tr key={variantKey(variant) + i}>
                        {form.has_size && <td>{variant.size}</td>}
                        {form.has_color && <td>{variant.color}</td>}
                        <td>
                          <input
                            type="text"
                            value={variant.sku}
                            maxLength={100}
                            required
                            aria-label={`SKU ${variant.size || ""} ${variant.color || ""}`}
                            onChange={(e) =>
                              changeVariant(i, "sku", e.target.value)
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max="4294967295"
                            required
                            value={variant.stock}
                            aria-label={`Tồn kho ${variant.size || ""} ${variant.color || ""}`}
                            onChange={(e) =>
                              changeVariant(i, "stock", Number(e.target.value))
                            }
                          />
                        </td>
                        <td>
                          <label className="variant-active">
                            <input
                              type="checkbox"
                              checked={!!variant.is_active}
                              onChange={(e) =>
                                changeVariant(i, "is_active", e.target.checked)
                              }
                            />{" "}
                            Bật
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="variant-empty">
                Thêm danh sách size/màu rồi chọn “Tạo tổ hợp” để nhập SKU và tồn
                kho.
              </p>
            )}
          </section>
        </div>
        <div className="editor-sidebar">
          <section className="panel image-panel">
            <h3>Hình ảnh sản phẩm</h3>
            <p className="muted">
              Ảnh đầu tiên là ảnh đại diện. JPG, PNG, WebP; tối đa 5 MB/ảnh, 12
              ảnh/sản phẩm.
            </p>
            <label className="upload-box">
              <Upload size={25} />
              <b>{uploading ? "Đang tải ảnh…" : "Chọn ảnh từ máy"}</b>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={uploading}
                onChange={upload}
              />
            </label>
            {form.images.map((im, i) => (
              <div className="image-editor" key={i}>
                <img src={im.image_path} alt={"Ảnh " + (i + 1)} />
                <Field
                  label={i === 0 ? "Ảnh đại diện" : "Ảnh " + (i + 1)}
                  value={im.image_path}
                  required
                  onChange={(e) =>
                    set(
                      "images",
                      form.images.map((v, n) =>
                        n === i ? { ...v, image_path: e.target.value } : v,
                      ),
                    )
                  }
                />
                <div className="actions">
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        set("images", [
                          im,
                          ...form.images.filter((_, n) => n !== i),
                        ])
                      }
                    >
                      Đặt làm đại diện
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "images",
                        form.images.filter((_, n) => n !== i),
                      )
                    }
                  >
                    Xóa ảnh
                  </button>
                </div>
              </div>
            ))}
            <button
              className="text-link"
              type="button"
              disabled={form.images.length >= 12}
              onClick={() =>
                set("images", [...form.images, { image_path: "" }])
              }
            >
              <Plus size={16} /> Thêm ảnh bằng URL
            </button>
          </section>
          <div className="editor-save">
            <button
              type="submit"
              className="button"
              disabled={busy || uploading}
            >
              <Save size={17} />
              {busy ? "Đang lưu…" : "Lưu sản phẩm"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
