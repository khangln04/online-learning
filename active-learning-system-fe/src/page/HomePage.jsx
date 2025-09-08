import { useEffect, useState } from "react";
import axios from "axios";
import aiIcon from "../css/icon/AI.png";
import { useNavigate, Link } from "react-router-dom";
import Slider from "../Slider";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import { getCourses, getBanners, getBlogs, getFeedbacks, resolveImageUrl } from "../js/homepageApi";
import "../css/page/homepage.css";
import "../slider.css"; // đảm bảo slider CSS được load
import { FaRegCalendarAlt, FaUser } from "react-icons/fa"; // Thêm trên cùng file nếu chưa có
import favicon11 from "../css/icon/favicon11.png";

// Dữ liệu mẫu cho users để hiển thị role
const users = [
  { Name: 'Hiền Trang', RoleId: 4 }, // Học sinh
  { Name: 'Thế Phương', RoleId: 1 }, // Phụ huynh
  { Name: 'Minh Anh', RoleId: 4 }, // Học sinh
  { Name: 'Ngọc Lan', RoleId: 1 }, // Phụ huynh
  // Thêm các user khác nếu cần
];

// Map RoleId sang tên vai trò
const roleMap = {
  1: 'Phụ huynh',
  3: 'Phụ huynh',
  4: 'Học sinh',
  5: 'Học sinh',
  6: 'Học sinh',
  7: 'Phụ huynh',
};

const getUserRoleByName = (name) => {
  const user = users.find(u => u.Name === name);
  return user ? roleMap[user.RoleId] : null;
};

