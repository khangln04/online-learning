
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import favicon from "../css/icon/favicon11.png";
import "../css/page/VerifyOtp.css";

export default function VerifyOtp() {
  const navigate = useNavigate();

  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Ẩn tự động thông báo lỗi/thành công sau 4s
  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage("") , 4000);
      return () => clearTimeout(t);
    }
  }, [errorMessage]);

  useEffect(() => {
    if (successMessage) {
      const t = setTimeout(() => setSuccessMessage("") , 4000);
      return () => clearTimeout(t);
    }
  }, [successMessage]);
  const [loading, setLoading] = useState(false);
  const [resendCount, setResendCount] = useState(() => {
    const saved = localStorage.getItem('otp_resend_count');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [resendDisabled, setResendDisabled] = useState(() => {
    const saved = localStorage.getItem('otp_resend_count');
    return saved ? parseInt(saved, 10) >= 3 : false;
  });
  // Thêm biến đếm số lần nhập sai OTP
  const [otpAttempts, setOtpAttempts] = useState(() => {
    const saved = localStorage.getItem('otp_attempts');
    return saved ? parseInt(saved, 10) : 0;
  });
  const tooManyAttempts = otpAttempts >= 3;
  // Không còn validate email mới

  // Gửi lại OTP
  const handleResendOtp = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    if (resendDisabled || tooManyAttempts) {
      setErrorMessage("Bạn chỉ được gửi lại OTP tối đa 3 lần hoặc đã nhập sai quá 3 lần.");
      return;
    }
    if (!token) {
      setErrorMessage("Không tìm thấy mã token. Vui lòng đăng ký lại.");
      return;
    }
    try {
      setResendLoading(true);
      const payload = { token: typeof token === 'string' ? token : (token?.token || '') };
      const res = await axios.post("https://localhost:5000/api/Account/resend-otp", payload);
      let newToken = '';
      if (res.data && typeof res.data === 'object' && res.data.token) {
        newToken = res.data.token;
      } else if (typeof res.data === 'string') {
        newToken = res.data;
      }
      if (newToken) {
        setToken(newToken);
        localStorage.setItem("register_token", newToken);
        setSuccessMessage("Đã gửi lại mã OTP thành công! Vui lòng kiểm tra email.");
        const nextCount = resendCount + 1;
        setResendCount(nextCount);
        localStorage.setItem('otp_resend_count', nextCount);
        if (nextCount >= 3) {
          setResendDisabled(true);
        }
      }
    } catch (err) {
      let msg = "Gửi lại OTP thất bại. Vui lòng thử lại!";
      const errData = err.response?.data;
      if (typeof errData === 'object') {
        const rawMsg = errData.message || errData.error || JSON.stringify(errData);
        if (rawMsg?.includes("Token đã hết hạn")) {
          msg = "Token đã hết hạn. Vui lòng bắt đầu lại quá trình đăng ký.";
        } else if (rawMsg?.includes("Email mới không hợp lệ")) {
          msg = "Email mới không hợp lệ.";
        } else if (rawMsg?.includes("Email đã được sử dụng")) {
          msg = "Email này đã được sử dụng. Vui lòng chọn email khác.";
        } else if (rawMsg?.includes("giới hạn")) {
          msg = rawMsg;
        } else if (rawMsg?.includes("Email không hợp lệ")) {
          msg = "Email không hợp lệ hoặc không tồn tại.";
        } else if (rawMsg && rawMsg !== '{}') {
          msg = rawMsg;
        }
      }
      setErrorMessage(msg);
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    // Chỉ reset resendCount khi thực sự không có token/email (tức là register lại từ đầu)
    const savedToken = localStorage.getItem("register_token");
    const savedEmail = localStorage.getItem("register_email");
    if (!savedToken || !savedEmail) {
      // Đăng ký mới hoàn toàn, reset mọi thứ
      localStorage.removeItem('otp_resend_count');
      setResendCount(0);
      setResendDisabled(false);
      setOtpAttempts(0);
      setToken("");
      setEmail("");
      setErrorMessage("Thiếu thông tin xác thực. Vui lòng đăng ký lại.");
    } else {
      // Đã có token/email, giữ nguyên số lần gửi lại
      setToken(savedToken);
      setEmail(savedEmail);
      // Đọc lại resendCount từ localStorage
      const resend = localStorage.getItem('otp_resend_count');
      setResendCount(resend ? parseInt(resend, 10) : 0);
      setResendDisabled(resend ? parseInt(resend, 10) >= 3 : false);
      // Đọc lại số lần nhập sai OTP
      const attempts = localStorage.getItem('otp_attempts');
      setOtpAttempts(attempts ? parseInt(attempts, 10) : 0);
    }
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (tooManyAttempts) {
      setErrorMessage("Bạn đã nhập sai quá 3 lần, vui lòng thực hiện lại đăng ký.");
      return;
    }

    if (!otp.trim()) {
      setErrorMessage("Vui lòng nhập mã OTP!");
      return;
    }

    if (!token) {
      setErrorMessage("Không tìm thấy mã token. Vui lòng đăng ký lại.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        token: token,
        otp: otp
      };

      console.log("Xác thực OTP với:", payload); // ✅ Debug nếu cần

      await axios.post("https://localhost:5000/api/Account/verify-otp", payload);
      setSuccessMessage("✅ Xác thực thành công! Đang chuyển hướng...");

      // Xoá token/email sau xác thực thành công
      localStorage.removeItem("register_token");
      localStorage.removeItem("register_email");

      setTimeout(() => navigate("/login"), 2000);
      setOtpAttempts(0);
      localStorage.removeItem('otp_attempts');
    } catch (err) {
      console.error("❌ Lỗi xác thực OTP:", err.response?.data || err.message);
      let msg = "Xác thực thất bại. Vui lòng kiểm tra mã OTP!";
      let isOtpWrong = false;
      const errData = err.response?.data;
      if (typeof errData === 'object') {
        const rawMsg = errData.message || errData.error || JSON.stringify(errData);
        if (rawMsg?.includes("OTP không chính xác")) {
          msg = "Mã OTP không chính xác. Vui lòng kiểm tra lại.";
          isOtpWrong = true;
        } else if (rawMsg?.includes("OTP đã hết hạn")) {
          msg = "Mã OTP đã hết hạn. Vui lòng đăng ký lại hoặc gửi lại mã.";
        } else if (rawMsg && rawMsg !== '{}') {
          msg = rawMsg;
        }
      }
      if (isOtpWrong) {
        setOtpAttempts((prev) => {
          const next = prev + 1;
          localStorage.setItem('otp_attempts', next);
          if (next >= 3) {
            setErrorMessage("Bạn đã nhập sai quá 3 lần, vui lòng thực hiện lại đăng ký.");
          } else {
            setErrorMessage(msg);
          }
          return next;
        });
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img src={favicon} alt="Logo" className="login-logo" />
      </div>

      <div className="login-right">
        <h2 className="login-title">
          <span className="highlight">Xác&nbsp;Thực&nbsp;OTP</span>
        </h2>
        <p className="login-subtext">
          Nhập mã OTP đã gửi tới email: <b>{email}</b>
        </p>

  {/* Thông báo lỗi xác thực OTP sẽ hiển thị dưới nút xác thực, không hiển thị ở đây nữa */}

        {/* Nếu nhập sai 3 lần thì chỉ hiển thị nút quay về đăng ký, disable 2 nút còn lại */}
        {tooManyAttempts ? (
          <button
            className="login-button"
            style={{ background: '#e53935', color: '#fff', marginTop: 16 }}
            onClick={() => {
              localStorage.removeItem('otp_resend_count');
              localStorage.removeItem('otp_attempts');
              setOtpAttempts(0);
              setResendCount(0);
              setResendDisabled(false);
              navigate('/register');
            }}
            type="button"
          >
            Quay về đăng ký
          </button>
        ) : (
          <>
            <form onSubmit={handleVerify} className="register-form">
              <input
                type="text"
                className="login-input"
                placeholder="Nhập mã OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={tooManyAttempts}
              />
              <button type="submit" className="login-button" disabled={loading || tooManyAttempts}>
                {loading ? "Đang xác thực..." : "Xác thực"}
              </button>
              {/* Hiển thị lỗi xác thực OTP dưới nút xác thực */}
              {errorMessage && (
                <div className="message-wrapper error-message-otp">{errorMessage}</div>
              )}
            </form>
            <div style={{ marginTop: 24 }}>
              <button
                className="login-button"
                style={{ background: '#1976d2', marginTop: 4 }}
                onClick={handleResendOtp}
                disabled={resendLoading || resendDisabled || tooManyAttempts}
                type="button"
              >
                {resendLoading
                  ? "Đang gửi lại..."
                  : resendDisabled
                    ? "Đã gửi lại tối đa 3 lần"
                    : `Gửi lại mã OTP (${3 - resendCount} lần còn lại)`}
              </button>
              {/* Hiển thị thông báo thành công gửi lại OTP dưới nút gửi lại */}
              {successMessage && (
                <div className="message-wrapper success-message-otp">{successMessage}</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

