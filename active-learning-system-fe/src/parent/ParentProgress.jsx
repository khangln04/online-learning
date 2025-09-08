
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import "../css/pupil/StudentProgress.css";
import { useParams } from "react-router-dom";

function ParentProgress() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    if (!id) {
      setError("Không tìm thấy thông tin khoá học.");
      return;
    }
    setLoading(true);
    const token = localStorage.getItem("token");
    axios
      .get(`https://localhost:5000/api/CourseProgress/student-course/${id}/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => {
        setProgress(res.data);
        setLoading(false);
      })
      .catch((err) => {
        let msg = "Không thể tải tiến độ học của học sinh.";
        if (err.response) {
          if (err.response.status === 401) {
            msg = "Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.";
          } else if (err.response.data) {
            if (typeof err.response.data === "string") msg = err.response.data;
            else if (err.response.data.message) msg = err.response.data.message;
          }
        }
        setError(msg);
        setLoading(false);
      });
  }, [id]);

  if (error) {
    return (
      <>
        <Header />
        <main className="progress-container">
          <p className="error-message">{error}</p>
        </main>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="progress-container">Đang tải tiến độ học...</main>
        <Footer />
      </>
    );
  }

  if (!progress) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="progress-container">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <button
            onClick={() => navigate('/profile')}
            style={{ marginRight: 16, padding: '6px 16px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            ← Quay lại
          </button>
          <h2 style={{ margin: 0 }}>Tiến độ học của con bạn</h2>
        </div>

        {progress.modules?.map((mod) => (
          <div className="module-block" key={mod.moduleId}>
            <h3>{mod.moduleName}</h3>
            <div style={{ marginBottom: 8, color: '#555', fontSize: 14 }}>
              <span><strong>Ngày bắt đầu:</strong> {mod.startDate || '-'}</span>
              {mod.lastAccess && <span style={{ marginLeft: 16 }}><strong>Truy cập cuối:</strong> {mod.lastAccess}</span>}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Tên bài học</th>
                  <th>Trạng thái</th>
                  <th>Ngày học gần nhất</th>
                </tr>
              </thead>
              <tbody>
                {mod.lessons?.map((lesson) => (
                  <tr key={lesson.lessonId}>
                    <td>{lesson.lessonName}</td>
                    <td className={lesson.isCompleted ? "status-complete" : "status-incomplete"}>
                      {lesson.isCompleted ? "✅ Đã hoàn thành" : "⏳ Chưa hoàn thành"}
                    </td>
                    <td>{lesson.lastWatched || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mod.quizzs && mod.quizzs.filter(q => q.score !== null && q.score !== undefined).length > 0 && (
              <div style={{ marginTop: 12 }}>
                <strong>Quiz:</strong>
                <table style={{ marginTop: 4 }}>
                  <thead>
                    <tr>
                      <th>Tên quiz</th>
                      <th>Điểm</th>
                      <th>Đạt yêu cầu</th>
                      <th>Thời gian bắt đầu</th>
                      <th>Thời gian nộp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mod.quizzs.filter(quiz => quiz.score !== null && quiz.score !== undefined).map((quiz, qidx) => (
                      <tr key={quiz.userQuizzId || qidx}>
                        <td>{quiz.title}</td>
                        <td>{quiz.score}</td>
                        <td>{quiz.isPass === true ? '✔️' : quiz.isPass === false ? '❌' : '-'}</td>
                        <td>{quiz.startAt ? new Date(quiz.startAt).toLocaleString() : '-'}</td>
                        <td>{quiz.submitAt ? new Date(quiz.submitAt).toLocaleString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
      <Footer />
    </>
  );
}

export default ParentProgress;


// ...existing code...