const HomePage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [courses, setCourses] = useState([]);
  const [banners, setBanners] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  const [blogs, setBlogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    const allowed = !token || ["Pupil", "Parent"].includes(role);

    if (!allowed) {
      setTimeout(() => navigate("/error"), 0);
    }
  }, [navigate]);

  useEffect(() => {
    getCourses().then(setCourses).catch(console.error);
    getBanners().then(setBanners).catch(console.error);
    getBlogs().then(setBlogs).catch(console.error);
    getFeedbacks().then(setFeedbacks).catch(console.error); // thêm dòng này

  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [banners]);

  // ...existing code...

  return (
    <div className="homepage">
      <Header />

      {/* Hero Banner mới */}
      <section className="hero-banner-v2">
        <div className="hero-left">
          <div className="platform-badge">
      <img
        src={favicon11}
        alt="Logo cá nhân"
        style={{ width: 32, height: 32, verticalAlign: 'middle', marginRight: 8 }}
      />
      Platform Học Online #1 Việt Nam
    </div>
          <h1>
            Học tập thông minh<br />
            cùng <span className="educonnect">ActiveLearningSystem</span>
          </h1>
          <p className="hero-desc">
            Nền tảng học online hiện đại với hệ thống quản lý gia đình thông minh. Phụ huynh kiểm soát, con em học tập hiệu quả.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate('/courselist')}>Bắt đầu học ngay</button>
          </div>
          <div className="hero-stats">
            <div>
              <div className="stat-number">50K+</div>
              <div className="stat-label">Học viên</div>
            </div>
            <div>
              <div className="stat-number">1000+</div>
              <div className="stat-label">Khóa học</div>
            </div>
            <div>
              <div className="stat-number">95%</div>
              <div className="stat-label">Hài lòng</div>
            </div>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-image-box">
            <img
              src={resolveImageUrl(banners[currentIndex]?.thumbnail, "banner")}
              alt="EduConnect học tập"
              className="hero-main-img"
            />
            <div className="hero-rating-badge">
              <span role="img" aria-label="star">⭐</span> 4.9/5.0 Rating
            </div>
            <div className="hero-trust-badge">
              ✓ Được phụ huynh tin tưởng
            </div>
          </div>
        </div>
      </section>

      {/* Lợi ích */}
      <section className="section-benefits">
        <div className="benefits-grid">
          {[
            {
              icon: "🧠",
              title: "Cá nhân hóa lộ trình học",
              desc: "Mỗi học sinh đều có một xuất phát điểm và mục tiêu riêng. " +
                "Hệ thống ALS phân tích hành vi học tập, kết quả kiểm tra và phản hồi của người học " +
                "để xây dựng lộ trình học phù hợp, giúp học sinh tiến bộ nhanh chóng và hiệu quả hơn. " +
                "Đây là sự khác biệt giúp ALS đồng hành sâu sát với từng cá nhân."
            },
            {
              icon: "💻",
              title: "Học tập mọi lúc, mọi nơi",
              desc: "Với nền tảng học trực tuyến hiện đại, học sinh có thể tham gia các khóa học mọi lúc, mọi nơi " +
                "chỉ với một thiết bị kết nối Internet. Tất cả bài giảng, bài tập và tài nguyên học tập đều được truy cập dễ dàng, " +
                "không giới hạn thời gian hay địa điểm, mang lại sự linh hoạt tối đa trong quá trình học."
            },
            {
              icon: "📊",
              title: "Theo dõi tiến độ & đánh giá thông minh",
              desc: "Hệ thống ALS liên tục ghi nhận tiến trình học tập của người dùng, " +
                "từ đó đưa ra phân tích chi tiết về mức độ hoàn thành, điểm mạnh, điểm yếu và gợi ý cải thiện. " +
                "Bảng xếp hạng giúp học sinh có thêm động lực cạnh tranh lành mạnh và phát triển toàn diện kỹ năng."
            },
          ].map((item, idx) => (
            <div key={idx} className="benefit-card">
              <div className="benefit-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>

            </div>
          ))}
        </div>
      </section>

      {/* Khóa học hot */}
      <section className="section-courses">
        <div className="courses-header">
          <div>
            <h2><span className="highlight">Khóa học</span>nổi bật</h2>
            <p className="courses-sub">Những khóa học được yêu thích nhất</p>
          </div>
          <Link to="/courselist" className="courses-viewall">Xem tất cả</Link>
        </div>
        <div className="courses-grid">
          {courses.slice(0, 6).map((course, idx) => (
            <div key={idx} className="course-card">
              {/* Badge level & discount */}
              <div className="course-badges">
                {course.level && <span className={`badge badge-level badge-${course.level.toLowerCase()}`}>{course.level}</span>}
                {course.discount && <span className="badge badge-discount">-{course.discount}%</span>}
              </div>
              <div className="course-image">
                <img src={course.image} alt={course.courseName} />
              </div>
              <div className="course-info">
                <div className="course-category">
                  <span className="badge badge-category">{course.categoryName}</span>
                </div>
                <h3 className="course-title">{course.courseName}</h3>
                <p className="course-desc">{course.description}</p>
                <div className="course-teacher">
                  <FaUser className="teacher-avatar" />
                  <span>{course.authorName}</span>
                </div>
                <div className="course-price-row">
                  <span className="course-price">{course.price?.toLocaleString('vi-VN')}₫</span>
                  {course.oldPrice && <span className="course-oldprice">{course.oldPrice?.toLocaleString('vi-VN')}₫</span>}
                </div>
                <Link to={`/course/${course.courseId}`} className="course-register-btn">Đăng ký ngay</Link>
              </div>
            </div>
          ))}
          {/* Sửa đường dẫn sang /courselist */}
        </div>
      </section>

      {/* Feedback */}
      <div className="feedback-header">

      </div>
      <section className="section-feedback">
        <h2><span className="highlight">Phản hồi</span> đánh giá</h2>
        <p className="feedback-sub">Từ khách hàng</p>
        <Slider>
          {feedbacks.map((fb, idx) => (
            <div key={idx} className="slide-item">
              <div className="feedback">
                <img
                  src={resolveImageUrl(fb.avatar, "profile")}
                  alt={`${fb.authorName}'s avatar`}
                />
                <div>
                  {/* Hiển thị badge role nổi bật phía trên */}
                  {getUserRoleByName(fb.authorName) && (
                    <div style={{
                      display: 'inline-block',
                      marginBottom: '8px',
                      background: getUserRoleByName(fb.authorName) === 'Phụ huynh' ? '#1976d2' : '#43a047',
                      color: '#fff',
                      borderRadius: '8px',
                      padding: '4px 12px',
                      fontSize: '1rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}>
                      {getUserRoleByName(fb.authorName)}
                    </div>
                  )}
                  <p className="role">Khóa học: {fb.courseName}</p>
                  <blockquote>"{fb.content}"</blockquote>
                  <p className="feedback-danhgia">
                    Đánh giá:{" "}
                    {[...Array(fb.rate)].map((_, i) => (
                      <span key={i}>⭐</span>
                    ))}
                  </p>
                  <div className="feedback-meta">
                    <div className="feedback-meta-info">
                      <span className="feedback-date">
                        📆 {new Date(fb.createdDate).toLocaleDateString("vi-VN")}
                      </span>
                      <span className="feedback-author">
                        <FaUser />
                        {fb.authorName}
                        {/* Đã bỏ badge role cạnh tên user theo yêu cầu */}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </section>

      {/* Bài viết */}

      <section className="section-posts">
        <h2><span className="highlight">Bài viết</span> mới</h2>
        <p className="posts-subtitle">Thông tin mới nhất từ đội ngũ của chúng tôi</p>
        <Slider>
          {blogs.map((post, idx) => {
            const blogId = post.blogId || post.id || post._id; // Thử các trường có thể
            if (!blogId) {
              console.warn(`⚠️ Bài viết tại index ${idx} không có ID hợp lệ`, post);
              return null;
            }
            console.log(`🔍 Blog ID for post ${idx}:`, blogId); // Debug ID
            return (
              <div key={blogId} className="slide-item">
                <div className="blog-card">
                  <img src={post.thumbnail} alt={post.title} />
                  <div className="card-content">
                    <div className="meta">
                      <span>
                        <FaRegCalendarAlt style={{ marginRight: "6px", color: "#888" }} />
                        {post.createdDate}
                      </span>
                      <span>
                        <FaUser style={{ marginRight: "6px", color: "#888" }} />
                        {post.authorName}
                      </span>
                    </div>
                    <h3> <Link to={`/blog/${blogId}`} className="blog-title-link">
                      {post.title}
                    </Link></h3>
                    <p>{post.summary}</p>
                    <div className="card-footer">
                      <Link
                        to={`/blog/${blogId}`} // Sử dụng blogId thay vì post.id
                        className="read-more-link"
                      >
                        Xem thêm
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </Slider>
      </section>

      <Footer />
    </div>
  );
};



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

// Thêm ChatBubble vào HomePage
const HomePageWithChat = () => {
  return (
    <>
      <HomePage />
      <ChatBubble />
    </>
  );
};

export default HomePageWithChat;
