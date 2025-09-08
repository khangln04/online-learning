import React, { useEffect, useState } from "react";
import axios from "axios";
import aiIcon from "../css/icon/AI.png";
import "../css/page/homepage.css";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import { resolveImageUrl } from "../js/homepageApi";
import { useNavigate } from "react-router-dom";
import { FaRegCalendarAlt, FaUser } from "react-icons/fa";
import "../css/course/Courselist.css";
// ChatBubble component lấy từ HomePage
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


function Courselist() {
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [allClasses, setAllClasses] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const pageSize = 8;
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const allowed = !token || ["Pupil", "Parent"].includes(role);
    if (!allowed) {
      setTimeout(() => navigate("/error"), 0);
    }
  }, [navigate]);

  // Lấy danh sách className và categoryName duy nhất từ API (hoặc từ courses)
  useEffect(() => {
    // Có thể thay thế bằng API riêng nếu backend hỗ trợ
    const fetchAllCourses = async () => {
      let url = `https://localhost:5000/api/course/all?pageIndex=1&pageSize=1000`;
      try {
        const res = await axios.get(url);
        const data = res.data.data || res.data.Data || res.data;
        const classes = Array.from(new Set((data || []).map(c => c.className).filter(Boolean)));
        const categories = Array.from(new Set((data || []).map(c => c.categoryName).filter(Boolean)));
        setAllClasses(classes);
        setAllCategories(categories);
      } catch {
        setAllClasses([]);
        setAllCategories([]);
      }
    };
    fetchAllCourses();
  }, []);

  useEffect(() => {
    // Gọi API với search, class, category nếu có
    const fetchCourses = async () => {
      let url = `https://localhost:5000/api/course/all?pageIndex=${page}&pageSize=${pageSize}`;
      if (search !== undefined && search !== null && search !== "") {
        url += `&keyword=${encodeURIComponent(search)}`;
      }
      if (selectedClass) {
        url += `&className=${encodeURIComponent(selectedClass)}`;
      }
      if (selectedCategory) {
        url += `&categoryName=${encodeURIComponent(selectedCategory)}`;
      }
      try {
        const res = await axios.get(url);
        const data = res.data.data || res.data.Data || res.data;
        setCourses(Array.isArray(data) ? data : []);
        setHasNext(data.length === pageSize);
      } catch (err) {
        // Nếu public API lỗi 404 thì thử gọi API manager
        if (err.response?.status === 404) {
          const token = localStorage.getItem("token");
          if (token) {
            try {
              let url2 = `https://localhost:5000/api/manager/course/all?pageIndex=${page}&pageSize=${pageSize}`;
              if (search !== undefined && search !== null && search !== "") {
                url2 += `&keyword=${encodeURIComponent(search)}`;
              }
              if (selectedClass) {
                url2 += `&className=${encodeURIComponent(selectedClass)}`;
              }
              if (selectedCategory) {
                url2 += `&categoryName=${encodeURIComponent(selectedCategory)}`;
              }
              const res2 = await axios.get(url2, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const data2 = res2.data.data || res2.data.Data || res2.data;
              setCourses(Array.isArray(data2) ? data2 : []);
              setHasNext(data2.length === pageSize);
            } catch (managerErr) {
              setCourses([]);
            }
          } else {
            setCourses([]);
          }
        } else {
          setCourses([]);
        }
      }
    };
    fetchCourses();
  }, [page, search, selectedClass, selectedCategory]);

  // Hiển thị trực tiếp 8 bản ghi trên grid
  const displayCourses = courses.slice(0, 8);

  // Xử lý search: chỉ search khi bấm nút
  const handleSearch = (e) => {
    e.preventDefault();
    const value = searchInput.trim();
    setPage(1);
    setSearch(value === '' ? '' : value);
  };

  // Xử lý filter class/category
  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setPage(1);
  };
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPage(1);
  };

  return (
    <>
      <Header />

      <div className="course-list-section">
        <h2><span className="course-list-highlight">📘</span> Danh sách khóa học</h2>

        {/* Search & Filter */}
        <form className="course-list-search-form" onSubmit={handleSearch} style={{ marginBottom: 24, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên môn học..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc', minWidth: 220 }}
          />
          <select value={selectedClass} onChange={handleClassChange} style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}>
            <option value="">Tất cả lớp</option>
            {allClasses.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <select value={selectedCategory} onChange={handleCategoryChange} style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}>
            <option value="">Tất cả chủ đề</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <button type="submit" style={{ padding: '8px 18px', borderRadius: 4, background: '#ff6b35', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
            Tìm kiếm
          </button>
        </form>

        {/* Grid hiển thị 8 khóa học */}
        <div className="course-list-grid">
          {displayCourses.map((course) => (
            <div key={course.courseId} className="course-list-card">
              <div className="course-list-card-image">
                <img src={resolveImageUrl(course.image, "course")} alt={course.courseName} />
              </div>
              <div className="course-list-card-content">
                <p className="course-list-date">
                  <FaRegCalendarAlt style={{ marginRight: "6px", color: "#888" }} />
                  {new Date(course.createdDate).toLocaleDateString("vi-VN")}
                </p>

                <h5
                  className="course-list-title"
                  onClick={() => navigate(`/course/${course.courseId}`)}
                  style={{
                    fontSize: "15px",
                    lineHeight: "1.4",
                    margin: "12px 0",
                    minHeight: "42px",
                    cursor: "pointer",
                    color: "#ff6b35"
                  }}
                >
                  {course.courseName}
                </h5>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', justifyContent: 'space-between' }}>
                  <p className="course-list-category" style={{ marginBottom: 0, color: '#007bff', fontWeight: 600, fontSize: '16px' }}>{course.categoryName}</p>
                  {course.className && (
                    <p className="course-list-classname" style={{ marginBottom: 0, color: '#007bff', fontWeight: 600, fontSize: '16px', marginLeft: 'auto' }}>
                      {course.className}
                    </p>
                  )}
                </div>
                <div className="course-list-meta">
                  <span className="course-list-author">
                    <FaUser style={{ marginRight: "6px", color: "#888" }} />
                    {course.authorName}
                  </span>
                  <div className="course-list-price">
                    <h5 style={{ color: '#ff6b35' }}>{course.price.toLocaleString()} VND</h5>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Phân trang */}
        <div className="course-list-pagination">
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>
            Trang trước
          </button>
          <span>Trang {page}</span>
          <button disabled={!hasNext} onClick={() => setPage(page + 1)}>
            Trang sau
          </button>
        </div>
      </div>

      <ChatBubble />
      <Footer />
    </>
  );
}

export default Courselist;