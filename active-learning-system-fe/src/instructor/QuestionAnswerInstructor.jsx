

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/instructor/questionanswerinstructor.css";
import Instructor from "../Component/InstructorSidebar";

const defaultAnswer = { content: "", isCorrect: false };


const QuestionAnswerInstructor = () => {
  const navigate = useNavigate();


  const [questions, setQuestions] = useState([]);
  const [topics, setTopics] = useState([]);
  // const [loading, setLoading] = useState(true); // removed unused variable
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    content: "",
    topicId: 0,
    answers: [{ ...defaultAnswer }],
  });
  // Lỗi khi submit modal
  const [modalError, setModalError] = useState("");
  // Xác nhận xóa
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  // Tổng số trang từ backend
  const [totalPages, setTotalPages] = useState(1);
  // const pageSize = 10; // removed unused variable
  // Search/filter state
  const [search, setSearch] = useState("");
  const [filterTopic, setFilterTopic] = useState(0);


  // Lấy danh sách chủ đề
 const fetchTopics = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.get("https://localhost:5000/api/ManageTopic/GetAll", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setTopics(res.data || []);
  } catch {
    setTopics([]);
  }
};

  // Lấy danh sách câu hỏi (có phân trang, keyword, topicId)
  const fetchQuestions = async (page = 1, keyword = search, topicId = filterTopic) => {
    try {
      const token = localStorage.getItem("token");
      let url = `https://localhost:5000/api/ManageQuestion/all?pageIndex=${page}&pageSize=5`;
      if (keyword && keyword.trim() !== "") url += `&keyword=${encodeURIComponent(keyword)}`;
      if (topicId && topicId !== 0) url += `&topicId=${topicId}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setErrorMsg("Không thể tải danh sách câu hỏi.");
  }
  };



  useEffect(() => {
    // Kiểm tra role trước khi cho truy cập
    const role = localStorage.getItem("role");
    if (role !== "Instructor") {
      navigate("/error");
      return;
    }
    fetchTopics();
    fetchQuestions(currentPage);
    // eslint-disable-next-line
  }, [currentPage, navigate, filterTopic]);

  // Chỉ search khi click nút hoặc nhấn Enter, không tự động khi nhập
  // useEffect cho filterTopic để lọc khi chọn chủ đề
  useEffect(() => {
    fetchQuestions(1, search, filterTopic);
    setCurrentPage(1);
    // eslint-disable-next-line
  }, [filterTopic]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAnswerChange = (index, field, value) => {
    setForm((prev) => {
      const updatedAnswers = [...prev.answers];
      updatedAnswers[index][field] = field === "isCorrect" ? value === "true" : value;
      return { ...prev, answers: updatedAnswers };
    });
  };

  const addAnswer = () => {
    setForm((prev) => ({
      ...prev,
      answers: [...prev.answers, { ...defaultAnswer }],
    }));
  };

  const removeAnswer = (index) => {
    setForm((prev) => ({
      ...prev,
      answers: prev.answers.filter((_, i) => i !== index),
    }));
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const showError = (msg, inModal = false) => {
    if (inModal) {
      setModalError(msg);
      setTimeout(() => setModalError("") , 4000);
    } else {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError("");
    // Validate nội dung
    const content = form.content.trim();
    if (content.length < 6 || content.length > 99) {
      setModalError("Nội dung phải từ 6 đến 99 ký tự");
      return;
    }
    // Validate chủ đề
    if (!form.topicId || Number(form.topicId) === 0) {
      setModalError("Vui lòng chọn chủ đề");
      return;
    }
    // Check trùng nội dung + chủ đề (bỏ qua chính nó khi edit)
    const isDuplicate = questions.some(q =>
      q.content.trim().toLowerCase() === content.toLowerCase() &&
      String(q.topicId) === String(form.topicId) &&
      (!editing || q.id !== editing)
    );
    if (isDuplicate) {
      setModalError("Câu hỏi đã tồn tại");
      return;
    }
    const token = localStorage.getItem("token");
    const payload = {
      question: {
        content: form.content,
        topicId: Number(form.topicId),
      },
      answers: form.answers,
    };

    try {
      if (editing) {
        await axios.put(`https://localhost:5000/api/ManageQuestion/update/${editing}`, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        showSuccess("Cập nhật câu hỏi thành công.");
      } else {
        await axios.post(`https://localhost:5000/api/ManageQuestion/add`, payload, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        showSuccess("Thêm câu hỏi thành công.");
      }

      setForm({ content: "", topicId: 0, answers: [{ ...defaultAnswer }] });
      setEditing(null);
      setShowModal(false);
      fetchQuestions(currentPage);
    } catch (err) {
      showError(err?.response?.data?.message || "Thao tác thất bại.", true);
    }
  };


  const handleEdit = async (id) => {
    try {
      const res = await axios.get(`https://localhost:5000/api/ManageQuestion/detail/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = res.data.data;
      setForm({
        content: data.content,
        topicId: data.topicId,
        answers: data.answers,
      });
      setEditing(data.id);
      setShowModal(true);
    } catch (err) {
      showError(err?.response?.data?.message || "Không thể tải chi tiết.");
    }
  };


  const handleDelete = async (id) => {
    setConfirmDelete({ show: true, id });
  };

  const confirmDeleteAction = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ show: false, id: null });
    try {
      await axios.delete(`https://localhost:5000/api/ManageQuestion/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      showSuccess("Xóa thành công.");
      fetchQuestions(currentPage);
    } catch (err) {
      showError(err?.response?.data?.message || "Xóa thất bại.");
    }
  };



  // Không cần paginated FE, chỉ dùng questions trả về từ backend

  // Hàm tạo mảng số trang hiển thị động
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f3f4f6' }}>
      <Instructor />
      <div className="question-instructor" style={{ flex: 1 }}>
        <div className="header">
          <h2>📚 Quản lý câu hỏi</h2>
          <button onClick={() => setShowModal(true)}>+ Thêm câu hỏi</button>
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 18 }}>
          <input
            type="text"
            placeholder="Tìm kiếm nội dung..."
            value={search}
            onChange={e => {
              const val = e.target.value;
              if (val === '' || val.trim() !== '') setSearch(val);
            }}
            style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 16, minWidth: 220 }}
            maxLength={100}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (search.trim() !== '' || filterTopic !== 0) {
                  fetchQuestions(1, search, filterTopic);
                  setCurrentPage(1);
                }
              }
            }}
          />
          <button
            className="search-btn"
            onClick={() => {
              // Nếu không có dữ liệu search thì trả về tất cả
              if (search.trim() === "") {
                fetchQuestions(1, "", filterTopic);
                setCurrentPage(1);
              } else {
                fetchQuestions(1, search, filterTopic);
                setCurrentPage(1);
              }
            }}
          >Tìm kiếm</button>
          <select
            value={filterTopic}
            onChange={e => setFilterTopic(Number(e.target.value))}
            style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 16 }}
          >
            <option value={0}>-- tất cả --</option>
            {topics.map(topic => (
              <option key={topic.id} value={topic.id}>{topic.name}</option>
            ))}
          </select>
        </div>

        {errorMsg && <div className="notify error">{errorMsg}</div>}
        {successMsg && <div className="notify success">{successMsg}</div>}

        <table>
          <thead>
            <tr>
              <th>Nội dung</th>
              <th>Chủ đề</th>
              <th>Đáp án</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id}>
                <td>{q.content}</td>
                <td>{q.topicName}</td>
                <td>
                  {q.answers.map((a, i) => (
                    <div key={i}>
                      <b className={a.isCorrect ? 'answer-correct' : 'answer-wrong'}>{a.isCorrect ? "✔" : "✖"}</b> {a.content}
                    </div>
                  ))}
                </td>
                <td className="action-buttons">
                  <button onClick={() => handleEdit(q.id)} title="Sửa">
                    <span role="img" aria-label="edit" style={{marginRight: 4}}>✏️</span> Sửa
                  </button>
                  <button onClick={() => handleDelete(q.id)} title="Xóa">
                    <span role="img" aria-label="delete" style={{marginRight: 4}}>🗑️</span> Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >Đầu</button>
          <button
            onClick={() => setCurrentPage(p => p - 1)}
            disabled={currentPage === 1}
          >Trước</button>
          {getPageNumbers().map((num, idx) =>
            num === '...'
              ? <span key={"ellipsis-" + idx}>...</span>
              : <button
                  key={"page-" + num + "-" + idx}
                  className={num === currentPage ? 'active' : ''}
                  onClick={() => setCurrentPage(num)}
                  disabled={num === currentPage}
                >{num}</button>
          )}
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={currentPage === totalPages}
          >Sau</button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >Cuối</button>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={(e) => e.target.classList.contains("modal-overlay") && setShowModal(false)}>
            <div className="modal">
              <h3>{editing ? "Chỉnh sửa" : "Thêm"} câu hỏi</h3>
              {modalError && <div className="notify error">{modalError}</div>}
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 12 }}>
                  <label htmlFor="content" style={{ marginBottom: 4, fontWeight: 500 }}>Nội dung</label>
                  <input
                    id="content"
                    type="text"
                    name="content"
                    placeholder="Nội dung câu hỏi"
                    value={form.content}
                    onChange={handleChange}
                    required
                    style={{ minWidth: 180 }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 12 }}>
                  <label htmlFor="topicId" style={{ marginBottom: 4, fontWeight: 500 }}>Chủ đề</label>
                  <select id="topicId" name="topicId" value={form.topicId} onChange={handleChange} required style={{ minWidth: 180 }}>
                    <option value={0}>-- Chọn chủ đề --</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="answers">
                  <h4>Đáp án</h4>
                  {form.answers.map((a, idx) => (
                    <div key={idx} className="answer-item">
                      <input
                        type="text"
                        value={a.content}
                        placeholder="Nội dung đáp án"
                        onChange={(e) =>
                          handleAnswerChange(idx, "content", e.target.value)
                        }
                        required
                      />
                      <select
                        value={a.isCorrect.toString()}
                        onChange={(e) =>
                          handleAnswerChange(idx, "isCorrect", e.target.value)
                        }
                      >
                        <option value="true">Đúng</option>
                        <option value="false">Sai</option>
                      </select>
                      {form.answers.length > 1 && (
                        <button type="button" onClick={() => removeAnswer(idx)}>🗑️</button>
                      )}
                    </div>
                  ))}
                  {form.answers.length < 4 && (
                    <button type="button" onClick={addAnswer}>+ Thêm đáp án</button>
                  )}
                </div>

                <div className="actions">
                  <button type="submit">{editing ? "Lưu" : "Thêm"}</button>
                  <button type="button" onClick={() => {
                    setShowModal(false);
                    setEditing(null);
                    setForm({ content: "", topicId: 0, answers: [{ ...defaultAnswer }] });
                    setModalError("");
                  }}>Hủy</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal xác nhận xóa */}
        {confirmDelete.show && (
          <div className="modal-overlay" onClick={(e) => e.target.classList.contains("modal-overlay") && setConfirmDelete({ show: false, id: null })}>
            <div className="modal">
              <h3>Xác nhận xóa</h3>
              <p>Bạn có chắc chắn muốn xóa câu hỏi này?</p>
              <div className="actions">
                <button onClick={confirmDeleteAction}>Xóa</button>
                <button onClick={() => setConfirmDelete({ show: false, id: null })}>Hủy</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionAnswerInstructor;
