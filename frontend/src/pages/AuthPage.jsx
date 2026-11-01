import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Auth } from "../auth";
import { api } from "../api";
import { Notice, Field } from "../components/StoreUI";

export function AuthPage({ register = false, forgot = false, verify = false }) {
  const { setUser } = useContext(Auth);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [step, setStep] = useState("details");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const purpose = register || verify ? "register" : "forgot_password";
  const remaining = Math.max(0, Math.ceil((retryAt - now) / 1000));
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  async function resend() {
    setBusy(true);
    setError("");
    try {
      const result = await api("/otp/send", {
        method: "POST",
        body: JSON.stringify({ email, purpose }),
      });
      setMessage(result.message);
      setRetryAt(Date.now() + 60000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const values = Object.fromEntries(new FormData(e.currentTarget));
      if (step === "otp") {
        const result = await api("/otp/verify", {
          method: "POST",
          body: JSON.stringify({ email, purpose, otp: values.otp }),
        });
        setMessage(result.message);
        setStep(register || verify ? "done" : "reset");
      } else if (step === "reset") {
        const result = await api("/password/reset", {
          method: "POST",
          body: JSON.stringify(values),
        });
        setMessage(result.message);
        setStep("done");
      } else if (register || forgot || verify) {
        const result = await api(register ? "/register" : "/otp/send", {
          method: "POST",
          body: JSON.stringify(
            register ? values : { email: values.email, purpose },
          ),
        });
        if (register && result.requires_verification === false) {
          setMessage(result.message);
          setStep("done");
          return;
        }
        setEmail(values.email);
        setMessage(result.message);
        setRetryAt(Date.now() + 60000);
        setStep("otp");
      } else {
        const user = await api("/login", {
          method: "POST",
          body: JSON.stringify(values),
        });
        setUser(user);
        navigate(user.role === "admin" ? "/admin" : "/", { replace: true });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <div className="auth-art">
        <span>LUMIQ / EVERYDAY ESSENTIALS</span>
        <h2>
          Thoải mái
          <br />
          là chính mình.
        </h2>
        <p>
          Một tủ đồ tinh giản.
          <br />
          Vô vàn cảm hứng mỗi ngày.
        </p>
        <div>LQ</div>
      </div>
      <div className="auth-form">
        <p className="eyebrow">CHÀO MỪNG ĐẾN VỚI LUMIQ</p>
        <h1>
          {step === "otp"
            ? "Xác minh email"
            : step === "reset"
              ? "Đặt lại mật khẩu"
              : verify
                ? "Xác minh email"
                : forgot
                  ? "Quên mật khẩu"
                  : register
                    ? "Tạo tài khoản"
                    : "Rất vui gặp lại bạn."}
        </h1>
        <p>
          {forgot
            ? "Xác minh email để đặt lại mật khẩu."
            : verify
              ? "Nhận mã OTP để hoàn tất xác minh tài khoản."
              : register
                ? "Bắt đầu hành trình phong cách của riêng bạn."
                : "Đăng nhập để quản lý thông tin của bạn."}
        </p>
        <Notice>{error}</Notice>
        <Notice>{message}</Notice>
        {step === "done" ? (
          <Link className="button" to="/dang-nhap">
            Đăng nhập
          </Link>
        ) : step === "otp" ? (
          <>
            <p>Nhập mã 6 số gửi đến {email}. Mã có hiệu lực 5 phút.</p>
            <form onSubmit={submit}>
              <Field
                label="Mã OTP"
                name="otp"
                inputMode="numeric"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                autoComplete="one-time-code"
                required
              />
              <button className="button full" disabled={busy}>
                Xác minh
              </button>
            </form>
            <div className="otp-actions">
              <button onClick={resend} disabled={busy || remaining > 0}>
                {remaining > 0 ? `Gửi lại sau ${remaining}s` : "Gửi lại mã"}
              </button>
              <button
                disabled={busy}
                onClick={() => {
                  setStep("details");
                  setError("");
                  setMessage("");
                }}
              >
                Nhập lại thông tin
              </button>
            </div>
          </>
        ) : step === "reset" ? (
          <form onSubmit={submit}>
            <Field
              label="Mật khẩu mới (ít nhất 8 ký tự, gồm chữ và số)"
              name="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              required
            />
            <Field
              label="Nhập lại mật khẩu mới"
              name="password_confirmation"
              type="password"
              autoComplete="new-password"
              required
            />
            <button className="button full" disabled={busy}>
              Lưu mật khẩu mới
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={submit}>
              {register && (
                <Field
                  label="Họ và tên"
                  name="name"
                  required
                  maxLength={100}
                  autoComplete="name"
                />
              )}
              <Field
                label="Email"
                name="email"
                type="email"
                required
                maxLength={191}
                autoComplete="email"
              />
              {register && (
                <Field
                  label="Số điện thoại (không bắt buộc)"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  pattern="0[0-9]{9}"
                  maxLength={10}
                  title="Số điện thoại phải bắt đầu bằng 0 và có đúng 10 chữ số."
                />
              )}
              {!forgot && !verify && (
                <Field
                  label="Mật khẩu"
                  name="password"
                  type="password"
                  minLength={register ? 8 : 1}
                  required
                  autoComplete={register ? "new-password" : "current-password"}
                />
              )}
              {register && (
                <>
                  <small>Ít nhất 8 ký tự, gồm chữ và số.</small>
                  <Field
                    label="Nhập lại mật khẩu"
                    name="password_confirmation"
                    type="password"
                    required
                    autoComplete="new-password"
                  />
                </>
              )}
              <button className="button full" disabled={busy}>
                {busy
                  ? "Đang xử lý…"
                  : forgot || verify
                    ? "Gửi mã OTP"
                    : register
                      ? "Tạo tài khoản"
                      : "Đăng nhập"}{" "}
                <ArrowRight size={18} />
              </button>
            </form>
            {!register && !forgot && !verify && (
              <p>
                <Link to="/quen-mat-khau">Quên mật khẩu?</Link>
                {" · "}
                <Link to="/xac-minh-email">Xác minh email</Link>
              </p>
            )}
          </>
        )}
        {step === "reset" && (
          <p>
            <button
              onClick={() => {
                setStep("details");
                setMessage("");
                setError("");
              }}
            >
              Yêu cầu mã OTP mới
            </button>
          </p>
        )}
        {register && (
          <p>
            <Link to="/xac-minh-email">
              Đã đăng ký nhưng chưa xác minh email?
            </Link>
          </p>
        )}
        <p className="auth-switch">
          {register ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
          <Link
            to={register ? "/dang-nhap" : "/dang-ky"}
            onClick={() => setError("")}
          >
            {register ? "Đăng nhập" : "Đăng ký ngay"}
          </Link>
        </p>
      </div>
    </main>
  );
}
