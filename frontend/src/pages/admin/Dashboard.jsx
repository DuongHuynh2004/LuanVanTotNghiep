import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Boxes,
  CircleAlert,
  ClipboardList,
  CircleDollarSign,
  Package,
  Users,
} from "lucide-react";
import { api, money } from "../../api";
import { Notice, ProductImage } from "../../components/StoreUI";

const orderStatuses = {
  pending: "Chờ xử lý",
  processing: "Đang xử lý",
  shipped: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

const revenuePeriods = [
  { value: "day", label: "1 ngày" },
  { value: "week", label: "1 tuần" },
  { value: "month", label: "1 tháng" },
  { value: "year", label: "1 năm" },
];

const dateLabel = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value || "")
    ? new Date(value).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      })
    : "";

function SalesChart({ data, periodLabel }) {
  const maximum = Math.max(...data.map((item) => item.total), 1);
  const points = data
    .map((item, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * 100;
      const y = 90 - (item.total / maximum) * 74;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="sales-chart">
      <div className="sales-chart-values">
        <span>{money(maximum)}</span>
        <span>{money(0)}</span>
      </div>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Biểu đồ doanh thu đơn hoàn tất trong ${periodLabel}`}
      >
        <defs>
          <linearGradient id="sales-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#73a88c" stopOpacity=".28" />
            <stop offset="100%" stopColor="#73a88c" stopOpacity=".02" />
          </linearGradient>
        </defs>
        <line x1="0" x2="100" y1="16" y2="16" />
        <line x1="0" x2="100" y1="53" y2="53" />
        <line x1="0" x2="100" y1="90" y2="90" />
        <polygon points={`0,100 ${points} 100,100`} />
        <polyline points={points} />
        {data.map((item, index) => {
          const x = (index / Math.max(data.length - 1, 1)) * 100;
          const y = 90 - (item.total / maximum) * 74;
          return (
            <circle
              key={item.date}
              cx={x}
              cy={y}
              r="1.25"
              aria-label={`${item.label}: ${money(item.total)}`}
            />
          );
        })}
      </svg>
      <div className="sales-chart-labels">
        {data.map((item) => (
          <span key={item.date}>
            {item.label}
            <small>{dateLabel(item.date)}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

export function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("week");
  const selectedPeriod =
    revenuePeriods.find((item) => item.value === period) || revenuePeriods[1];

  useEffect(() => {
    api(`/admin/dashboard?period=${period}`)
      .then((response) => {
        setData(response);
        setError("");
      })
      .catch((e) => setError(e.message));
  }, [period]);

  const metrics = data
    ? [
        {
          label: "Tổng sản phẩm",
          value: data.products,
          detail: `${data.active.toLocaleString("vi-VN")} đang hiển thị`,
          Icon: Package,
          tone: "mint",
        },
        {
          label: "Khách hàng",
          value: data.customers,
          detail: "Tài khoản khách hàng",
          Icon: Users,
          tone: "blue",
        },
        {
          label: `Doanh thu ${selectedPeriod.label}`,
          value: data.orders_available ? money(data.completed_value) : "—",
          detail: data.orders_available
            ? `${data.completed_orders.toLocaleString("vi-VN")} đơn hoàn tất`
            : "Nhập SQL đơn hàng để bật",
          Icon: CircleDollarSign,
          tone: "sand",
        },
        {
          label: "Đơn chờ xử lý",
          value: data.orders_available
            ? data.orders_pending.toLocaleString("vi-VN")
            : "—",
          detail: data.orders_available
            ? `${data.orders_processing.toLocaleString("vi-VN")} đang xử lý`
            : "Nhập SQL đơn hàng để bật",
          Icon: ClipboardList,
          tone: "rose",
        },
      ]
    : [];

  return (
    <>
      <div className="admin-heading dashboard-heading">
        <div>
          <p className="eyebrow">LUMIQ STORE · TỔNG QUAN</p>
          <h1>Tổng quan cửa hàng</h1>
          <p className="muted">
            Theo dõi doanh thu, sản phẩm, khách hàng, tồn kho và đơn hàng.
          </p>
        </div>
      </div>
      <Notice>{error}</Notice>
      {data ? (
        <>
          <div className="stats dashboard-stats">
            {metrics.map(({ label, value, detail, Icon, tone }) => (
              <article className="stat dashboard-stat" key={label}>
                <div className="dashboard-stat-label">
                  <span>{label}</span>
                  <span className={"dashboard-stat-icon " + tone}>
                    <Icon size={19} />
                  </span>
                </div>
                <strong>
                  {typeof value === "number"
                    ? value.toLocaleString("vi-VN")
                    : value}
                </strong>
                <small>{detail}</small>
              </article>
            ))}
          </div>

          {!data.orders_available && (
            <section className="dashboard-setup">
              <div>
                <span className="dashboard-setup-icon">
                  <CircleAlert size={20} />
                </span>
                <div>
                  <b>Bật báo cáo và quản lý đơn hàng</b>
                  <p>
                    Nhập SQL tạo bảng đơn hàng trong phpMyAdmin để hiển thị đơn
                    chờ và biểu đồ số liệu thật. Chưa cần chạy migration.
                  </p>
                </div>
              </div>
              <Link className="text-link" to="/admin/orders">
                Xem hướng dẫn <ArrowUpRight size={17} />
              </Link>
            </section>
          )}

          <div className="dashboard-panels dashboard-primary-panels">
            <section className="panel dashboard-chart-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">
                    {selectedPeriod.label.toUpperCase()}
                  </p>
                  <h3>Doanh thu đơn hoàn tất</h3>
                </div>
                <div
                  className="dashboard-period-controls"
                  aria-label="Khoảng thời gian doanh thu"
                >
                  {revenuePeriods.map((item) => (
                    <button
                      aria-pressed={period === item.value}
                      className={period === item.value ? "active" : ""}
                      key={item.value}
                      onClick={() => setPeriod(item.value)}
                      type="button"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              {data.orders_available ? (
                <>
                  <strong className="dashboard-chart-total">
                    {money(data.completed_value)}
                  </strong>
                  <span className="dashboard-period">
                    {data.completed_orders.toLocaleString("vi-VN")} đơn hoàn tất
                  </span>
                  <SalesChart
                    data={data.sales_chart}
                    periodLabel={selectedPeriod.label}
                  />
                  <p className="dashboard-chart-note">
                    Tổng giá trị đơn có trạng thái hoàn tất; chưa phải số tiền
                    đối soát thanh toán.
                  </p>
                </>
              ) : (
                <div className="dashboard-chart-empty">
                  <ClipboardList size={25} />
                  <p>Biểu đồ sẽ hiển thị sau khi nhập SQL đơn hàng.</p>
                </div>
              )}
            </section>

            <section className="panel dashboard-stock-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">CẦN THEO DÕI</p>
                  <h3>Sắp hết hàng</h3>
                </div>
                <Link
                  className="text-link"
                  to="/admin/products"
                  aria-label="Quản lý sản phẩm tồn kho thấp"
                >
                  Tất cả <ArrowUpRight size={17} />
                </Link>
              </div>
              {data.low_stock.length ? (
                data.low_stock.map((variant) => (
                  <div className="stock-row" key={variant.sku}>
                    <div>
                      <b>{variant.name}</b>
                      <small>{variant.sku}</small>
                    </div>
                    <span className="stock-level">Còn {variant.stock}</span>
                  </div>
                ))
              ) : (
                <div className="empty dashboard-empty">
                  <Boxes size={25} />
                  <p>Chưa có biến thể tồn kho thấp.</p>
                </div>
              )}
            </section>
          </div>

          {data.orders_available && (
            <section className="panel dashboard-orders-panel">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">VẬN HÀNH</p>
                  <h3>Đơn hàng gần đây</h3>
                </div>
                <Link className="text-link" to="/admin/orders">
                  Xem tất cả <ArrowUpRight size={17} />
                </Link>
              </div>
              {data.recent_orders.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Khách hàng</th>
                        <th>Giá trị</th>
                        <th>Trạng thái</th>
                        <th>Ngày tạo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent_orders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <Link
                              className="dashboard-order-link"
                              to="/admin/orders"
                            >
                              {order.order_code}
                            </Link>
                          </td>
                          <td>{order.customer_name}</td>
                          <td>{money(order.total)}</td>
                          <td>
                            <span className={"badge " + order.status}>
                              {orderStatuses[order.status] || order.status}
                            </span>
                          </td>
                          <td>{dateLabel(order.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty dashboard-empty">
                  <ClipboardList size={25} />
                  <p>Chưa có đơn hàng.</p>
                </div>
              )}
            </section>
          )}

          <section className="panel dashboard-products-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">SẢN PHẨM</p>
                <h3>Mới cập nhật</h3>
              </div>
              <Link className="text-link" to="/admin/products">
                Quản lý sản phẩm <ArrowUpRight size={17} />
              </Link>
            </div>
            {data.recent.length ? (
              data.recent.map((product) => (
                <Link
                  className="recent-product"
                  to={"/admin/products/" + product.id + "/edit"}
                  key={product.id}
                >
                  <ProductImage product={product} />
                  <div>
                    <b>{product.name}</b>
                    <small>
                      {product.status === "active" ? "Đang hiển thị" : "Đã ẩn"}
                    </small>
                  </div>
                  <strong>{money(product.price)}</strong>
                </Link>
              ))
            ) : (
              <div className="empty dashboard-empty">
                <Package size={25} />
                <p>Chưa có sản phẩm.</p>
              </div>
            )}
          </section>
        </>
      ) : (
        !error && <p className="empty">Đang tải tổng quan…</p>
      )}
    </>
  );
}
