// File: Profile.jsx
import React, { useEffect, useState } from "react";
import aiIcon from "../css/icon/AI.png";
import "../css/page/homepage.css";
// import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import ManagerSidebar from "../Component/ManagerSidebar";
import MarketerSidebar from "../Component/MarketerSidebar";
import InstructorSidebar from "../Component/InstructorSidebar";
import "../css/page/profile.css";
import ChangePassword from "./Changepassword";
import PaidHistory from "../parent/PaidHistory";
import UnpaidHistory from "../parent/UnpaidHistory";
import axios from "axios";
import {
  FaBookOpen,
  FaEdit,
  FaLock,
  FaCreditCard
} from "react-icons/fa";
import {
  fetchUserProfile,
  getMyCourses,
  linkAccount,
  updateMyProfile,
} from "../js/profileApi";

const Profile = () => {
  const [showCourse, setShowCourse] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("edit");
  // ...existing code...
  const [user, setUser] = useState({});
  const [role, setRole] = useState(null);
  const [linkEmail, setLinkEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    Name: "",
    Address: "",
    Dob: "",
    Sex: "",
    Phone: "",
  });
  const token = localStorage.getItem("token");
  // State for parent's children courses
  const [childrenCourses, setChildrenCourses] = useState([]);
  // Pagination state for completed courses
  const [currentPage, setCurrentPage] = useState(1);

  // Get today's date in YYYY-MM-DD format for max attribute
  const today = new Date().toISOString().split("T")[0];

  /** ================= LẤY THÔNG TIN HỒ SƠ ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Token từ localStorage:", token);

    if (!token) {
      setError("Vui lòng đăng nhập để xem thông tin!");
      setTimeout(() => setError(""), 4000);
      navigate("/login");
      return;
    }

    const savedRole = localStorage.getItem("role");
    if (savedRole) {
      setRole(savedRole);
      console.log("✅ Role trong localStorage:", savedRole);
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("Đang lấy thông tin hồ sơ...");
        const data = await fetchUserProfile();
        console.log("Dữ liệu hồ sơ nhận được:", data);
        setUser(data);
        setProfileForm({
          Name: data.name || "",
          Address: data.address || "",
          Dob: data.dob ? new Date(data.dob).toISOString().split("T")[0] : "",
          Sex: data.sex || "",
          Phone: data.phone || "",
        });
        setError("");
      } catch (err) {
        console.error("Lỗi khi lấy hồ sơ:", err);
  setError(err.message || "Không thể kết nối đến server.");
  setTimeout(() => setError(""), 4000);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  /** ================= LẤY DỮ LIỆU KHÓA HỌC CON (PARENT) ================= */
  useEffect(() => {
    const fetchChildrenCourses = async () => {
      if (role === "Parent") {
        setLoading(true);
        // Không setError khi không có khóa học, chỉ setError khi thực sự có lỗi kết nối hoặc lỗi server
        try {
          const token = localStorage.getItem("token");
          let url = "";
          if (activeTab === "courses") {
            url = "https://localhost:5000/api/Parent/MyChildrenCourses";
          } else if (activeTab === "completecourses") {
            url = "https://localhost:5000/api/Parent/MyChildrenCompleteCourses";
          } else {
            setChildrenCourses([]);
            setLoading(false);
            return;
          }
          const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
          setChildrenCourses(res.data || []);
          setError(""); // reset error nếu call API thành công
        } catch (err) {
          setChildrenCourses([]);
          // Chỉ setError nếu là lỗi mạng hoặc lỗi server
          if (err?.response?.status >= 500 || err?.message?.includes("Network")) {
            setError("Không thể kết nối đến server.");
            setTimeout(() => setError(""), 4000);
          } else {
            setError(""); // Không setError nếu chỉ là không có khóa học
          }
        } finally {
          setLoading(false);
        }
      }
    };
    fetchChildrenCourses();
  }, [activeTab, role]);

  /** ================= XỬ LÝ ROLE CHANGE ================= */
  useEffect(() => {
    if (role && role !== "Pupil" && user.roleName !== "Parent" &&
      !["edit", "changepassword", "paidhistory", "unpaidhistory"].includes(activeTab)) {
      setActiveTab("edit");
    }
  }, [role, activeTab, user.roleName]);

  /** ================= XỬ LÝ SỰ KIỆN ================= */
  const handleLinkAccount = async () => {
    if (!linkEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(linkEmail)) {
  setError("Vui lòng nhập email hợp lệ!");
  setTimeout(() => setError(""), 4000);
  return;
    }
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const isLinkedEmail =
        (user.roleName === "Pupil" && user.linkedParentEmail === linkEmail) ||
        (user.roleName === "Parent" && user.linkedChildrenEmails?.includes(linkEmail));
      if (isLinkedEmail) {
  setError("Tài khoản đã tồn tại liên kết!");
  setTimeout(() => setError(""), 4000);
  return;
      }

  await linkAccount(linkEmail);
  setSuccessMessage("Liên kết tài khoản thành công!");
      setTimeout(() => setSuccessMessage(""), 3000);
      setLinkEmail("");
      const updatedProfile = await fetchUserProfile();
      if (updatedProfile) {
        setUser(updatedProfile);
        localStorage.setItem("username", updatedProfile.name || "");
        window.dispatchEvent(new Event("storage"));
      }
    } catch (err) {
      if (err.message?.includes("đã được liên kết") || err.message?.includes("exist") || err.message?.includes("already linked")) {
        setError("Tài khoản đã tồn tại liên kết!");
        setTimeout(() => setError(""), 4000);
      } else {
        setError(err.message || "Liên kết tài khoản thất bại!");
        setTimeout(() => setError(""), 4000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Kiểm tra đuôi file ảnh hợp lệ
    const allowedExtensions = [
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'apng', 'avif', 'ico', 'tif', 'tiff', 'xbm', 'pjp', 'pjpeg', 'heif', 'heic', 'jiff', 'svgz'
    ];
    const fileName = file.name || '';
    const ext = fileName.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
  setError('File ảnh không hợp lệ!');
  setTimeout(() => setError(""), 4000);
  e.target.value = null;
  return;
    }
    if (!file) return; 
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      if (!(file instanceof File)) {
        throw new Error("File ảnh không hợp lệ!");
      }
      await updateMyProfile(profileForm, file);
      const updatedProfile = await fetchUserProfile();
      if (updatedProfile) {
        let avatarUrl = updatedProfile.avatar?.startsWith("https")
          ? updatedProfile.avatar
          : updatedProfile.avatar
          ? `https://localhost:5000/${updatedProfile.avatar.startsWith("/") ? updatedProfile.avatar.slice(1) : updatedProfile.avatar}`
          : "https://localhost:5000/profile/default.jpg";
        localStorage.setItem("avatar", avatarUrl);
        window.dispatchEvent(new Event("avatar-updated"));
      }
      setSuccessMessage("Cập nhật ảnh đại diện thành công!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
  setError(err.message || "Cập nhật ảnh đại diện thất bại! Vui lòng kiểm tra server hoặc file.");
  setTimeout(() => setError(""), 4000);
    } finally {
      setLoading(false);
      e.target.value = null;
    }
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.Name || !profileForm.Address || !profileForm.Phone || !profileForm.Sex) {
  setError("Tên, địa chỉ, số điện thoại và giới tính không được để trống!");
  setTimeout(() => setError(""), 4000);
  return;
    }
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      await updateMyProfile(profileForm, null);
      const updatedProfile = await fetchUserProfile();
      if (updatedProfile) {
        setUser(updatedProfile);
        localStorage.setItem("username", updatedProfile.name || "");
        window.dispatchEvent(new Event("storage"));
      }
      setSuccessMessage("Cập nhật hồ sơ thành công!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
  setError(err.message || "Cập nhật hồ sơ thất bại!");
  setTimeout(() => setError(""), 4000);
    } finally {
      setLoading(false);
    }
  };

  /** ================= HÀM HỖ TRỢ ================= */
  const getImageUrl = (path) => {
    // Ưu tiên lấy avatar mới nhất từ localStorage (nếu có)
    let avatarUrl = localStorage.getItem("avatar");
    if (avatarUrl) return avatarUrl;
    if (!path || path.includes("pic2.jpg")) return "https://localhost:5000/profile/default.jpg";
    return `https://localhost:5000${path.startsWith("/") ? "" : "/"}${path}`;
  };

  // Lắng nghe event avatar-updated để cập nhật lại user.avatar khi đổi ảnh
  useEffect(() => {
    const handleAvatarUpdated = () => {
      setUser((prev) => ({ ...prev, avatar: localStorage.getItem("avatar") }));
    };
    window.addEventListener("avatar-updated", handleAvatarUpdated);
    return () => {
      window.removeEventListener("avatar-updated", handleAvatarUpdated);
    };
  }, []);

  /** ================= HIỂN THỊ NỘI DUNG ================= */
  const renderContent = () => {
    if (loading) return <div className="rm-loading">Đang tải...</div>;
    if (error) {
      return (
        <div className="rm-dashboard-content">
          <p className="rm-error-message">{error}</p>
        </div>
      );
    }

    switch (activeTab) {
      case "courses":
        if (role !== "Parent") return <div className="rm-dashboard-content">Không có quyền truy cập.</div>;
        // Kiểm tra có học sinh nào có khóa học chưa hoàn thành không
        const hasOngoing = Array.isArray(childrenCourses) && childrenCourses.some(child => Array.isArray(child.courses) && child.courses.some(c => c.statusName === 'Đang học'));
        return (
          <div className="rm-dashboard-content">
            <h2>Khóa học của học sinh</h2>
            {hasOngoing ? (
              <div>
                {childrenCourses.map(child => (
                  <div key={child.pupilUserId} style={{marginBottom: 32}}>
                    <div style={{display: 'flex', alignItems: 'center', marginBottom: 16}}>
                      <img src={child.avatar?.startsWith('http') ? child.avatar : `https://localhost:5000${child.avatar}`} alt="avatar" style={{width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', marginRight: 18, border: '2px solid #e5e7eb'}} />
                      <b style={{fontSize: 18}}>{child.pupilName}</b>
                    </div>
                    {Array.isArray(child.courses) && child.courses.filter(c => c.statusName === 'Đang học').length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
                        {child.courses.filter(course => course.statusName === 'Đang học').map((course, idx) => (
                          <div key={course.courseId || idx} className="course-checkprogress-pupil">
                            <div className="course-checkprogress-pupil-imgbox">
                              <img src={course.image?.startsWith('http') ? course.image : `https://localhost:5000${course.image || ''}`} alt="course" className="course-checkprogress-pupil-img" />
                              <span className="course-checkprogress-pupil-status">Đang học</span>
                            </div>
                            <div className="course-checkprogress-pupil-content">
                              <div className="course-checkprogress-pupil-title">{course.courseName}</div>
                              <div className="course-checkprogress-pupil-meta">
                                <div><span role="img" aria-label="calendar">📅</span> Ngày bắt đầu: {course.startDate}</div>
                                <div><span role="img" aria-label="clock">⏰</span> Truy cập cuối: {course.lastAccess || 'Chưa truy cập'}</div>
                                <div><span role="img" aria-label="user">👤</span> Học sinh: {child.pupilName}</div>
                              </div>
                              <div className="course-checkprogress-pupil-action">
                                <button
                                  className="course-checkprogress-pupil-btn"
                                  onClick={() => navigate(`/parent-progress/${course.studentCourseId || course.courseStudentId}`)}
                                >
                                  Xem chi tiết
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{color: '#888'}}>Chưa có khóa học nào.</div>
            )}
          </div>
        );
      case "completecourses":
        if (role !== "Parent") return <div className="rm-dashboard-content">Không có quyền truy cập.</div>;
        const pageSize = 6;
        // Flatten all completed courses for all children
        const completedCourses = Array.isArray(childrenCourses)
          ? childrenCourses.flatMap(child =>
              (child.courses || [])
                .filter(course => course.statusName === "Đã hoàn thành")
                .map(course => ({ ...course, pupilName: child.pupilName, pupilUserId: child.pupilUserId, avatar: child.avatar }))
            )
          : [];
        const totalPages = Math.ceil(completedCourses.length / pageSize);
        const paginatedCourses = completedCourses.slice((currentPage - 1) * pageSize, currentPage * pageSize);
        return (
          <div className="rm-dashboard-content">
            <h2>Khóa học đã hoàn thành của học sinh</h2>
            {paginatedCourses.length > 0 ? (
              <div>
                {/* Group by pupilUserId to show avatar and name for each child */}
                {(() => {
                  // Group courses by pupilUserId
                  const grouped = {};
                  paginatedCourses.forEach(course => {
                    if (!grouped[course.pupilUserId]) grouped[course.pupilUserId] = { pupilName: course.pupilName, avatar: course.avatar, courses: [] };
                    grouped[course.pupilUserId].courses.push(course);
                  });
                  return Object.values(grouped).map((child, i) => (
                    <div key={child.pupilUserId || i} style={{marginBottom: 32}}>
                      <div style={{display: 'flex', alignItems: 'center', marginBottom: 16}}>
                        <img src={child.avatar?.startsWith('http') ? child.avatar : `https://localhost:5000${child.avatar}`} alt="avatar" style={{width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', marginRight: 18, border: '2px solid #e5e7eb'}} />
                        <b style={{fontSize: 18}}>{child.pupilName}</b>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
                        {child.courses.map((course, idx) => (
                          <div key={course.courseId || idx} className="course-checkprogress-pupil">
                            <div className="course-checkprogress-pupil-imgbox">
                              <img src={course.image?.startsWith('http') ? course.image : `https://localhost:5000${course.image || ''}`} alt="course" className="course-checkprogress-pupil-img" />
                              <span className="course-checkprogress-pupil-status course-checkprogress-pupil-status-complete">Đã hoàn thành</span>
                            </div>
                            <div className="course-checkprogress-pupil-content">
                              <div className="course-checkprogress-pupil-title">{course.courseName}</div>
                              <div className="course-checkprogress-pupil-meta">
                                <div><span role="img" aria-label="calendar">📅</span> Ngày bắt đầu: {course.startDate}</div>
                                <div><span role="img" aria-label="clock">⏰</span> Truy cập cuối: {course.lastAccess || 'Chưa truy cập'}</div>
                                <div><span role="img" aria-label="user">👤</span> Học sinh: {course.pupilName}</div>
                              </div>
                              <div className="course-checkprogress-pupil-action">
                                <button
                                  className="course-checkprogress-pupil-btn"
                                  onClick={() => navigate(`/parent-progress/${course.studentCourseId || course.courseStudentId}`)}
                                >
                                  Xem chi tiết
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div style={{ color: '#888' }}>Chưa có khóa học đã hoàn thành.</div>
            )}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e5e7eb', background: currentPage === 1 ? '#f1f5f9' : '#fff', color: '#2563eb', fontWeight: 600, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>Trước</button>
                <span style={{ alignSelf: 'center', fontWeight: 500, color: '#64748b' }}>{currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e5e7eb', background: currentPage === totalPages ? '#f1f5f9' : '#fff', color: '#2563eb', fontWeight: 600, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>Sau</button>
              </div>
            )}
          </div>
        );
      case "password":
        if (role !== "Pupil" && user.roleName !== "Parent") return <div className="rm-dashboard-content">Không có quyền truy cập.</div>;
        const isLinked =
          (user.roleName === "Pupil" && user.linkedParentEmail) ||
          (user.roleName === "Parent" && user.linkedChildrenEmails && user.linkedChildrenEmails.length > 0);

        const currentEmailLabel = user.roleName === "Pupil" ? "Email của học sinh" : "Email của phụ huynh";
        const linkedEmailLabel = user.roleName === "Pupil" ? "Email của phụ huynh" : "Email của học sinh";
        const linkedEmailDisplay = user.roleName === "Pupil"
          ? user.linkedParentEmail || "Chưa liên kết phụ huynh"
          : user.roleName === "Parent"
            ? user.linkedChildrenEmails?.join(", ") || "Chưa liên kết học sinh"
            : "Không xác định";

        const placeholderText = user.roleName === "Pupil"
          ? "Nhập email phụ huynh để liên kết"
          : "Nhập email học sinh để liên kết";

        return (
          <div className="rm-dashboard-content">
            <h2>LIÊN KẾT TÀI KHOẢN</h2>
            <div className="rm-link-account-section">
              <p><strong>{currentEmailLabel}:</strong> {user.email || "Chưa có email"}</p>
              <p><strong>{linkedEmailLabel}:</strong> {linkedEmailDisplay}</p>
              {!isLinked && (
                <>
                  <input
                    type="email"
                    value={linkEmail}
                    onChange={(e) => setLinkEmail(e.target.value)}
                    placeholder={placeholderText}
                    className="rm-form-input"
                    disabled={loading}
                  />
                  {error && <p className="rm-error-message">{error}</p>}
                  {successMessage && <p className="rm-report-success-message">{successMessage}</p>}
                  <button
                    onClick={handleLinkAccount}
                    className="rm-submit-btn"
                    disabled={loading || !linkEmail}
                  >
                    {loading ? "Đang xử lý..." : "Liên kết"}
                  </button>
                </>
              )}
              {isLinked && <p className="rm-report-success-message">Tài khoản đã được liên kết!</p>}
            </div>
          </div>
        );
      case "paidhistory":
        if (user.roleName !== "Parent") return <div className="rm-dashboard-content">Không có quyền truy cập.</div>;
        return (
          <div className="rm-dashboard-content">
            <h2>Lịch sử thanh toán</h2>
            <PaidHistory />
          </div>
        );
      case "unpaidhistory":
        if (user.roleName !== "Parent") return <div className="rm-dashboard-content">Không có quyền truy cập.</div>;
        return (
          <div className="rm-dashboard-content">
            <h2>Khoá học chưa thanh toán</h2>
            <UnpaidHistory />
          </div>
        );
      case "edit":
        return (
          <div className="rm-dashboard-content">
            <h2>CHỈNH SỬA HỒ SƠ</h2>
            <div className="rm-profile-form">
              <div className="rm-form-group">
                <label className="rm-form-label">Tên:</label>
                <input
                  type="text"
                  name="Name"
                  value={profileForm.Name}
                  onChange={handleProfileChange}
                  placeholder="Nhập tên"
                  className="rm-form-input"
                  disabled={loading}
                />
              </div>
              <div className="rm-form-group">
                <label className="rm-form-label">Địa chỉ:</label>
                <input
                  type="text"
                  name="Address"
                  value={profileForm.Address}
                  onChange={handleProfileChange}
                  placeholder="Nhập địa chỉ"
                  className="rm-form-input"
                  disabled={loading}
                />
              </div>
              <div className="rm-form-group">
                <label className="rm-form-label">Ngày sinh:</label>
                <input
                  type="date"
                  name="Dob"
                  value={profileForm.Dob}
                  onChange={handleProfileChange}
                  className="rm-form-input"
                  disabled={loading}
                  max={today}
                />
              </div>
              <div className="rm-form-group">
                <label className="rm-form-label">Giới tính:</label>
                <select
                  name="Sex"
                  value={profileForm.Sex}
                  onChange={handleProfileChange}
                  className="rm-form-input"
                  disabled={loading}
                >
                  <option value="" disabled>Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
              <div className="rm-form-group">
                <label className="rm-form-label">Số điện thoại:</label>
                <input
                  type="tel"
                  name="Phone"
                  value={profileForm.Phone}
                  onChange={handleProfileChange}
                  placeholder="Nhập số điện thoại"
                  className="rm-form-input"
                  disabled={loading}
                />
              </div>
              {error && <p className="rm-error-message">{error}</p>}
              {successMessage && <p className="rm-report-success-message">{successMessage}</p>}
              <div className="rm-form-actions">
                <button
                  onClick={handleUpdateProfile}
                  className="rm-submit-btn"
                  disabled={loading}
                  style={{ padding: "10px 20px", width: "auto" }}
                >
                  {loading ? "Đang xử lý..." : "Cập nhật"}
                </button>
              </div>
            </div>
          </div>
        );
      case "changepassword":
        return (
          <div className="rm-dashboard-content">
            <h2>ĐỔI MẬT KHẨU</h2>
            <ChangePassword />
          </div>
        );
      default:
        return (
          <div className="rm-dashboard-content">
            <h2>CHỈNH SỬA HỒ SƠ</h2>
            <p>Chọn một mục từ menu bên trái.</p>
          </div>
        );
    }
  };

  return (
    <>
      {(role === "Pupil" || role === "Parent") && <Header />}
      <div className="rm-report-manager-page">
        {role === "Manager" && <ManagerSidebar />}
        {role === "Marketer" && <MarketerSidebar />}
        {role === "Instructor" && <InstructorSidebar />}
        {(role === "Pupil" || role === "Parent" || role === "Manager" || role === "Marketer" || role === "Instructor") && (
          <aside className="rm-sidebar">
            <div className="profile-img-container">
              <img
                src={getImageUrl(user.avatar)}
                alt="Ảnh người dùng"
                className="profile-img"
              />
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
                disabled={loading}
              />
              <label htmlFor="avatar-upload" className="choose-file-btn">
                Chọn file
              </label>
            </div>
            <h3>{user.name || localStorage.getItem("username") || "Chưa xác định"}</h3>
            <p>{user.email || "Chưa có email"}</p>
            <nav className="rm-menu">
              {role === "Parent" && (
                <>
                  <div onClick={() => setShowCourse(!showCourse)} className="rm-menu-item">
                    <FaBookOpen size={16} /> Khóa học của học sinh
                  </div>
                  {showCourse && (
                    <>
                      <div
                        className={`rm-menu-sub-item ${activeTab === "courses" ? "rm-active" : ""}`}
                        onClick={() => setActiveTab("courses")}
                      >
                        • Khóa học chưa hoàn thành
                      </div>
                      <div
                        className={`rm-menu-sub-item ${activeTab === "completecourses" ? "rm-active" : ""}`}
                        onClick={() => setActiveTab("completecourses")}
                      >
                        • Khóa học đã hoàn thành
                      </div>
                    </>
                  )}
                </>
              )}
              <div
                className={`rm-menu-item ${activeTab === "edit" ? "rm-active" : ""}`}
                onClick={() => setActiveTab("edit")}
              >
                <FaEdit size={16} /> Chỉnh sửa hồ sơ
              </div>
              {(role === "Pupil" || user.roleName === "Parent") && (
                <div
                  className={`rm-menu-item ${activeTab === "password" ? "rm-active" : ""}`}
                  onClick={() => setActiveTab("password")}
                >
                  <FaLock size={16} /> Liên kết tài khoản
                </div>
              )}
              {user.roleName === "Parent" && (
                <>
                  <div onClick={() => setShowPayment(!showPayment)} className="rm-menu-item">
                    <FaCreditCard size={16} /> Thanh toán
                  </div>
                  {showPayment && (
                    <>
                      <div
                        className={`rm-menu-sub-item ${activeTab === "paidhistory" ? "rm-active" : ""}`}
                        onClick={() => setActiveTab("paidhistory")}
                      >
                        • Lịch sử thanh toán
                      </div>
                      <div
                        className={`rm-menu-sub-item ${activeTab === "unpaidhistory" ? "rm-active" : ""}`}
                        onClick={() => setActiveTab("unpaidhistory")}
                      >
                        • Khoá học chưa thanh toán
                      </div>
                    </>
                  )}
                </>
              )}
              <div
                className={`rm-menu-item ${activeTab === "changepassword" ? "rm-active" : ""}`}
                onClick={() => setActiveTab("changepassword")}
              >
                <FaLock size={16} /> Đổi mật khẩu
              </div>
            </nav>
          </aside>
        )}
        <main className="rm-main">{renderContent()}</main>
      </div>
      {(role === "Pupil" || role === "Parent") && <>
        <ChatBubble />
        <Footer />
      </>}
    </>
  );
};


function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleInput = (e) => setInput(e.target.value);

  const sendMessage = async (msg) => {
    setMessages(msgs => [...msgs, { from: "user", text: msg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await axios.post("https://localhost:5000/api/Chat", { message: msg });
      setMessages(msgs => [...msgs, { from: "bot", text: res.data.reply }]);
    } catch (err) {
      setMessages(msgs => [...msgs, { from: "bot", text: "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau." }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && input.trim() && !loading) {
      sendMessage(input.trim());
    }
  };

  return (
    <>
      <div className="chat-bubble-btn" onClick={() => setOpen(o => !o)} title="Bạn cần hỗ trợ? Chat với AI!">
        <img src={aiIcon} alt="AI Chat" className="chat-bubble-btn-img" />
      </div>
      {open && (
        <div className="chat-bubble-window chat-bubble-window-left">
          <div className="chat-bubble-window-header">
           AI ChatBot
            <button className="chat-bubble-close" onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="chat-bubble-window-body">
            <div className="chat-bubble-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={msg.from === 'user' ? 'chat-msg-user' : 'chat-msg-bot'}>
                  <span className="chat-msg-text">{msg.text}</span>
                </div>
              ))}
              {loading && (
                <div className="chat-msg-bot chat-msg-loading">Đang trả lời...</div>
              )}
            </div>
            <div className="chat-bubble-input-row">
              <input
                className="chat-bubble-input"
                type="text"
                placeholder="Nhập tin nhắn..."
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                autoFocus
                disabled={loading}
              />
              <button
                className="chat-bubble-send-btn"
                onClick={() => {
                  if (input.trim() && !loading) {
                    sendMessage(input.trim());
                  }
                }}
                disabled={!input.trim() || loading}
                tabIndex={0}
              >Gửi</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Profile;