import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import favicon from "../css/icon/favicon11.png";
import "../css/page/Forget2.css";

export default function Forget2() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Lấy token từ URL
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  // Real-time password validation
  const validatePassword = (pwd) => {
    const passwordRequirements = [];
    if (pwd.length < 6) {
      passwordRequirements.push("ít nhất 6 ký tự");
    }
    if (!/[!@#$%^&*(),.?":{}|<>\[\]\\/~`_+=;'-]/.test(pwd)) {
      passwordRequirements.push("ít nhất 1 ký tự đặc biệt");
    }
    if (!/[0-9]/.test(pwd)) {
      passwordRequirements.push("ít nhất 1 số");
    }
    if (!/[A-Z]/.test(pwd)) {
      passwordRequirements.push("ít nhất 1 chữ in hoa");
    }
    if (passwordRequirements.length > 0) {
      setPasswordError("Mật khẩu phải có " + passwordRequirements.join(", "));
    } else {
      setPasswordError("");
    }
  };

  const validateConfirmPassword = (pwd, confirmPwd) => {
    if (confirmPwd && pwd !== confirmPwd) {
      setConfirmPasswordError("Mật khẩu không trùng khớp!");
    } else {
      setConfirmPasswordError("");
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
    validateConfirmPassword(value, confirmPassword);
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);
    validateConfirmPassword(password, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);

    if (!token) {
      setErrorMessage("Không tìm thấy token. Vui lòng kiểm tra lại email.");
      return;
    }

    // Final validation before submit
    validatePassword(password);
    validateConfirmPassword(password, confirmPassword);
    // Check for errors, but do not set errorMessage, just prevent submit
    const passwordRequirements = [];
    if (password.length < 6) passwordRequirements.push("ít nhất 6 ký tự");
    if (!/[!@#$%^&*(),.?":{}|<>\[\]\\/~`_+=;'-]/.test(password)) passwordRequirements.push("ít nhất 1 ký tự đặc biệt");
    if (!/[0-9]/.test(password)) passwordRequirements.push("ít nhất 1 số");
    if (!/[A-Z]/.test(password)) passwordRequirements.push("ít nhất 1 chữ in hoa");
    if (passwordRequirements.length > 0) {
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      return;
    }

    try {
      const response = await axios.post(
        "https://localhost:5000/api/Account/reset-password",
        {
          token: token,
          newPassword: password,
        }
      );

      if (response.status === 200) {
        setSuccess(true);
      } else {
        setErrorMessage("Token đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu lại liên kết đặt lại mật khẩu.");
      }
    } catch (err) {
      console.error("Lỗi khi gửi yêu cầu:", err);
      // Chỉ hiển thị lỗi nếu là lỗi token hết hạn hoặc không hợp lệ
      if (err.response?.data && (String(err.response.data).toLowerCase().includes("token") || String(err.response.data).toLowerCase().includes("hết hạn") || String(err.response.data).toLowerCase().includes("expired"))) {
        setErrorMessage("Token đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu lại liên kết đặt lại mật khẩu.");
      } else {
        setErrorMessage(""); // Không hiển thị lỗi khác
      }
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-left">
        <img src={favicon} alt="Logo" className="reset-logo" />
      </div>

      <div className="reset-right">
        <h2 className="reset-title">
          <span className="highlight">Đặt&nbsp;Lại&nbsp;Mật&nbsp;Khẩu</span>
        </h2>

        <p className="reset-subtext">
          Quay về{" "}
          <span className="create-link" onClick={() => navigate("/login")}>
            Đăng nhập
          </span>
        </p>



        {errorMessage && (
          <div className="message-wrapper error-message-forget2">
            {errorMessage}
          </div>
        )}
        {success ? (
          <>
            <p className="success-text">
              ✅ Mật khẩu đã được cập nhật thành công!
            </p>
            <button
              className="reset-button"
              onClick={() => navigate("/login")}
            >
              Đăng nhập
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="Nhập mật khẩu mới"
              className="reset-input"
              value={password}
              onChange={handlePasswordChange}
              required
            />
            {passwordError && (
              <div className="message-wrapper error-message-forget2">{passwordError}</div>
            )}
            <input
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              className="reset-input"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
            />
            {confirmPasswordError && (
              <div className="message-wrapper error-message-forget2">{confirmPasswordError}</div>
            )}
            <button type="submit" className="reset-button">
              Cập nhật
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
