import { useEffect, useState } from "react";
import { Tag } from "lucide-react";
import { api } from "../api";
import { StoreBanner } from "../components/StoreBanner";

export function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/promotions")
      .then(setPromotions)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <StoreBanner
        className="promotions-banner"
        image="photo-1607082349566-187342175e2f"
        alt="Hộp quà và ưu đãi mua sắm"
        eyebrow="LUMIQ · ĐẶC QUYỀN MUA SẮM"
        title="Ưu đãi dành riêng cho bạn."
        description="Xem các chương trình khuyến mãi đang áp dụng và chọn ưu đãi phù hợp cho đơn hàng."
      />
      <main className="section commerce-page">
        <p className="eyebrow">LUMIQ · ƯU ĐÃI</p>
        <h1>Khuyến mãi đang áp dụng</h1>
        {error && <p className="commerce-message error">{error}</p>}
        {!error && promotions.length === 0 && (
          <div className="empty">
            <Tag size={25} />
            <p>Hiện chưa có chương trình khuyến mãi.</p>
          </div>
        )}
        <div className="promotion-grid">
          {promotions.map((promo) => (
            <article className="promotion-card" key={promo.id}>
              <span className="eyebrow">{promo.discount_percent}% OFF</span>
              <h2>{promo.name}</h2>
              <strong>{promo.code}</strong>
              <small>
                Đơn tối thiểu{" "}
                {Number(promo.minimum_subtotal).toLocaleString("vi-VN")}₫{" · "}
                Đến {new Date(promo.ends_at).toLocaleDateString("vi-VN")}
              </small>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
