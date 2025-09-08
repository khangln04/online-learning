import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../css/pupil/MyCourseList.css";

const MyCourseList = ({ token }) => {
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
      console.warn("Không có token để gọi API MyCourseList");
      setLoading(false);
      return;
    }

    axios
      .get("https://localhost:5000/api/CourseProgress/MyCourseList", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })
      .then((res) => {
        setCourses(res.data || []);
      })
      .catch((err) => {
        console.error("Lỗi khi tải danh sách khóa học:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authToken]);

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa xác định";
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Không hợp lệ"
      : date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="course-section">
      <h2>
        <span className="highlight">📚</span> Danh sách Khóa học
      </h2>

      {loading ? (
        <p style={{ textAlign: "center", padding: "20px" }}>
          Đang tải dữ liệu...
        </p>
      ) : courses.length === 0 ? (
        <p style={{ textAlign: "center", padding: "20px" }}>
          Bạn chưa có khóa học nào.
        </p>
      ) : (
        <div className="course-grid">
          {courses.map((course) => {
            const isPaid = course.statusName === "Đã thanh toán";

            return (
              <div key={course.courseId} className="mycourselist-card">
                <h3
                  className={`course-title ${isPaid ? "paid-title" : "unpaid-title"}`}
                >
                  {isPaid ? (
                    <a href={`/student-progress/${course.courseId}`}>
                      {course.courseName}
                    </a>
                  ) : (
                    course.courseName
                  )}
                </h3>

                <div className="mycourselist-card-content">
                  <div className="course-row">
                    <span className={isPaid ? "paid" : "unpaid"}>
                      <span className="label">Trạng thái:</span>&nbsp;
                      {isPaid ? (
                        <>
                          <FaCheckCircle /> Đã thanh toán
                        </>
                      ) : (
                        <>
                          <FaTimesCircle /> Chưa thanh toán
                        </>
                      )}
                    </span>
                  </div>

                  <div className="course-row">
                    <span>
                      <span className="label">Ngày bắt đầu:</span>&nbsp;
                      {formatDate(course.startDate)}
                    </span>
                  </div>

                  <div className="course-row">
                    <span>
                      <span className="label">Truy cập gần nhất:</span>&nbsp;
                      {formatDate(course.lastAccess)}
                    </span>
                  </div>

                  {isPaid && (
                    <button
                      className="start-btn"
                      onClick={() =>
                        navigate(`/student-progress/${course.courseId}`)
                      }
                    >
                      Xem
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCourseList;
