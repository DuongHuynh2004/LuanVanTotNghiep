import { useContext } from "react";
import { Link, NavLink, Routes, Route } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingBag,
  ArrowUpRight,
  LogOut,
  FolderTree,
  ReceiptText,
  BadgePercent,
  CreditCard,
} from "lucide-react";
import { Auth } from "./auth";
import { Logo } from "./components/StoreUI";
import { Dashboard } from "./pages/admin/Dashboard";
import { ProductList } from "./pages/admin/ProductList";
import { ProductEditor } from "./pages/admin/ProductEditor";
import { Categories } from "./pages/admin/Categories";
import { Customers } from "./pages/admin/Customers";
import { Orders } from "./pages/admin/Orders";
import { AdminInvoices } from "./pages/admin/Invoices";
import { AdminPromotions } from "./pages/admin/Promotions";
import { Payments } from "./pages/admin/Payments";
export default function Admin() {
  const { user, logout } = useContext(Auth);
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Logo />
        <p className="eyebrow">QUẢN TRỊ CỬA HÀNG</p>
        <nav>
          <NavLink end to="/admin">
            <LayoutDashboard size={19} /> Tổng quan
          </NavLink>
          <NavLink to="/admin/products">
            <Package size={19} /> Sản phẩm
          </NavLink>
          <NavLink to="/admin/orders">
            <ShoppingBag size={19} /> Đơn hàng
          </NavLink>
          <NavLink to="/admin/payments">
            <CreditCard size={19} /> Thanh toán
          </NavLink>
          <NavLink to="/admin/invoices">
            <ReceiptText size={19} /> Hóa đơn nội bộ
          </NavLink>
          <NavLink to="/admin/promotions">
            <BadgePercent size={19} /> Khuyến mãi
          </NavLink>
          <NavLink to="/admin/categories">
            <FolderTree size={19} /> Danh mục
          </NavLink>
          <NavLink to="/admin/customers">
            <Users size={19} /> Khách hàng
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <Link to="/">
            Xem cửa hàng <ArrowUpRight size={16} />
          </Link>
          <button onClick={logout}>
            <LogOut size={17} /> Đăng xuất
          </button>
        </div>
      </aside>
      <div className="admin-body">
        <div className="admin-topbar">
          <span>
            LUMIQ <span className="muted">/ Trang quản trị</span>
          </span>
          <Link to="/tai-khoan">
            {user.name} <span className="badge active">Admin</span>
          </Link>
        </div>
        <main className="admin-main">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductList />} />
            <Route path="products/new" element={<ProductEditor key="new" />} />
            <Route path="products/:id/edit" element={<ProductEditor />} />
            <Route path="orders" element={<Orders />} />
            <Route path="payments" element={<Payments />} />
            <Route path="invoices" element={<AdminInvoices />} />
            <Route path="invoices/:id" element={<AdminInvoices />} />
            <Route path="promotions" element={<AdminPromotions />} />
            <Route path="categories" element={<Categories />} />
            <Route path="customers" element={<Customers />} />
            <Route path="*" element={<p>Không tìm thấy trang.</p>} />
          </Routes>
        </main>
        <div className="admin-footer">
          LUMIQ ADMIN <span>Đơn giản để quản lý. Tinh tế để phát triển.</span>
        </div>
      </div>
    </div>
  );
}
