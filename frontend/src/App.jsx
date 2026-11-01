import { useContext, useEffect, useState } from "react";
import {
  Link,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Auth } from "./auth";
import { Cart } from "./auth";
import { api } from "./api";
import { Header, Footer } from "./components/StoreUI";
import { Home } from "./pages/Home";
import { Catalog } from "./pages/Catalog";
import { AuthPage } from "./pages/AuthPage";
import { Profile, ProfileDetails } from "./pages/Profile";
import { Detail } from "./pages/Detail";
import { CartPage } from "./pages/CartPage";
import { Checkout } from "./pages/Checkout";
import { Promotions } from "./pages/Promotions";
import { CustomerOrders } from "./pages/CustomerOrders";
import { CustomerInvoice } from "./pages/CustomerInvoice";
import { About, Contact, PrivacyPolicy } from "./pages/StoreInfo";
import Admin from "./Admin";
function Guard({ children, admin = false }) {
  const { user, loading } = useContext(Auth);
  if (loading) return <p className="empty">Đang tải…</p>;
  if (!user) return <Navigate to="/dang-nhap" replace />;
  if (admin && user.role !== "admin")
    return <Navigate to="/tai-khoan" replace />;
  return children;
}
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("lumiq_cart") || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch (error) {
      console.error("Không thể đọc giỏ hàng đã lưu.", error);
      return [];
    }
  });
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  useEffect(() => {
    localStorage.setItem("lumiq_cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    api("/me")
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  async function logout() {
    try {
      await api("/logout", { method: "POST" });
      setUser(null);
      navigate("/dang-nhap");
    } catch (e) {
      alert(e.message);
    }
  }
  return (
    <Auth.Provider value={{ user, setUser, loading, logout }}>
      <Cart.Provider value={{ cart, setCart }}>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <Guard admin>
                <Admin />
              </Guard>
            }
          />
          <Route
            path="*"
            element={
              <>
                <Header />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/san-pham" element={<Catalog />} />
                  <Route path="/san-pham/:id" element={<Detail />} />
                  <Route path="/gioi-thieu" element={<About />} />
                  <Route path="/lien-he" element={<Contact />} />
                  <Route
                    path="/chinh-sach-bao-mat"
                    element={<PrivacyPolicy />}
                  />
                  <Route path="/khuyen-mai" element={<Promotions />} />
                  <Route path="/gio-hang" element={<CartPage />} />
                  <Route
                    path="/thanh-toan"
                    element={
                      <Guard>
                        <Checkout />
                      </Guard>
                    }
                  />
                  <Route
                    path="/xac-minh-email"
                    element={<AuthPage key="verify" verify />}
                  />
                  <Route
                    path="/quen-mat-khau"
                    element={<AuthPage key="forgot" forgot />}
                  />
                  <Route path="/dang-nhap" element={<AuthPage key="login" />} />
                  <Route
                    path="/dang-ky"
                    element={<AuthPage key="register" register />}
                  />
                  <Route
                    path="/tai-khoan"
                    element={
                      <Guard>
                        <Profile />
                      </Guard>
                    }
                  >
                    <Route index element={<ProfileDetails />} />
                    <Route path="don-hang" element={<CustomerOrders />} />
                    <Route path="don-hang/:id" element={<CustomerOrders />} />
                    <Route path="phieu/:id" element={<CustomerInvoice />} />
                  </Route>
                  <Route
                    path="*"
                    element={
                      <div className="empty">
                        <h1>Không tìm thấy trang</h1>
                        <Link to="/">Về trang chủ</Link>
                      </div>
                    }
                  />
                </Routes>
                <Footer />
              </>
            }
          />
        </Routes>
      </Cart.Provider>
    </Auth.Provider>
  );
}
