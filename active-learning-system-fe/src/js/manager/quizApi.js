import axios from "axios";

const API_BASE_URL = "https://localhost:5000/api/ManageQuizz";

// Hàm tiện ích để kiểm tra token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Bạn cần đăng nhập để thực hiện thao tác này.");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Lấy tất cả quiz
export const fetchAllQuizzes = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/quizz/all`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    let message = "";
    if (error.response && error.response.data) {
      if (typeof error.response.data === "string") {
        message = error.response.data;
      } else if (error.response.data.message) {
        message = error.response.data.message;
      } else {
        message = JSON.stringify(error.response.data);
      }
    } else if (error.message) {
      message = error.message;
    } else {
      message = error.toString();
    }
    console.error("Error fetching quizzes:", message);
    throw new Error(message);
  }
};

// Lấy danh sách quiz theo moduleId
export const fetchQuizzesByModuleId = async (moduleId) => {
  try {
    if (!moduleId || isNaN(moduleId)) {
      throw new Error("Module ID không hợp lệ.");
    }
    const response = await axios.get(`${API_BASE_URL}/quizz/${moduleId}/details`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    let message = "";
    if (error.response && error.response.data) {
      if (typeof error.response.data === "string") {
        message = error.response.data;
      } else if (error.response.data.message) {
        message = error.response.data.message;
      } else {
        message = JSON.stringify(error.response.data);
      }
    } else if (error.message) {
      message = error.message;
    } else {
      message = error.toString();
    }
    console.error("Error fetching quizzes for module:", message);
    throw new Error(message);
  }
};

// Lấy chi tiết quiz theo quizId
export const fetchQuizById = async (quizId) => {
  try {
    if (!quizId || isNaN(quizId)) {
      throw new Error("Quiz ID không hợp lệ.");
    }
    const response = await axios.get(`${API_BASE_URL}/quizz/${quizId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    let message = "";
    if (error.response && error.response.data) {
      if (typeof error.response.data === "string") {
        message = error.response.data;
      } else if (error.response.data.message) {
        message = error.response.data.message;
      } else {
        message = JSON.stringify(error.response.data);
      }
    } else if (error.message) {
      message = error.message;
    } else {
      message = error.toString();
    }
    console.error("Error fetching quiz:", message);
    throw new Error(message);
  }
};

// Tạo quiz mới
export const createQuiz = async (quizData) => {
  try {
    if (!quizData.moduleId || !quizData.title || !quizData.timeLimit || !quizData.questionCount || !quizData.requiredScore) {
      throw new Error("Dữ liệu quiz không đầy đủ.");
    }
    const response = await axios.post(`${API_BASE_URL}/quizz/create`, quizData, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    let message = "";
    if (error.response && error.response.data) {
      if (typeof error.response.data === "string") {
        message = error.response.data;
      } else if (error.response.data.message) {
        message = error.response.data.message;
      } else {
        message = JSON.stringify(error.response.data);
      }
    } else if (error.message) {
      message = error.message;
    } else {
      message = error.toString();
    }
    console.error("Error creating quiz:", message);
    throw new Error(message);
  }
};

// Cập nhật quiz
export const updateQuiz = async (quizzId, quizData) => {
  try {
    if (!quizzId || isNaN(quizzId)) {
      throw new Error("Quiz ID không hợp lệ.");
    }
    if (!quizData.title || !quizData.timeLimit || !quizData.questionCount || !quizData.requiredScore) {
      throw new Error("Dữ liệu quiz không đầy đủ.");
    }
    await axios.put(`${API_BASE_URL}/quizz/update/${quizzId}`, quizData, {
      headers: getAuthHeaders(),
    });
  } catch (error) {
    let message = "";
    if (error.response && error.response.data) {
      if (typeof error.response.data === "string") {
        message = error.response.data;
      } else if (error.response.data.message) {
        message = error.response.data.message;
      } else {
        message = JSON.stringify(error.response.data);
      }
    } else if (error.message) {
      message = error.message;
    } else {
      message = error.toString();
    }
    console.error("Error updating quiz:", message);
    throw new Error(message);
  }
};

// Cập nhật topics cho quiz
export const updateQuizTopics = async (quizzId, topicIds) => {
  try {
    if (!quizzId || isNaN(quizzId)) {
      throw new Error("Quiz ID không hợp lệ.");
    }
    if (!Array.isArray(topicIds) || topicIds.length === 0) {
      throw new Error("Danh sách topic không hợp lệ.");
    }
    await axios.put(`${API_BASE_URL}/quizz/${quizzId}/topics/update`, topicIds, {
      headers: getAuthHeaders(),
    });
  } catch (error) {
    let message = "";
    if (error.response && error.response.data) {
      if (typeof error.response.data === "string") {
        message = error.response.data;
      } else if (error.response.data.message) {
        message = error.response.data.message;
      } else {
        message = JSON.stringify(error.response.data);
      }
    } else if (error.message) {
      message = error.message;
    } else {
      message = error.toString();
    }
    console.error("Error updating topics for quiz:", message);
    throw new Error(message);
  }
};

// Xóa quiz
export const lockUnlockQuiz = async (quizzId) => {
  try {
    if (!quizzId || isNaN(quizzId)) {
      throw new Error("Quiz ID không hợp lệ.");
    }
    const response = await axios.put(`${API_BASE_URL}/quizz/lockUnlock/${quizzId}`, {}, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    let message = "";
    if (error.response && error.response.data) {
      if (typeof error.response.data === "string") {
        message = error.response.data;
      } else if (error.response.data.message) {
        message = error.response.data.message;
      } else {
        message = JSON.stringify(error.response.data);
      }
    } else if (error.message) {
      message = error.message;
    } else {
      message = error.toString();
    }
    console.error("Error locking/unlocking quiz:", message);
    throw new Error(message);
  }
};
// Lấy danh sách topic
export const fetchTopicDropdown = async (quizId) => {
  try {
    if (!quizId) throw new Error("Quiz ID không hợp lệ");
    const response = await axios.get(`${API_BASE_URL}/topic-class`, {
      params: { quizzId: quizId },
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    let message = "";
    if (error.response && error.response.data) {
      if (typeof error.response.data === "string") {
        message = error.response.data;
      } else if (error.response.data.message) {
        message = error.response.data.message;
      } else {
        message = JSON.stringify(error.response.data);
      }
    } else if (error.message) {
      message = error.message;
    } else {
      message = error.toString();
    }
    console.error("Error fetching topics:", message);
    throw new Error(message);
  }
};