import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaVideo, FaTrash } from "react-icons/fa";
import axios from "axios";
import Instructor from "../Component/InstructorSidebar";
import "../css/manager/Module.css";

function ModulePage() {
  // Xóa module (dùng confirm modal riêng)
  const [confirmDelete, setConfirmDelete] = useState({ open: false, moduleId: null });
  const [deleteError, setDeleteError] = useState("");
  const deleteModule = async (moduleId) => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      await axios.delete(`https://localhost:5000/api/manager/ManageModule/delete/${moduleId}`, {
        headers: getAuthHeaders(),
      });
      await fetchModules();
      setSuccessMessage("Đã xóa module thành công!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || "Không thể xóa module");
      setTimeout(() => setDeleteError(""), 4000);
    } finally {
      setProcessing(false);
    }
  };
  const { courseId } = useParams();
  const numericCourseId = parseInt(courseId, 10);
  const navigate = useNavigate();

  // Validate courseId
  useEffect(() => {
    console.log("Course ID validation:", { courseId, numericCourseId });
    if (!courseId || isNaN(numericCourseId) || numericCourseId <= 0) {
      console.error("Invalid course ID");
      setError("ID khóa học không hợp lệ");
      setTimeout(() => navigate("/error"), 0);
      return;
    }
    console.log("Course ID is valid:", numericCourseId);
  }, [courseId, numericCourseId, navigate]);

  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [editForm, setEditForm] = useState({ moduleName: "", description: "" });
  const [editFormError, setEditFormError] = useState("");
  const [editFormTouched, setEditFormTouched] = useState(false);
  const [editFormDescError, setEditFormDescError] = useState("");
  const [editFormDescErrorTimeout, setEditFormDescErrorTimeout] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newModule, setNewModule] = useState({ moduleName: "", description: "" });
  const [newModuleError, setNewModuleError] = useState("");
  const [newModuleDescError, setNewModuleDescError] = useState("");
  const [newModuleDescErrorTimeout, setNewModuleDescErrorTimeout] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmToggle, setConfirmToggle] = useState({ open: false, module: null });

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Check authentication and authorization
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (!isLoggedIn || !token) {
      navigate("/login");
      return;
    }

    if (role !== "Instructor") {
      setError("Bạn không có quyền truy cập trang này. Chỉ giảng viên mới được phép vào.");
      setTimeout(() => navigate("/error"), 0);
      return;
    }
  }, [navigate]);

  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(modules.length / pageSize)),
    [modules]
  );
  const paginatedModules = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return modules.slice(start, start + pageSize);
  }, [modules, currentPage]);

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      console.log("Fetching modules for courseId:", numericCourseId);
      let apiUrl = `https://localhost:5000/api/manager/ManageModule/course${numericCourseId}/modules`;
      console.log("API URL:", apiUrl);
      
      const { data } = await axios.get(apiUrl, {
        headers: getAuthHeaders(),
      });
      console.log("API Response:", data);
      console.log("Data type:", typeof data);
      console.log("Data length:", data?.length);
      console.log("First item:", data?.[0]);
      
      if (!Array.isArray(data)) {
        console.error("API response is not an array:", data);
        setModules([]);
        setCurrentPage(1);
        return;
      }
      
      const valid = data.filter((m) => {
        console.log("Checking module:", m);
        const hasValidId = m && (m.moduleId || m.id || m.Id);
        const hasValidName = m && (m.moduleName || m.ModuleName);
        console.log("Module validation:", { hasValidId, hasValidName, m });
        return hasValidId && hasValidName;
      });
      
      console.log("Valid modules:", valid);
      setModules(valid);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error fetching modules:", err.response || err);
      
      if (err.response?.status === 404) {
        console.log("404 - Course not found or no modules exist");
        setModules([]);
        setCurrentPage(1);
        setError(null);
      } else if (err.response?.status === 401) {
        console.log("401 - Unauthorized, redirecting to login");
        navigate("/login");
        return;
      } else if (err.response?.status === 403) {
        console.log("403 - Forbidden, insufficient permissions");
        setError("Bạn không có quyền truy cập khóa học này.");
      } else {
        console.log("Other error:", err.response?.status, err.message);
        setError(`Lỗi ${err.response?.status || 'không xác định'}: ${err.response?.data?.message || err.message || "Không thể tải module"}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [numericCourseId, navigate]);

  const toggleStatus = async (id, status) => {
    if (processing) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      await axios.put(
        `https://localhost:5000/api/manager/ManageModule/update-status/${id}?status=${!status}`,
        {},
        {
          headers: getAuthHeaders(),
        }
      );
      await fetchModules();
      setSuccessMessage("Đã cập nhật trạng thái!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      alert(err.response?.data?.message || err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setNewModule((prev) => ({ ...prev, [name]: value }));
    // Do not set error here, only set error on submit
  };

  const submitAdd = async (e) => {
    e.preventDefault();
    let hasError = false;
    if (!newModule.moduleName?.trim()) {
      setNewModuleError("Vui lòng nhập tên module");
      hasError = true;
    } else if (newModule.moduleName.length > 100) {
      setNewModuleError("Tên module không được vượt quá 100 ký tự.");
      hasError = true;
    } else {
      setNewModuleError("");
    }
    if (!newModule.description?.trim()) {
      setNewModuleDescError("Vui lòng nhập mô tả cho module");
      hasError = true;
      if (newModuleDescErrorTimeout) clearTimeout(newModuleDescErrorTimeout);
      const timeout = setTimeout(() => setNewModuleDescError("") , 4000);
      setNewModuleDescErrorTimeout(timeout);
    } else {
      setNewModuleDescError("");
      if (newModuleDescErrorTimeout) clearTimeout(newModuleDescErrorTimeout);
    }
    if (hasError) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const apiUrl = `https://localhost:5000/api/manager/ManageModule/course${numericCourseId}/add-module`;
      await axios.post(apiUrl, newModule, {
        headers: getAuthHeaders(),
      });
      await fetchModules();
      setShowAddModal(false);
      setNewModule({ moduleName: "", description: "" });
      setSuccessMessage("Thêm module thành công!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
        return;
      }
      const errorMessage = err.response?.data?.message || err.message || "Không thể thêm module";
      setNewModuleError(errorMessage);
    }
  };

  return (
    <div style={{ display: 'flex', height: '95vh', width: '95vw', overflow: 'hidden' }}>
      <Instructor />
      <main className="course-list-container-instructor-module" style={{ flex: 1, overflowY: 'auto', maxHeight: '100vh' }}>
        <div className="course-list-header-instructor-module" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <button
            onClick={() => navigate('/instructor-courselist')}
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
          <h2 style={{ margin: 0 }}>Danh sách Module</h2>
          <button className="add-btn-instructor-module" onClick={() => setShowAddModal(true)}>
            Thêm module
          </button>
        </div>

        {successMessage && <div className="success-message-fixed-instructor-module">{successMessage}</div>}

        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : error ? (
          <div className="error-message-instructor-module">{error}</div>
        ) : modules.length === 0 ? (
          <div className="empty-module-instructor-module">
            <h2>Chưa có module nào</h2>
            <p>Khóa học này hiện chưa có module nào được thêm.</p>
            <button className="add-btn-instructor-module" onClick={() => setShowAddModal(true)}>
              Thêm module đầu tiên
            </button>
          </div>
        ) : (
          <div className="table-wrapper-instructor-module">
            <table>
              <thead>
                <tr>
                  <th>Tên module</th>
                  <th>Mô tả</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Ngày chỉnh sửa</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {paginatedModules.map((m) => {
                  const moduleId = m.moduleId || m.id || m.Id;
                  const moduleName = m.moduleName || m.ModuleName;
                  const description = m.description || m.Description;
                  const status = m.status !== undefined ? m.status : m.Status;
                  const createdDate = m.createdDate || m.CreatedDate;
                  const updatedDate = m.updatedDate || m.UpdatedDate;
                  
                  return (
                    <tr key={moduleId}>
                      <td>{moduleName}</td>
                      <td>{description || "Chưa có mô tả"}</td>
                      <td className={status ? "status-active-instructor-module" : "status-inactive-instructor-module"}>
                        {status ? "Hoạt động" : "Không hoạt động"}
                      </td>
                      <td>{new Date(createdDate).toLocaleDateString("vi-VN")}</td>
                      <td>
                        {updatedDate
                          ? new Date(updatedDate).toLocaleDateString("vi-VN")
                          : "Chưa cập nhật"}
                      </td>
                      <td>
                        {/* Ẩn cả nút edit và xóa nếu module đang hoạt động */}
                        {status === false && (
                          <>
                            <button
                              className="action-btn-instructor-module update-btn-instructor-module"
                              onClick={() => {
                                setEditingModule({ ...m, moduleId, moduleName, description });
                                setEditForm({ moduleName: moduleName, description: description || "" });
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              className="action-btn-instructor-module"
                              title="Xóa module"
                              style={{ marginLeft: 2, marginRight: 2, color: '#e74c3c' }}
                              onClick={() => setConfirmDelete({ open: true, moduleId })}
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
        {/* Modal xác nhận xóa module */}
        {confirmDelete.open && (
          <div className="confirm-modal-instructor-module">
            <div className="modal-box-instructor-module">
              <h3>Xác nhận xóa module</h3>
              <p>Bạn có chắc chắn muốn xóa module này?</p>
              <div className="modal-actions-instructor-module">
                <button className="cancel-btn-instructor-module" onClick={() => setConfirmDelete({ open: false, moduleId: null })}>
                  Hủy
                </button>
                <button
                  className="submit-btn-instructor-module"
                  onClick={async () => {
                    await deleteModule(confirmDelete.moduleId);
                    setConfirmDelete({ open: false, moduleId: null });
                  }}
                  disabled={processing}
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hiển thị lỗi xóa module */}
        {deleteError && (
          <div className="error-message-instructor-module" style={{ margin: '16px 0', textAlign: 'center' }}>{deleteError}</div>
        )}
                        <Link to={`/quizzes/${moduleId}`}>
                          <button className="action-btn-instructor-module quizzes-btn-instructor-module">
                            📖
                          </button>
                        </Link>
                        <Link to={`/instructor/lesson/${moduleId}`} title="Quản lý bài giảng">
                          <button className="action-btn-instructor-module lessons-btn-instructor-module">
                            <FaVideo />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="pagination-instructor-module">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                Trước
              </button>
              <span>
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Sau
              </button>
            </div>
          </div>
        )}

        {confirmToggle.open && confirmToggle.module && (
          <div className="confirm-modal-instructor-module">
            <div className="modal-box-instructor-module">
              <h3>Xác nhận thay đổi trạng thái</h3>
              <p>
                Bạn có chắc muốn {(confirmToggle.module.status !== undefined ? confirmToggle.module.status : confirmToggle.module.Status) ? "ẩn" : "hiện"} module "
                {confirmToggle.module.moduleName || confirmToggle.module.ModuleName}"?
              </p>
              <div className="modal-actions-instructor-module">
                <button className="cancel-btn-instructor-module" onClick={() => setConfirmToggle({ open: false, module: null })}>
                  Hủy
                </button>
                <button
                  className="submit-btn-instructor-module"
                  onClick={() => {
                    const moduleId = confirmToggle.module.moduleId || confirmToggle.module.id || confirmToggle.module.Id;
                    const status = confirmToggle.module.status !== undefined ? confirmToggle.module.status : confirmToggle.module.Status;
                    toggleStatus(moduleId, status);
                    setConfirmToggle({ open: false, module: null });
                  }}
                >
                  {(confirmToggle.module.status !== undefined ? confirmToggle.module.status : confirmToggle.module.Status) ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>
          </div>
        )}

        {editingModule && (
          <div
            className="modal-overlay-instructor-module"
            onClick={(e) => e.target.classList.contains("modal-overlay-instructor-module") && setEditingModule(null)}
          >
            <div className="modal-content-instructor-module">
              <h3>Chỉnh sửa module</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setEditFormTouched(true);
                  let hasError = false;
                  if (!editForm.moduleName?.trim()) {
                    setEditFormError("Vui lòng nhập tên module");
                    hasError = true;
                  } else if (editForm.moduleName.length > 100) {
                    setEditFormError("Tên module không được vượt quá 100 ký tự.");
                    hasError = true;
                  } else {
                    setEditFormError("");
                  }
                  if (!editForm.description?.trim()) {
                    setEditFormDescError("Vui lòng nhập mô tả cho module");
                    hasError = true;
                    if (editFormDescErrorTimeout) clearTimeout(editFormDescErrorTimeout);
                    const timeout = setTimeout(() => setEditFormDescError("") , 4000);
                    setEditFormDescErrorTimeout(timeout);
                  } else {
                    setEditFormDescError("");
                    if (editFormDescErrorTimeout) clearTimeout(editFormDescErrorTimeout);
                  }
                  if (hasError) return;
                  const token = localStorage.getItem("token");
                  if (!token) {
                    navigate("/login");
                    return;
                  }
                  const moduleId = editingModule.moduleId || editingModule.id || editingModule.Id;
                  axios
                    .put(
                      `https://localhost:5000/api/manager/ManageModule/module${moduleId}/update`,
                      editForm,
                      {
                        headers: getAuthHeaders(),
                      }
                    )
                    .then(() => {
                      fetchModules();
                      setEditingModule(null);
                      setSuccessMessage("Cập nhật thành công!");
                      setTimeout(() => setSuccessMessage(""), 3000);
                    })
                    .catch((err) => {
                      if (err.response?.status === 401) {
                        navigate("/login");
                        return;
                      }
                      alert(err.response?.data?.message || err.message);
                    });
                }}
              >
                <div className="form-group-instructor-module">
                  <label>Tên module</label>
                  <input
                    name="moduleName"
                    value={editForm.moduleName}
                    onChange={(e) => {
                      setEditForm({ ...editForm, moduleName: e.target.value });
                      // Do not set error here, only on submit
                    }}
                    required
                  />
                  {editFormTouched && editFormError && (
                    <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{editFormError}</div>
                  )}
                </div>
                <div className="form-group-instructor-module">
                  <label>Mô tả</label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  />
                  {editFormTouched && editFormDescError && (
                    <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{editFormDescError}</div>
                  )}
                </div>
                <div className="modal-actions-instructor-module">
                  <button type="button" className="cancel-btn-instructor-module" onClick={() => setEditingModule(null)}>
                    Hủy
                  </button>
                  <button type="submit" className="submit-btn-instructor-module">
                    Lưu
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAddModal && (
          <div
            className="modal-overlay-instructor-module"
            onClick={(e) => e.target.classList.contains("modal-overlay-instructor-module") && setShowAddModal(false)}
          >
            <div className="modal-content-instructor-module">
              <h3>Thêm module</h3>
              <form onSubmit={submitAdd}>
                <div className="form-group-instructor-module">
                  <label>Tên module</label>
                  <input
                    name="moduleName"
                    value={newModule.moduleName}
                    onChange={handleAddChange}
                    required
                  />
                  {newModuleError && (
                    <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{newModuleError}</div>
                  )}
                </div>
                <div className="form-group-instructor-module">
                  <label>Mô tả</label>
                  <textarea
                    name="description"
                    value={newModule.description}
                    onChange={handleAddChange}
                  />
                  {newModuleDescError && (
                    <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{newModuleDescError}</div>
                  )}
                </div>
                <div className="modal-actions-instructor-module">
                  <button type="button" className="cancel-btn-instructor-module" onClick={() => setShowAddModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="submit-btn-instructor-module">
                    Thêm
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ModulePage;