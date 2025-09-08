import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, Users, BarChart3, LogOut, ClipboardList } from 'lucide-react';
import "../css/manager/ManagerCourseList.css"; // Sử dụng chung CSS với ManagerCourseList
// ...existing code...

const ManagerSidebar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("https://localhost:5000/profile/default.jpg");
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
          const res = await fetch("https://localhost:5000/api/Profile/my-profile", {
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
    setIsLoggedIn(false);
    setUsername("");
    setAvatar("https://localhost:5000/profile/default.jpg");
    localStorage.removeItem("avatar");
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="sidebar-courselist-manager">
      <div className="logo-courselist-manager">
        <div className="logo-content-courselist-manager">
          <div className="logo-icon-courselist-manager">📚</div>
          <div className="logo-text-courselist-manager">
            <h1>EduPlatform</h1>
            <p>Nền tảng học tập</p>
          </div>
        </div>
      </div>
      <nav className="nav-menu-courselist-manager">
        <button
          className="nav-item-courselist-manager"
          onClick={() => navigate("/managercourselist")}
        >
          <BookOpen size={18} />
          Quản lý khóa học
        </button>

        <button
          className="nav-item-courselist-manager"
          onClick={() => navigate("/managerReport")}
        >
          <ClipboardList size={18} />
          Đề xuất
        </button>

        <button
          className="nav-item-courselist-manager"
          onClick={() => navigate("/macourselist")}
        >
          <BarChart3 size={18} />
        Nội dung khóa học
        </button>
        
        <button
          className="nav-item-courselist-manager"
          onClick={() => navigate("/profile")}
        >
          <Users size={18} />
        Thông tin cá nhân
        </button>
      </nav>
      <div className="user-section-courselist-manager">
        {isLoggedIn ? (
          <>
            <div className="user-info-courselist-manager">
              <Link to="/profile" title="Hồ sơ quản lý">
                <img
                  src={avatar}
                  alt="Manager Profile"
                  style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', marginRight: 10, cursor: 'pointer' }}
                  onError={e => (e.target.src = "https://localhost:5000/profile/default.jpg")}
                />
              </Link>
              <div className="user-details-courselist-manager">
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{username}</h3>
                <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>Quản lý</p>
              </div>
            </div>
            <button className="logout-btn-courselist-manager" onClick={handleLogout}><LogOut size={16} />Đăng xuất</button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <Link to="/login">
              <button className="logout-btn-courselist-manager" style={{ background: '#3b82f6', color: '#fff' }}>👤 Đăng nhập</button>
            </Link>
            <Link to="/register">
              <button className="logout-btn-courselist-manager" style={{ background: '#10b981', color: '#fff' }}>🧑‍💼 Đăng ký</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerSidebar;