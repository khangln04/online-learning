import React, { useEffect, useState } from "react";
import axios from "axios";
import aiIcon from "../css/icon/AI.png";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import "../css/blog/bloglist.css";
import "../css/page/homepage.css";
import { getAllBlogs } from "../js/blogApi";
import { useNavigate } from "react-router-dom";
import { FaRegCalendarAlt } from "react-icons/fa";
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
const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const pageSize = 8;

  useEffect(() => {
    // Gọi API với search nếu có
    getAllBlogs(page, pageSize, search).then(({ blogs, hasNextPage }) => {
      setBlogs(blogs);
      setHasNextPage(hasNextPage);
    });
  }, [page, search]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const allowed = !token || ["Pupil", "Parent"].includes(role);
    if (!allowed) {
      setTimeout(() => navigate("/error"), 0);
    }
  }, [navigate]);

  // Xử lý search: chỉ search khi bấm nút
  const handleSearch = (e) => {
    e.preventDefault();
    const value = searchInput.trim();
    setPage(1);
    setSearch(value === '' ? '' : value);
  };

  return (
    <>
      <Header />
      <div className="bloglist-container">
        <h2>📚 Bài viết mới</h2>

        {/* Search box */}
        <form onSubmit={handleSearch} style={{ marginBottom: 24, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tiêu đề bài viết..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #ccc', minWidth: 220 }}
          />
          <button type="submit" style={{ padding: '8px 18px', borderRadius: 4, background: '#ff6b35', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
            Tìm kiếm
          </button>
        </form>

        <div className="blog-grid">
          {blogs.map((blog, index) => {
            const blogId = blog.blogId || blog.id || blog._id;
            if (!blogId) {
              console.warn(`⚠️ Bài viết tại index ${index} không có ID hợp lệ`, blog);
              return null;
            }
            return (
              <div key={blogId} className="blog-card">
                <img src={blog.thumbnail} alt={blog.title} />
                <div className="card-content">
                  <div className="meta">
                    <span>
                      <FaRegCalendarAlt style={{ marginRight: "6px", color: "#888" }} />
                      {blog.createdDate}
                    </span>
                    <span>{blog.author}</span>
                  </div>
                  <h3
                    className="blog-title-link"
                    onClick={() => navigate(`/blog/${blogId}`)}
                    style={{ cursor: "pointer", color: "#007bff" }}
                  >
                    {blog.title}
                  </h3>
                  <p>{blog.summary}</p>
                  <div className="card-footer">
                    <span
                      className="read-more-link"
                      onClick={() => navigate(`/blog/${blogId}`)}
                      style={{ cursor: "pointer", color: "#007bff", fontWeight: "bold" }}
                    >
                      Xem thêm
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pagination">
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>
            Trang trước
          </button>
          <span>Trang {page}</span>
          <button onClick={() => setPage(page + 1)} disabled={!hasNextPage}>
            Trang sau
          </button>
        </div>
      </div>
      <ChatBubble />
      <Footer />
    </>
  );
};

export default BlogList;