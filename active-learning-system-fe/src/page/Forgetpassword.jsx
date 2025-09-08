import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import favicon from "../css/icon/favicon11.png";
import "../css/page/Forgetpassword.css";

const ForgetPassword = () => {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccess(false);

    if (!email) {
      setErrorMessage("Vui lòng nhập email!");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "https://localhost:5000/api/Account/request-reset-password",
        { email }
      );

      if (response.status === 200) {
        setSuccess(true);
      } else {
        setErrorMessage("Gửi yêu cầu thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setErrorMessage("Không tìm thấy tài khoản với email này.");
      } else {
        setErrorMessage("Lỗi kết nối đến server.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Ẩn message thành công sau 5 giây
  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className="login-container">
      {/* Logo bên trái */}
      <div className="login-left">
        <img src={favicon} alt="Logo" className="login-logo" />
      </div>

      {/* Form bên phải */}
      <div className="login-right">
        <h2 className="login-title">
          <span className="highlight">Quên&nbsp;Mật&nbsp;Khẩu</span>
        </h2>

        <p className="login-subtext">
          Nhớ mật khẩu?{" "}
          <span className="create-link" onClick={() => navigate("/login")}>
            Đăng nhập
          </span>
        </p>


        {errorMessage && (
          <div className="error-forgetpassword">
            <p className="error-message-forgetpassword">{errorMessage}</p>
          </div>
        )}

        {success && (
          <div className="success-forgetpassword">
            <p style={{ color: "green" }}>
              Vui lòng kiểm tra email để đặt lại mật khẩu.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Nhập email"
            className="login-input"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Đang gửi..." : "Xác nhận"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgetPassword;
