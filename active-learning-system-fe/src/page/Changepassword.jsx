import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/page/Changepassword.css";

const ChangePassword = () => {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errorMessages, setErrorMessages] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessages(["Vui lòng đăng nhập để thực hiện thao tác này."]);
    }
  }, []);

  useEffect(() => {
    if (errorMessages.length > 0 || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessages([]);
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessages, successMessage]);


  // Real-time validation
  const validate = (fields) => {
    const errors = [];
    if (fields.newPassword !== fields.confirmPassword) {
      errors.push(" Mật khẩu mới và xác nhận không khớp.");
    }
    if (fields.oldPassword && fields.newPassword && fields.oldPassword === fields.newPassword) {
      errors.push(" Mật khẩu mới không được trùng với mật khẩu cũ.");
    }
    return errors;
  };

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    // Only show errors if user has started typing new/confirm password
    if (e.target.name === 'newPassword' || e.target.name === 'confirmPassword' || e.target.name === 'oldPassword') {
      setErrorMessages(validate(updated));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessages([]);
    setSuccessMessage("");

    const errors = [];


  // Real-time validation already handled, but double check before submit
  errors.push(...validate(form));

    const token = localStorage.getItem("token");
    if (!token) {
      errors.push("Bạn chưa đăng nhập.");
      setErrorMessages(errors);
      return;
    }

    if (errors.length > 0) {
      setErrorMessages(errors);
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        "https://localhost:5000/api/Account/change-password",
        form,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccessMessage(" Cập nhật mật khẩu thành công!");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      const res = error.response;
      const raw = res?.data;
      const newErrors = [...errors]; // giữ lỗi frontend
      const seen = new Set(newErrors); // tránh trùng

      if (res?.status === 400 && raw?.errors) {
        Object.entries(raw.errors).forEach(([field, messages]) => {
          messages.forEach((msg) => {
            let finalMsg = "";

            if (field === "OldPassword" && msg.includes("không đúng")) {
              finalMsg = " Mật khẩu cũ bạn nhập không chính xác.";
            } else if (field === "ConfirmPassword" && msg.includes("không khớp")) {
              finalMsg = " Mật khẩu mới và xác nhận không khớp.";
            } else {
              finalMsg = `⚠️ ${msg}`;
            }

            if (!seen.has(finalMsg)) {
              newErrors.push(finalMsg);
              seen.add(finalMsg);
            }
          });
        });
      } else {
        const fallback =
          raw?.error || raw?.message || raw?.title || "Đã xảy ra lỗi khi đổi mật khẩu.";
        const fallbackMsg = `⚠️ ${fallback}`;
        if (!seen.has(fallbackMsg)) {
          newErrors.push(fallbackMsg);
        }
      }

      setErrorMessages(newErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-wrapper">
      <h3 className="change-title">Đổi mật khẩu</h3>

      {errorMessages.length > 0 && (
        <div className="alert-box error">
          <ul>
            {errorMessages.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {successMessage && <div className="alert-box success">{successMessage}</div>}

      <form className="change-form" onSubmit={handleSubmit}>
        <input
          type="password"
          name="oldPassword"
          placeholder="Mật khẩu hiện tại"
          className="change-input"
          value={form.oldPassword}
          onChange={handleChange}
          required
          disabled={loading}
        />
        <input
          type="password"
          name="newPassword"
          placeholder="Mật khẩu mới"
          className="change-input"
          value={form.newPassword}
          onChange={handleChange}
          required
          disabled={loading}
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Xác nhận mật khẩu mới"
          className="change-input"
          value={form.confirmPassword}
          onChange={handleChange}
          required
          disabled={loading}
        />
        <button type="submit" className="change-button" disabled={loading}>
          {loading ? "Đang xử lý..." : "Cập nhật"}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
