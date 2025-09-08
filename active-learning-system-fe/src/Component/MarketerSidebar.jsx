import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import '../css/mkt/marketingcourselist.css';

const sidebarItems = [
    { id: 'assigned', label: 'Khóa học', icon: '🎓', path: '/macourselist' },
    { id: 'suggest', label: 'Đề xuất', icon: '📋', path: '/managerreport' },
    { id: 'stats', label: 'Quản lý bài viết', icon: '📊', path: '/marketerblog' },
    { id: 'feedback', label: 'Thống kê', icon: '💬', path: '/feedback-mrk' },
    { id: 'stat', label: 'Thông tin cá nhân', icon: '🪪', path: '/profile' }
];

const MarketerSidebar = ({ activeSidebar, setActiveSidebar }) => {
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
        <aside className="sidebar-marketing">
            <div className="logo-marketing">
                <span role="img" aria-label="logo" style={{ fontSize: 28 }}>🎓</span>
                <div>
                    <h2>EduPlatform</h2>
                    <p>Nền tảng học tập</p>
                </div>
            </div>
            <nav className="nav-marketing">
                {sidebarItems.map(item => (
                    <button
                        key={item.id}
                        className="nav-item-marketing"
                        onClick={() => {
                            navigate(item.path);
                        }}
                    >
                        <span className="nav-icon-marketing">{item.icon}</span> {item.label}
                    </button>
                ))}
            </nav>

            <div className="user-section-marketing">
                {isLoggedIn ? (
                    <>
                        <div className="user-info-marketing">
                            <Link to="/profile" title="Hồ sơ marketing">
                                <img
                                    src={avatar}
                                    alt="Marketer Profile"
                                    className="user-avatar-marketing"
                                    style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', marginRight: 10, cursor: 'pointer' }}
                                    onError={e => (e.target.src = "https://localhost:5000/profile/default.jpg")}
                                />
                            </Link>
                            <div className="user-details-courselist-manager">
                                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{username}</h3>
                                <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>Marketer</p>
                            </div>
                        </div>
                        <button className="logout-btn-marketing" onClick={handleLogout}>Đăng xuất</button>
                    </>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                        <Link to="/login">
                            <button className="logout-btn-marketing" style={{ background: '#3b82f6', color: '#fff' }}>👤 Đăng nhập</button>
                        </Link>
                        <Link to="/register">
                            <button className="logout-btn-marketing" style={{ background: '#10b981', color: '#fff' }}>🧑‍💼 Đăng ký</button>
                        </Link>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default MarketerSidebar;
