import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "https://localhost:5000/api"; // Đảm bảo giao thức đúng
const API_TIMEOUT = 10000; // Tăng timeout lên 10s để tránh lỗi mạng nhanh

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
 * Fetch user profile based on token and store in localStorage
 * @returns {Promise<object|null>} User data or null if error
 */
export const fetchUserProfile = async (retry = true) => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const response = await axios.get(`${API_BASE}/Profile/my-profile`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: API_TIMEOUT,
    });
    const data = response.data;
    localStorage.setItem("user", JSON.stringify(data)); // Ensure role is in data
    return data;
  } catch (err) {
    if (!retry || err.code !== "ECONNABORTED") {
      throw new Error(handleApiError(err, "Không thể kết nối đến server. Vui lòng thử lại."));
    }
    console.warn("Thử lại yêu cầu profile do lỗi mạng...");
    return fetchUserProfile(false);
  }
};

/**
 * Handle post-login tasks, storing necessary data
 * @param {object} loginResponse - Response from login API
 * @returns {Promise<void>}
 */
export const handlePostLogin = async (loginResponse) => {
  if (!loginResponse?.token) {
    throw new Error("Token không hợp lệ trong phản hồi đăng nhập.");
  }
  localStorage.setItem("username", loginResponse.username || "");
  localStorage.setItem("token", loginResponse.token);
  await fetchUserProfile();
};

/**
 * Fetch enrolled courses
 * @returns {Promise<array>} List of enrolled courses
 */
export const getMyCourses = async () => {
  const token = localStorage.getItem("token");
  if (!token) return [];
  try {
    const response = await axios.get(`${API_BASE}/CourseProgress/MyCourseList`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: API_TIMEOUT,
    });
    return response.data || [];
  } catch (err) {
    throw new Error(handleApiError(err, "Không thể tải danh sách khóa học."));
  }
};

/**
 * Fetch quiz results
 * @returns {Promise<array>} List of quiz results
 */
export const getMyQuizResults = async () => {
  const token = localStorage.getItem("token");
  if (!token) return [];
  try {
    const response = await axios.get(`${API_BASE}/quiz/my-results`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: API_TIMEOUT,
    });
    return response.data || [];
  } catch (err) {
    throw new Error(handleApiError(err, "Không thể tải kết quả quiz."));
  }
};
export const linkAccount = async (email) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
  }
  try {
    const response = await axios.post(
      `${API_BASE}/Profile/link-account`,
      { Email: email },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: API_TIMEOUT,
      }
    );
    return response.data;
  } catch (err) {
    throw new Error(handleApiError(err, "Không thể liên kết tài khoản. Vui lòng thử lại."));
  }
};
export const updateMyProfile = async (profileData, avatar) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
  }
  try {
    const formData = new FormData();
    formData.append("Name", profileData.Name);
    formData.append("Address", profileData.Address);
    formData.append("Dob", profileData.Dob);
    formData.append("Sex", profileData.Sex === "Nữ" ? "false" : "true");

    formData.append("Phone", profileData.Phone);
    if (avatar) {
      formData.append("avatar", avatar);
    }
    const response = await axios.put(`${API_BASE}/Profile/my-profile`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
      timeout: API_TIMEOUT,
    });
    return response.data;
  } catch (err) {
    throw new Error(handleApiError(err, "Không thể cập nhật hồ sơ. Vui lòng thử lại."));
  }
};

export { API_BASE };