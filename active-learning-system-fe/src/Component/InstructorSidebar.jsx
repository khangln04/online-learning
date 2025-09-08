import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import logo from "../css/icon/favicon11.png";
import bookmarkIcon from "../css/icon/bookmark.png";
import '../css/instructor/instructorSidebar.css';

const InstructorSidebar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [name, setName] = useState("");
    const [avatar, setAvatar] = useState("https://localhost:5000/profile/default.jpg");
    const navigate = useNavigate();

    useEffect(() => {
        const updateAuthState = async () => {
            const loggedIn = localStorage.getItem("isLoggedIn") === "true";
            setIsLoggedIn(loggedIn);
            if (loggedIn) {
                try {
                    const token = localStorage.getItem("token");
                    const res = await axios.get("https://localhost:5000/api/Profile/my-profile", {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const profile = res.data;
                    setName(profile.name || "");
                    localStorage.setItem("name", profile.name || "");
                    // Ưu tiên lấy avatar từ localStorage nếu có
                    let avatarUrl = localStorage.getItem("avatar");
                    if (!avatarUrl) {
                        const userAvatar = profile.avatar;
                        avatarUrl = userAvatar?.startsWith("https")
                            ? userAvatar
                            : userAvatar
                            ? `https://localhost:5000/${userAvatar.startsWith("/") ? userAvatar.slice(1) : userAvatar}`
                            : "https://localhost:5000/profile/default.jpg";
                    }
                    setAvatar(avatarUrl || "https://localhost:5000/profile/default.jpg");
                } catch (err) {
                    // fallback localStorage nếu lỗi
                    const user = JSON.parse(localStorage.getItem("user") || "{}")
                    setName(user?.name || localStorage.getItem("name") || "");
                    let avatarUrl = localStorage.getItem("avatar");
                    if (!avatarUrl) {
                        const userAvatar = user?.avatar;
                        avatarUrl = userAvatar?.startsWith("https")
                            ? userAvatar
                            : userAvatar
                            ? `https://localhost:5000/${userAvatar.startsWith("/") ? userAvatar.slice(1) : userAvatar}`
                            : "https://localhost:5000/profile/default.jpg";
                    }
                    setAvatar(avatarUrl || "https://localhost:5000/profile/default.jpg");
                }
            } else {
                setName("");
                setAvatar("https://localhost:5000/profile/default.jpg");
            }
        };
        updateAuthState();
        const handleStorageChange = () => updateAuthState();
        const handleAvatarUpdated = () => {
            // Lấy avatar mới nhất từ localStorage và cập nhật ngay
            setAvatar(localStorage.getItem("avatar") || "https://localhost:5000/profile/default.jpg");
        };
        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("avatar-updated", handleAvatarUpdated);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("avatar-updated", handleAvatarUpdated);
        };
    }, []);

    const handleLogout = () => {
        setIsLoggedIn(false);
        setName("");
        setAvatar("https://localhost:5000/profile/default.jpg");
        localStorage.removeItem("avatar");
        localStorage.clear();
        navigate("/login");
    };

    return (
        <aside className="sidebar-instructor" style={{ minWidth: 220, background: '#222', color: '#fff', height: '96vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', padding: 16 }}>
                    <img src={logo} alt="logo" style={{ width: 36, height: 36, marginRight: 8 }} />
                    <span style={{ fontWeight: 700, fontSize: 18 }}>Giảng viên</span>
                </div>
                <nav className="nav-instructor" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px' }}>
                    <Link to="/instructor-courselist" className="nav-item-instructor" style={{ color: '#fff', textDecoration: 'none', padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={bookmarkIcon} alt="" style={{ width: 18, height: 18 }} />
                        <span>Khóa học</span>
                    </Link>
                     <Link to="/macourselist" className="nav-item-instructor" style={{ color: '#fff', textDecoration: 'none', padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={bookmarkIcon} alt="" style={{ width: 18, height: 18 }} />
                        <span>Nội dung khóa học</span>
                    </Link>
                    <Link to="/managerreport" className="nav-item-instructor" style={{ color: '#fff', textDecoration: 'none', padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={bookmarkIcon} alt="" style={{ width: 18, height: 18 }} />
                        <span>Đề xuất</span>
                    </Link>
                    <Link to="/managetopicpage" className="nav-item-instructor" style={{ color: '#fff', textDecoration: 'none', padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={bookmarkIcon} alt="" style={{ width: 18, height: 18 }} />
                        <span>Quản lý các chủ đề</span>
                    </Link>
                    <Link to="/instructor/questions" className="nav-item-instructor" style={{ color: '#fff', textDecoration: 'none', padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={bookmarkIcon} alt="" style={{ width: 18, height: 18 }} />
                        <span>Quản lý câu hỏi</span>
                    </Link>
                    
                    <Link to="/profile" className="nav-item-instructor" style={{ color: '#fff', textDecoration: 'none', padding: '8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={bookmarkIcon} alt="" style={{ width: 18, height: 18 }} />
                        <span>Thông tin cá nhân</span>
                    </Link>

                </nav>
            </div>
            <div style={{ padding: 16, borderTop: '1px solid #333', display: 'flex', alignItems: 'center', gap: 12 }}>
                {isLoggedIn ? (
                    <>
                        <Link to="/profile" title="Hồ sơ quản lý">
                            <img
                                src={avatar}
                                alt="Manager Profile"
                                style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff' }}
                                onError={e => (e.target.src = "https://localhost:5000/profile/default.jpg")}
                            />
                        </Link>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, fontSize: 15 }}> {name || 'Giảng viên'}</div>
                            <div style={{ fontSize: 13, color: '#aaa' }}>Giảng viên</div>
                        </div>
                        <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 500 }}>Đăng xuất</button>
                    </>
                ) : (
                    <>
                        <Link to="/login">
                            <button style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', marginRight: 8, cursor: 'pointer', fontWeight: 500 }}>👤 Đăng nhập</button>
                        </Link>
                        <Link to="/register">
                            <button style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontWeight: 500 }}>🧑‍💼 Đăng ký</button>
                        </Link>
                    </>
                )}
            </div>
        </aside>
    );
};

export default InstructorSidebar;