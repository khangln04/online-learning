import "../css/components/Header.css";
import logo from "../css/icon/favicon11.png";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const updateAuthState = async () => {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      setIsLoggedIn(loggedIn);
      setUsername(localStorage.getItem("username") || "");
      let avatarUrl = localStorage.getItem("avatar");
      if (loggedIn) {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get("https://localhost:5000/api/Profile/my-profile", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const profile = await res.json();
            const userAvatar = profile.avatar;
            avatarUrl = userAvatar?.startsWith("https")
              ? userAvatar
              : userAvatar
              ? `https://localhost:5000/${userAvatar.startsWith("/") ? userAvatar.slice(1) : userAvatar}`
              : "https://localhost:5000/profile/default.jpg";
            localStorage.setItem("avatar", avatarUrl);
            window.dispatchEvent(new Event("avatar-updated"));
          }
        } catch {
          // fallback localStorage nếu lỗi
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          const userAvatar = user?.avatar;
          avatarUrl = userAvatar?.startsWith("https")
            ? userAvatar
            : userAvatar
            ? `https://localhost:5000/${userAvatar.startsWith("/") ? userAvatar.slice(1) : userAvatar}`
            : "https://localhost:5000/profile/default.jpg";
        }
      } else {
        avatarUrl = "https://localhost:5000/profile/default.jpg";
      }
      setAvatar(avatarUrl || "https://localhost:5000/profile/default.jpg");
    };
    updateAuthState();
    const handleStorageChange = () => updateAuthState();
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("avatar-updated", updateAuthState);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("avatar-updated", updateAuthState);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("name");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/homepage");
  };

  // Lấy role từ localStorage để xác định loại tài khoản
  const role = localStorage.getItem("role");

  return (
    <div className="header-component">
      <Link to="/homepage" className="logo-component">
        <img src={logo} alt="Logo" />
      </Link>

      <div className="navbar-component">
        <Link to="/homepage">Trang chủ</Link>
        <a href="/bloglist">Bài viết</a>
        <a href="/courselist">Khóa học</a>
        {/* Hiển thị 2 link này chỉ khi đã login và role là Pupil */}
        {isLoggedIn && role === "Pupil" && (
          <>
            <a href="/course-complete">Khóa học của tôi</a>
            <a href="/completed-courses">Khóa học đã hoàn thành</a>
          </>
        )}
      </div>

      <div className="auth-buttons-component">
        {!isLoggedIn ? (
          <>
            <Link to="/login">
              <button>👤 Đăng nhập</button>
            </Link>
            <Link to="/register">
              <button>🧑‍💻 Đăng ký</button>
            </Link>
          </>
        ) : (
          <>
            <span style={{ marginRight: "12px" }}>👋 Xin chào, {username}</span>
            <Link to="/profile" className="profile-icon-component" title="Hồ sơ">
              <img
                src={avatar}
                alt="Profile"
                style={{
                  width: "28px",
                  height: "28px",
                  marginRight: "12px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  cursor: "pointer",
                }}
                onError={(e) => (e.target.src = "https://localhost:5000/profile/default.jpg")}
              />
            </Link>
            <button onClick={handleLogout}>Đăng xuất</button>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;