import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchQuizzesByModuleId,
  fetchQuizById,
  createQuiz,
  updateQuiz,
  updateQuizTopics,
  lockUnlockQuiz,
  fetchTopicDropdown,
} from "../js/manager/quizApi";
import Instructor from "../Component/InstructorSidebar";
import "../css/manager/quizzmanager.css";

const ManagerQuizList = () => {
  const { moduleId } = useParams();
  const numericModuleId = parseInt(moduleId, 10);
  const navigate = useNavigate();
  const [moduleName, setModuleName] = useState("");
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditTopicModalOpen, setIsEditTopicModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, quizId: null, status: false });
  const [createForm, setCreateForm] = useState({
    moduleId: numericModuleId,
    title: "",
    description: "",
    timeLimit: "",
    questionCount: "",
    requiredScore: "",
    status: "false",
  });
  const [createFormError, setCreateFormError] = useState({});
  const [createFormTouched, setCreateFormTouched] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editFormError, setEditFormError] = useState({});
  const [newTopicIds, setNewTopicIds] = useState([]);
  const [editTopicQuizId, setEditTopicQuizId] = useState(null);
  const [topicUpdateError, setTopicUpdateError] = useState(""); // Add this state

  // Handle user avatar in localStorage
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || '{}');
      if (user?.avatar) {
        const fixedAvatar = user.avatar.startsWith("https")
          ? user.avatar
          : `https://localhost:5000/${user.avatar.startsWith("/") ? user.avatar.slice(1) : user.avatar}`;
        localStorage.setItem("avatar", fixedAvatar);
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      setErrorMessage("Lỗi khi tải thông tin người dùng.");
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    const allowed = !token || ["Instructor"].includes(role);

    if (!allowed) {
      setTimeout(() => navigate("/error"), 0);
    }
  }, [navigate]);

  // Load quizzes
  useEffect(() => {
    const loadQuizzes = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setErrorMessage("Bạn cần đăng nhập để xem danh sách quiz.");
          navigate('/login', { replace: true });
          return;
        }
        if (!numericModuleId) throw new Error("Module ID không hợp lệ.");
        const quizzes = await fetchQuizzesByModuleId(numericModuleId);
        setQuizzes(quizzes);
        if (quizzes.length > 0) {
          const firstQuiz = await fetchQuizById(quizzes[0].id);
          if (firstQuiz.moduleName) {
            setModuleName(firstQuiz.moduleName);
          }
        }
        setErrorMessage("");
      } catch (error) {
        console.error("Error loading quizzes:", error);
        setErrorMessage(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadQuizzes();
  }, [numericModuleId, navigate]);

  // Load topics
  useEffect(() => {
    const loadTopics = async () => {
      if (!selectedQuiz) return;

      try {
        setLoadingTopics(true);
        const topicsData = await fetchTopicDropdown(selectedQuiz.id);
        setTopics(topicsData);
        setErrorMessage("");
      } catch (error) {
        console.error("Error loading topics:", error);
        setErrorMessage(error.message);
      } finally {
        setLoadingTopics(false);
      }
    };
    loadTopics();
  }, [selectedQuiz]);

  // Handle quiz selection
  const handleSelectQuiz = useCallback(async (quizId) => {
    try {
      const quiz = await fetchQuizById(quizId);
      setSelectedQuiz(quiz);
      // Set module name from the selected quiz's moduleName
      if (quiz.moduleName) {
        setModuleName(quiz.moduleName);
      }
      const topics = await fetchTopicDropdown(quizId);
      setTopics(topics);
      const currentTopicIds = quiz.topics ? quiz.topics.map((t) => t.id) : [];
      setNewTopicIds(currentTopicIds);
      setErrorMessage("");
    } catch (error) {
      console.error("Error selecting quiz:", error);
      setErrorMessage(error.message);
    }
  }, []);

  // Select first quiz when quizzes list changes
  useEffect(() => {
    if (quizzes.length > 0 && (!selectedQuiz || !quizzes.some((q) => q.id === selectedQuiz.id))) {
      handleSelectQuiz(quizzes[0].id);
    } else if (quizzes.length === 0) {
      setSelectedQuiz(null);
    }
  }, [quizzes, selectedQuiz, handleSelectQuiz]);

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setCreateFormTouched(true);
    const errors = {};
    // Validate title
    if (!createForm.title.trim()) {
      errors.title = "Vui lòng nhập tiêu đề";
    } else if (createForm.title.length < 5) {
      errors.title = "Tiêu đề phải có ít nhất 5 ký tự";
    } else if (createForm.title.length > 200) {
      errors.title = "Tiêu đề không được vượt quá 200 ký tự";
    }
    // Validate description
    if (!createForm.description.trim()) {
      errors.description = "Vui lòng nhập mô tả";
    } else if (createForm.description.length < 5) {
      errors.description = "Mô tả phải có ít nhất 5 ký tự";
    } else if (createForm.description.length > 200) {
      errors.description = "Mô tả không được vượt quá 200 ký tự";
    }
    // Validate timeLimit
    const timeLimit = parseInt(createForm.timeLimit);
    if (isNaN(timeLimit)) {
      errors.timeLimit = "Vui lòng nhập thời gian hợp lệ";
    } else if (timeLimit < 5) {
      errors.timeLimit = "Thời gian tối thiểu là 5 phút";
    } else if (timeLimit > 30) {
      errors.timeLimit = "Thời gian tối đa là 30 phút";
    }
    // Validate questionCount
    const questionCount = parseInt(createForm.questionCount);
    if (isNaN(questionCount)) {
      errors.questionCount = "Vui lòng nhập số câu hỏi hợp lệ";
    } else if (questionCount < 5) {
      errors.questionCount = "Số câu hỏi tối thiểu là 5";
    } else if (questionCount > 30) {
      errors.questionCount = "Số câu hỏi tối đa là 30";
    }
    // Validate requiredScore
    const requiredScore = parseInt(createForm.requiredScore);
    if (isNaN(requiredScore)) {
      errors.requiredScore = "Vui lòng nhập điểm qua hợp lệ";
    } else if (requiredScore < 50) {
      errors.requiredScore = "Điểm qua tối thiểu là 50%";
    }
    setCreateFormError(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const formData = {
        moduleId: createForm.moduleId,
        title: createForm.title,
        description: createForm.description,
        timeLimit,
        questionCount,
        requiredScore,
        status: createForm.status === "true",
      };
      await createQuiz(formData);
      setSuccessMessage("Tạo quiz thành công!");
      setIsCreateModalOpen(false);
      setCreateForm({
        moduleId: numericModuleId,
        title: "",
        description: "",
        timeLimit: "",
        questionCount: "",
        requiredScore: "",
        status: "false",
      });
      setCreateFormError({});
      setCreateFormTouched(false);
      const quizzes = await fetchQuizzesByModuleId(numericModuleId);
      setQuizzes(quizzes);
      setErrorMessage("");
      setTimeout(() => setSuccessMessage("") , 3000);
    } catch (error) {
      console.error("Error creating quiz:", error);
      setErrorMessage(error.message);
    }
  };

  const handleEditQuiz = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!editForm.title || !editForm.title.trim()) {
      errors.title = "Vui lòng nhập tiêu đề";
    } else if (editForm.title.length < 5) {
      errors.title = "Tiêu đề phải có ít nhất 5 ký tự";
    } else if (editForm.title.length > 200) {
      errors.title = "Tiêu đề không được vượt quá 200 ký tự";
    }
    if (!editForm.description || !editForm.description.trim()) {
      errors.description = "Vui lòng nhập mô tả";
    } else if (editForm.description.length < 5) {
      errors.description = "Mô tả phải có ít nhất 5 ký tự";
    } else if (editForm.description.length > 200) {
      errors.description = "Mô tả không được vượt quá 200 ký tự";
    }
    const timeLimit = parseInt(editForm.timeLimit);
    if (isNaN(timeLimit)) {
      errors.timeLimit = "Vui lòng nhập thời gian hợp lệ";
    } else if (timeLimit < 5) {
      errors.timeLimit = "Thời gian tối thiểu là 5 phút";
    } else if (timeLimit > 30) {
      errors.timeLimit = "Thời gian tối đa là 30 phút";
    }
    const questionCount = parseInt(editForm.questionCount);
    if (isNaN(questionCount)) {
      errors.questionCount = "Vui lòng nhập số câu hỏi hợp lệ";
    } else if (questionCount < 5) {
      errors.questionCount = "Số câu hỏi tối thiểu là 5";
    } else if (questionCount > 30) {
      errors.questionCount = "Số câu hỏi tối đa là 30";
    }
    const requiredScore = parseInt(editForm.requiredScore);
    if (isNaN(requiredScore)) {
      errors.requiredScore = "Vui lòng nhập điểm qua hợp lệ";
    } else if (requiredScore < 50) {
      errors.requiredScore = "Điểm qua tối thiểu là 50%";
    }
    setEditFormError(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const formData = {
        ...editForm,
        moduleId: numericModuleId,
        timeLimit,
        questionCount,
        requiredScore,
        status: editForm.status === "true",
      };
      await updateQuiz(editForm.id, formData);
      setSuccessMessage("Cập nhật quiz thành công!");
      setIsEditModalOpen(false);
      const quizzes = await fetchQuizzesByModuleId(numericModuleId);
      setQuizzes(quizzes);
      setSelectedQuiz({ ...selectedQuiz, ...formData });
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating quiz:", error);
      setErrorMessage(error.message);
    }
  };

  // Update handleUpdateTopics function
  const handleUpdateTopics = async (quizzId) => {
    try {
      setTopicUpdateError(""); // Clear previous errors
      await updateQuizTopics(quizzId, newTopicIds);
      const updatedQuiz = await fetchQuizById(quizzId);
      setSuccessMessage("Cập nhật topics thành công!");
      setSelectedQuiz(updatedQuiz);
      setIsEditTopicModalOpen(false); // Close topic modal on success
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      // Chỉ hiển thị lỗi thực sự từ backend, nếu không có thì không hiển thị gì
      const msg = error?.response?.data?.message || "";
      setTopicUpdateError(msg);
    }
  };

  const handleLockUnlockQuiz = async (quizId, currentStatus) => {
    setConfirmModal({ show: true, quizId, status: currentStatus });
  };

  const confirmLockUnlock = async () => {
    try {
      const quizId = confirmModal.quizId;
      await lockUnlockQuiz(quizId);
      setSuccessMessage(`Cập nhật trạng thái quiz thành công!`);
      const quizzes = await fetchQuizzesByModuleId(numericModuleId);
      setQuizzes(quizzes);
      if (selectedQuiz && selectedQuiz.id === quizId) {
        const updatedQuiz = await fetchQuizById(quizId);
        setSelectedQuiz(updatedQuiz);
      }
      setErrorMessage("");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error locking/unlocking quiz:", error);
      setErrorMessage(error.message);
    } finally {
      setConfirmModal({ show: false, quizId: null, status: false });
    }
  };

  const handleCreateFormChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
    // Live validate as user types
    let error = "";
    if (name === "title") {
      if (!value.trim()) error = "Vui lòng nhập tiêu đề";
      else if (value.length < 5) error = "Tiêu đề phải có ít nhất 5 ký tự";
      else if (value.length > 200) error = "Tiêu đề không được vượt quá 200 ký tự";
    }
    if (name === "description") {
      if (!value.trim()) error = "Vui lòng nhập mô tả";
      else if (value.length < 5) error = "Mô tả phải có ít nhất 5 ký tự";
      else if (value.length > 200) error = "Mô tả không được vượt quá 200 ký tự";
    }
    if (name === "timeLimit") {
      const v = parseInt(value);
      if (isNaN(v)) error = "Vui lòng nhập thời gian hợp lệ";
      else if (v < 5) error = "Thời gian tối thiểu là 5 phút";
      else if (v > 30) error = "Thời gian tối đa là 30 phút";
    }
    if (name === "questionCount") {
      const v = parseInt(value);
      if (isNaN(v)) error = "Vui lòng nhập số câu hỏi hợp lệ";
      else if (v < 5) error = "Số câu hỏi tối thiểu là 5";
      else if (v > 30) error = "Số câu hỏi tối đa là 30";
    }
    if (name === "requiredScore") {
      const v = parseInt(value);
      if (isNaN(v)) error = "Vui lòng nhập điểm qua hợp lệ";
      else if (v < 50) error = "Điểm qua tối thiểu là 50%";
    }
    setCreateFormError((prev) => ({ ...prev, [name]: error }));
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    // Live validate as user types
    let error = "";
    if (name === "title") {
      if (!value.trim()) error = "Vui lòng nhập tiêu đề";
      else if (value.length < 5) error = "Tiêu đề phải có ít nhất 5 ký tự";
      else if (value.length > 200) error = "Tiêu đề không được vượt quá 200 ký tự";
    }
    if (name === "description") {
      if (!value.trim()) error = "Vui lòng nhập mô tả";
      else if (value.length < 5) error = "Mô tả phải có ít nhất 5 ký tự";
      else if (value.length > 200) error = "Mô tả không được vượt quá 200 ký tự";
    }
    if (name === "timeLimit") {
      const v = parseInt(value);
      if (isNaN(v)) error = "Vui lòng nhập thời gian hợp lệ";
      else if (v < 5) error = "Thời gian tối thiểu là 5 phút";
      else if (v > 30) error = "Thời gian tối đa là 30 phút";
    }
    if (name === "questionCount") {
      const v = parseInt(value);
      if (isNaN(v)) error = "Vui lòng nhập số câu hỏi hợp lệ";
      else if (v < 5) error = "Số câu hỏi tối thiểu là 5";
      else if (v > 30) error = "Số câu hỏi tối đa là 30";
    }
    if (name === "requiredScore") {
      const v = parseInt(value);
      if (isNaN(v)) error = "Vui lòng nhập điểm qua hợp lệ";
      else if (v < 50) error = "Điểm qua tối thiểu là 50%";
    }
    setEditFormError((prev) => ({ ...prev, [name]: error }));
  };

  // Add date formatting helper
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch (error) {
      return "Không có ngày";
    }
  };

  // Update the header in render section
  return (
    <div style={{ display: 'flex', height: '104vh', width: '97vw', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
        <div className="app-container-quiz">

          <main className="quiz-manager-container-quiz">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <button
                onClick={() => navigate(-1)}
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
              <h2 style={{ margin: 0 }}>Danh sách bài Quiz của {moduleName || "Đang tải..."}</h2>
            </div>
            {successMessage && <p className="success-message-quiz">{successMessage}</p>}
            {errorMessage && <p className="error-message-quiz">{errorMessage}</p>}
            {isLoading && <p>Đang tải dữ liệu...</p>}
            <div className="quiz-manager-header">
              <button className="edit-btn-quiz" onClick={() => setIsCreateModalOpen(true)}>
                Tạo Quiz Mới
              </button>
            </div>
            <div className="quiz-content-container">
              <div className="quiz-list-grid">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className={`quiz-card ${selectedQuiz?.id === quiz.id ? "selected-quiz" : ""}`}
                    onClick={() => handleSelectQuiz(quiz.id)}
                  >
                    <h4>{quiz.title}</h4>
                    <p><strong>Mô tả:</strong> {quiz.description || "Chưa có mô tả"}</p>
                    <p><strong>Số câu:</strong> {quiz.questionCount}</p>
                    <p><strong>Thời gian:</strong> {quiz.timeLimit}(phút)</p>
                    <p><strong>Ngày tạo:</strong> {formatDate(quiz.createAt)}</p>
                    <p><strong>Điểm qua:</strong> {quiz.requiredScore}</p>
                    <p><strong>Trạng thái:</strong> {quiz.status ? "Hoạt động" : "Không hoạt động"}</p>
                    <div className="quiz-card-actions">
                      {/* Luôn hiển thị nút Khóa/Mở khóa, các nút Sửa Quiz và Sửa Topic chỉ cho phép khi quiz chưa hoạt động */}
                      {quiz.status === false && (
                        <>
                          <button
                            className="edit-btn-quiz"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditForm(quiz);
                              setIsEditModalOpen(true);
                            }}
                          >
                            Sửa Quiz
                          </button>
                          <button
                            className="edit-btn-quiz"
                            style={{ backgroundColor: '#fbbf24', color: '#fff' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditTopicQuizId(quiz.id);
                              setNewTopicIds(quiz.topics ? quiz.topics.map((t) => t.id) : []);
                              setIsEditTopicModalOpen(true);
                            }}
                          >
                            Sửa Topic
                          </button>
                        </>
                      )}
                      <button
                        className="lock-unlock-btn-quiz"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLockUnlockQuiz(quiz.id, quiz.status);
                        }}
                      >
                        {quiz.status ? "Khóa" : "Mở khóa"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="topic-list-section">
                <h3>Topics của {selectedQuiz ? `Quiz: ${selectedQuiz.title}` : "Chưa chọn Quiz"}</h3>
                {selectedQuiz ? (
                  loadingTopics ? (
                    <p>Đang tải topics...</p>
                  ) : (
                    <div className="topic-display">
                      {selectedQuiz.topics && selectedQuiz.topics.length > 0 ? (
                        <ul>
                          {selectedQuiz.topics.map((topic, index) => (
                            <li key={index}>{topic.name}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>Không có topic nào cho quiz này.</p>
                      )}
                    </div>
                  )
                ) : (
                  <p>Vui lòng chọn một quiz để xem topics.</p>
                )}
              </div>
            </div>
          </main>
        </div>
        {/* Modals and Confirm Modal inside the right panel */}
        {isCreateModalOpen && (
          <div className="modal-overlay-quiz" onClick={() => setIsCreateModalOpen(false)}>
            <div className="modal-quiz" onClick={(e) => e.stopPropagation()}>
              <h3>Tạo Quiz Mới</h3>
              <form className="form-container-quiz" onSubmit={handleCreateQuiz}>
                <div>
                  <label>Tiêu đề:</label>
                  <input
                    type="text"
                    name="title"
                    value={createForm.title}
                    onChange={handleCreateFormChange}
                    onBlur={() => setCreateFormTouched(true)}
                    required
                  />
                  {createFormError.title && (
                    <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{createFormError.title}</div>
                  )}
                </div>
                <div>
                  <label>Mô tả:</label>
                  <input
                    type="text"
                    name="description"
                    value={createForm.description}
                    onChange={handleCreateFormChange}
                    onBlur={() => setCreateFormTouched(true)}
                  />
                  {createFormError.description && (
                    <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{createFormError.description}</div>
                  )}
                </div>
                <div>
                  <label>Thời gian (phút):</label>
                  <input
                    type="number"
                    name="timeLimit"
                    value={createForm.timeLimit}
                    onChange={handleCreateFormChange}
                    onBlur={() => setCreateFormTouched(true)}
                    required
                  />
                  {createFormError.timeLimit && (
                    <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{createFormError.timeLimit}</div>
                  )}
                </div>
                <div>
                  <label>Số câu hỏi:</label>
                  <input
                    type="number"
                    name="questionCount"
                    value={createForm.questionCount}
                    onChange={handleCreateFormChange}
                    onBlur={() => setCreateFormTouched(true)}
                    required
                  />
                  {createFormError.questionCount && (
                    <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{createFormError.questionCount}</div>
                  )}
                </div>
                <div>
                  <label>Điểm qua:</label>
                  <input
                    type="number"
                    name="requiredScore"
                    value={createForm.requiredScore}
                    onChange={handleCreateFormChange}
                    onBlur={() => setCreateFormTouched(true)}
                    required
                  />
                  {createFormError.requiredScore && (
                    <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{createFormError.requiredScore}</div>
                  )}
                </div>
              
                <div className="form-buttons-quiz">
                  <button type="submit" className="edit-btn-quiz">Tạo</button>
                  <button
                    type="button"
                    className="delete-btn-quiz"
                    onClick={() => setIsCreateModalOpen(false)}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {isEditModalOpen && (
          <div className="modal-overlay-quiz" onClick={() => setIsEditModalOpen(false)}>
            <div className="modal-quiz" onClick={(e) => e.stopPropagation()}>
              <h3>Sửa Quiz</h3>
              <form className="form-container-quiz" onSubmit={handleEditQuiz}>
                <div>
                  <label>Tiêu đề:</label>
                  <input
                    type="text"
                    name="title"
                    value={editForm.title || ""}
                    onChange={handleEditFormChange}
                    required
                  />
                  {editFormError.title && (
                    <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{editFormError.title}</div>
                  )}
                </div>
                <div>
                  <label>Mô tả:</label>
                  <input
                    type="text"
                    name="description"
                    value={editForm.description || ""}
                    onChange={handleEditFormChange}
                  />
                  {editFormError.description && (
                    <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{editFormError.description}</div>
                  )}
                </div>
                <div>
                  <label>Thời gian (phút):</label>
                  <input
                    type="number"
                    name="timeLimit"
                    value={editForm.timeLimit || ""}
                    onChange={handleEditFormChange}
                    required
                  />
                  {editFormError.timeLimit && (
                    <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{editFormError.timeLimit}</div>
                  )}
                </div>
                <div>
                  <label>Số câu hỏi:</label>
                  <input
                    type="number"
                    name="questionCount"
                    value={editForm.questionCount || ""}
                    onChange={handleEditFormChange}
                    required
                  />
                  {editFormError.questionCount && (
                    <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{editFormError.questionCount}</div>
                  )}
                </div>
                <div>
                  <label>Điểm qua:</label>
                  <input
                    type="number"
                    name="requiredScore"
                    value={editForm.requiredScore || ""}
                    onChange={handleEditFormChange}
                    required
                  />
                  {editFormError.requiredScore && (
                    <div style={{ color: 'red', fontSize: 13, marginTop: 4 }}>{editFormError.requiredScore}</div>
                  )}
                </div>
                <div>
                  <label>Trạng thái:</label>
                  <select
                    name="status"
                    value={editForm.status ? "true" : "false"}
                    onChange={handleEditFormChange}
                    className="status-select"
                    required
                  >
                    <option value="false">Không hoạt động</option>
                    <option value="true">Hoạt động</option>
                  </select>
                </div>
                {/* Hiển thị lỗi edit ngay trong modal */}
                {errorMessage && (
                  <p className="error-message-quiz" style={{ marginTop: 8 }}>{errorMessage}</p>
                )}
                <div className="form-buttons-quiz">
                  <button type="submit" className="edit-btn-quiz">Lưu</button>
                  <button
                    type="button"
                    className="delete-btn-quiz"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Topic Modal */}
        {isEditTopicModalOpen && (
          <div className="modal-overlay-quiz" onClick={() => setIsEditTopicModalOpen(false)}>
            <div className="modal-quiz" onClick={(e) => e.stopPropagation()}>
              <h3>Sửa Topic Quiz</h3>
              <form className="form-container-quiz" onSubmit={e => { e.preventDefault(); handleUpdateTopics(editTopicQuizId); }}>
                <div>
                  <label>Topics:</label>
                  <select
                    multiple
                    value={newTopicIds}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                      setNewTopicIds(selectedOptions);
                    }}
                    className="status-select"
                    style={{ height: "150px", width: "100%" }}
                  >
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name} - {topic.className} - {topic.categoryName}
                      </option>
                    ))}
                  </select>
                  <small>Giữ Ctrl để chọn nhiều topics</small>
                  {topicUpdateError && <p className="error-message-quiz">{topicUpdateError}</p>}
                </div>
                <div className="form-buttons-quiz">
                  <button type="submit" className="edit-btn-quiz" disabled={!editTopicQuizId}>Cập nhật Topics</button>
                  <button
                    type="button"
                    className="delete-btn-quiz"
                    onClick={() => setIsEditTopicModalOpen(false)}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Confirm Modal */}
        {confirmModal.show && (
          <div className="modal-overlay-quiz" onClick={() => setConfirmModal({ show: false, quizId: null, status: false })}>
            <div className="modal-quiz" onClick={(e) => e.stopPropagation()}>
              <h3>Xác nhận</h3>
              <p>Bạn có chắc muốn {confirmModal.status ? "khóa" : "mở khóa"} quiz này không?</p>
              <div className="form-buttons-quiz">
                <button className="edit-btn-quiz" onClick={confirmLockUnlock}>
                  Xác nhận
                </button>
                <button
                  className="delete-btn-quiz"
                  onClick={() => setConfirmModal({ show: false, quizId: null, status: false })}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerQuizList;