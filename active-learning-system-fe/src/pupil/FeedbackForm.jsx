import React, { useEffect, useState } from "react";
import "../css/pupil/feedback.css";

const FeedbackForm = ({ userId }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // TODO: Gọi API lấy danh sách khóa học đã học của userId
    const mockCourses = [
      { id: 2, name: "Khóa học 1" },
      { id: 3, name: "Khóa học 2" },
    ];
    setCourses(mockCourses);
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCourse || rating === 0 || content.trim() === "") {
      setMessage("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const feedback = {
      content,
      rate: rating,
      createdDate: new Date().toISOString(),
      status: true,
      authorId: userId,
      courseId: selectedCourse,
    };

    try {
      // TODO: Gọi API để gửi feedback
      console.log("Gửi feedback:", feedback);
      setMessage("Gửi phản hồi thành công!");
      setContent("");
      setRating(0);
      setSelectedCourse("");
    } catch (error) {
      console.error("Lỗi khi gửi phản hồi:", error);
      setMessage("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  return (
    <div className="feedback-container">
      <h2>📝 Gửi phản hồi về khóa học</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>📚 Khóa học:</label>
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} required>
            <option value="">-- Chọn khóa học --</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>⭐ Đánh giá:</label>
          <div className="stars">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={i <= rating ? "star active" : "star"}
                onClick={() => setRating(i)}
              >
                ★
              </span>
            ))}
            <span className="rating-text">({rating} trên 5 sao)</span>
          </div>
        </div>

        <div className="form-group">
          <label>💬 Nhận xét:</label>
          <textarea
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Nhập nội dung phản hồi..."
            required
          ></textarea>
        </div>

        <button type="submit" className="submit-btn">Gửi phản hồi</button>
        {message && <p className="form-message">{message}</p>}
      </form>
    </div>
  );
};

export default FeedbackForm;
