// MyCompleteCourseList.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../css/pupil/MyCourseList.css";

const MyCompleteCourseList = ({ token }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const authToken = token || localStorage.getItem("token");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    const allowed = !token || ["Pupil", "Parent"].includes(role);

    if (!allowed) {
      setTimeout(() => navigate("/error"), 0);
    }
  }, [navigate]);

  useEffect(() => {
    if (!authToken) {
      setLoading(false);
      return;
    }

    axios
      .get("https://localhost:5000/api/CourseProgress/CompletedCourseList", {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      .then((res) => setCourses(res.data || []))
      .catch((err) => console.error("Lỗi:", err))
      .finally(() => setLoading(false));
  }, [authToken]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? "Không hợp lệ" : date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="course-section">
      <h2>
        <span className="highlight">🎓</span> Khóa học đã hoàn thành
      </h2>
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : courses.length === 0 ? (
        <p style={{ textAlign: "center", padding: "20px" }}>Không có khóa học nào đã hoàn thành.</p>
      ) : (
        <div className="course-grid">
          {courses.map((course) => (
            <div key={course.courseId} className="card">
              <h3 className="course-title paid-title">
                <a href={`/student-progress/${course.courseId}`}>
                  {course.courseName}
                </a>
              </h3>
              <div className="card-content">
                <div className="course-row">
                  <span className="label">Trạng thái:</span>
                  <span className="paid">
                    <FaCheckCircle /> Đã hoàn thành
                  </span>
                </div>
                <div className="course-row">
                  <span className="label">Ngày hoàn thành:</span>
                  <span>{formatDate(course.completeDate)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCompleteCourseList;
