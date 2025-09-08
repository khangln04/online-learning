import React, { useEffect, useState } from "react";
import axios from "axios";
import aiIcon from "../css/icon/AI.png";
import "../css/page/homepage.css";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import "../css/blog/Blogdetail.css";
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

const BlogDetail = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [comments, setComments] = useState([]);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
    axios.get(`https://localhost:5000/api/blog/${id}`)
      .then((res) => {
        const blogData = Array.isArray(res.data) ? res.data[0] : res.data;
        setBlog(blogData);
        setComments(blogData.comments || []);
      })
      .catch(() => setBlog(null));
  }, [id]);

  useEffect(() => {
    axios.get(`https://localhost:5000/api/blog/top3new`)
      .then((res) => setRecentBlogs(res.data || []))
      .catch(() => setRecentBlogs([]));
  }, []);

  const handleSubmit = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Vui lòng đăng nhập để bình luận.");
      return;
    }

    if (!newComment.trim()) {
      setError("Nội dung bình luận không được để trống.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await axios.post(
        `https://localhost:5000/api/blog/${id}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewComment("");
      const { data } = await axios.get(`https://localhost:5000/api/blog/${id}`);
      setComments(data.comments || []);
    } catch (err) {
      setError("Không thể gửi bình luận.");
    } finally {
      setLoading(false);
    }
  };

  if (!blog) return <div className="loading">Đang tải bài viết...</div>;

  return (
    <>
      <Header />
      <main className="blog-layout">
        <article className="blog-content">
          <h1 className="blog-title">{blog.title}</h1>
          <div className="blog-meta">
            <span>Tác giả: <strong>{blog.authorName}</strong></span>
            <span>Ngày đăng: {new Date(blog.createdDate).toLocaleDateString("vi-VN")}</span>
          </div>

          <img
            src={`https://localhost:5000${blog.thumbnail}`}
            alt={blog.title}
            className="blog-thumbnail"
          />

          <p className="blog-summary">{blog.summary}</p>

          <div
            className="blog-body"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />

          {/* Bình luận */}
          <section className="blog-comments">
            <h3>Bình luận ({comments.length})</h3>
            <div className="comment-list">
              {comments.length === 0 && <p>Chưa có bình luận nào.</p>}
              {comments.map((cmt, idx) => (
                <div className="comment-item highlight" key={idx}>
                  <div className="comment-avatar">
                    <img
                      src={`https://localhost:5000${cmt.authorAvatar || "/profile/default.jpg"}`}
                      alt="avatar"
                    />
                  </div>
                  <div className="comment-content">
                    <strong>{cmt.authorName || "Ẩn danh"}</strong>
                    <p>{cmt.content}</p>
                    <small>{new Date(cmt.createdDate).toLocaleDateString("vi-VN")}</small>
                  </div>
                </div>
              ))}
            </div>

            {/* Gửi bình luận */}
            <div className="comment-form">
              <textarea
                rows={3}
                placeholder="Nhập bình luận của bạn..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={loading}
              />
              {error && <div className="error-message">{error}</div>}
              <button onClick={handleSubmit} disabled={loading}>
                {loading ? "Đang gửi..." : "Gửi bình luận"}
              </button>
            </div>
          </section>
        </article>

        {/* Sidebar */}
        <aside className="blog-sidebar">
          <h3>Bài viết mới nhất 📰</h3>
          <ul className="recent-posts">
            {recentBlogs.map((item) => (
              <li key={item.id} className="recent-post-item">
                <img
                  src={`https://localhost:5000${item.thumbnail}`}
                  alt={item.title}
                />
                <div>
                  <Link to={`/blog/${item.id}`}>{item.title}</Link>
                  <br />
                  <small>{new Date(item.createdDate).toLocaleDateString("vi-VN")}</small>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </main>
      <ChatBubble />
      <Footer />
    </>
  );
};

export default BlogDetail;
