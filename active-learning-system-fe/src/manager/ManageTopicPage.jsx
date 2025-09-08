import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import HeaderInstruc from "../Component/HeaderInstruc";
import "../css/manager/ManagerCourseList.css";
import "../css/manager/Module.css";
import Instructor from "../Component/InstructorSidebar";

function ManageTopicPage() {
  const [topics, setTopics] = useState([]);
  const [classList, setClassList] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTopic, setNewTopic] = useState({ name: "", classId: "", categoryId: "" });
  const [editTopic, setEditTopic] = useState(null);
  const [topicError, setTopicError] = useState("");
  const [editTopicError, setEditTopicError] = useState("");

  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(topics.length / pageSize)), [topics]);
  const paginatedTopics = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return topics.slice(start, start + pageSize);
  }, [topics, currentPage]);
  const navigate = useNavigate();

  
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    const allowed = !token || ["Instructor"].includes(role);

    if (!allowed) {
      setTimeout(() => navigate("/error"), 0);
    }
  }, [navigate]);

  useEffect(() => {
    // Đảm bảo fetch class/category xong mới fetch topics để map id
    const fetchAll = async () => {
      await fetchClassList();
      await fetchCategoryList();
      await fetchTopics();
    };
    fetchAll();
    // eslint-disable-next-line
  }, []);

  const fetchTopics = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("https://localhost:5000/api/ManageTopic/GetAll", {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Map lại để đảm bảo có classId, categoryId, className, categoryName
      const mapped = (data || []).map(t => {
        let classId = t.classId;
        let categoryId = t.categoryId;
        let className = t.className;
        let categoryName = t.categoryName;
        if ((!classId || classId === "") && t.className && classList.length > 0) {
          const found = classList.find(cls => cls.name === t.className);
          if (found) classId = found.id;
        }
        if ((!categoryId || categoryId === "") && t.categoryName && categoryList.length > 0) {
          const found = categoryList.find(cat => cat.name === t.categoryName);
          if (found) categoryId = found.id;
        }
        // Nếu thiếu className, categoryName thì map từ id
        if ((!className || className === "") && classId && classList.length > 0) {
          const found = classList.find(cls => String(cls.id) === String(classId));
          if (found) className = found.name;
        }
        if ((!categoryName || categoryName === "") && categoryId && categoryList.length > 0) {
          const found = categoryList.find(cat => String(cat.id) === String(categoryId));
          if (found) categoryName = found.name;
        }
        return { ...t, classId, categoryId, className, categoryName };
      });
      setTopics(mapped);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách chủ đề");
    } finally {
      setLoading(false);
    }
  };

  const fetchClassList = async () => {
    try {
      const { data } = await axios.get("https://localhost:5000/api/manager/course/list-class");
      setClassList(data || []);
    } catch (err) {
      console.error("Không thể tải danh sách lớp", err);
    }
  };

  const fetchCategoryList = async () => {
    try {
      const { data } = await axios.get("https://localhost:5000/api/manager/course/list-category");
      setCategoryList(data || []);
    } catch (err) {
      console.error("Không thể tải danh mục", err);
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    // Validate
    setTopicError("");
    const name = newTopic.name.trim();
    if (name.length < 6 || name.length > 99) {
      setTopicError("Tên chủ đề phải từ 6 đến 99 ký tự");
      return;
    }
    const isDuplicate = topics.some(
      (t) =>
        t.name.trim().toLowerCase() === name.toLowerCase() &&
        String(t.classId) === String(newTopic.classId) &&
        String(t.categoryId) === String(newTopic.categoryId)
    );
    if (isDuplicate) {
      setTopicError("Chủ đề này đã tồn tại");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "https://localhost:5000/api/ManageTopic/Create",
        {
          ...newTopic,
          classId: Number(newTopic.classId),
          categoryId: Number(newTopic.categoryId),
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchTopics();
      setShowAddModal(false);
      setNewTopic({ name: "", classId: "", categoryId: "" });
      setSuccessMessage("Thêm chủ đề thành công!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      const msg = err.response?.data?.message;
      if (
        (msg && (msg.includes("đã tồn tại") || msg.toLowerCase().includes("exist"))) ||
        (err.response && err.response.status === 500)
      ) {
        setTopicError("Chủ đề này đã tồn tại");
      } else {
        alert(msg || err.message);
      }
    }
  };

  const handleEditTopic = async (e) => {
    e.preventDefault();
    setEditTopicError("");
    const name = editTopic.name.trim();
    if (name.length < 6 || name.length > 99) {
      setEditTopicError("Tên chủ đề phải từ 6 đến 99 ký tự");
      return;
    }
    const isDuplicate = topics.some(
      (t) =>
        t.id !== editTopic.id &&
        t.name.trim().toLowerCase() === name.toLowerCase() &&
        String(t.classId) === String(editTopic.classId) &&
        String(t.categoryId) === String(editTopic.categoryId)
    );
    if (isDuplicate) {
      setEditTopicError("Chủ đề này đã tồn tại");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://localhost:5000/api/ManageTopic/Update/${editTopic.id}`,
        {
          name: editTopic.name,
          classId: Number(editTopic.classId),
          categoryId: Number(editTopic.categoryId),
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      fetchTopics();
      setShowEditModal(false);
      setEditTopic(null);
      setSuccessMessage("Cập nhật chủ đề thành công!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      const msg = err.response?.data?.message;
      if (
        (msg && (msg.includes("đã tồn tại") || msg.toLowerCase().includes("exist"))) ||
        (err.response && err.response.status === 500)
      ) {
        setEditTopicError("Chủ đề này đã tồn tại");
      } else {
        alert(msg || err.message);
      }
    }
  };

  return (
    <>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <div style={{ width: 270, minWidth: 220, maxWidth: 320, height: '100vh', position: 'sticky', top: 0, left: 0, zIndex: 100 }}>
          <Instructor />
        </div>
        <main className="course-list-container" style={{ flex: 1, padding: '20px' }}>
          <div className="course-list-header">
            <h2>Danh sách Chủ đề</h2>
            <button className="add-btn" onClick={() => setShowAddModal(true)}>
              Thêm chủ đề
            </button>
          </div>

          {successMessage && <div className="success-message-fixed">{successMessage}</div>}

          {loading ? (
            <p>Đang tải dữ liệu...</p>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : topics.length === 0 ? (
            <div className="empty-module">
              <h2>Chưa có chủ đề nào</h2>
              <button className="add-btn" onClick={() => setShowAddModal(true)}>Thêm chủ đề</button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Tên chủ đề</th>
                    <th>Lớp</th>
                    <th>Danh mục</th>
                    <th>Ngày tạo</th>
                    <th>Ngày cập nhật</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTopics.map((t) => (
                    <tr key={t.id}>
                      <td>{t.name}</td>
                      <td>{t.className}</td>
                      <td>{t.categoryName}</td>
                      <td>{new Date(t.createdDate).toLocaleDateString("vi-VN")}</td>
                      <td>
                        {t.updatedDate
                          ? new Date(t.updatedDate).toLocaleDateString("vi-VN")
                          : "Chưa cập nhật"}
                      </td>
                      <td>
                        <button
                          className="action-btn update-btn"
                          onClick={() => {
                            setEditTopic({
                              ...t,
                              classId: t.classId !== undefined && t.classId !== null ? String(t.classId) : "",
                              categoryId: t.categoryId !== undefined && t.categoryId !== null ? String(t.categoryId) : ""
                            });
                            setShowEditModal(true);
                          }}
                        >
                          ✏️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pagination">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  Trước
                </button>
                <span>Trang {currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  Sau
                </button>
              </div>
            </div>
          )}

          {/* Modal Thêm chủ đề */}
          {showAddModal && (
            <div className="modal-overlay" onClick={(e) => e.target.classList.contains("modal-overlay") && setShowAddModal(false)}>
              <div className="modal-content">
                <h3>Thêm Chủ đề</h3>
                <form onSubmit={handleAddTopic}>
                  <div className="form-group">
                    <label>Tên chủ đề</label>
                    <input name="name" required value={newTopic.name} onChange={(e) => setNewTopic({ ...newTopic, name: e.target.value })} />
                    {topicError && <div style={{color:'red', fontSize:13, marginTop:4}}>{topicError}</div>}
                  </div>
                  <div className="form-group">
                    <label>Lớp</label>
                    <select required value={newTopic.classId} onChange={(e) => setNewTopic({ ...newTopic, classId: e.target.value })}>
                      <option value="">-- Chọn lớp --</option>
                      {classList.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Danh mục</label>
                    <select required value={newTopic.categoryId} onChange={(e) => setNewTopic({ ...newTopic, categoryId: e.target.value })}>
                      <option value="">-- Chọn danh mục --</option>
                      {categoryList.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>Hủy</button>
                    <button type="submit" className="submit-btn">Thêm</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Sửa chủ đề */}
          {showEditModal && editTopic && (
            <div className="modal-overlay" onClick={(e) => e.target.classList.contains("modal-overlay") && setShowEditModal(false)}>
              <div className="modal-content">
                <h3>Cập nhật Chủ đề</h3>
                <form onSubmit={handleEditTopic}>
                  <div className="form-group">
                    <label>Tên chủ đề</label>
                    <input name="name" required value={editTopic.name} onChange={(e) => setEditTopic({ ...editTopic, name: e.target.value })} />
                    {editTopicError && <div style={{color:'red', fontSize:13, marginTop:4}}>{editTopicError}</div>}
                  </div>
                  <div className="form-group">
                    <label>Lớp</label>
                    <select required value={editTopic.classId} onChange={(e) => setEditTopic({ ...editTopic, classId: e.target.value })}>
                      <option value="">-- Chọn lớp --</option>
                      {classList.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Danh mục</label>
                    <select required value={editTopic.categoryId} onChange={(e) => setEditTopic({ ...editTopic, categoryId: e.target.value })}>
                      <option value="">-- Chọn danh mục --</option>
                      {categoryList.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="modal-actions">
                    <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>Hủy</button>
                    <button type="submit" className="submit-btn">Lưu</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default ManageTopicPage;
