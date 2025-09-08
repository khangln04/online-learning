import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../css/pupil/quizPupil.css';
import '../css/pupil/quiz-button-styles.css';

const QuizPupil = () => {
    const { moduleId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { studentCourseId, moduleProgressID, courseId } = location.state || {};

    const [quizData, setQuizData] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [showResult, setShowResult] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [quizStarted, setQuizStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [userQuizId, setUserQuizId] = useState(null);
    const [completionData, setCompletionData] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [showMessage, setShowMessage] = useState(false);

    // Hàm tính toán thời gian làm bài từ startAt và submitAt
    const calculateDuration = (startAt, submitAt) => {
        if (!startAt || !submitAt) return 0;
        const start = new Date(startAt);
        const end = new Date(submitAt);
        const durationInMinutes = (end - start) / (1000 * 60);
        return Math.round(durationInMinutes * 10) / 10; // Làm tròn 1 chữ số thập phân
    };

    // Hàm format thời gian với timezone chuẩn
    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        // Sử dụng format cụ thể để tránh lỗi timezone
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'Asia/Ho_Chi_Minh'
        });
    };

    useEffect(() => {
        console.log('=== QUIZ PUPIL MOUNT DEBUG ===');
        console.log('QuizPupil mounted with params:', { moduleId, studentCourseId, moduleProgressID, courseId });
        
        if (moduleProgressID) {
            console.log('Starting fetchQuizData...');
            fetchQuizData();
        } else {
            console.error('Missing moduleProgressID:', moduleProgressID);
            setError('Thiếu thông tin moduleProgressID. Vui lòng thử lại từ danh sách bài học.');
            setLoading(false);
        }
    }, [moduleProgressID]);

    // Timer countdown
    useEffect(() => {
        let interval = null;
        if (quizStarted && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(time => {
                    if (time <= 1) {
                        handleSubmitQuiz();
                        return 0;
                    }
                    return time - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [quizStarted, timeLeft]);

    const fetchQuizData = async () => {
        console.log('=== FETCH QUIZ DATA START ===');
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.log('No token found, redirecting to login');
                navigate('/login');
                return;
            }

            if (!moduleProgressID || moduleProgressID === 'undefined' || moduleProgressID === 'null' || moduleProgressID === 0) {
                console.error('Invalid moduleProgressID detected:', moduleProgressID);
                setError('Module chưa được bắt đầu. Vui lòng xem hết video bài học trước khi làm quiz.');
                return;
            }

            // Chỉ fetch completion data để hiển thị thông tin quiz
            if (studentCourseId) {
                await fetchCompletionData();
            } else {
                setError('Thiếu thông tin studentCourseId để tải quiz.');
            }

        } catch (err) {
            console.error('Error fetching quiz data:', err);
            let errorMessage = 'Không thể tải thông tin quiz.';
            if (err.response?.status === 404) {
                errorMessage = 'Không tìm thấy quiz cho module này. Có thể quiz chưa được tạo.';
            } else if (err.response?.status === 400) {
                errorMessage = 'Module chưa được bắt đầu. Vui lòng xem hết video bài học trước khi làm quiz.';
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }
            
            setError(errorMessage);
            if (err.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchCompletionData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                return;
            }

            const response = await axios.get(
                `https://localhost:5000/api/CourseProgress/get-completion/${studentCourseId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                setCompletionData(response.data);
                
                // Tìm quiz trong moduleCompletionVMs theo moduleProgressID
                if (response.data.moduleCompletionVMs && response.data.moduleCompletionVMs.length > 0) {
                    const currentModule = response.data.moduleCompletionVMs.find(module => 
                        module.moduleProgressID === parseInt(moduleProgressID)
                    );
                    
                    if (currentModule && currentModule.quizzs && currentModule.quizzs.length > 0) {
                        const currentModuleQuiz = currentModule.quizzs[0];
                        
                        // Tạo quizData từ completion data
                        const processedQuizData = {
                            id: currentModuleQuiz.id,
                            quizId: currentModuleQuiz.id,
                            userQuizzId: currentModuleQuiz.userQuizzId,
                            quizTitle: currentModuleQuiz.title,
                            title: currentModuleQuiz.title,
                            description: currentModuleQuiz.description,
                            timeLimit: currentModuleQuiz.timeLimit || 30, // Từ API hoặc default 30 phút
                            passingScore: currentModuleQuiz.requiredScore || 60, // Từ API hoặc default 60
                            questionCount: currentModuleQuiz.questionCount || 0, // Từ API
                            questions: [], // Sẽ được load khi click "Làm quiz"
                            totalQuestions: currentModuleQuiz.questionCount || 0, // Sử dụng questionCount từ API
                            startAt: currentModuleQuiz.startAt,
                            submitAt: currentModuleQuiz.submitAt,
                            duration: currentModuleQuiz.duration,
                            score: currentModuleQuiz.score,
                            isPass: currentModuleQuiz.isPass
                        };
                        
                        setQuizData(processedQuizData);
                        
                        // Nếu đã có userQuizzId, set luôn để có thể submit
                        if (currentModuleQuiz.userQuizzId) {
                            setUserQuizId(currentModuleQuiz.userQuizzId);
                        }
                    } else {
                        setError('Không tìm thấy quiz cho module này.');
                    }
                } else {
                    setError('Không tìm thấy modules completion data.');
                }
            } else {
                setError('Không có dữ liệu completion.');
            }

        } catch (err) {
            console.error('Error fetching completion data:', err);
            setError('Không thể tải thông tin quiz từ completion data.');
        }
    };

    const startQuiz = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                navigate('/login');
                return;
            }

            console.log('=== STARTING QUIZ ===');
            console.log('Creating user quiz with moduleProgressID:', moduleProgressID);

            // Gọi API POST để tạo user quiz khi click "Làm quiz"
            const createResponse = await axios.post(
                `https://localhost:5000/api/CourseProgress/user-quiz/${moduleProgressID}`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Create quiz response:', createResponse.data);

            if (createResponse.data) {
                const quizResponse = createResponse.data;
                
                // Cập nhật quizData với questions từ POST response
                setQuizData(prevData => ({
                    ...prevData,
                    questions: quizResponse.questions || [],
                    totalQuestions: quizResponse.questions?.length || prevData.totalQuestions
                }));
                
                // Set userQuizId để có thể submit sau này
                setUserQuizId(quizResponse.id);
                setTimeLeft((quizData.timeLimit || 30) * 60); // Sử dụng timeLimit từ API * 60 giây
                setQuizStarted(true);
                
                console.log('Quiz started with userQuizId:', quizResponse.id);
                console.log('Questions loaded:', quizResponse.questions?.length);
            }

        } catch (err) {
            console.error('Error starting quiz:', err);
            
            let errorMessage = 'Không thể bắt đầu quiz. ';
            if (err.response?.status === 400) {
                errorMessage += 'Module chưa được hoàn thành. Vui lòng xem hết video bài học trước.';
            } else if (err.response?.data?.message) {
                errorMessage += err.response.data.message;
            } else {
                errorMessage += 'Vui lòng thử lại.';
            }
            
            alert(errorMessage);
        }
    };

    const handleAnswerSelect = async (questionId, answerId) => {
        try {
            // Cập nhật selected answer ngay lập tức cho UX
            setSelectedAnswers(prev => ({
                ...prev,
                [questionId]: answerId
            }));

        } catch (err) {
            console.error('Error selecting answer:', err);
        }
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < quizData.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const prevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmitQuiz = async () => {
        try {
            const token = localStorage.getItem('token');
            
            console.log('=== SUBMIT QUIZ DEBUG ===');
            console.log('userQuizId:', userQuizId);
            console.log('selectedAnswers:', selectedAnswers);
            
            // Kiểm tra xem có câu trả lời nào được chọn không
            if (Object.keys(selectedAnswers).length === 0) {
                alert('Vui lòng chọn ít nhất một câu trả lời trước khi nộp bài!');
                return;
            }
            
            // Chuẩn bị data cho API submit theo format yêu cầu
            const answers = Object.entries(selectedAnswers).map(([questionId, selectedAnswerId]) => ({
                questionId: parseInt(questionId),
                selectedAnswerId: parseInt(selectedAnswerId)
            }));

            console.log('Prepared answers for API:', answers);

            // Gọi API submit answers với userQuizId
            const submitResponse = await axios.put(
                `https://localhost:5000/api/CourseProgress/user-quiz/${userQuizId}/answers`,
                {
                    answers: answers
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('Submit response:', submitResponse.data);
            
            // Hiển thị thông báo nộp bài thành công với message CSS
            setLoading(true);
            setSuccessMessage('🎉 Nộp bài thành công! Đang cập nhật kết quả...');
            setShowMessage(true);
            
            // Ẩn message sau 3 giây
            setTimeout(() => {
                setShowMessage(false);
                setSuccessMessage('');
            }, 3000);
            
            // Reset quiz state và quay về trang quiz để xem kết quả
            setQuizStarted(false);
            setSelectedAnswers({});
            setCurrentQuestionIndex(0);
            setUserQuizId(null);
            
            // Refresh completion data để hiển thị kết quả mới
            await fetchCompletionData();
            setLoading(false);
            
        } catch (err) {
            console.error('Error submitting quiz:', err);
            
            let errorMessage = 'Có lỗi khi nộp bài. ';
            if (err.response?.status === 500) {
                errorMessage += 'Lỗi server. Vui lòng kiểm tra lại dữ liệu hoặc liên hệ admin.';
            } else if (err.response?.status === 400) {
                errorMessage += err.response?.data?.message || 'Dữ liệu không hợp lệ.';
            } else if (err.response?.data?.message) {
                errorMessage += err.response.data.message;
            } else {
                errorMessage += 'Vui lòng thử lại.';
            }
            
            alert(errorMessage);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="quiz-pupil-container">
                <div className="quiz-pupil-loading">
                    <div className="quiz-pupil-loading-spinner"></div>
                    <div>Đang tải quiz...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="quiz-pupil-container">
                <div className="quiz-pupil-error">
                    <div className="quiz-pupil-error-icon">❌</div>
                    <h3>Có lỗi xảy ra</h3>
                    <p>{error}</p>
                    <button onClick={() => navigate(-1)} className="quiz-pupil-back-btn">
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    if (!quizData) {
        return (
            <div className="quiz-pupil-container">
                <div className="quiz-pupil-error">
                    <p>Không tìm thấy thông tin quiz</p>
                    <button onClick={() => navigate(-1)} className="quiz-pupil-back-btn">
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    // Kiểm tra nếu quiz chưa có câu hỏi - chỉ check khi đã bắt đầu quiz
    if (quizStarted && quizData && (!quizData.questions || quizData.questions.length === 0)) {
        return (
            <div className="quiz-pupil-container">
                <div className="quiz-pupil-error">
                    <div className="quiz-pupil-error-icon">📝</div>
                    <h3>Quiz chưa sẵn sàng</h3>
                    <p>Quiz này chưa có câu hỏi. Vui lòng liên hệ giáo viên hoặc thử lại sau.</p>
                    <button onClick={() => navigate(-1)} className="quiz-pupil-back-btn">
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const currentQuestion = quizData.questions?.[currentQuestionIndex];

    if (!quizStarted) {
        // Quiz introduction screen
        return (
            <div className="quiz-pupil-container">
                {/* Success Message Component */}
                {showMessage && (
                    <div className="quiz-pupil-success-message">
                        <div className="quiz-pupil-message-content">
                            <span className="quiz-pupil-message-text">{successMessage}</span>
                            <button 
                                className="quiz-pupil-message-close" 
                                onClick={() => setShowMessage(false)}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}
                
                <div className="quiz-pupil-header">
                    <button onClick={() => navigate(-1)} className="quiz-pupil-back-button">
                        ← Quay lại
                    </button>
                </div>

                <div className="quiz-pupil-intro">
                    <h1 className="quiz-pupil-title">{quizData.quizTitle}</h1>
                    <p className="quiz-pupil-description">{quizData.description}</p>
                    
                    <div className="quiz-pupil-progress-section">
                        <div className="quiz-pupil-progress-header">
                            <span>Tiến độ module</span>
                            <span className="quiz-pupil-progress-text">2/2 video</span>
                        </div>
                        <div className="quiz-pupil-progress-bar">
                            <div className="quiz-pupil-progress-fill" style={{ width: '100%' }}></div>
                        </div>
                    </div>

                    <div className="quiz-pupil-tabs">
                        <div className="quiz-pupil-tab quiz-pupil-tab-active">Quiz</div>
                    </div>

                    <div className="quiz-pupil-info-card">
                        <h2>{quizData.quizTitle}</h2>
                        <p>{quizData.description}</p>
                        
                        <div className="quiz-pupil-meta">
                            <div className="quiz-pupil-meta-item">
                                <span className="quiz-pupil-meta-icon">📝</span>
                                <div>
                                    <div className="quiz-pupil-meta-label">Số câu hỏi</div>
                                    <div className="quiz-pupil-meta-value">{quizData.questionCount || 0}</div>
                                </div>
                            </div>
                            
                            <div className="quiz-pupil-meta-item">
                                <span className="quiz-pupil-meta-icon">⏱️</span>
                                <div>
                                    <div className="quiz-pupil-meta-label">Thời gian làm</div>
                                    <div className="quiz-pupil-meta-value">{quizData.timeLimit} phút</div>
                                </div>
                            </div>
                            
                            <div className="quiz-pupil-meta-item">
                                <span className="quiz-pupil-meta-icon">🎯</span>
                                <div>
                                    <div className="quiz-pupil-meta-label">Điểm để qua</div>
                                    <div className="quiz-pupil-meta-value">{quizData.passingScore}</div>
                                </div>
                            </div>
                        </div>

                        {/* Hiển thị nút theo trạng thái quiz */}
                        {!quizData.startAt ? (
                            <button className="quiz-pupil-start-btn" onClick={startQuiz}>
                                <span className="quiz-pupil-btn-icon">🚀</span>
                                Bắt đầu làm quiz
                            </button>
                        ) : quizData.submitAt ? (
                            // Đã hoàn thành quiz - chỉ hiển thị nút làm lại
                            <button className="quiz-pupil-retake-btn" onClick={startQuiz}>
                                <span className="quiz-pupil-btn-icon">🔄</span>
                                Làm lại quiz
                            </button>
                        ) : (
                            <div className="quiz-pupil-in-progress">
                                <h3>⏳ Quiz đang được thực hiện</h3>
                                <p>Bạn đã bắt đầu quiz lúc: {formatDateTime(quizData.startAt)}</p>
                                <button className="quiz-pupil-continue-btn" onClick={startQuiz}>
                                    <span className="quiz-pupil-btn-icon">▶️</span>
                                    Tiếp tục làm quiz
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="quiz-pupil-history">
                        <h3>Lịch sử làm quiz</h3>
                        {quizData && quizData.submitAt ? (
                            <div className={`quiz-pupil-history-item quiz-pupil-completed ${quizData.isPass ? 'pass' : 'fail'}`}>
                                <div className="quiz-pupil-completed-header">
                                    <div className="quiz-pupil-completed-times">
                                        <div className="quiz-pupil-time-item">
                                            <span className="quiz-pupil-time-icon">🕐</span>
                                            <div className="quiz-pupil-time-content">
                                                <span className="quiz-pupil-time-label">Thời gian bắt đầu:</span>
                                                <span className="quiz-pupil-time-value">{formatDateTime(quizData.startAt)}</span>
                                            </div>
                                        </div>
                                        <div className="quiz-pupil-time-item">
                                            <span className="quiz-pupil-time-icon">🕑</span>
                                            <div className="quiz-pupil-time-content">
                                                <span className="quiz-pupil-time-label">Thời gian nộp bài:</span>
                                                <span className="quiz-pupil-time-value">{formatDateTime(quizData.submitAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="quiz-pupil-completed-result">
                                        <div className="quiz-pupil-duration">
                                            <span className="quiz-pupil-duration-label">Làm trong: {calculateDuration(quizData.startAt, quizData.submitAt)} phút</span>
                                        </div>
                                        <div className={`quiz-pupil-final-score ${!quizData.isPass ? 'fail' : ''}`}>
                                            <span className="quiz-pupil-score-large">{quizData.score}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : quizData && quizData.startAt ? (
                            <div className="quiz-pupil-history-item quiz-pupil-in-progress">
                                <div className="quiz-pupil-history-info">
                                    <span className="quiz-pupil-progress-icon">⏳</span>
                                    <div className="quiz-pupil-progress-content">
                                        <h4>Quiz đang thực hiện</h4>
                                        <p><strong>Thời gian bắt đầu:</strong> {formatDateTime(quizData.startAt)}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="quiz-pupil-history-item quiz-pupil-not-started">
                                <div className="quiz-pupil-history-info">
                                    <span className="quiz-pupil-waiting-icon">📝</span>
                                    <div className="quiz-pupil-waiting-content">
                                        <h4>Quiz chưa được thực hiện</h4>
                                        <p>Hãy bắt đầu làm quiz để xem kết quả</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Quiz taking screen
    return (
        <div className="quiz-pupil-container">
            <div className="quiz-pupil-header">
                <button onClick={() => navigate(-1)} className="quiz-pupil-back-button">
                    ← Quay lại
                </button>
                <div className="quiz-pupil-timer">
                    <span className="quiz-pupil-timer-icon">⏱️</span>
                    <span className="quiz-pupil-timer-text">Thời gian còn lại: {formatTime(timeLeft)}</span>
                </div>
            </div>

            <div className="quiz-pupil-content">
                <div className="quiz-pupil-question-header">
                    <h2>{quizData.quizTitle}</h2>
                    <div className="quiz-pupil-question-counter">
                        <span>{currentQuestionIndex + 1}/{quizData.questions?.length}</span>
                    </div>
                </div>

                {currentQuestion && (
                    <div className="quiz-pupil-question-card">
                        <h3 className="quiz-pupil-question-title">
                            Câu {currentQuestionIndex + 1}: {currentQuestion.content}
                        </h3>
                        
                        <div className="quiz-pupil-answers-list">
                            {currentQuestion.answers?.map((answer) => {
                                const isSelected = selectedAnswers[currentQuestion.id] === answer.id;
                                const result = showResult[currentQuestion.id];
                                const isCorrect = result?.correctAnswerId === answer.id;
                                const isWrong = result && isSelected && !result.isCorrect;
                                
                                return (
                                    <div 
                                        key={answer.id}
                                        className={`quiz-pupil-answer-option ${isSelected ? 'quiz-pupil-answer-selected' : ''} ${
                                            result ? (isCorrect ? 'quiz-pupil-answer-correct' : (isWrong ? 'quiz-pupil-answer-wrong' : '')) : ''
                                        }`}
                                        onClick={() => !result && handleAnswerSelect(currentQuestion.id, answer.id)}
                                    >
                                        <span className="quiz-pupil-answer-letter">
                                            {String.fromCharCode(65 + currentQuestion.answers.indexOf(answer))}
                                        </span>
                                        <span className="quiz-pupil-answer-text">{answer.content}</span>
                                        {result && isCorrect && <span className="quiz-pupil-result-icon">✓</span>}
                                        {result && isWrong && <span className="quiz-pupil-result-icon">✗</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="quiz-pupil-navigation">
                    <button 
                        className="quiz-pupil-nav-btn quiz-pupil-prev-btn" 
                        onClick={prevQuestion}
                        disabled={currentQuestionIndex === 0}
                    >
                        ← Câu trước
                    </button>
                    
                    {currentQuestionIndex === quizData.questions?.length - 1 ? (
                        <button className="quiz-pupil-submit-btn" onClick={handleSubmitQuiz}>
                            Nộp bài
                        </button>
                    ) : (
                        <button 
                            className="quiz-pupil-nav-btn quiz-pupil-next-btn" 
                            onClick={nextQuestion}
                        >
                            Câu tiếp theo →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizPupil;
