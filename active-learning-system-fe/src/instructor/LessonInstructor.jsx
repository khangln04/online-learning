import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../css/instructor/lessoninstructor.css";
import { useParams } from "react-router-dom";
import Instructor from "../Component/InstructorSidebar";

const LessonInstructor = () => {
  const { moduleId } = useParams();
  const moduleIdNum = Number(moduleId);
  const [lessons, setLessons] = useState([]);
  const [filteredLessons, setFilteredLessons] = useState([]);
  const [search, setSearch] = useState({ keyword: "", status: "all" });
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    link: "",
    description: "",
    videoNum: 0,
    durationSeconds: 0,
    status: true,
    moduleId: moduleIdNum,
  });
  const [formErrors, setFormErrors] = useState({
    title: "",
    link: "",
    description: "",
    durationSeconds: ""
  });
  const [showTitleDuplicateError, setShowTitleDuplicateError] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const api = axios.create({
    baseURL: "https://localhost:5000/api",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  const fetchLessons = useCallback(async () => {
    try {
      const res = await api.get(`/ManageLesson/${moduleIdNum}`);
      setLessons(res.data || []);
      setFilteredLessons(res.data || []);
    } catch {
      toast.error("Lỗi khi tải danh sách bài giảng");
    }
  }, [api, moduleIdNum]);

  useEffect(() => {
    fetchLessons();
    setForm((prev) => ({ ...prev, moduleId: moduleIdNum }));
    setSearch({ keyword: "", status: "all" });
    setCurrentPage(1);
  }, [moduleIdNum, fetchLessons]);

  // Validate các trường
  // Validate các trường, không check tiêu đề trùng khi nhập input
  const validateField = (name, value, { skipDuplicateCheck = false } = {}) => {
    let error = "";
    if (name === "title") {
      if (!value.trim()) error = "Tiêu đề không được để trống";
      else if (value.length < 6) error = "Tiêu đề phải lớn hơn 5 ký tự";
      else if (value.length > 100) error = "Tiêu đề không vượt quá 100 ký tự";
      else if (!skipDuplicateCheck) {
        // Chỉ check trùng khi submit
        const editingLesson = lessons.find(l => l.id === editingId);
        const isSameAsEditing = editingLesson && editingLesson.title.trim().toLowerCase() === value.trim().toLowerCase();
        if (!isSameAsEditing) {
          const isDuplicate = lessons.some(
            (l) => l.title.trim().toLowerCase() === value.trim().toLowerCase() && l.id !== editingId
          );
          if (isDuplicate) error = "Tiêu đề đã tồn tại, vui lòng chọn tên tiêu đề khác";
        }
      }
    }
    if (name === "link") {
      if (!value.trim()) error = "Đường dẫn không được để trống";
      else if (value.length > 200) error = "Đường dẫn không vượt quá 200 ký tự";
      else if (!/^https?:\/\//.test(value.trim())) error = "Đường dẫn phải bắt đầu bằng http:// hoặc https://";
      else if (!/^https?:\/\/.+\..+/.test(value.trim())) error = "Đường dẫn phải là URL hợp lệ";
    }
    if (name === "description") {
      if (!value.trim()) error = "Mô tả không được để trống";
      else if (value.length > 200) error = "Mô tả không vượt quá 200 ký tự";
    }
    if (name === "durationSeconds") {
      const num = Number(value);
      // Bỏ check 'Thời lượng phải là số', chỉ check các điều kiện khác
      if (num <= 50) error = "Thời lượng phải lớn hơn 50 giây";
      else if (num > 10800) error = "Tối đa 3 tiếng (10800 giây)";
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "videoNum" || name === "durationSeconds"
          ? Number(value)
          : name === "status"
          ? value === "true"
          : value,
    }));
    // Khi nhập lại input, ẩn lỗi tiêu đề trùng nếu có
    if (name === "title" && showTitleDuplicateError) setShowTitleDuplicateError(false);
    setFormErrors((prev) => ({
      ...prev,
      [name]: name === "title" ? validateField(name, value, { skipDuplicateCheck: true }) : validateField(name, value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validate all fields before submit, check tiêu đề trùng khi submit
    const newErrors = {
      title: validateField("title", form.title, { skipDuplicateCheck: false }),
      link: validateField("link", form.link),
      description: validateField("description", form.description),
      durationSeconds: validateField("durationSeconds", form.durationSeconds)
    };
    setFormErrors(newErrors);
    // Nếu có lỗi tiêu đề trùng thì hiển thị lỗi trong 3s rồi tự tắt
    if (newErrors.title === "Tiêu đề đã tồn tại, vui lòng chọn tên tiêu đề khác") {
      setShowTitleDuplicateError(true);
      setTimeout(() => setShowTitleDuplicateError(false), 3000);
    }
    if (Object.values(newErrors).some((err) => err)) return;
    try {
      const payload = { ...form, moduleId: moduleIdNum };
      payload.durationSeconds = Number(form.durationSeconds) || 0;
      if (editingId) {
        await api.put(`/ManageLesson/${editingId}`, payload);
        setSuccessMsg("Cập nhật bài giảng thành công!");
        toast.success("Cập nhật bài giảng thành công");
      } else {
        await api.post(`/ManageLesson`, payload);
        setSuccessMsg("Thêm bài giảng thành công!");
        toast.success("Thêm bài giảng thành công");
      }
      setShowModal(false);
      setEditingId(null);
      resetForm();
      fetchLessons();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      toast.error("Lỗi khi lưu bài giảng");
    }
  };

  // Search & Filter handler
  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearch((prev) => ({ ...prev, [name]: value }));
    if (name === "status") {
      // Tự động filter khi chọn trạng thái
      const keyword = search.keyword.trim().toLowerCase();
      let filtered = lessons;
      if (keyword) {
        filtered = filtered.filter(
          (l) => l.title?.toLowerCase().includes(keyword)
        );
      }
      if (value !== "all") {
        filtered = filtered.filter((l) =>
          value === "active" ? l.status === true : l.status === false
        );
      }
      setFilteredLessons(filtered);
      setCurrentPage(1);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const keyword = search.keyword.trim().toLowerCase();
    let filtered = lessons;
    // Search chỉ theo tiêu đề
    if (keyword) {
      filtered = filtered.filter(
        (l) => l.title?.toLowerCase().includes(keyword)
      );
    }
    // Filter theo status
    if (search.status !== "all") {
      filtered = filtered.filter((l) =>
        search.status === "active" ? l.status === true : l.status === false
      );
    }
    setFilteredLessons(filtered);
    setCurrentPage(1);
  };

  const handleEdit = (lesson) => {
    setForm({
      title: lesson.title,
      link: lesson.link,
      description: lesson.description,
      videoNum: lesson.videoNum,
      durationSeconds: lesson.durationSeconds || 0,
      status: lesson.status,
      moduleId: moduleIdNum,
    });
    setEditingId(lesson.id);
    // Validate lại tất cả trường khi mở modal edit, KHÔNG check tiêu đề trùng và ẩn lỗi tiêu đề trùng
    setFormErrors({
      title: validateField("title", lesson.title, { skipDuplicateCheck: true }),
      link: validateField("link", lesson.link),
      description: validateField("description", lesson.description),
      durationSeconds: validateField("durationSeconds", lesson.durationSeconds)
    });
    setShowTitleDuplicateError(false);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa bài giảng này?")) {
      try {
        await api.delete(`/ManageLesson/${id}`);
        toast.success("Xóa bài giảng thành công");
        fetchLessons();
      } catch {
        toast.error("Lỗi khi xóa bài giảng");
      }
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      link: "",
      description: "",
      videoNum: 0,
      durationSeconds: 0,
      status: true,
      moduleId: moduleIdNum,
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // Pagination logic
  const totalRecords = filteredLessons.length;
  const totalPages = Math.ceil(totalRecords / recordsPerPage);
  const paginatedLessons = filteredLessons.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      
      <div className="lesson-manager-lesson-instructor" style={{ flex: 1 }}>
        {/* Back Button + Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <button
            onClick={() => window.history.back()}
            style={{
              background: '#f3f4f6',
              color: '#2563eb',
              border: '1.5px solid #2563eb',
              borderRadius: 7,
              fontWeight: 600,
              fontSize: 15,
              padding: '8px 20px',
              cursor: 'pointer',
              marginRight: 8
            }}
          >
            ← Quay lại
          </button>
          <div className="header-section-lesson-instructor" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>Quản lý bài giảng</h2>
            <div className="total-count-lesson-instructor">Tổng số bài giảng: {filteredLessons.length}</div>
          </div>
        </div>

        {/* Toolbar + Search */}
        <div className="toolbar-lesson-instructor" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="toolbar-title-lesson-instructor">📄 Danh sách bài giảng</div>
          <form style={{ display: 'flex', alignItems: 'center', gap: 8 }} onSubmit={handleSearch}>
            <input
              type="text"
              name="keyword"
              placeholder="Tìm kiếm tiêu đề, link, mô tả..."
              value={search.keyword}
              onChange={handleSearchChange}
              style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #e3e8ee', minWidth: 180 }}
            />
            <select
              name="status"
              value={search.status}
              onChange={handleSearchChange}
              style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #e3e8ee' }}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
            <button type="submit" className="btn-primary-lesson-instructor" style={{ padding: '7px 18px', fontSize: '1rem' }}>
              Tìm kiếm
            </button>
          </form>
          <button
            className="btn-add-lesson-instructor"
            onClick={() => {
              resetForm();
              setEditingId(null);
              setShowModal(true);
            }}
          >
            + Thêm bài giảng
          </button>
        </div>

        {/* Success Message */}
        {successMsg && (
          <div className="success-message-lesson-instructor">
            {successMsg}
          </div>
        )}
        {/* Table */}
        <div className="table-wrapper-lesson-instructor">
          <table className="lesson-table-lesson-instructor">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tiêu đề</th>
                <th>Đường dẫn</th>
                <th>Mô tả</th>
                <th>Thời lượng video (giây)</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Cập nhật</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {paginatedLessons.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: '#888', padding: 24 }}>
                    Không có bản ghi nào phù hợp.
                  </td>
                </tr>
              ) : (
                paginatedLessons.map((lesson, idx) => (
                  <tr key={lesson.id}>
                    <td>{(currentPage - 1) * recordsPerPage + idx + 1}</td>
                    <td>{lesson.title}</td>
                    <td>
                      <span className="path-link-lesson-instructor">{lesson.link}</span>
                    </td>
                    <td>{lesson.description}</td>
                    <td>{lesson.durationSeconds || 0}</td>
                    <td>
                      <span
                        className={`status-badge-lesson-instructor ${
                          lesson.status ? "active-lesson-instructor" : "inactive-lesson-instructor"
                        }`}
                        style={{ display: 'inline-flex', alignItems: 'center' }}
                      >
                        {lesson.status ? "Hoạt động" : "Tạm dừng"}
                      </span>
                    </td>
                    <td>{formatDate(lesson.createdDate)}</td>
                    <td>{formatDate(lesson.updatedDate)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Ẩn cả nút edit và xóa nếu bài giảng đang hoạt động */}
                        {lesson.status === false && (
                          <>
                            <button
                              className="action-btn-lesson-instructor edit-lesson-instructor"
                              onClick={() => handleEdit(lesson)}
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="action-btn-lesson-instructor delete-lesson-instructor"
                              onClick={() => handleDelete(lesson.id)}
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18, gap: 8 }}>
            <button
              className="btn-secondary-lesson-instructor"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Trang trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`btn-secondary-lesson-instructor${currentPage === i + 1 ? ' active' : ''}`}
                style={currentPage === i + 1 ? { background: '#1976d2', color: '#fff' } : {}}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="btn-secondary-lesson-instructor"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Trang sau
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div
            className="modal-overlay-lesson-instructor"
            onClick={(e) =>
              e.target.classList.contains("modal-overlay-lesson-instructor") &&
              setShowModal(false)
            }
          >
            <div className="modal-lesson-instructor">
              <h3>{editingId ? "Chỉnh sửa bài giảng" : "Thêm bài giảng"}</h3>
              <form onSubmit={handleSubmit}>

                <label>Tiêu đề</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
                {showTitleDuplicateError && formErrors.title === "Tiêu đề đã tồn tại, vui lòng chọn tên tiêu đề khác" && (
                  <div style={{color:'red', fontSize:13, marginBottom:4}}>{formErrors.title}</div>
                )}
                {!showTitleDuplicateError && formErrors.title && formErrors.title !== "Tiêu đề đã tồn tại, vui lòng chọn tên tiêu đề khác" && (
                  <div style={{color:'red', fontSize:13, marginBottom:4}}>{formErrors.title}</div>
                )}

                <label>Đường dẫn</label>
                <input
                  type="text"
                  name="link"
                  value={form.link}
                  onChange={handleChange}
                  required
                />
                {formErrors.link && <div style={{color:'red', fontSize:13, marginBottom:4}}>{formErrors.link}</div>}

                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                />
                {formErrors.description && <div style={{color:'red', fontSize:13, marginBottom:4}}>{formErrors.description}</div>}

                <label>Thời lượng (giây)</label>
                <input
                  type="number"
                  name="durationSeconds"
                  value={form.durationSeconds}
                  onChange={handleChange}
                  min={0}
                  required
                />
                {formErrors.durationSeconds && <div style={{color:'red', fontSize:13, marginBottom:4}}>{formErrors.durationSeconds}</div>}

                

             

                <div className="modal-actions-lesson-instructor">
                  <button type="submit" className="btn-primary-lesson-instructor">
                    {editingId ? "Lưu" : "Thêm"}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary-lesson-instructor"
                    onClick={() => {
                      setShowModal(false);
                      setEditingId(null);
                      resetForm();
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonInstructor;
