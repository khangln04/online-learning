import React, { useEffect, useState } from "react";
import axios from "axios";
import { BookOpen, CheckCircle, Clock } from 'lucide-react';
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import "../css/pupil/StudentProgress.css";

function StudentProgress() {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const courseId = 1;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Bạn chưa đăng nhập.");
      return;
    }

    axios
      .get(`https://localhost:5000/api/CourseProgress/student-course/${courseId}/progress`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setProgress(res.data);
      })
      .catch(() => {
        setError("Không thể tải tiến độ học.");
      });
  }, [courseId]);

  const filteredModules = progress?.modules?.filter((mod) => {
    if (filter === "incomplete") {
      return mod.lessons.some((lesson) => !lesson.isCompleted);
    }
    return true;
  }) || [];

  if (error) {
    return (
      <div className="sp-student-progress-page">
        <Header />
        <main className="sp-main">
          <div className="sp-error-message">{error}</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="sp-student-progress-page">
        <Header />
        <main className="sp-main">
          <div className="sp-loading">Đang tải...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="sp-student-progress-page">
      <Header />
      <main className="sp-main">
        <div className="sp-page-title">
          <h2>Tiến độ học của bạn</h2>
          <p>Xem tiến độ học tập của bạn trong khóa học này.</p>
        </div>

        <div className="sp-stats-cards">
          <div className="sp-stats-card">
            <div className="sp-stats-card-header">
              <h3>Tổng bài học</h3>
              <BookOpen size={20} style={{ color: "#3b82f6" }} />
            </div>
            <div className="sp-value">
              {progress.modules.reduce((acc, mod) => acc + mod.lessons.length, 0)}
            </div>
          </div>
          <div className="sp-stats-card">
            <div className="sp-stats-card-header">
              <h3>Bài học hoàn thành</h3>
              <CheckCircle size={20} style={{ color: "#10b981" }} />
            </div>
            <div className="sp-value">
              {progress.modules.reduce(
                (acc, mod) => acc + mod.lessons.filter((lesson) => lesson.isCompleted).length,
                0
              )}
            </div>
          </div>
          <div className="sp-stats-card">
            <div className="sp-stats-card-header">
              <h3>Bài học chưa hoàn thành</h3>
              <Clock size={20} style={{ color: "#f59e0b" }} />
            </div>
            <div className="sp-value">
              {progress.modules.reduce(
                (acc, mod) => acc + mod.lessons.filter((lesson) => !lesson.isCompleted).length,
                0
              )}
            </div>
          </div>
        </div>

        <div className="sp-filter-group">
          <label className="sp-form-label">Lọc module</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="sp-form-input"
            aria-label="Lọc module"
          >
            <option value="all">Tất cả module</option>
            <option value="incomplete">Module có bài học chưa hoàn thành</option>
          </select>
        </div>

        <div className="sp-module-list">
          {filteredModules.length === 0 ? (
            <div className="sp-no-modules">Không có module nào phù hợp với bộ lọc.</div>
          ) : (
            filteredModules.map((mod) => (
              <div className="sp-module-item" key={mod.moduleId}>
                <div className="sp-module-header">
                  <h3>{mod.moduleName}</h3>
                </div>
                <div className="sp-meta">
                  <div>
                    <BookOpen size={14} /> {mod.lessons.length} bài học
                  </div>
                  <div>
                    <CheckCircle size={14} />{" "}
                    {mod.lessons.filter((lesson) => lesson.isCompleted).length} hoàn thành
                  </div>
                </div>
                <table className="sp-table">
                  <thead>
                    <tr>
                      <th>Tên bài học</th>
                      <th className="sp-status-header">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mod.lessons.map((lesson) => (
                      <tr key={lesson.lessonId}>
                        <td>{lesson.lessonName}</td>
                        <td className={lesson.isCompleted ? "sp-status-complete" : "sp-status-incomplete"} style={{ width: "150px" }}>
                          {lesson.isCompleted ? (
                            <>
                              <CheckCircle size={14} /> Đã hoàn thành
                            </>
                          ) : (
                            <>
                              <Clock size={14} /> Chưa hoàn thành
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default StudentProgress;