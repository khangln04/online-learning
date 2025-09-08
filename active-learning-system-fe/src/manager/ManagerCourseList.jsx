import React, { useEffect, useState, useCallback } from "react"; // Added useCallback
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getCourses, updateCourse, setCourseStatus, createCourse, getCourseDetail, getCategories, getClasses } from "../js/manager/managercourlist";
import "../css/manager/ManagerCourseList.css";
import { resolveImageUrl } from "../js/homepageApi";
import { BookOpen, Users, BarChart3, Settings, LogOut, Eye, Trash2, Menu, Pencil,Lock } from 'lucide-react';
import ManagerSidebar from "../Component/ManagerSidebar"; // Import ManagerSidebar

const API_BASE_URL = "https://localhost:5000/api/manager/course";

const formatDate = (dateString) => {
  if (!dateString) return "Chưa cập nhật";
  try {
    const date = new Date(dateString);
    if (isNaN(date)) return "Chưa cập nhật";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "Chưa cập nhật";
  }
};

const ManagerCourseList = () => {
  const [courses, setCourses] = useState([]);
  const [allCoursesStats, setAllCoursesStats] = useState({ total: 0, published: 0, hidden: 0 });
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [categories, setCategories] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [courseToToggle, setCourseToToggle] = useState(null);
  const [updateCourseData, setUpdateCourseData] = useState({
    CourseName: "",
    Description: "",
    Price: 0,
    Status: true,
    CategoryId: "",
    ClassId: "",
    Image: null,
  });
  const [addCourseData, setAddCourseData] = useState({
    CourseName: "",
    Description: "",
    Price: 0,
    Status: true,
    CategoryId: "",
    ClassId: "",
    Image: null,
  });
  const navigate = useNavigate();
  const pageSize = 5;

  // Check authentication and authorization
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (!isLoggedIn || !token) {
      navigate("/login");
      return;
    }

    if (role !== "Manager") {
      setError("Bạn không có quyền truy cập trang này.");
      setTimeout(() => navigate("/error"), 0);
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [categoryResponse, classResponse] = await Promise.all([
          getCategories(),
          getClasses(),
        ]);
        setCategories(categoryResponse || []);
        setClasses(classResponse || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách danh mục/lớp:", error);
        setError("Không thể tải danh mục hoặc lớp.");
        setTimeout(() => setError(""), 5000);
      }
    };
    fetchDropdowns();
  }, []);

  const fetchCourseDetail = async (courseId) => {
    try {
      const detail = await getCourseDetail(courseId);
      console.log("Phản hồi từ API chi tiết:", detail);
      return detail;
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết khóa học:", error);
      setError("Không thể tải chi tiết khóa học. Vui lòng thử lại.");
      setTimeout(() => setError(""), 5000);
      return null;
    }
  };

  const fetchCourses = useCallback(async () => {
    try {
      // Kiểm tra token trước khi gọi API
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Lấy tất cả khóa học cho stats
      const statsResponse = await getCourses(1, searchTerm, null, categoryFilter, 10000); // pageSize lớn để lấy hết
      const allValidStatsCourses = Array.isArray(statsResponse.courses)
        ? statsResponse.courses.filter(
            (c) =>
              c &&
              typeof c.courseId === "number" &&
              typeof c.courseName === "string" &&
              typeof c.authorName === "string" &&
              typeof c.status === "boolean"
          )
        : [];
      setAllCoursesStats({
        total: allValidStatsCourses.length,
        published: allValidStatsCourses.filter(c => c.status).length,
        hidden: allValidStatsCourses.filter(c => !c.status).length,
      });

      // Lấy khóa học cho trang hiện tại
      let allValidCourses = [];
      let page = 1;
      let backendTotalPages = 1;
      while (page <= backendTotalPages) {
        const response = await getCourses(page, searchTerm, null, categoryFilter, pageSize);
        const validCourses = Array.isArray(response.courses)
          ? response.courses.filter(
              (c) =>
                c &&
                typeof c.courseId === "number" &&
                typeof c.courseName === "string" &&
                typeof c.authorName === "string" &&
                typeof c.status === "boolean" &&
                (c.authorId === undefined || typeof c.authorId === "number") &&
                (c.categoryId === undefined || typeof c.categoryId === "number") &&
                (c.classId === undefined || typeof c.classId === "string" || typeof c.classId === "number")
            )
          : [];
        const filteredCourses = statusFilter !== ""
          ? validCourses.filter((c) => c.status === (statusFilter === "true"))
          : validCourses;
        allValidCourses = [...allValidCourses, ...filteredCourses];
        backendTotalPages = response.totalPages || 1;
        page++;
      }
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedCourses = allValidCourses.slice(startIndex, startIndex + pageSize);
      const calculatedTotalPages = Math.ceil(allValidCourses.length / pageSize) || 1;
      setCourses(paginatedCourses);
      setTotalPages(calculatedTotalPages);
      if (paginatedCourses.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error("Lỗi khi fetch courses:", error);
      setCourses([]);
      setTotalPages(1);
      setError("Không thể tải danh sách khóa học.");
      setTimeout(() => setError(""), 5000);
    }
  }, [currentPage, searchTerm, categoryFilter, statusFilter, pageSize]);

  useEffect(() => {
    fetchCourses();
  }, [currentPage, searchTerm, categoryFilter, statusFilter, fetchCourses]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput.trim());
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const openUpdateModal = (course) => {
    setSelectedCourse(course);
    setUpdateCourseData({
      CourseName: course.courseName || "",
      Description: course.description || "",
      Price: course.price || 0,
      CategoryId: course.categoryId?.toString() || "",
      ClassId: course.classId?.toString() || "",
      Image: null,
    });
    setShowUpdateModal(true);
  };

  const openAddModal = () => {
    setAddCourseData({
      CourseName: "",
      Description: "",
      Price: 0,
      Status: true,
      CategoryId: "",
      ClassId: "",
      Image: null,
    });
    setShowAddModal(true);
  };

  const openDetailModal = async (course) => {
    const detail = await fetchCourseDetail(course.courseId);
    if (detail) {
      setSelectedCourse(detail);
      setShowDetailModal(true);
    }
  };

  const handleInputChange = (e, isUpdate = true) => {
    const { name, value, files } = e.target;
    const newValue = files ? files[0] : name === "Status" ? value === "true" : value;
    if (isUpdate) {
      setUpdateCourseData((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    } else {
      setAddCourseData((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    }
    setError("");
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }

      const requiredFields = ["CourseName", "Price", "CategoryId", "Image"];
      const missingFields = requiredFields.filter(
        (field) => !addCourseData[field] || (typeof addCourseData[field] === "string" && !addCourseData[field].trim())
      );
      if (missingFields.length > 0) {
        throw new Error(`Vui lòng điền đầy đủ: ${missingFields.join(", ")}`);
      }

      const price = parseFloat(addCourseData.Price);
      if (isNaN(price) || price < 0) {
        throw new Error("Giá khóa học phải là số không âm.");
      }

      const categoryId = parseInt(addCourseData.CategoryId);
      if (isNaN(categoryId)) {
        throw new Error("Danh mục không hợp lệ.");
      }

      const classId = addCourseData.ClassId ? parseInt(addCourseData.ClassId) : null;
      if (addCourseData.ClassId && isNaN(classId)) {
        throw new Error("Lớp không hợp lệ.");
      }

      if (!addCourseData.Image) {
        throw new Error("Vui lòng chọn một file ảnh hợp lệ.");
      }

      const formData = new FormData();
      formData.append("CourseName", addCourseData.CourseName.trim());
      formData.append("Description", addCourseData.Description?.trim() || "");
      formData.append("Price", price.toString());
      formData.append("Status", addCourseData.Status.toString());
      formData.append("CategoryId", categoryId.toString());
      if (classId) formData.append("ClassId", classId.toString());
      formData.append("image", addCourseData.Image);

      console.log("Dữ liệu gửi đi:", Object.fromEntries(formData));

      const response = await createCourse(formData);
      console.log("Phản hồi từ API:", response);

      await fetchCourses();
      setShowAddModal(false);
      setAddCourseData({
        CourseName: "",
        Description: "",
        Price: 0,
        Status: true,
        CategoryId: "",
        ClassId: "",
        Image: null,
      });
      setSuccessMessage("Thêm thành công khóa học!");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Lỗi khi thêm khóa học:", error.response?.data || error.message);
      setError(error.response?.data?.message || error.message || "Không thể thêm khóa học. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCourse = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const requiredFields = ["CourseName", "Price", "CategoryId"];
      const missingFields = requiredFields.filter(
        (field) => !updateCourseData[field] || (typeof updateCourseData[field] === "string" && !updateCourseData[field].trim())
      );
      if (missingFields.length > 0) {
        throw new Error(`Vui lòng điền đầy đủ: ${missingFields.join(", ")}`);
      }

      const price = parseFloat(updateCourseData.Price);
      if (isNaN(price) || price < 0) {
        throw new Error("Giá khóa học phải là số không âm.");
      }

      const categoryId = parseInt(updateCourseData.CategoryId);
      if (isNaN(categoryId)) {
        throw new Error("Danh mục không hợp lệ.");
      }

      const classId = updateCourseData.ClassId ? parseInt(updateCourseData.ClassId) : null;
      if (updateCourseData.ClassId && isNaN(classId)) {
        throw new Error("Lớp không hợp lệ.");
      }

      const formData = new FormData();
      formData.append("CourseName", updateCourseData.CourseName.trim());
      formData.append("Description", updateCourseData.Description?.trim() || "");
      formData.append("Price", price.toString());
      formData.append("CategoryId", categoryId.toString());
      if (classId) formData.append("ClassId", classId.toString());
      if (updateCourseData.Image && updateCourseData.Image.size > 0) {
        const validImageTypes = ["image/jpeg", "image/png", "image/gif"];
        const maxSize = 5 * 1024 * 1024;
        if (!validImageTypes.includes(updateCourseData.Image.type) || updateCourseData.Image.size > maxSize) {
          throw new Error("Ảnh phải là JPEG/PNG/GIF và nhỏ hơn 5MB.");
        }
        formData.append("Image", updateCourseData.Image);
      }

      console.log("Dữ liệu gửi đi (Update Course):", {
        CourseName: updateCourseData.CourseName,
        Description: updateCourseData.Description,
        Price: price,
        CategoryId: categoryId,
        ClassId: classId,
        Image: updateCourseData.Image
          ? { name: updateCourseData.Image.name, type: updateCourseData.Image.type, size: updateCourseData.Image.size }
          : "Không thay đổi",
      });

      const response = await updateCourse(selectedCourse.courseId, formData);
      console.log("Phản hồi từ API (Update Course):", response);

      await fetchCourses();
      setShowUpdateModal(false);
      setUpdateCourseData({
        CourseName: "",
        Description: "",
        Price: 0,
        CategoryId: "",
        ClassId: "",
        Image: null,
      });
      setSelectedCourse(null);
      setSuccessMessage("Cập nhật khóa học thành công!");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Lỗi khi cập nhật khóa học:", error.message);
      setError(error.message || "Không thể cập nhật khóa học. Vui lòng thử lại.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = (courseId, currentStatus) => {
    const course = courses.find((c) => c.courseId === courseId);
    if (course) {
      setCourseToToggle({ ...course, newStatus: !currentStatus });
      setShowStatusConfirm(true);
    }
  };

  const handleStatusConfirmed = async (courseId, newStatus) => {
    try {
      setIsLoading(true);
      await setCourseStatus(courseId, newStatus);
      await fetchCourses();
      setSuccessMessage(`Đã ${newStatus ? "kích hoạt" : "ẩn"} khóa học thành công!`);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error("Lỗi khi thay đổi trạng thái khóa học:", error);
      setError(error.message || "Không thể thay đổi trạng thái khóa học.");
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsLoading(false);
      setShowStatusConfirm(false);
      setCourseToToggle(null);
    }
  };

  return (
    <div className="dashboard-courselist-manager">
      {/* Sidebar */}
      <ManagerSidebar />
      {/* Main Content */}
      <div className="main-content-courselist-manager">
        <header className="header-courselist-manager">
          <h1>Tất cả khóa học</h1>
        </header>
        <div className="content-area-courselist-manager">
          {/* Stats Grid */}
          <div className="stats-grid-courselist-manager">
            <div className="stat-card-courselist-manager">
              <div className="stat-header-courselist-manager"><span className="stat-icon-courselist-manager">📚</span><span className="stat-title-courselist-manager">Tổng khóa học</span></div>
              <div className="stat-value-courselist-manager">{allCoursesStats.total}</div>
              <div className="stat-subtitle-courselist-manager">Trong hệ thống</div>
            </div>
            <div className="stat-card-courselist-manager">
              <div className="stat-header-courselist-manager"><span className="stat-icon-courselist-manager">🌐</span><span className="stat-title-courselist-manager">Đã xuất bản</span></div>
              <div className="stat-value-courselist-manager">{allCoursesStats.published}</div>
              <div className="stat-subtitle-courselist-manager">Có thể truy cập công khai</div>
            </div>
            <div className="stat-card-courselist-manager">
              <div className="stat-header-courselist-manager"><span className="stat-icon-courselist-manager">🔒</span><span className="stat-title-courselist-manager">Đã ẩn</span></div>
              <div className="stat-value-courselist-manager">{allCoursesStats.hidden}</div>
              <div className="stat-subtitle-courselist-manager">Không hiển thị công khai</div>
            </div>
            <div className="stat-card-courselist-manager">
              <div className="stat-header-courselist-manager"><span className="stat-icon-courselist-manager">👥</span><span className="stat-title-courselist-manager">Bản nháp</span></div>
              <div className="stat-value-courselist-manager">1</div>
              <div className="stat-subtitle-courselist-manager">Đang phát triển</div>
            </div>
          </div>
          {/* Courses Table */}
            <div className="courses-section-courselist-manager">
            <div className="section-header-courselist-manager" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <h2 style={{ marginRight: 16 }}>Tất cả khóa học</h2>
              <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên khóa học..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e5e7eb', minWidth: 180 }}
                />
                <button type="submit" style={{ padding: '6px 16px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Tìm kiếm</button>
              </form>
              <select
                className="filter-dropdown-courselist-manager"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                style={{ minWidth: 120 }}
              >
                <option value="">Tất cả</option>
                <option value="true">Đã xuất bản</option>
                <option value="false">Đã ẩn</option>
              </select>
              {role === "Instructor" && (
                <button className="add-btn" onClick={openAddModal} disabled={isLoading}>Thêm khóa học</button>
              )}
            </div>
            {error && <p className="error-message-course-list-manager">{error}</p>}
            {successMessage && <p className="success-message-course-list-manager">{successMessage}</p>}
            {isLoading && <p className="loading-message">Đang xử lý...</p>}
            <table className="courses-table-courselist-manager">
              <thead className="table-header-courselist-manager">
                <tr>
                  <th>Tên khóa học</th>
                  <th>Giảng viên</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course, index) => (
                  <tr key={index} className="table-row-courselist-manager">
                    
                    <td className="table-cell-courselist-manager">
                      <div className="course-details-courselist-manager">
                        <h3>{course.courseName}</h3>
                        <p>{course.description}</p>
                      </div>
                    </td>
                    <td className="table-cell-courselist-manager">
                      <div className="instructor-info-courselist-manager">
                        <div className="instructor-avatar-courselist-manager">{course.authorName ? course.authorName.charAt(0) : "?"}</div>
                        <span className="instructor-name-courselist-manager">{course.authorName}</span>
                      </div>
                    </td>
                    <td className="table-cell-courselist-manager">
                      <span className={`status-badge-courselist-manager ${course.status ? 'status-published-courselist-manager' : 'status-private-courselist-manager'}`}>
                        {course.status ? 'Đã xuất bản' : 'Đã ẩn'}
                      </span>
                    </td>
                    <td className="table-cell-courselist-manager">
                      <span className="date-cell-courselist-manager">{formatDate(course.createdDate)}</span>
                    </td>
                    <td className="table-cell-courselist-manager">
                      <div className="actions-cell-courselist-manager">
                        <button className="action-btn-courselist-manager" title={course.status ? "Ẩn" : "Hiện"} onClick={() => handleToggleStatus(course.courseId, course.status)}>
                          <Lock size={16} />
                        </button>
                        <button className="action-btn-courselist-manager" title="Xem" onClick={() => openDetailModal(course)}>
                          <Eye size={16} />
                        </button>
                      
                      </div>
                    </td>
                  </tr>
                ))}
                {courses.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center" }}>
                      Không có dữ liệu
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="pagination">
              <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Trước</button>
              <span>Trang {currentPage} / {totalPages}</span>
              <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages}>Sau</button>
            </div>
          </div>
          {/* Modals */}
          <>
            {showUpdateModal && selectedCourse && (
              <div className="modal-overlay" onClick={(e) => e.target.classList.contains("modal-overlay") && setShowUpdateModal(false)}>
                <div className="modal-content">
                  <h3>Cập nhật khóa học: {selectedCourse.courseName}</h3>
                  <form onSubmit={handleUpdateCourse}>
                    {/* ...form fields... */}
                    <div className="form-group">
                      <label>Tên khóa học *</label>
                      <input name="CourseName" value={updateCourseData.CourseName} onChange={(e) => handleInputChange(e, true)} required />
                    </div>
                    <div className="form-group">
                      <label>Mô tả</label>
                      <textarea name="Description" value={updateCourseData.Description} onChange={(e) => handleInputChange(e, true)} />
                    </div>
                    <div className="form-group">
                      <label>Giá *</label>
                      <input type="number" name="Price" value={updateCourseData.Price} onChange={(e) => handleInputChange(e, true)} required min="0" step="0.01" />
                    </div>
                    <div className="form-group">
                      <label>Danh mục *</label>
                      <select name="CategoryId" value={updateCourseData.CategoryId} onChange={(e) => handleInputChange(e, true)} required>
                        <option value="">Chọn danh mục</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Lớp</label>
                      <select name="ClassId" value={updateCourseData.ClassId} onChange={(e) => handleInputChange(e, true)}>
                        <option value="">Chọn lớp</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Hình ảnh (tùy chọn)</label>
                      <input type="file" name="Image" accept="image/jpeg,image/png,image/gif" onChange={(e) => handleInputChange(e, true)} />
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="cancel-btn" onClick={() => setShowUpdateModal(false)} disabled={isLoading}>Hủy</button>
                      <button type="submit" className="submit-btn" disabled={isLoading}>Cập nhật</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {showAddModal && (
              <div className="modal-overlay" onClick={(e) => e.target.classList.contains("modal-overlay") && setShowAddModal(false)}>
                <div className="modal-content">
                  <h3>Thêm khóa học</h3>
                  <form onSubmit={handleAddCourse}>
                    {/* ...form fields... */}
                    <div className="form-group">
                      <label>Tên khóa học *</label>
                      <input name="CourseName" value={addCourseData.CourseName} onChange={(e) => handleInputChange(e, false)} required />
                    </div>
                    <div className="form-group">
                      <label>Mô tả</label>
                      <textarea name="Description" value={addCourseData.Description} onChange={(e) => handleInputChange(e, false)} />
                    </div>
                    <div className="form-group">
                      <label>Giá *</label>
                      <input type="number" name="Price" value={addCourseData.Price} onChange={(e) => handleInputChange(e, false)} required min="0" step="0.01" />
                    </div>
                    <div className="form-group">
                      <label>Trạng thái</label>
                      <select name="Status" value={addCourseData.Status} onChange={(e) => handleInputChange(e, false)}>
                        <option value={true}>Hoạt động</option>
                        <option value={false}>Không hoạt động</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Danh mục *</label>
                      <select name="CategoryId" value={addCourseData.CategoryId} onChange={(e) => handleInputChange(e, false)} required>
                        <option value="">Chọn danh mục</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Lớp</label>
                      <select name="ClassId" value={addCourseData.ClassId} onChange={(e) => handleInputChange(e, false)}>
                        <option value="">Chọn lớp</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Hình ảnh *</label>
                      <input type="file" name="Image" accept="image/jpeg,image/png" onChange={(e) => handleInputChange(e, false)} required />
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)} disabled={isLoading}>Hủy</button>
                      <button type="submit" className="submit-btn" disabled={isLoading}>Thêm</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {showDetailModal && selectedCourse && (
              <div className="modal-overlay" onClick={(e) => e.target.classList.contains("modal-overlay") && setShowDetailModal(false)}>
                <div className="modal-content">
                  <h3>Chi tiết khóa học: {selectedCourse.courseName}</h3>
                  <div className="detail-section">
                    <p><strong>Tên khóa học:</strong> {selectedCourse.courseName}</p>
                    <p><strong>Ngày tạo:</strong> {formatDate(selectedCourse.createdDate)}</p>
                    <p><strong>Ngày cập nhật:</strong> {formatDate(selectedCourse.updatedDate)}</p>
                    <p><strong>Mô tả:</strong> {selectedCourse.description || "Không có mô tả"}</p>
                    <p><strong>Giá:</strong> {selectedCourse.price.toLocaleString()} VNĐ</p>
                    <p><strong>Trạng thái:</strong> {selectedCourse.status ? "Hoạt động" : "Không hoạt động"}</p>
                    <p><strong>Tác giả:</strong> {selectedCourse.authorName}</p>
                    <p><strong>Danh mục:</strong> {selectedCourse.categoryName || "Chưa xác định"}</p>
                    <p><strong>Lớp:</strong> {selectedCourse.className || "Không có lớp"}</p>
                    {selectedCourse.image && (
                      <p>
                        <strong>Hình ảnh:</strong>{" "}
                        <img src={resolveImageUrl(selectedCourse.image || "/profile/default.jpg", "avatar")} alt={selectedCourse.courseName} className="avatar-image" />
                      </p>
                    )}
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="cancel-btn" onClick={() => setShowDetailModal(false)}>Đóng</button>
                  </div>
                </div>
              </div>
            )}
            {showStatusConfirm && courseToToggle && (
              <div className="modal-overlay" onClick={(e) => e.target.classList.contains("modal-overlay") && setShowStatusConfirm(false)}>
                <div className="modal-content" style={{ width: "300px", textAlign: "center" }}>
                  <h3>Xác nhận thay đổi trạng thái</h3>
                  <p>Bạn có chắc muốn {courseToToggle.newStatus ? "kích hoạt" : "ẩn"} khóa học "{courseToToggle.courseName}"?</p>
                  <div className="modal-actions">
                    <button type="button" className="cancel-btn" onClick={() => setShowStatusConfirm(false)} disabled={isLoading}>Hủy</button>
                    <button type="button" className="submit-btn" onClick={() => handleStatusConfirmed(courseToToggle.courseId, courseToToggle.newStatus)} disabled={isLoading}>{courseToToggle.newStatus ? "Kích hoạt" : "Ẩn"}</button>
                  </div>
                </div>
              </div>
            )}
          </>
        </div>
      </div>
      {/* Activate Windows */}
      <div className="activate-windows-courselist-manager">
        Activate Windows<br />Go to Settings to activate Windows
      </div>
    </div>
  );
};

export default ManagerCourseList;