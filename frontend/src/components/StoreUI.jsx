import { useContext, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Search,
  UserRound,
  ArrowUpRight,
  Menu,
  X,
  Package,
  ShoppingBasket,
} from "lucide-react";
import { Auth } from "../auth";
import { Cart } from "../auth";
import { countCartProducts } from "../cartUtils";

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="LUMIQ trang chủ">
      LUMIQ<span>EVERYDAY, REDEFINED.</span>
    </Link>
  );
}

export function Notice({ children }) {
  return children ? (
    <div className="notice" role="status">
      {children}
    </div>
  ) : null;
}

export function Field({ label, ...props }) {
  return (
    <label className="field">
      {label}
      <input {...props} />
    </label>
  );
}

export function ProductImage({ product }) {
  return product.images?.[0] ? (
    <img
      src={product.images[0].image_path}
      alt={product.name}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  ) : (
    <div className="image-placeholder">
      <Package size={38} />
      <span>LUMIQ</span>
    </div>
  );
}

export function Header() {
  const { user } = useContext(Auth);
  const { cart } = useContext(Cart);
  const cartProductCount = countCartProducts(cart);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  return (
    <>
      <header>
        <Logo />
        <nav className={menu ? "open" : ""}>
          <NavLink to="/" onClick={() => setMenu(false)}>
            Trang chủ
          </NavLink>
          <NavLink to="/san-pham" onClick={() => setMenu(false)}>
            Sản phẩm
          </NavLink>
          <NavLink to="/khuyen-mai" onClick={() => setMenu(false)}>
            Khuyến mãi
          </NavLink>
          <NavLink to="/gioi-thieu" onClick={() => setMenu(false)}>
            Giới thiệu
          </NavLink>
          <NavLink to="/lien-he" onClick={() => setMenu(false)}>
            Liên hệ
          </NavLink>
        </nav>
        <div className="header-tools">
          <Link
            className="icon-button cart-header-link"
            to="/gio-hang"
            aria-label={`Giỏ hàng, ${cartProductCount} sản phẩm`}
          >
            <ShoppingBasket size={22} />
            {cartProductCount > 0 && <span>{cartProductCount}</span>}
          </Link>
          <form
            className="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/san-pham?q=" + encodeURIComponent(q));
            }}
          >
            <Search size={17} />
            <input
              aria-label="Tìm sản phẩm"
              placeholder="Bạn đang tìm gì?"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </form>
          <Link
            className="icon-button"
            to={user ? "/tai-khoan" : "/dang-nhap"}
            aria-label="Tài khoản"
          >
            <UserRound size={22} />
          </Link>
          {user && (
            <Link
              to={user.role === "admin" ? "/admin" : "/tai-khoan"}
              className="account-link"
            >
              {user.role === "admin" ? "Quản trị" : user.name}
            </Link>
          )}
          <button
            className="mobile-menu icon-button"
            aria-label="Mở menu"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
    </>
  );
}

export function Footer() {
  return (
    <footer>
      <div>
        <Logo />
        <p>
          Thoải mái là chính mình.
          <br />
          Trang phục cho từng khoảnh khắc đời thường.
        </p>
      </div>
      <div>
        <b>KHÁM PHÁ</b>
        <Link to="/san-pham">Tất cả sản phẩm</Link>
        <Link to="/khuyen-mai">Ưu đãi</Link>
        <Link to="/gioi-thieu">Về LUMIQ</Link>
      </div>
      <div>
        <b>HỖ TRỢ</b>
        <Link to="/lien-he">Liên hệ</Link>
        <Link to="/chinh-sach-bao-mat">Chính sách bảo mật</Link>
      </div>
      <div>
        <b>TÀI KHOẢN</b>
        <Link to="/tai-khoan">Thông tin cá nhân</Link>
        <Link to="/dang-ky">Trở thành thành viên</Link>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} LUMIQ. <span>Ít hơn, chất hơn.</span>
      </div>
    </footer>
  );
}
