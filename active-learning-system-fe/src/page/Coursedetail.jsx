import React, { useEffect, useState } from "react";
import axios from "axios";
import aiIcon from "../css/icon/AI.png";
import "../css/page/homepage.css";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import { resolveImageUrl } from "../js/homepageApi";
import "../css/course/Coursedetail.css";


const CourseDetail = () => {
  const videoRef = React.useRef(null);

  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackShowCount, setFeedbackShowCount] = useState(3);
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const role = localStorage.getItem("role");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const allowed = !token || ["Pupil", "Parent"].includes(role);
    if (!allowed) {
      setTimeout(() => navigate("/error"), 0);
    }
  }, [navigate]);

  // Fetch feedbacks for this course
  useEffect(() => {
    setFeedbackLoading(true);
    setFeedbackError("");
    axios.get(`https://localhost:5000/api/Stat/feedback/${courseId}`)
      .then(res => {
        setFeedbacks(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => {
        setFeedbackError("Không thể tải feedback cho khoá học này.");
      })
      .finally(() => setFeedbackLoading(false));
  }, [courseId]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get(`https://localhost:5000/api/course/detail/${courseId}`)
      .then((res) => {
        if (res.data && typeof res.data === "object") {
          setCourse(res.data);
        } else {
          setError("Dữ liệu khóa học không hợp lệ.");
        }
      })
      .catch((err) => {
        console.error("Error fetching course detail:", err);
        setError("Không thể tải chi tiết khóa học. Vui lòng thử lại.");
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleEnroll = async () => {
    if (!isLoggedIn) {
      setError("Vui lòng đăng nhập để đăng ký khóa học.");
      setTimeout(() => setError(null), 5000);
      navigate("/login");
      return;
    }

    setEnrollLoading(true);
    setError(null);
    setSuccessMessage("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Phiên đăng nhập hết hạn.");

      await axios.post(
        "https://localhost:5000/api/registercourse/register",
        { CourseId: courseId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccessMessage("Đăng ký khóa học thành công");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error("Enrollment error:", err);
      console.error("Response data:", err.response?.data);
      
      let errorMessage;
      
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
        else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
        else {
          errorMessage = JSON.stringify(err.response.data);
        }
      } else {
        errorMessage = err.message || "Không thể đăng ký khóa học. Vui lòng kiểm tra lại.";
      }
      
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    } finally {
      setEnrollLoading(false);
    }
  };


  // Auto-pause video at 7 seconds
  React.useEffect(() => {
    if (!course?.securedLink) return;
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => {
      if (video.currentTime >= 7) {
        video.pause();
        video.currentTime = 7;
      }
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [course?.securedLink]);

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
  if (error && !course) return <div className="loading">{error}</div>;
  if (!course) return <div className="loading">Không tìm thấy khóa học.</div>;

  return (
    <>
      <Header />
      <div className="course-wrapper">
        <div className="course-detail-grid">
          {/* t1: course-header top-left */}
          <div className="t1-course-header">
            <div className="course-header">
              <h1 className="course-title-course-detail">
                <button
                  className="back-to-courselist-btn"
                  onClick={() => navigate('/courselist')}
                  style={{ position: 'absolute', left: 30, top: '50%', transform: 'translateY(-680%)', margin: 0, padding: '8px 18px', fontSize: 18, borderRadius: 6, border: 'none', background: '#f1f1f1', color: '#333', cursor: 'pointer', zIndex: 2 }}
                >
                  ← Quay lại
                </button>
                <span style={{ display: 'inline-block', width: '100%' }}>{course.courseName || "Không có tiêu đề"}</span>
              </h1>
              <div className="course-meta">
                <span>🗓️ {new Date(course.createdDate).toLocaleDateString("vi-VN")}</span>
                <span>✍️ {course.authorName || "Chưa xác định"}</span>
              </div>
              {course.securedLink && course.securedLink !== '' && (
                <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'flex-start',
                  }}>
                    <div style={{
                      width: '95%',
                      minWidth: 320,
                      maxWidth: 700,
                      aspectRatio: '16/9',
                      position: 'relative',
                      background: '#000',
                      borderRadius: 8,
                      overflow: 'hidden',
                      marginLeft: 0
                    }}>
                      <video
                        ref={videoRef}
                        src={course.securedLink}
                        controls
                        style={{
                          width: '100%',
                          height: '100%',
                          maxHeight: 360,
                          objectFit: 'cover',
                          borderRadius: 8,
                          background: '#000',
                          boxShadow: '0 2px 12px rgba(0,0,0,0.15)'
                        }}
                        poster={course.image ? resolveImageUrl(course.image, "course") : undefined}
                      >
                        Trình duyệt của bạn không hỗ trợ video.
                      </video>
                      {/* Overlay for demo duration */}
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 8,
                        textAlign: 'center',
                        pointerEvents: 'none',
                        color: '#fff',
                        fontSize: 13,
                        textShadow: '0 1px 4px #000',
                      }}>
                      
                      </div>
                    </div>
                  </div>
                 
                </div>
              )}
            </div>
          </div>
          {/* t2: course-image + course-sidebar top-right */}
          <div className="t2-course-sidebar">
            {course.image && (
              <img
                src={resolveImageUrl(course.image, "course")}
                alt={course.courseName || "Hình ảnh khóa học"}
                className="course-image"
              />
            )}
            <div style={{ width: '100%' }}>
              <aside className="course-sidebar">
                <div className="course-info">
                  <p><strong>Giá:</strong> {course.price?.toLocaleString() || "Chưa cập nhật"} VNĐ</p>
                  <p><strong>Danh mục:</strong> {course.categoryName || "Chưa xác định"}</p>
                  <p><strong>Lớp:</strong> {course.className || "Chưa xác định"}</p>
                </div>
                <button
                  className="enroll-button"
                  onClick={handleEnroll}
                  disabled={enrollLoading || !course.status || !isLoggedIn || role === 'Parent'}
                >
                  {enrollLoading ? "Đang xử lý..." : "Đăng ký khóa học"}
                </button>
                {/* Hiển thị message dưới nút đăng ký */}
                {successMessage && <p className="success-message-course-detail-public">{successMessage}</p>}
                {error && <p className="error-message-course-detail-public">{error}</p>}
              </aside>
            </div>
          </div>
          {/* t3: course-content below t1 */}
          <div className="t3-course-content">
            <div className="course-content">
              <div className="course-description">
                <h2>Mô tả khóa học</h2>
                <p>{course.description || "Chưa có mô tả"}</p>
              </div>
              <div className="module-list">
                <h2>📦 Các module</h2>
                <ul>
                  {(course.modules || []).map((mod) => (
                    <li key={mod.id}>{mod.moduleName}</li>
                  ))}
                </ul>
              </div>
              {/* ...existing code... */}
            </div>
            {/* Feedbacks section now outside course-content */}
            <div className="feedback-course-detail">
              <h3 className="feedback-course-detail-title">Feedback học viên</h3>
              {feedbackLoading ? (
                <div>Đang tải feedback...</div>
              ) : feedbackError ? (
                <div className="feedback-course-detail-error">{feedbackError}</div>
              ) : feedbacks.length === 0 ? (
                <div className="feedback-course-detail-empty">Chưa có feedback nào cho khoá học này.</div>
              ) : (
                <>
                  <div className="feedback-course-detail-list">
                    {feedbacks.slice(0, feedbackShowCount).map((fb, idx) => (
                      <div key={idx} className="feedback-course-detail-item" style={{borderBottom: idx !== Math.min(feedbacks.length, feedbackShowCount)-1 ? '1px solid #eee' : 'none'}}>
                        <div className="feedback-course-detail-user">
                          {fb.userName} <span className="feedback-course-detail-rate">{[...Array(fb.rate)].map((_,i)=>(<span key={i}>★</span>))}</span>
                        </div>
                        <div className="feedback-course-detail-date">{new Date(fb.createdDate).toLocaleDateString('vi-VN')}</div>
                        <div className="feedback-course-detail-content">{fb.content}</div>
                      </div>
                    ))}
                  </div>
                  {feedbackShowCount < feedbacks.length && (
                    <button
                      className="feedback-course-detail-showmore-btn"
                      onClick={() => setFeedbackShowCount(c => Math.min(c + 3, feedbacks.length))}
                    >
                      Xem thêm
                    </button>
                  )}
                </>
              )}
              {/* Feedback comment form below feedback list */}
              <FeedbackCommentForm courseId={courseId} onCommentSuccess={async () => {
                setFeedbackLoading(true);
                const res = await axios.get(`https://localhost:5000/api/Stat/feedback/${courseId}`);
                const arr = Array.isArray(res.data) ? res.data : [];
                setFeedbacks(arr);
                setFeedbackShowCount(Math.min(3, arr.length));
                setFeedbackLoading(false);
              }} />
            </div>


          </div>
        </div>
      </div>
  <ChatBubble />
  <Footer />
    </>
  );
};
function FeedbackCommentForm({ courseId, onCommentSuccess }) {
  const [content, setContent] = React.useState("");
  const [rate, setRate] = React.useState(5);
  const [hoverRate, setHoverRate] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Vui lòng đăng nhập để feedback.");
      return;
    }
    if (!content.trim()) {
      setError("Nội dung feedback không được để trống.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        "https://localhost:5000/api/Stat/feedback",
        {
          CourseId: Number(courseId),
          Rate: rate,
          Content: content.trim(),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setContent("");
      setRate(5);
      setHoverRate(0);
      if (onCommentSuccess) await onCommentSuccess();
    } catch (err) {
      setError(
        err?.response?.data || "Không thể gửi feedback. Bạn phải thanh toán khoá học mới có thể feedback."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feedback-course-detail-form">
      <div className="feedback-course-detail-form-row" style={{marginBottom: '10px'}}>
        <div style={{display:'flex',gap:4,marginLeft:0}}>
          {[1,2,3,4,5].map(star => (
            <span
              key={star}
              style={{
                fontSize: 32,
                color: (hoverRate || rate) >= star ? '#f7b500' : '#ccc',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'color 0.15s',
                userSelect: 'none',
                lineHeight: 1
              }}
              onMouseEnter={() => !loading && setHoverRate(star)}
              onMouseLeave={() => !loading && setHoverRate(0)}
              onClick={() => !loading && setRate(star)}
              role="button"
              aria-label={`Chọn ${star} sao`}
              tabIndex={0}
            >★</span>
          ))}
        </div>
      </div>
      <textarea
        rows={3}
        placeholder="Nhập nội dung feedback..."
        value={content}
        onChange={e => setContent(e.target.value)}
        disabled={loading}
      />
      {error && <div className="feedback-course-detail-form-error">{error}</div>}
      <button className="feedback-course-detail-form-submit-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? "Đang gửi..." : "Gửi feedback"}
      </button>
    </div>
  );
}

function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleInput = (e) => setInput(e.target.value);

  const sendMessage = async (msg) => {
    setMessages(msgs => [...msgs, { from: "user", text: msg }]);
    setInput("");
    setLoading(true);
    try {
      const res = await axios.post("https://localhost:5000/api/Chat", { message: msg });
      setMessages(msgs => [...msgs, { from: "bot", text: res.data.reply }]);
    } catch (err) {
      setMessages(msgs => [...msgs, { from: "bot", text: "Xin lỗi, hệ thống đang bận. Vui lòng thử lại sau." }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && input.trim() && !loading) {
      sendMessage(input.trim());
    }
  };

  return (
    <>
      <div className="chat-bubble-btn" onClick={() => setOpen(o => !o)} title="Bạn cần hỗ trợ? Chat với AI!">
        <img src={aiIcon} alt="AI Chat" className="chat-bubble-btn-img" />
      </div>
      {open && (
        <div className="chat-bubble-window chat-bubble-window-left">
          <div className="chat-bubble-window-header">
           AI ChatBot
            <button className="chat-bubble-close" onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="chat-bubble-window-body">
            <div className="chat-bubble-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={msg.from === 'user' ? 'chat-msg-user' : 'chat-msg-bot'}>
                  <span className="chat-msg-text">{msg.text}</span>
                </div>
              ))}
              {loading && (
                <div className="chat-msg-bot chat-msg-loading">Đang trả lời...</div>
              )}
            </div>
            <div className="chat-bubble-input-row">
              <input
                className="chat-bubble-input"
                type="text"
                placeholder="Nhập tin nhắn..."
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                autoFocus
                disabled={loading}
              />
              <button
                className="chat-bubble-send-btn"
                onClick={() => {
                  if (input.trim() && !loading) {
                    sendMessage(input.trim());
                  }
                }}
                disabled={!input.trim() || loading}
                tabIndex={0}
              >Gửi</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CourseDetail;



