import axios from 'axios';

const API_BASE = 'https://localhost:5000/api/CourseTest';

// Lấy danh sách câu hỏi của quizz cho marketer
export async function getQuizzQuestions(quizzId, token) {
  try {
    const res = await axios.get(`${API_BASE}/quizz/${quizzId}/questions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Không thể tải câu hỏi quizz.');
  }
}

// Add Axios interceptor for 401 handling
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export async function getMarketerCourseDetail(courseId, token) {
  try {
    const res = await axios.get(`${API_BASE}/detail/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('API Detail Response:', res.data);
    return res.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Không thể tải chi tiết khóa học.');
  }
}

export async function getMarketerCourses({ pageIndex = 1, keyword = '', className = '', categoryName = '', pageSize = 5, token }) {
  try {
    const res = await axios.get(`${API_BASE}/all`, {
      params: { pageIndex, keyword, className, categoryName, pageSize },
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('API Response:', res.data);
    return {
      courses: res.data.data || [],
      totalRecords: res.data.totalRecords || 0,
      totalPages: res.data.totalPages || 0,
    };
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Không thể tải danh sách khóa học.');
  }
}
