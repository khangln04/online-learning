import { useNavigate } from 'react-router-dom';
import favicon from "../css/icon/favicon11.png";
import { useState, useEffect } from 'react';
import axios from 'axios';
import "../css/page/Login.css";

export default function Login() {
  const [remember, setRemember] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const savedRemember = localStorage.getItem("rememberMe");
    if (savedRemember === "true") {
      const savedUsername = localStorage.getItem("username");
      const savedPassword = localStorage.getItem("password");
      if (savedUsername && savedPassword) {
        setUsername(savedUsername);
        setPassword(savedPassword);
        setRemember(true);
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault(); // Ngăn chặn reload trang khi submit form
    setErrorMessage(""); // Xóa thông báo lỗi cũ
    if (!username && !password) {
      setErrorMessage("Vui lòng nhập tài khoản và mật khẩu!");
      return;
    }
    // Validate username
    if (!username) {
      setErrorMessage("Vui lòng nhập tài khoản!");
      return;
    }
  

    // Validate password
    if (!password) {
      setErrorMessage("Vui lòng nhập mật khẩu!");
      return;
    }
  
    try {
      const response = await axios.post("https://localhost:5000/api/auth/login", {
        username,
        password,
      });
      console.log("✅ response.data từ server:", response.data);

      if (response.data.success) {
        const token = response.data.token; // Thay đổi tùy thuộc vào cấu trúc phản hồi API
        const accountId = response.data.accountId;
        const role = response.data.role;
  // ...existing code...

        if (!token) {
          throw new Error("Token không được trả về từ server.");
        }
        localStorage.setItem("token", token);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", username);
        localStorage.setItem("accountId", accountId); // Thêm dòng này
        localStorage.setItem("role", role);
        if (remember) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem("password", password);
        } else {
          localStorage.removeItem("password");
          localStorage.setItem("rememberMe", "false");
        }

        if (role === "Instructor") {
          navigate("/instructor-courselist");
        } else if (role === "Manager") {
          navigate("/managercourselist");
        } else if (role === "Marketer") {
          navigate("/macourselist");
        } else if (role === "Admin") {
          navigate("/accountlist");
        } else {
          navigate("/homepage");
        }
        window.location.reload(); // Cập nhật Header
      } else {
        // Xử lý các trường hợp lỗi từ server (ví dụ: sai thông tin, tài khoản bị ban)
        if (response.data.message) {
          setErrorMessage(response.data.message); // Hiển thị thông báo từ server
        } else {
          setErrorMessage("Sai tài khoản hoặc mật khẩu!");
        }
      }
    } catch (error) {
      console.error("Login error:", error.response ? error.response.data : error.message);
      // Xử lý lỗi chi tiết dựa trên phản hồi từ server
      if (error.response) {
        const { status, data } = error.response;
        if (status === 403) {
          setErrorMessage("Tài khoản của bạn không có quyền truy cập (có thể bị ban).");
        } else if (status === 401) {
          setErrorMessage("Sai tài khoản hoặc mật khẩu!");
        } else if (data && data.message) {
          setErrorMessage(data.message); // Hiển thị thông báo lỗi cụ thể từ server
        } else {
          setErrorMessage("Lỗi server. Vui lòng thử lại sau!");
        }
      } else {
        setErrorMessage("Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img src={favicon} alt="Logo" className="login-logo" />
      </div>

      <div className="login-right">
        <h2 className="login-title">
          <span className="highlight">Đăng nhập với</span> Tài khoản
        </h2>
        <p className="login-subtext">
          Bạn chưa có tài khoản?{' '}
          <span className="create-link" onClick={() => navigate('/register')}>
            Tạo tài khoản
          </span>
        </p>
        {errorMessage && (
          <div className="error-wrapperlogin">
            <p className="error-messagelogin">{errorMessage}</p>
          </div>
        )}
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Tên người dùng"
            className="login-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            className="login-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="login-options">
            <label className="remember-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Ghi nhớ</span>
            </label>
            <span className="forgot-password" onClick={() => navigate('/forget')}>
              Quên mật khẩu?
            </span>
          </div>

          <button className="login-button" type="submit">
            Đăng nhập
          </button>
        </form>

      </div>
    </div>
  );
}