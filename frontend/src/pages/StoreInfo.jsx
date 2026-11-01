import {
  ArrowRight,
  Mail,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { StoreBanner } from "../components/StoreBanner";

const contactEmail = "ngythanh.0411@gmail.com";

export function About() {
  return (
    <main className="store-info-page">
      <StoreBanner
        className="store-info-hero about-hero"
        image="photo-1483985988355-763728e1935b"
        alt="Thời trang thường ngày và phong cách cá nhân"
        eyebrow="CÂU CHUYỆN LUMIQ"
        title="Mặc điều mình thích. Sống theo cách của mình."
        description="LUMIQ hướng đến những món đồ dễ mặc, dễ kết hợp và thoải mái trong nhịp sống mỗi ngày."
      >
        <Link className="button mint" to="/san-pham">
          Khám phá sản phẩm <ArrowRight size={18} />
        </Link>
      </StoreBanner>

      <section className="info-content-section">
        <div className="info-section-heading">
          <p className="eyebrow">LESS, BUT BETTER</p>
          <h2>Ít cầu kỳ hơn, thêm chỗ cho cá tính của bạn.</h2>
        </div>
        <div className="about-values">
          <article>
            <span className="info-icon">
              <Sparkles size={22} />
            </span>
            <h3>Tinh giản</h3>
            <p>
              Thiết kế và màu sắc được giới thiệu theo hướng dễ phối, để bạn
              thoải mái tạo nên phong cách riêng.
            </p>
          </article>
          <article>
            <span className="info-icon">
              <PackageCheck size={22} />
            </span>
            <h3>Rõ ràng khi mua sắm</h3>
            <p>
              Xem thông tin sản phẩm, lựa chọn biến thể còn hàng và kiểm tra
              thông tin đơn trong tài khoản.
            </p>
          </article>
          <article>
            <span className="info-icon">
              <ShieldCheck size={22} />
            </span>
            <h3>An tâm với tài khoản</h3>
            <p>
              Email được xác minh bằng mã dùng một lần; bạn có thể xem lịch sử
              đơn hàng sau khi đăng nhập.
            </p>
          </article>
        </div>
      </section>

      <section className="info-callout">
        <div>
          <p className="eyebrow">BẮT ĐẦU TỪ ĐIỀU BẠN THÍCH</p>
          <h2>Tìm món đồ phù hợp với ngày hôm nay.</h2>
        </div>
        <Link className="button" to="/san-pham">
          Xem bộ sưu tập <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}

export function Contact() {
  return (
    <main className="store-info-page">
      <StoreBanner
        className="store-info-hero contact-hero"
        image="photo-1521737711867-e3b97375f902"
        alt="Đội ngũ hỗ trợ khách hàng"
        eyebrow="LUMIQ · HỖ TRỢ KHÁCH HÀNG"
        title="Chúng tôi sẵn sàng lắng nghe bạn."
        description="Cần hỏi về tài khoản, sản phẩm hoặc đơn hàng? Gửi email cho LUMIQ và nhớ ghi mã đơn nếu câu hỏi liên quan đến đơn mua."
      />
      <section className="contact-card-section">
        <article className="contact-card">
          <span className="info-icon">
            <Mail size={23} />
          </span>
          <p className="eyebrow">EMAIL HỖ TRỢ</p>
          <h2>Liên hệ với LUMIQ</h2>
          <p>
            Gửi nội dung cần hỗ trợ đến địa chỉ email của cửa hàng. Không gửi
            mật khẩu hoặc mã OTP qua email.
          </p>
          <a className="contact-email" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          <a
            className="button"
            href={`mailto:${contactEmail}?subject=${encodeURIComponent("Yêu cầu hỗ trợ LUMIQ")}`}
          >
            Soạn email <ArrowRight size={18} />
          </a>
        </article>
        <aside className="contact-help">
          <h2>Để được hỗ trợ nhanh hơn</h2>
          <ul>
            <li>Nêu ngắn gọn vấn đề bạn đang gặp.</li>
            <li>Với đơn hàng, cung cấp mã đơn và email đăng ký.</li>
            <li>Không gửi mật khẩu, thông tin thẻ hoặc mã xác minh OTP.</li>
          </ul>
          <Link className="text-link" to="/tai-khoan/don-hang">
            Xem lịch sử đơn hàng <ArrowRight size={17} />
          </Link>
        </aside>
      </section>
    </main>
  );
}

export function PrivacyPolicy() {
  return (
    <main className="store-info-page privacy-page">
      <StoreBanner
        className="store-info-hero privacy-hero"
        image="photo-1450101499163-c8848c66ca85"
        alt="Tài liệu và thông tin được bảo vệ"
        eyebrow="THÔNG TIN MINH BẠCH"
        title="Chính sách bảo mật"
        description="Chính sách này giải thích những thông tin LUMIQ sử dụng để vận hành tài khoản và xử lý đơn hàng trên website."
      />
      <article className="policy-content">
        <section>
          <h2>1. Thông tin được xử lý</h2>
          <p>
            Khi bạn sử dụng website, LUMIQ có thể xử lý họ tên, email, số điện
            thoại và mật khẩu tài khoản; thông tin người nhận, địa chỉ giao
            hàng, sản phẩm, số lượng, giá trị và trạng thái đơn; cùng nội dung
            bạn chủ động gửi khi liên hệ hỗ trợ.
          </p>
          <p>
            Mật khẩu tài khoản được lưu dưới dạng băm, không lưu thành mật khẩu
            đọc được. Mã OTP được lưu dưới dạng băm, có thời hạn và được dùng
            cho xác minh email hoặc đặt lại mật khẩu.
          </p>
        </section>
        <section>
          <h2>2. Mục đích sử dụng</h2>
          <ul>
            <li>
              Tạo và bảo vệ tài khoản, xác minh email và hỗ trợ đặt lại mật
              khẩu.
            </li>
            <li>
              Xử lý giỏ hàng, giao hàng, thanh toán COD và cập nhật trạng thái
              đơn.
            </li>
            <li>
              Hiển thị lịch sử đơn hàng, phiếu mua hàng và hỗ trợ yêu cầu của
              bạn.
            </li>
            <li>
              Bảo vệ website, phát hiện lạm dụng và duy trì hoạt động kỹ thuật.
            </li>
          </ul>
        </section>
        <section>
          <h2>3. Email, phiên đăng nhập và dịch vụ bản đồ</h2>
          <p>
            Website dùng nhà cung cấp SMTP để gửi OTP. Phiên đăng nhập được duy
            trì bằng cookie cần thiết. Nội dung giỏ hàng được lưu trong bộ nhớ
            cục bộ của trình duyệt để tiếp tục mua sắm trên thiết bị đó.
          </p>
          <p>
            Khi tính phí giao hàng, địa chỉ nhận hàng được gửi tới Google Routes
            API để tra cứu quãng đường. Thông tin này chỉ được gửi khi bạn yêu
            cầu báo giá hoặc đặt hàng và chức năng được cấu hình.
          </p>
        </section>
        <section>
          <h2>4. Chia sẻ và lưu giữ thông tin</h2>
          <p>
            LUMIQ không bán thông tin cá nhân. Thông tin chỉ được chia sẻ khi
            cần để vận hành dịch vụ đã nêu (như gửi email, tra cứu tuyến đường),
            theo yêu cầu hợp pháp, hoặc để bảo vệ quyền và an toàn của người
            dùng.
          </p>
          <p>
            Thông tin được lưu trong thời gian cần thiết để cung cấp dịch vụ,
            quản lý tài khoản và đơn hàng, giải quyết khiếu nại hoặc đáp ứng
            nghĩa vụ pháp lý. Thời gian lưu thực tế có thể phụ thuộc vào hồ sơ
            giao dịch và quy định áp dụng.
          </p>
        </section>
        <section>
          <h2>5. Bảo vệ và quyền của bạn</h2>
          <p>
            Website áp dụng các biện pháp kỹ thuật như băm mật khẩu, xác minh
            OTP có giới hạn và kiểm soát truy cập theo vai trò. Không có phương
            thức truyền tải hoặc lưu trữ nào đảm bảo an toàn tuyệt đối; hãy giữ
            kín mật khẩu và OTP, đồng thời đăng xuất khi dùng thiết bị chung.
          </p>
          <p>
            Bạn có thể cập nhật thông tin tài khoản trên website hoặc liên hệ
            LUMIQ để yêu cầu xem, sửa hay xử lý thông tin cá nhân, tùy theo quy
            định áp dụng và hồ sơ giao dịch cần được lưu giữ.
          </p>
        </section>
        <section>
          <h2>6. Liên hệ và cập nhật chính sách</h2>
          <p>
            Nếu có câu hỏi về quyền riêng tư, vui lòng liên hệ{" "}
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. Nội dung
            chính sách có thể được cập nhật khi cách vận hành website thay đổi;
            phiên bản mới sẽ được đăng trên trang này.
          </p>
        </section>
      </article>
    </main>
  );
}
