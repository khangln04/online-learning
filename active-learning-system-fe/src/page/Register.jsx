// Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import favicon from "../css/icon/favicon11.png";
import "../css/page/Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  // Lưu lỗi từng trường
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    address: "",
    dob: "",
    sex: 0,
    phone: "",
    email: "",
    roleId: 6,
    username: "",
    password: "",
  });

  // Timeout refs for clearing errors
  const errorTimeouts = {};

  const clearFieldError = (field) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    if (errorTimeouts[field]) {
      clearTimeout(errorTimeouts[field]);
      delete errorTimeouts[field];
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "sex" ? Number(value) : value
    }));
    // Xóa lỗi khi đang nhập
    clearFieldError(name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setFieldErrors({});

    // Helper functions
    const isBlank = (str) => !str || str.trim().length === 0;
    const errors = {};

    // Validate Name
    if (isBlank(form.name)) {
      errors.name = "Tên là bắt buộc và không được chỉ chứa khoảng trắng";
    } else if (form.name.length > 50) {
      errors.name = "Tên tối đa 50 ký tự";
    }

    // Validate Address
    if (isBlank(form.address)) {
      errors.address = "Địa chỉ là bắt buộc và không được chỉ chứa khoảng trắng";
    } else if (form.address.length > 200) {
      errors.address = "Địa chỉ tối đa 200 ký tự";
    }

    // Validate DOB (ngày sinh)
    if (isBlank(form.dob)) {
      errors.dob = "Ngày sinh là bắt buộc.";
    } else {
      const dobDate = new Date(form.dob);
      const now = new Date();
      const age = now.getFullYear() - dobDate.getFullYear() - (now < new Date(now.getFullYear(), dobDate.getMonth(), dobDate.getDate()) ? 1 : 0);
      if (isNaN(dobDate.getTime()) || age < 15) {
        errors.dob = "Tuổi của người dùng phải lớn hơn 15 tuổi";
      }
    }

    // Validate Phone
    if (isBlank(form.phone)) {
      errors.phone = "Số điện thoại là bắt buộc và không được chỉ chứa khoảng trắng";
    } else {
      const phone = form.phone.trim();
      const phoneRegex = /^(0)(\d{9,10})$/;
      if (!phoneRegex.test(phone)) {
        errors.phone = "Số điện thoại phải bắt đầu bằng 0 và theo sau là 9-10 chữ số";
      }
    }

    // Validate Email
    if (isBlank(form.email)) {
      errors.email = "Email là bắt buộc và không được phép chỉ có khoảng trắng";
    } else if (!form.email.includes("@")) {
      errors.email = "Email phải chứa kí tự @";
    }

    // Validate Username
    if (isBlank(form.username)) {
      errors.username = "Tên người dùng là bắt buộc và không được chỉ chứa khoảng trắng";
    } else if (form.username.length > 50) {
      errors.username = "Tên người dùng chỉ cho phép tối đa 50 ký tự";
    }

    // Validate Password
    if (isBlank(form.password)) {
      errors.password = "Mật khẩu là bắt buộc và không được phép chỉ chứa khoảng trắng";
    } else if (form.password.length < 9 ) {
      errors.password = "Mật khẩu phải có độ dài lớn hơn 8 kí tự ";
    } else {
      const hasUpper = /[A-Z]/.test(form.password);
      const hasLower = /[a-z]/.test(form.password);
      const hasDigit = /[0-9]/.test(form.password);
      const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(form.password);
      if (!(hasUpper && hasLower && hasDigit && hasSpecial)) {
        errors.password = "Mật khẩu phải có 1 chữ in hoa,in thường,1 chữ số và ký tự đặc biệt";
      }
    }

    // Nếu có lỗi thì set lỗi và return
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Auto-hide each error after 3s
      Object.keys(errors).forEach((field) => {
        if (errorTimeouts[field]) clearTimeout(errorTimeouts[field]);
        errorTimeouts[field] = setTimeout(() => {
          setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        }, 3000);
      });
      setLoading(false);
      return;
    }

    // Check if username exists (call API)
    try {
      const checkRes = await axios.post("https://localhost:5000/api/Account/check-username", { username: form.username });
      if (checkRes.data && checkRes.data.exists) {
        setFieldErrors({ username: "Đã tồn tại tên người dùng này" });
        // Auto-hide username error after 3s
        if (errorTimeouts.username) clearTimeout(errorTimeouts.username);
        errorTimeouts.username = setTimeout(() => {
          setFieldErrors((prev) => ({ ...prev, username: undefined }));
        }, 3000);
        setLoading(false);
        return;
      }
    } catch (err) {
      // Nếu API check lỗi, vẫn cho phép tiếp tục đăng ký (có thể xử lý khác nếu muốn)
    }

    // Nếu tất cả hợp lệ, gửi đăng ký
    try {
      setLoading(true);
      const res = await axios.post(
        "https://localhost:5000/api/Account/pre-register",
        form
      );

      const { token } = res.data;

  // ✅ Lưu token và email vào localStorage
  localStorage.setItem("register_token", token);
  localStorage.setItem("register_email", form.email);
  // Reset lại số lần gửi lại OTP khi đăng ký thành công
  localStorage.removeItem("otp_resend_count");
  // Nếu muốn reset luôn số lần nhập sai OTP:
  localStorage.removeItem("otp_attempts");

  navigate("/verify-otp");
    } catch (err) {
      console.error("Lỗi khi đăng ký:", err.response?.data || err.message);
      let msg = "Đăng ký thất bại, vui lòng thử lại!";
      const errData = err.response?.data;
      if (typeof errData === 'object') {
        const rawMsg = errData.message || errData.error || JSON.stringify(errData);
        if (rawMsg?.includes("Tên đăng nhập đã tồn tại")) {
          setFieldErrors({ username: "Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác." });
          if (errorTimeouts.username) clearTimeout(errorTimeouts.username);
          errorTimeouts.username = setTimeout(() => {
            setFieldErrors((prev) => ({ ...prev, username: undefined }));
          }, 3000);
        } else if (rawMsg?.includes("Email đã được sử dụng")) {
          setFieldErrors({ email: "Email này đã được sử dụng. Vui lòng chọn email khác." });
          if (errorTimeouts.email) clearTimeout(errorTimeouts.email);
          errorTimeouts.email = setTimeout(() => {
            setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }, 3000);
        } else if (rawMsg?.includes("Số điện thoại đã được sử dụng")) {
          setFieldErrors({ phone: "Số điện thoại này đã được sử dụng. Vui lòng chọn số khác." });
          if (errorTimeouts.phone) clearTimeout(errorTimeouts.phone);
          errorTimeouts.phone = setTimeout(() => {
            setFieldErrors((prev) => ({ ...prev, phone: undefined }));
          }, 3000);
        } else if (rawMsg && rawMsg !== '{}') {
          setErrorMessage(rawMsg);
        } else {
          setErrorMessage(msg);
        }
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
          <span className="highlight">Tạo&nbsp;Tài&nbsp;Khoản&nbsp;Mới</span>
        </h2>
        <p className="login-subtext">
          Đã có tài khoản?{" "}
          <span className="create-link" onClick={() => navigate("/login")}>
            Đăng nhập
          </span>
        </p>

        {errorMessage && (
          <div className="error-wrapper">
            <p className="error-message">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div style={{position:'relative'}}>
            <input name="name" value={form.name} onChange={handleChange} className="login-input" placeholder="Họ và tên" required />
            {fieldErrors.name && <div className="error-message-register">{fieldErrors.name}</div>}
          </div>
          <div style={{position:'relative'}}>
            <input name="address" value={form.address} onChange={handleChange} className="login-input" placeholder="Địa chỉ" required />
            {fieldErrors.address && <div className="error-message-register">{fieldErrors.address}</div>}
          </div>
          <div style={{position:'relative'}}>
            <input type="date" name="dob" value={form.dob} onChange={handleChange} className="login-input" required />
            {fieldErrors.dob && <div className="error-message-register">{fieldErrors.dob}</div>}
          </div>
          <select name="sex" value={form.sex} onChange={handleChange} className="login-input">
            <option value={1}>Nam</option>
            <option value={0}>Nữ</option>
          </select>
          <div style={{position:'relative'}}>
            <input name="phone" value={form.phone} onChange={handleChange} className="login-input" placeholder="Số điện thoại" />
            {fieldErrors.phone && <div className="error-message-register">{fieldErrors.phone}</div>}
          </div>
          <div style={{position:'relative'}}>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="login-input" placeholder="Email" required />
            {fieldErrors.email && <div className="error-message-register">{fieldErrors.email}</div>}
          </div>
          <select name="roleId" value={form.roleId} onChange={handleChange} className="login-input">
            <option value={6}>Học sinh</option>
            <option value={7}>Phụ huynh</option>
          </select>
          <div style={{position:'relative'}}>
            <input name="username" value={form.username} onChange={handleChange} className="login-input" placeholder="Tên đăng nhập" required />
            {fieldErrors.username && <div className="error-message-register">{fieldErrors.username}</div>}
          </div>
          <div style={{position:'relative'}}>
            <input type="password" name="password" value={form.password} onChange={handleChange} className="login-input" placeholder="Mật khẩu" required />
            {fieldErrors.password && <div className="error-message-register">{fieldErrors.password}</div>}
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Đang gửi OTP..." : "Đăng ký"}
          </button>
        </form>
      </div>
    </div>
  );
}
