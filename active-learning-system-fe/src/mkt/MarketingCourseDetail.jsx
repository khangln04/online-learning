

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMarketerCourseDetail, getQuizzQuestions } from '../js/marketer/marketerCourseApi';
import { resolveImageUrl } from '../js/homepageApi';
import "../css/mkt/marketingcoursedetail.css";

const MarketingCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [course, setCourse] = useState(null);

  // Sidebar/main-content UI state
  const [expandedModules, setExpandedModules] = useState(new Set());
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [contentType, setContentType] = useState('module-overview'); // 'module-overview', 'video', 'quiz-intro', ...

  // Fake quiz data for preview (demo) - Removed quiz-taking state
  const [quizData, setQuizData] = useState(null);
  const [showQuizPreview, setShowQuizPreview] = useState(false);
  // Pagination state for quiz preview
  const [quizPage, setQuizPage] = useState(1);
  const QUIZ_PAGE_SIZE = 10;
  const videoRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) {
      setError('Vui lòng đăng nhập lại.');
      navigate('/login');
      return;
    }
    if (role !== 'Marketer' && role !== 'Manager' && role !== 'Instructor') {
      setError('Bạn không có quyền truy cập trang này.');
      setTimeout(() => navigate('/error'), 0);
      return;
    }
    const fetchDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getMarketerCourseDetail(courseId, token);
        setCourse(data);
      } catch (err) {
        setError(err.message || 'Không thể tải chi tiết khóa học.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [courseId, navigate]);

  // Sidebar expand/collapse
  const handleModuleToggle = (moduleId) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) newExpanded.delete(moduleId);
    else newExpanded.add(moduleId);
    setExpandedModules(newExpanded);
  };
  // Chọn module
  const handleModuleSelect = (module) => {
    setSelectedModule(module);
    setSelectedLesson(null);
    setSelectedQuiz(null);
    setContentType('module-overview');
    setShowQuizPreview(false);
  };
  // Chọn lesson
  const handleLessonItemClick = (lesson, module) => {
    setSelectedModule(module);
    setSelectedLesson(lesson);
    setSelectedQuiz(null);
    setContentType('video');
    setShowQuizPreview(false);
  };
  // Chọn quiz: fetch all questions and correct answers for preview
  const handleQuizClick = async (quiz, module) => {
    setSelectedModule(module);
    setSelectedQuiz(quiz);
    setSelectedLesson(null);
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Always fetch latest questions for this quiz
      const questionsRaw = await getQuizzQuestions(quiz.id, token);
      // Ensure answers have isCorrect property for preview
      const questions = (questionsRaw || []).map(q => {
        if (q.answers && q.answers.length > 0) {
          let correctId = q.correctAnswerId;
          if (!correctId) {
            const found = q.answers.find(a => a.isCorrect);
            if (found) correctId = found.id;
          }
          const answers = q.answers.map(a => ({
            ...a,
            isCorrect: a.isCorrect || (correctId && a.id === correctId)
          }));
          return { ...q, answers };
        }
        return q;
      });
      setQuizData({
        ...quiz,
        questions,
        questionCount: quiz.questionCount || questions.length,
      });
      setQuizPage(1); // Reset to first page when opening quiz
      setShowQuizPreview(true);
    } catch (err) {
      setError(err.message || 'Không thể tải câu hỏi quiz.');
    } finally {
      setLoading(false);
    }
  };

  // Fixed: removed leftover quiz-taking function and misplaced JSX

  const renderModuleOverview = () => (
    <div className="market-detail-module-overview-content">
      <div className="market-detail-overview-header">
        <h2>📚 {selectedModule?.moduleName || course?.courseName}</h2>
        <p>{selectedModule?.description || course?.description}</p>
      </div>
      <div className="market-detail-module-stats">
        <div className="market-detail-stat-card">
          <div className="market-detail-stat-number">{selectedModule ? selectedModule.lessons.length : course?.modules?.reduce((a, m) => a + (m.lessons?.length || 0), 0)}</div>
          <div className="market-detail-stat-label">Bài học</div>
        </div>
        <div className="market-detail-stat-card">
          <div className="market-detail-stat-number">{selectedModule ? selectedModule.quizzs.length : course?.modules?.reduce((a, m) => a + (m.quizzs?.length || 0), 0)}</div>
          <div className="market-detail-stat-label">Quiz</div>
        </div>
      </div>
    </div>
  );

  const renderVideoContent = () => (
    <div className="market-detail-video-content">
      <div className="market-detail-video-header">
        <h1>{selectedLesson?.title || selectedLesson?.lessonName}</h1>
      </div>
      <div className="market-detail-video-player-container">
        {selectedLesson?.securedVideoLink ? (
          <video
            key={selectedLesson.id}
            ref={videoRef}
            controls
            width="100%"
            height="500"
          >
            <source src={selectedLesson.securedVideoLink} type="video/mp4" />
            Trình duyệt của bạn không hỗ trợ video HTML5.
          </video>
        ) : (
          <div className="market-detail-video-placeholder" key={selectedLesson?.id}>
            <div className="market-detail-play-icon">▶️</div>
            <p>Video: {selectedLesson?.title || selectedLesson?.lessonName}</p>
            <p>Thời lượng: {selectedLesson?.duration || '10:00'}</p>
          </div>
        )}
      </div>
      <div className="market-detail-video-info">
        {selectedLesson?.description && (
          <div className="market-detail-lesson-description">
            <h3>Mô tả</h3>
            <p>{selectedLesson.description}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderQuizPreview = () => {
    if (!quizData) return null;
    // Pagination logic
    const totalQuestions = quizData.questions.length;
    const totalPages = Math.ceil(totalQuestions / QUIZ_PAGE_SIZE);
    const startIdx = (quizPage - 1) * QUIZ_PAGE_SIZE;
    const endIdx = Math.min(startIdx + QUIZ_PAGE_SIZE, totalQuestions);
    const questionsToShow = quizData.questions.slice(startIdx, endIdx);

    return (
      <div className="market-detail-quiz-intro-content">
        <div className="market-detail-quiz-header">
          <h1>{quizData.title}</h1>
          <p>{quizData.description}</p>
        </div>
        <div className="market-detail-quiz-info-grid">
          {/* <div className="market-detail-quiz-info-card">
            <h3>📋 Số câu hỏi</h3>
            <div className="market-detail-info-value">{quizData.questionCount}</div>
          </div> */}
        </div>
        <div style={{ marginTop: 32 }}>
          <h3 style={{ color: '#6366f1', marginBottom: 16 }}>Danh sách câu hỏi & đáp án</h3>
          {questionsToShow.map((q, idx) => (
            <div key={q.id} style={{ marginBottom: 24, padding: 16, borderRadius: 10, background: '#f3f4f6', border: '2px solid #6366f1' }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>
                Câu {startIdx + idx + 1}: {q.questionContent || q.content || q.title || 'Không có nội dung câu hỏi'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {q.answers && q.answers.length > 0 ? q.answers.map(ans => (
                  <div key={ans.id} style={{
                    padding: '8px 14px',
                    borderRadius: 6,
                    marginBottom: 0,
                    background: ans.isCorrect ? '#d1fae5' : '#fff',
                    color: ans.isCorrect ? '#059669' : '#222',
                    fontWeight: ans.isCorrect ? 600 : 400,
                    border: ans.isCorrect ? '1.5px solid #059669' : '1.5px solid #e5e7eb',
                    display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: ans.isCorrect ? '0 1px 4px 0 #05966922' : 'none'
                  }}>
                    {ans.isCorrect && <span style={{ fontSize: 18, marginRight: 6 }}>✔</span>}
                    <span>{ans.content || ans.answerContent}</span>
                  </div>
                )) : (
                  <div style={{ color: '#e11d48', fontWeight: 600 }}>Không có đáp án cho câu hỏi này!</div>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Pagination controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 12 }}>
            <button
              className="market-detail-nav-btn"
              style={{ minWidth: 80 }}
              onClick={() => setQuizPage(p => Math.max(1, p - 1))}
              disabled={quizPage === 1}
            >
              Trang trước
            </button>
            <span style={{ fontWeight: 600, fontSize: 16 }}>
              Trang {quizPage} / {totalPages}
            </span>
            <button
              className="market-detail-nav-btn"
              style={{ minWidth: 80 }}
              onClick={() => setQuizPage(p => Math.min(totalPages, p + 1))}
              disabled={quizPage === totalPages}
            >
              Trang sau
            </button>
          </div>
        )}
        <button className="market-detail-start-quiz-btn" style={{ marginTop: 12, background: '#6366f1' }} onClick={() => setShowQuizPreview(false)}>Đóng</button>
      </div>
    );
  };



  // Main content switch
  let mainContent;
  if (showQuizPreview && quizData) mainContent = renderQuizPreview();
  else if (contentType === 'video' && selectedLesson) mainContent = renderVideoContent();
  else mainContent = renderModuleOverview();

  // Fallback UI
  if (loading) {
    return <div className="market-detail-interface"><div className="market-detail-content-area"><p>Đang tải...</p></div></div>;
  }
  if (error) {
    return <div className="market-detail-interface"><div className="market-detail-content-area"><p style={{ color: 'red' }}>{error}</p></div></div>;
  }
  if (!course) {
    return <div className="market-detail-interface"><div className="market-detail-content-area"><p>Không tìm thấy khóa học.</p></div></div>;
  }

  return (
    <div className="market-detail-interface">
      {/* Sidebar */}
      <div className="market-detail-sidebar">
        <div className="market-detail-sidebar-header">
          <div className="market-detail-back-button-container">
            <button
              onClick={() => navigate('/macourselist')}
              className="market-detail-back-button"
            >
              ← Về danh sách khóa học
            </button>
          </div>
          <h3>Nội dung khóa học</h3>
        </div>
        <div className="market-detail-modules-list">
          {course.modules && course.modules.map((module, idx) => {
            const isExpanded = expandedModules.has(module.id);
            return (
              <div key={module.id} className={`market-detail-module-item${isExpanded ? ' expanded' : ''}${selectedModule?.id === module.id ? ' active' : ''}`}>
                <div
                  className={[
                    'market-detail-module-header',
                    isExpanded ? 'expanded' : '',
                    selectedModule?.id === module.id ? 'active' : ''
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleModuleToggle(module.id)}
                >
                  <div className="market-detail-module-toggle">{isExpanded ? '▼' : '▶'}</div>
                  <div className="market-detail-module-number">{idx + 1}</div>
                  <div className="market-detail-module-details">
                    <h4>{module.moduleName}</h4>
                  </div>
                </div>
                {isExpanded && (
                  <div className="market-detail-module-content">
                    <button className="market-detail-select-module-btn" onClick={() => handleModuleSelect(module)}>
                      Xem tổng quan module
                    </button>
                    <div>
                      {module.lessons && module.lessons.map((lesson, lidx) => (
                        <div
                          key={lesson.id}
                          className={`market-detail-lesson-item${selectedLesson?.id === lesson.id ? ' active' : ''}`}
                          onClick={() => handleLessonItemClick(lesson, module)}
                        >
                          <div className="market-detail-lesson-icon">🎬</div>
                          <div className="market-detail-lesson-info">
                            <h5>{lesson.title || lesson.lessonName}</h5>
                          </div>
                        </div>
                      ))}
                    </div>
                    {module.quizzs && module.quizzs.length > 0 && (
                      <div className="market-detail-quiz-section">
                        {module.quizzs.map((quiz, qidx) => (
                          <div
                            key={quiz.id}
                            className={`market-detail-quiz-item${selectedQuiz?.id === quiz.id ? ' active' : ''}`}
                            onClick={() => handleQuizClick(quiz, module)}
                          >
                            <div className="market-detail-quiz-icon">📝</div>
                            <div className="market-detail-quiz-info">
                              <div className="market-detail-quiz-title">Quiz: {quiz.title}</div>
                              <div className="market-detail-quiz-subtitle">{quiz.questionCount || (quiz.questions ? quiz.questions.length : 0)} câu hỏi</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Main content */}
      <div className="market-detail-content-area">
        {mainContent}
      </div>
    </div>
  );
};

export default MarketingCourseDetail;