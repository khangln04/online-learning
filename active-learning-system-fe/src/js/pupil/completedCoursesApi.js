import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "https://localhost:5000/api";
const API_TIMEOUT = 10000;

/**
 * Handle API errors consistently
 * @param {Error} err - The error object from axios
 * @param {string} defaultMessage - Fallback error message
 * @returns {string} - Formatted error message
 */
const handleApiError = (err, defaultMessage) => {
  const message =
    err.response?.data?.message ||
    err.response?.data ||
    err.message ||
    defaultMessage;
  return typeof message === "string" ? message : JSON.stringify(message);
};

/**
 * Get authentication headers with JWT token
 * @returns {Object} - Headers object with Authorization
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

/**
 * Fetch completed courses for current user
 * @returns {Promise<Array>} List of completed courses
 */
export const getCompletedCourses = async () => {
  try {
    const response = await axios.get(
      `${API_BASE}/CourseProgress/CompletedCourseList`,
      {
        headers: getAuthHeaders(),
        timeout: API_TIMEOUT,
      }
    );
    return response.data || [];
  } catch (err) {
    throw new Error(handleApiError(err, "Không thể tải danh sách khóa học đã hoàn thành."));
  }
};

export { API_BASE };
