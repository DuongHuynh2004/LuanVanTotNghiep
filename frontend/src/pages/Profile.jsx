import { useContext, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
  ArrowRight,
  Check,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Auth } from "../auth";
import { api } from "../api";
import { Notice, Field } from "../components/StoreUI";

export function Profile() {
  const { user, setUser, logout } = useContext(Auth);
  const { pathname } = useLocation();
  const isOrdersPage =
    pathname.startsWith("/tai-khoan/don-hang") ||
    pathname.startsWith("/tai-khoan/phieu/");
  return (
    <main className="section profile">
      <aside className="profile-sidebar">
        <div className="profile-identity">
          <span className="profile-avatar" aria-hidden="true">
            {user.name.trim().charAt(0).toUpperCase()}
          </span>
          <p className="eyebrow">MY LUMIQ</p>
          <h2>{user.name}</h2>
          <p className="profile-email">{user.email}</p>
          <span className="profile-member-label">
            <ShieldCheck size={15} /> Thành viên LUMIQ
          </span>
        </div>
        <p className="profile-nav-label">TÀI KHOẢN</p>
        <div className="profile-nav">
          <Link
            to="/tai-khoan"
            className={!isOrdersPage ? "active" : undefined}
            aria-current={!isOrdersPage ? "page" : undefined}
          >
            <UserRound size={18} /> Thông tin cá nhân
          </Link>
          <Link
            to="/tai-khoan/don-hang"
            className={isOrdersPage ? "active" : undefined}
            aria-current={isOrdersPage ? "page" : undefined}
          >
            <PackageCheck size={18} /> Lịch sử đơn hàng
          </Link>
          {user.role === "admin" && (
            <Link to="/admin">
              <LayoutDashboard size={18} /> Trang quản trị
            </Link>
          )}
          <button type="button" onClick={logout}>
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </aside>
      <Outlet />
    </main>
  );
}

export function ProfileDetails() {
  const { user, setUser } = useContext(Auth);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    setMessage("");
    try {
      setUser(
        await api("/me", {
          method: "PUT",
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        }),
      );
      setMessage("Đã lưu thông tin của bạn.");
      form
        .querySelectorAll("input[type=password]")
        .forEach((i) => (i.value = ""));
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="profile-content">
      <div className="profile-heading">
        <div>
          <p className="eyebrow">TÀI KHOẢN CỦA BẠN</p>
          <h1>Thông tin cá nhân</h1>
          <p>Quản lý thông tin liên hệ và bảo mật tài khoản.</p>
        </div>
        <span className="profile-heading-mark" aria-hidden="true">
          <UserRound size={23} />
        </span>
      </div>
      <Notice>{message}</Notice>
      <form className="profile-form" onSubmit={submit}>
        <section className="profile-form-section">
          <div className="profile-section-heading">
            <div>
              <h2>Thông tin liên hệ</h2>
              <p>Cập nhật để LUMIQ có thể liên hệ khi cần.</p>
            </div>
          </div>
          <div className="form-grid">
            <Field
              label="Họ và tên"
              name="name"
              defaultValue={user.name}
              required
              maxLength={100}
              autoComplete="name"
            />
            <Field
              label="Số điện thoại"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              pattern="0[0-9]{9}"
              title="Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số."
              defaultValue={user.phone || ""}
              maxLength={10}
            />
            <Field
              label="Email"
              name="email"
              type="email"
              defaultValue={user.email}
              required
              autoComplete="email"
            />
          </div>
        </section>
        <section className="profile-form-section profile-password-section">
          <div className="profile-section-heading">
            <div>
              <h2>Đổi mật khẩu</h2>
              <p>Để trống nếu bạn chưa muốn thay đổi mật khẩu.</p>
            </div>
            <ShieldCheck size={21} aria-hidden="true" />
          </div>
          <Field
            label="Mật khẩu hiện tại"
            name="current_password"
            type="password"
            autoComplete="current-password"
          />
          <div className="form-grid">
            <Field
              label="Mật khẩu mới"
              name="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
            />
            <Field
              label="Nhập lại mật khẩu mới"
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
            />
          </div>
        </section>
        <div className="profile-form-actions">
          <span>
            <ShieldCheck size={17} /> Thông tin của bạn được bảo vệ
          </span>
          <button className="button" disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu thay đổi"}
            {busy ? <Check size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
}
