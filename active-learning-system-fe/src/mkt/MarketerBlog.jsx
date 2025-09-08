import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import "../css/mkt/mktBlog.css";
import "../css/mkt/blog-modal.css";
import MarketerSidebar from "../Component/MarketerSidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MarketerBlog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [newBlog, setNewBlog] = useState({
    title: "",
    summary: "",
    content: "",
    thumbnailFile: null,
    status: true,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // State for blog detail popup
  const [detailBlog, setDetailBlog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  // Fetch blog detail by id
  const handleShowDetail = async (blogId) => {
    try {
      const res = await axios.get(`https://localhost:5000/api/ManageBlog/BlogDetail/${blogId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (Array.isArray(res.data) && res.data.length > 0) {
        setDetailBlog(res.data[0]);
        setShowDetailModal(true);
      } else {
        showError("Không tìm thấy blog.");
      }
    } catch {
      showError("Không thể tải chi tiết blog.");
    }
  };

  const fetchBlogs = async () => {
    try {
      const { data } = await axios.get("https://localhost:5000/api/ManageBlog/summaries", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setBlogs(data);
      setCurrentPage(1);
    } catch (err) {
      setErrorMessage("Không thể tải danh sách blog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const totalPages = useMemo(() => Math.ceil(blogs.length / pageSize), [blogs]);
  const paginatedBlogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return blogs.slice(start, start + pageSize);
  }, [blogs, currentPage]);

  const handleChange = (e, setter) => {
    const { name, value, files, type } = e.target;
    const val = type === "file" ? files[0] : type === "checkbox" ? e.target.checked : value;

    setter((prev) => ({
      ...prev,
      [name]: name === "status" ? val === "true" || val === true : val,
      ...(name === "thumbnailFile" && { thumbnailFile: val }),
    }));
  };

  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(""), 4000);
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  // Xác nhận xóa blog bằng toast với nút OK/Hủy
  const handleDelete = (id) => {
    toast.info(
      <div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Bạn có chắc muốn xóa blog này không?</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: 5, padding: '6px 18px', fontWeight: 600, cursor: 'pointer' }}
            onClick={async () => {
              toast.dismiss();
              try {
                await axios.delete(`https://localhost:5000/api/ManageBlog/DeleteBlog/${id}`, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                });
                fetchBlogs();
                toast.success("Xóa blog thành công!");
              } catch {
                toast.error("Xóa blog thất bại!");
              }
            }}
          >
            OK
          </button>
          <button
            style={{ background: '#f3f4f6', color: '#222', border: '1.5px solid #bbb', borderRadius: 5, padding: '6px 18px', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => toast.dismiss()}
          >
            Hủy
          </button>
        </div>
      </div>,
      { autoClose: false, closeOnClick: false, draggable: false, closeButton: false, position: 'top-center' }
    );
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("Title", newBlog.title);
    formData.append("Summary", newBlog.summary);
    formData.append("Content", newBlog.content);
    formData.append("Status", newBlog.status.toString());
    formData.append("thumbnail", newBlog.thumbnailFile);

    try {
      await axios.post("https://localhost:5000/api/ManageBlog/AddBlog", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      fetchBlogs();
      setShowAddModal(false);
      setNewBlog({ title: "", summary: "", content: "", thumbnailFile: null, status: true });
      showSuccess("Thêm blog thành công!");
    } catch (err) {
      showError("Lỗi khi thêm blog: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editingBlog || !editingBlog.blogId) {
      showError("Không xác định được blog cần cập nhật.");
      return;
    }
    const formData = new FormData();
    formData.append("Title", editingBlog.title);
    formData.append("Summary", editingBlog.summary);
    formData.append("Content", editingBlog.content);
    formData.append("Status", editingBlog.status.toString());
    // Backend expects the file as 'thumbnail', not 'thumbnailFile'
    if (editingBlog.thumbnailFile) {
      formData.append("thumbnail", editingBlog.thumbnailFile);
    }

    try {
      await axios.put(
        `https://localhost:5000/api/ManageBlog/UpdateBlog/${editingBlog.blogId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchBlogs();
      setEditingBlog(null);
      showSuccess("Cập nhật blog thành công!");
    } catch (err) {
      showError("Lỗi khi cập nhật blog.");
    }
  };

  const openEditModal = async (blog) => {
    try {
      const res = await axios.get(`https://localhost:5000/api/ManageBlog/BlogDetail/${blog.blogId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      // Backend trả về mảng, lấy phần tử đầu tiên
      if (Array.isArray(res.data) && res.data.length > 0) {
        // Đảm bảo luôn có blogId trong editingBlog
        setEditingBlog({ ...res.data[0], blogId: blog.blogId, thumbnailFile: null });
      } else {
        showError("Không tìm thấy blog.");
      }
    } catch {
      showError("Không thể tải chi tiết blog.");
    }
  };

  return (
    <>
      <ToastContainer />
      <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
        <aside>
          <MarketerSidebar />
        </aside>
        <main className="course-list-container">
          <div className="course-list-header">
            <h2>Quản lý Blog</h2>
            <button className="add-btn" onClick={() => setShowAddModal(true)}>Thêm Blog</button>
          </div>

          {errorMessage && <div className="error-message-fixed">{errorMessage}</div>}
          {successMessage && <div className="success-message-fixed">{successMessage}</div>}

          {loading ? (
            <p>Đang tải...</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Tác giả</th>
                    <th>Ngày tạo</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBlogs.map((b) => (
                    <tr key={b.blogId}>
                      <td>
                        <span
                          style={{ color: '#1976d2', cursor: 'pointer', textDecoration: 'underline' }}
                          onClick={() => handleShowDetail(b.blogId)}
                        >
                          {b.title}
                        </span>
                      </td>
                      <td>{b.authorName}</td>
                      <td>{new Date(b.createdDate).toLocaleDateString("vi-VN")}</td>
                      <td>
                        <button onClick={() => openEditModal(b)}>✏️</button>
                        <button onClick={() => handleDelete(b.blogId)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Blog Detail Modal */}
              {showDetailModal && detailBlog && (
                <div className="modal-overlay" onClick={e => e.target.classList.contains("modal-overlay") && setShowDetailModal(false)}>
                  <div className="blog-detail-modal">
                    <h3>{detailBlog.title}</h3>
                    <div className="blog-detail-meta">
                      <b>Tác giả:</b> {detailBlog.authorName} &nbsp;|&nbsp; <b>Ngày tạo:</b> {new Date(detailBlog.createdDate).toLocaleDateString("vi-VN")}
                    </div>
                    <img src={`https://localhost:5000${detailBlog.thumbnail}`} alt="thumb" />
                    <div className="blog-detail-section">
                      <b>Tóm tắt:</b>
                      <div className="blog-detail-summary">{detailBlog.summary}</div>
                    </div>
                    <div className="blog-detail-section">
                      <b>Nội dung:</b>
                      <div className="blog-detail-content">{detailBlog.content}</div>
                    </div>
                    <div className="modal-actions">
                      <button type="button" onClick={() => setShowDetailModal(false)}>Đóng</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="pagination">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Trước</button>
                <span>Trang {currentPage} / {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Sau</button>
              </div>
            </>
          )}

          {showAddModal && (
            <div className="modal-overlay" onClick={(e) => e.target.classList.contains("modal-overlay") && setShowAddModal(false)}>
              <div className="modal-content">
                <h3>Thêm Blog</h3>
                <form onSubmit={handleAdd} className="blog-modal-form">
                  <div className="blog-modal-field">
                    <label htmlFor="add-title">Tiêu đề:</label>
                    <input
                      id="add-title"
                      name="title"
                      value={newBlog.title}
                      onChange={(e) => handleChange(e, setNewBlog)}
                      placeholder="Nhập tiêu đề blog"
                      required
                    />
                  </div>
                  <div className="blog-modal-field">
                    <label htmlFor="add-summary">Tóm tắt:</label>
                    <textarea
                      id="add-summary"
                      name="summary"
                      value={newBlog.summary}
                      onChange={(e) => handleChange(e, setNewBlog)}
                      placeholder="Nhập tóm tắt blog"
                    />
                  </div>
                  <div className="blog-modal-field">
                    <label htmlFor="add-content">Nội dung:</label>
                    <textarea
                      id="add-content"
                      name="content"
                      value={newBlog.content}
                      onChange={(e) => handleChange(e, setNewBlog)}
                      placeholder="Nhập nội dung blog"
                    />
                  </div>
                  <div className="blog-modal-field">
                    <label htmlFor="add-thumbnail">Ảnh đại diện:</label>
                    <input
                      id="add-thumbnail"
                      type="file"
                      name="thumbnailFile"
                      accept="image/*"
                      onChange={(e) => handleChange(e, setNewBlog)}
                      required
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" onClick={() => setShowAddModal(false)}>Hủy</button>
                    <button type="submit">Thêm</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {editingBlog && (
            <div className="modal-overlay" onClick={(e) => e.target.classList.contains("modal-overlay") && setEditingBlog(null)}>
              <div className="modal-content">
                <h3>Chỉnh sửa Blog</h3>
                <form onSubmit={handleEdit} className="blog-modal-form">
                  <div className="blog-modal-field">
                    <label htmlFor="edit-title">Tiêu đề:</label>
                    <input
                      id="edit-title"
                      name="title"
                      value={editingBlog.title ?? ""}
                      onChange={(e) => handleChange(e, setEditingBlog)}
                      placeholder="Nhập tiêu đề blog"
                      required
                    />
                  </div>
                  <div className="blog-modal-field">
                    <label htmlFor="edit-summary">Tóm tắt:</label>
                    <textarea
                      id="edit-summary"
                      name="summary"
                      value={editingBlog.summary ?? ""}
                      onChange={(e) => handleChange(e, setEditingBlog)}
                      placeholder="Nhập tóm tắt blog"
                    />
                  </div>
                  <div className="blog-modal-field">
                    <label htmlFor="edit-content">Nội dung:</label>
                    <textarea
                      id="edit-content"
                      name="content"
                      value={editingBlog.content ?? ""}
                      onChange={(e) => handleChange(e, setEditingBlog)}
                      placeholder="Nhập nội dung blog"
                    />
                  </div>
                  <div className="blog-modal-field">
                    <label>Ảnh hiện tại:</label>
                    <img src={`https://localhost:5000${editingBlog.thumbnail}`} alt="thumb" style={{ width: 120, borderRadius: 6, marginBottom: 8 }} />
                  </div>
                  <div className="blog-modal-field">
                    <label htmlFor="edit-thumbnail">Đổi ảnh đại diện:</label>
                    <input
                      id="edit-thumbnail"
                      type="file"
                      name="thumbnailFile"
                      accept="image/*"
                      onChange={(e) => handleChange(e, setEditingBlog)}
                    />
                  </div>
                  <div className="modal-actions">
                    <button type="button" onClick={() => setEditingBlog(null)}>Hủy</button>
                    <button type="submit">Lưu</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default MarketerBlog;