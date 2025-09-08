import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useVideoProgress } from '../hooks/useVideoProgress';
import { resolveImageUrl } from '../js/homepageApi';
import '../css/pupil/learningInterface.css';
import aiIcon from '../css/icon/AI.png';
// ChatBubble component (copy from HomePage)
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

const LearningInterface = () => {
    const { courseId, moduleId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { studentCourseId, moduleProgressID, courseProgressId: passedCourseProgressId } = location.state || {};

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
    
        const allowed = !token || ["Pupil"].includes(role);
    
        if (!allowed) {
          setTimeout(() => navigate("/error"), 0);
        }
      }, [navigate]);

    // Course and Module states
    const [courseData, setCourseData] = useState(null);
    const [modules, setModules] = useState([]);
    const [expandedModules, setExpandedModules] = useState(new Set());
    const [courseProgressId, setCourseProgressId] = useState(null);

    // Current module and lesson states
    const [currentModule, setCurrentModule] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [selectedLesson, setSelectedLesson] = useState(null);

    // Content type: 'module-overview', 'video', 'quiz-intro', 'quiz-taking'
    const [contentType, setContentType] = useState('module-overview');

    // Quiz states
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [quizData, setQuizData] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [quizStarted, setQuizStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [userQuizId, setUserQuizId] = useState(null);

    // UI states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showMessage, setShowMessage] = useState(false);
    const [currentLessonProgress, setCurrentLessonProgress] = useState(null);
    // Trạng thái loading khi submit quiz
    const [submitLoading, setSubmitLoading] = useState(false);

    // Video progress tracking
    const {
        videoRef,
        handlePlay,
        handlePause,
        handleTimeUpdate,
        handleEnded,
        initializeVideoProgress,
        saveCurrentProgress
    } = useVideoProgress(currentLessonProgress, async (newStatus) => {
        if (!newStatus || !selectedLesson) return;

        console.log('🎯 Video reached 90%, marking lesson as completed:', selectedLesson.lessonName);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('❌ Không tìm thấy token, không thể gọi API update-watch-status');
                return;
            }

            // Lấy lessonProgressId hiện tại (ép kiểu số nguyên)
            let lessonProgressId = Number(currentLessonProgress?.id);

            // Nếu lessonProgressId không hợp lệ thì gọi API lấy lại
            if (!lessonProgressId || lessonProgressId <= 0 || isNaN(lessonProgressId)) {
                console.warn('⚠️ lessonProgressId không hợp lệ, gọi get-completion lấy lại...');
                const res = await axios.get(
                    `https://localhost:5000/api/CourseProgress/get-completion/${studentCourseId}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const refreshedModule = res.data.moduleCompletionVMs.find(m => m.id === currentModule?.id);
                const refreshedLesson = refreshedModule?.lessons.find(l => l.id === selectedLesson.id);
                lessonProgressId = Number(refreshedLesson?.lessonProgressId);

                if (!lessonProgressId || lessonProgressId <= 0 || isNaN(lessonProgressId)) {
                    console.error('❌ Không lấy được lessonProgressId hợp lệ từ get-completion API, dừng cập nhật.');
                    return;
                }

                // Cập nhật lessonProgressId mới vào state để dùng cho các lần sau
                setCurrentLessonProgress(prev => ({
                    ...prev,
                    id: lessonProgressId
                }));
            }

            // Lấy thời gian xem thực tế từ videoRef, phải > 0 mới gọi
            const currentTime = videoRef.current?.currentTime ?? 0;
            if (currentTime <= 0) {
                console.warn('⚠️ Video currentTime <= 0, chưa gọi update-watch-status lần này');
                return; // Chờ lần khác có thời gian xem rồi mới gửi
            }

            console.log('📤 Gọi API update-watch-status với dữ liệu:', {
                LessonProgressId: lessonProgressId,
                WatchedSeconds: Math.floor(currentTime)
            });

            await axios.post(
                'https://localhost:5000/api/CourseProgress/update-watch-status',
                {
                    LessonProgressId: lessonProgressId,
                    WatchedSeconds: Math.floor(currentTime)
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Cập nhật trạng thái xem video thành công');

            // Cập nhật state UI local
            setCurrentLessonProgress(prev => ({ ...prev, id: lessonProgressId, status: true }));
            setSelectedLesson(prev => ({ ...prev, status: true }));
            setLessons(prev => prev.map(lesson =>
                lesson.id === selectedLesson.id ? { ...lesson, status: true } : lesson
            ));
            setModules(prevModules => {
                const updatedModules = prevModules.map(module => {
                    if (module.id !== currentModule?.id) return module;

                    // Clone lại từng lesson, cập nhật status nếu là bài học vừa hoàn thành
                    const updatedLessons = module.lessons.map(lesson => {
                        if (lesson.id === selectedLesson.id) {
                            return { ...lesson, status: true };
                        }
                        return { ...lesson }; // Clone lại dù chưa hoàn thành để đảm bảo React nhận thay đổi
                    });

                    return {
                        ...module,
                        lessons: updatedLessons
                    };
                });

                // Kiểm tra xem có mở quiz không
                const updatedModule = updatedModules.find(m => m.id === currentModule?.id);
                if (updatedModule) {
                    const completedLessons = updatedModule.lessons.filter(l => l.status).length;
                    const totalLessons = updatedModule.lessons.length;

                    if (completedLessons === totalLessons && updatedModule.quizzs?.length > 0) {
                        console.log('🎯 Đã hoàn thành toàn bộ video, unlock quiz!');
                        unlockQuizForModule(updatedModule); // không cần await
                    }
                }

                return updatedModules;
            });
        } catch (error) {
            console.error('❌ Lỗi khi cập nhật trạng thái xem video:', error);
        }
    });



    useEffect(() => {
        initializeData();
    }, [courseId, moduleId, studentCourseId]);

    // Reset video khi lesson thay đổi
    useEffect(() => {
        if (selectedLesson && videoRef.current) {
            console.log('🎬 Bài học mới được chọn, tải lại video:', selectedLesson.lessonName);
            videoRef.current.load(); // Tải lại video
        }
    }, [selectedLesson?.id]);

    // Quiz timer countdown
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

    const initializeData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            if (!token) {
                navigate('/login');
                return;
            }

            if (!studentCourseId) {
                setError('Thiếu thông tin studentCourseId');
                return;
            }

            // Get course completion data
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
                setCourseData(response.data.course);
                setModules(response.data.moduleCompletionVMs || []);
                setCourseProgressId(response.data.courseProgressId);

                // Nếu có moduleId trên URL thì mở rộng module đó
                if (moduleId) {
                    const module = response.data.moduleCompletionVMs?.find(m => m.id === parseInt(moduleId));
                    if (module) {
                        setExpandedModules(new Set([module.id]));
                        handleModuleSelect(module);
                    }
                } else {
                    // Không mở rộng module nào khi mới vào trang
                    setExpandedModules(new Set());
                }
            }

        } catch (err) {
            console.error('Error initializing data:', err);
            setError('Không thể tải dữ liệu khóa học. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleModuleToggle = (moduleId) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(moduleId)) {
            newExpanded.delete(moduleId);
        } else {
            newExpanded.add(moduleId);
            const module = modules.find(m => m.id === moduleId);
            if (module && (!currentModule || currentModule.id !== moduleId)) {
                // Khi mở rộng module-header, gọi API InsertModuleProgress nếu chưa có moduleProgressID
                const createModuleProgressIfNeeded = async () => {
                    let currentModuleProgressID = module.moduleProgressID;
                    if (!currentModuleProgressID || currentModuleProgressID === 0) {
                        if (!courseProgressId) {
                            console.error('❌ No courseProgressId available for creating module progress');
                            alert('Không tìm thấy thông tin tiến độ khóa học. Vui lòng tải lại trang.');
                            return;
                        }
                        const token = localStorage.getItem('token');
                        const moduleProgressData = {
                            courseProcessId: parseInt(courseProgressId),
                            moduleId: parseInt(module.id)
                        };
                        try {
                            const moduleResponse = await axios.post(
                                'https://localhost:5000/api/CourseProgress/InsertModuleProgress',
                                moduleProgressData,
                                {
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    }
                                }
                            );
                            currentModuleProgressID = moduleResponse.data?.id || moduleResponse.data;
                            // Gọi ngay get-completion để lấy lại moduleProgressId mới nhất từ backend
                            const completionRes = await axios.get(
                                `https://localhost:5000/api/CourseProgress/get-completion/${studentCourseId}`,
                                {
                                    headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json'
                                    }
                                }
                            );
                            const refreshedModule = completionRes.data.moduleCompletionVMs.find(m => m.id === module.id);
                            currentModuleProgressID = refreshedModule?.moduleProgressID || currentModuleProgressID;
                            // Cập nhật module với moduleProgressID mới
                            setModules(prev => prev.map(m =>
                                m.id === module.id ? { ...m, moduleProgressID: currentModuleProgressID } : m
                            ));
                        } catch (err) {
                            console.error('Error creating module progress:', err);
                        }
                    }
                    setCurrentModule({ ...module, moduleProgressID: currentModuleProgressID });
                    setLessons(module.lessons || []);
                    // Process quizzes for display only
                    if (module.quizzs && module.quizzs.length > 0) {
                        const processedQuizzes = module.quizzs.map(quiz => ({
                            id: quiz.id,
                            quizzName: quiz.title,
                            questionQuantity: quiz.questionCount || 0,
                            timeLimit: quiz.timeLimit || 30,
                            completed: quiz.userQuizzId ? true : false,
                            score: quiz.score,
                            userQuizzId: quiz.userQuizzId
                        }));
                        setQuizzes(processedQuizzes);
                    } else {
                        setQuizzes([]);
                    }
                    setContentType('module-overview');
                };
                createModuleProgressIfNeeded();
            }
        }
        setExpandedModules(newExpanded);
    };

    const handleModuleSelect = (module) => {
        console.log('🔍 Module selected:', module);
        console.log('📋 Module lessons:', module.lessons);
        console.log('🧠 Module quizzes:', module.quizzs);

        setCurrentModule(module);
        setLessons(module.lessons || []);

        // Process quizzes
        if (module.quizzs && module.quizzs.length > 0) {
            const processedQuizzes = module.quizzs.map(quiz => ({
                id: quiz.id,
                quizzName: quiz.title,
                questionQuantity: quiz.questionCount || 0,
                timeLimit: quiz.timeLimit || 30,
                completed: quiz.userQuizzId ? true : false,
                score: quiz.score,
                userQuizzId: quiz.userQuizzId
            }));
            console.log('✅ Processed quizzes:', processedQuizzes);
            setQuizzes(processedQuizzes);
        } else {
            console.log('❌ No quizzes found in module');
            setQuizzes([]);
        }

        setContentType('module-overview');
    };

    const handleLessonItemClick = async (lesson, module) => {
        const token = localStorage.getItem('token');
        // Luôn gọi get-completion để lấy moduleProgressId mới nhất từ backend
        let moduleProgressId = null;
        try {
            const completionRes = await axios.get(
                `https://localhost:5000/api/CourseProgress/get-completion/${studentCourseId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            const refreshedModule = completionRes.data.moduleCompletionVMs.find(m => m.id === module.id);
            moduleProgressId = refreshedModule?.moduleProgressID;
        } catch (err) {
            console.error('Error fetching moduleProgressId from get-completion:', err);
            return;
        }

        // Gọi InsertLessonProgress với moduleProgressId mới lấy được
        let lessonProgressId = lesson.lessonProgressId;
        if (!lessonProgressId || lessonProgressId === null) {
            lessonProgressId = await insertLessonProgress(lesson.id, moduleProgressId);
            setLessons(prevLessons => prevLessons.map(l =>
                l.id === lesson.id ? { ...l, lessonProgressId: lessonProgressId } : l
            ));
            setModules(prevModules => prevModules.map(m =>
                m.id === module.id
                    ? { ...m, lessons: m.lessons.map(l => l.id === lesson.id ? { ...l, lessonProgressId: lessonProgressId } : l) }
                    : m
            ));
        }

        if (lessonProgressId) {
            const lessonProgressData = {
                id: lessonProgressId,
                videoId: lesson.id,
                watchedDuration: lesson.watchedDuration || 0,
                status: lesson.status
            };
            setCurrentLessonProgress(lessonProgressData);
        }
        setSelectedLesson({ ...lesson, lessonProgressId: lessonProgressId });
        setContentType('video');
    };

    const insertLessonProgress = async (videoId) => {
        try {
            const token = localStorage.getItem('token');

            let currentModuleProgressID = currentModule?.moduleProgressID || moduleProgressID;

            if (!currentModuleProgressID || currentModuleProgressID === 0) {
                if (!courseProgressId) {
                    console.error('❌ No courseProgressId available for creating module progress');
                    alert('Không tìm thấy thông tin tiến độ khóa học. Vui lòng tải lại trang.');
                    return null;
                }

                const moduleProgressData = {
                    courseProcessId: parseInt(courseProgressId),
                    moduleId: parseInt(currentModule.id)
                };

                const moduleResponse = await axios.post(
                    'https://localhost:5000/api/CourseProgress/InsertModuleProgress',
                    moduleProgressData,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                currentModuleProgressID = moduleResponse.data?.id || moduleResponse.data;

                setCurrentModule(prev => ({
                    ...prev,
                    moduleProgressID: currentModuleProgressID
                }));
            }

            const lessonProgressData = {
                moduleProgressId: parseInt(currentModuleProgressID),
                videoId: parseInt(videoId)
            };

            // Gọi API InsertLessonProgress
            await axios.post(
                'https://localhost:5000/api/CourseProgress/InsertLessonProgress',
                lessonProgressData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Gọi lại API get-completion để lấy lessonProgressId mới nhất
            const completionRes = await axios.get(
                `https://localhost:5000/api/CourseProgress/get-completion/${studentCourseId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const refreshedModule = completionRes.data.moduleCompletionVMs.find(m => m.id === currentModule.id);
            const refreshedLesson = refreshedModule?.lessons?.find(l => l.id === videoId);
            const newLessonProgressId = refreshedLesson?.lessonProgressId;

            console.log('✅ InsertLessonProgress + get-completion => lessonProgressId:', newLessonProgressId);

            return newLessonProgressId || null;

        } catch (err) {
            console.error('Error inserting lesson progress:', err);
            return null;
        }
    };


    const unlockQuizForModule = async (module) => {
        try {
            const token = localStorage.getItem('token');

            if (!token) {
                console.log('❌ No token found');
                return;
            }

            // Ensure we have moduleProgressId
            let currentModuleProgressID = module?.moduleProgressID || moduleProgressID;

            // If no moduleProgressId, create one first
            if (!currentModuleProgressID || currentModuleProgressID === 0) {
                // Check if we have courseProgressId
                if (!courseProgressId) {
                    console.error('❌ No courseProgressId available for quiz unlock');
                    alert('Không tìm thấy thông tin tiến độ khóa học. Vui lòng tải lại trang.');
                    return;
                }
                console.log('🔧 Creating module progress for quiz unlock...', {
                    courseProgressId: courseProgressId,
                    moduleId: module?.id,
                    moduleName: module?.moduleName
                });

                const moduleProgressData = {
                    courseProcessId: parseInt(courseProgressId),
                    moduleId: parseInt(module.id)
                };

                const moduleResponse = await axios.post(
                    'https://localhost:5000/api/CourseProgress/InsertModuleProgress',
                    moduleProgressData,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                currentModuleProgressID = moduleResponse.data?.id || moduleResponse.data;
                console.log('✅ Created moduleProgressId for unlock:', currentModuleProgressID);
            }

            console.log('🔓 Unlocking quiz with moduleProgressId:', currentModuleProgressID);

            const response = await axios.post(
                `https://localhost:5000/api/CourseProgress/user-quiz/${currentModuleProgressID}`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Quiz unlocked successfully:', response.data);

            // Update current module with new moduleProgressID if created
            if (currentModule?.id === module.id) {
                setCurrentModule(prev => ({
                    ...prev,
                    moduleProgressID: currentModuleProgressID
                }));
            }

            // Show success message
            setSuccessMessage('Chúc mừng! Bạn đã mở khóa quiz cho module này!');
            setShowMessage(true);

            setTimeout(() => {
                setShowMessage(false);
                setSuccessMessage('');
            }, 3000);

        } catch (err) {
            console.error('Error unlocking quiz:', err);
            console.error('Error response:', err.response);

            if (err.response?.status === 400) {
                console.log('ℹ️ Quiz might already be unlocked or not available');
            } else {
                console.log('❌ Failed to unlock quiz:', err.response?.data?.message || err.message);
            }
        }
    };

    const handleQuizClick = async (quiz = null, module = null) => {
        // ✅ Luôn dùng module được truyền vào, không phụ thuộc currentModule
        const targetModule = module || currentModule;

        if (!targetModule) {
            console.error('❌ Không có module để xử lý quiz');
            return;
        }

        // 👇 Cập nhật module và bài học trong UI (để render đúng nội dung)
        setCurrentModule(targetModule);
        setLessons(targetModule.lessons || []);

        // 👇 Cập nhật quizzes hiển thị trong UI
        if (targetModule.quizzs && targetModule.quizzs.length > 0) {
            const processedQuizzes = targetModule.quizzs.map(q => ({
                id: q.id,
                quizzName: q.title,
                questionQuantity: q.questionCount || 0,
                timeLimit: q.timeLimit || 30,
                completed: q.userQuizzId ? true : false,
                score: q.score,
                userQuizzId: q.userQuizzId
            }));
            setQuizzes(processedQuizzes);
        } else {
            setQuizzes([]);
        }

        // ✅ Kiểm tra điều kiện mở quiz cho module này
        const completedLessons = targetModule.lessons.filter(l => l.status).length;
        const totalLessons = targetModule.lessons.length;
        const moduleQuizUnlocked = completedLessons === totalLessons && totalLessons > 0;

        if (!moduleQuizUnlocked) {
            alert('Bạn cần hoàn thành tất cả video bài học trước khi làm quiz.');
            return;
        }

        if (quiz) {
            setSelectedQuiz(quiz);
        }

        setContentType('quiz-intro');

        // ✅ GỌI đúng quiz data theo ID module được truyền vào
        await fetchQuizData(targetModule.id);
    };


    const fetchQuizData = async (moduleId = currentModule?.id) => {

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                navigate('/login');
                return;
            }

            // Get quiz basic info from course completion data
            const response = await axios.get(
                `https://localhost:5000/api/CourseProgress/get-completion/${studentCourseId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.moduleCompletionVMs) {
                const module = response.data.moduleCompletionVMs.find(m =>
                    m.id === moduleId
                );


                if (module && module.quizzs && module.quizzs.length > 0) {
                    const quiz = module.quizzs[0];

                    // Only set basic quiz info, questions will be loaded when starting quiz
                    const processedQuizData = {
                        id: quiz.id,
                        quizId: quiz.id,
                        userQuizzId: quiz.userQuizzId,
                        quizTitle: quiz.title,
                        title: quiz.title,
                        description: quiz.description || 'Kiểm tra kiến thức của bạn',
                        timeLimit: quiz.timeLimit || 30,
                        passingScore: quiz.requiredScore || 60,
                        questionCount: quiz.questionCount || 0,
                        questions: [], // Questions will be loaded in startQuiz
                        totalQuestions: quiz.questionCount || 0,
                        startAt: quiz.startAt,
                        submitAt: quiz.submitAt,
                        duration: quiz.duration,
                        score: quiz.score,
                        isPass: quiz.isPass
                    };

                    setQuizData(processedQuizData);

                    if (quiz.userQuizzId) {
                        setUserQuizId(quiz.userQuizzId);
                    }
                }
            }
        } catch (err) {
            console.error('Error fetching quiz data:', err);
        }
    };

    const startQuiz = async () => {
        try {
            console.log('🎯 === STARTING QUIZ DEBUG ===');
            console.log('🔍 Current module:', currentModule);
            console.log('🔍 Module ID:', currentModule?.id);
            console.log('🔍 Module name:', currentModule?.moduleName);
            console.log('🔍 Student course ID:', studentCourseId);

            const token = localStorage.getItem('token');
            console.log('🔐 Token exists:', !!token);

            if (!token) {
                console.error('❌ No token found, redirecting to login');
                navigate('/login');
                return;
            }

            // Ensure we have moduleProgressId
            let currentModuleProgressID = currentModule?.moduleProgressID || moduleProgressID;
            console.log('🆔 ModuleProgressID check:', {
                fromCurrentModule: currentModule?.moduleProgressID,
                fromProps: moduleProgressID,
                final: currentModuleProgressID,
                courseProgressId: courseProgressId
            });

            if (!currentModuleProgressID) {
                // Check if we have courseProgressId before trying to create module progress
                if (!courseProgressId) {
                    console.error('❌ No courseProgressId available - cannot create module progress');
                    alert('Không tìm thấy thông tin tiến độ khóa học. Vui lòng tải lại trang.');
                    return;
                }

                console.error('❌ No moduleProgressId available - will need to create one when starting lesson');
                alert('Vui lòng chọn và xem một video bài học trước khi làm quiz.');
                return;
            }

            console.log('🚀 Starting/Resetting quiz with moduleProgressID:', currentModuleProgressID);

            // Step 1: POST to create/reset quiz
            console.log('📤 STEP 1: Creating/resetting quiz');
            console.log('📤 POST URL:', `https://localhost:5000/api/CourseProgress/user-quiz/${currentModuleProgressID}`);

            const createResponse = await axios.post(
                `https://localhost:5000/api/CourseProgress/user-quiz/${currentModuleProgressID}`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ POST Response Status:', createResponse.status);
            console.log('✅ POST Response Data:', createResponse.data);
            console.log('✅ POST Response Type:', typeof createResponse.data);

            // Check for both uppercase and lowercase 'id' fields
            const newUserQuizId = createResponse.data?.Id || createResponse.data?.id;

            if (newUserQuizId) {
                console.log('🆔 Got userQuizId from POST:', newUserQuizId);
                console.log('🆔 UserQuizId type:', typeof newUserQuizId);

                // Step 2: GET quiz questions from get-completion API 
                console.log('📥 STEP 2: Fetching quiz questions from get-completion');
                console.log('📥 GET URL:', `https://localhost:5000/api/CourseProgress/get-completion/${studentCourseId}`);

                const getResponse = await axios.get(
                    `https://localhost:5000/api/CourseProgress/get-completion/${studentCourseId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                console.log('✅ GET Response Status:', getResponse.status);
                console.log('✅ GET Response Data:', getResponse.data);

                // Find current module and quiz data with questions
                const moduleData = getResponse.data?.moduleCompletionVMs?.find(m => m.id === currentModule.id);
                console.log('🔍 Found module data:', moduleData);
                console.log('🔍 Module has quizzes:', moduleData?.quizzs?.length || 0);

                const quizWithQuestions = moduleData?.quizzs?.[0];
                console.log('🧠 Quiz with questions:', quizWithQuestions);
                console.log('🧠 Quiz has questions:', quizWithQuestions?.questions?.length || 0);

                if (quizWithQuestions && quizWithQuestions.questions) {
                    console.log('✅ Found quiz with questions, processing...');

                    // Map questions to expected format
                    const mappedQuestions = quizWithQuestions.questions.map(q => ({
                        id: q.id,
                        questionContent: q.questionContent, // Already correct field name
                        answers: (q.answers || []).map(a => ({
                            id: a.id,
                            answerContent: a.answerContent, // Already correct field name
                            isCorrect: a.isCorrect,
                            option: a.option
                        }))
                    }));

                    console.log('📝 Mapped questions count:', mappedQuestions.length);
                    console.log('📝 Sample mapped question:', mappedQuestions[0]);

                    if (mappedQuestions.length === 0) {
                        console.error('❌ No questions found after mapping');
                        alert('Quiz chưa có câu hỏi. Vui lòng liên hệ giáo viên.');
                        return;
                    }

                    // Update quiz data with questions
                    console.log('📊 Updating quiz data with questions...');
                    setQuizData(prevData => ({
                        ...prevData,
                        questions: mappedQuestions,
                        totalQuestions: mappedQuestions.length,
                        userQuizzId: newUserQuizId
                    }));

                    // Set userQuizId for submission
                    setUserQuizId(newUserQuizId);

                    // Start quiz
                    const timeLimit = quizData?.timeLimit || 30;
                    console.log('⏰ Setting timer for:', timeLimit, 'minutes');
                    setTimeLeft(timeLimit * 60);
                    setQuizStarted(true);
                    setSelectedAnswers({});
                    setCurrentQuestionIndex(0);
                    setContentType('quiz-taking');

                    console.log('✅ Quiz started successfully!');
                    console.log('✅ UserQuizId:', newUserQuizId);
                    console.log('✅ Questions loaded:', mappedQuestions.length);
                    console.log('✅ Timer set to:', timeLimit * 60, 'seconds');
                } else {
                    console.error('❌ No quiz or questions found in API response');
                    console.error('❌ QuizWithQuestions:', quizWithQuestions);
                    console.error('❌ Questions array:', quizWithQuestions?.questions);
                    alert('Không nhận được câu hỏi từ server từ get-completion API.');
                }
            } else {
                console.error('❌ Invalid POST response - no userQuizId found');
                console.error('❌ Response data:', createResponse.data);
                console.error('❌ Expected field "Id" or "id" not found');
                console.error('❌ Available fields:', Object.keys(createResponse.data || {}));
                alert('Không thể tạo quiz. Vui lòng thử lại.');
            }

        } catch (err) {
            console.error('🚨 === QUIZ START ERROR DETAILS ===');
            console.error('🚨 Error object:', err);
            console.error('🚨 Error message:', err.message);
            console.error('🚨 Error response:', err.response);
            console.error('🚨 Error response status:', err.response?.status);
            console.error('🚨 Error response data:', err.response?.data);
            console.error('🚨 Error response headers:', err.response?.headers);
            console.error('🚨 Error config:', err.config);
            console.error('🚨 === END ERROR DETAILS ===');

            let errorMessage = 'Không thể bắt đầu quiz. ';
            if (err.response?.status === 400) {
                errorMessage += 'Module chưa được hoàn thành. Vui lòng xem hết video bài học trước.';
                console.error('🚨 Status 400: Module not completed');
            } else if (err.response?.status === 404) {
                errorMessage += 'Không tìm thấy quiz cho module này.';
                console.error('🚨 Status 404: Quiz not found');
            } else if (err.response?.status === 401) {
                errorMessage += 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
                console.error('🚨 Status 401: Unauthorized');
            } else if (err.response?.status === 500) {
                errorMessage += 'Lỗi server. Vui lòng thử lại sau.';
                console.error('🚨 Status 500: Server error');
            } else if (err.response?.data?.message) {
                errorMessage += err.response.data.message;
                console.error('🚨 Custom error message:', err.response.data.message);
            } else {
                errorMessage += 'Vui lòng thử lại.';
                console.error('🚨 Unknown error type');
            }

            alert(errorMessage);
        }
    };

    const handleAnswerSelect = async (questionId, answerId) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: answerId
        }));
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
        if (submitLoading) return;
        setSubmitLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (Object.keys(selectedAnswers).length === 0) {
                alert('Vui lòng chọn ít nhất một câu trả lời trước khi nộp bài!');
                setSubmitLoading(false);
                return;
            }
            const answers = Object.entries(selectedAnswers).map(([questionId, selectedAnswerId]) => ({
                questionId: parseInt(questionId),
                selectedAnswerId: parseInt(selectedAnswerId)
            }));

            await axios.put(
                `https://localhost:5000/api/CourseProgress/user-quiz/${userQuizId}/answers`,
                { answers: answers },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setSuccessMessage('Nộp bài thành công! Đang cập nhật kết quả...');
            setShowMessage(true);

            setTimeout(() => {
                setShowMessage(false);
                setSuccessMessage('');
            }, 3000);

            setQuizStarted(false);
            setSelectedAnswers({});
            setCurrentQuestionIndex(0);
            setUserQuizId(null);
            setContentType('quiz-intro');

            // Lấy lại kết quả quiz mới nhất từ API
            const completionRes = await axios.get(
                `https://localhost:5000/api/CourseProgress/get-completion/${studentCourseId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            const refreshedModule = completionRes.data.moduleCompletionVMs.find(m => m.id === currentModule?.id);
            const refreshedQuiz = refreshedModule?.quizzs?.find(q => q.id === (selectedQuiz?.id || quizData?.id));

            // Cập nhật lại trạng thái quiz trong modules để sidebar đổi màu ngay
            setModules(prev =>
                prev.map(module =>
                    module.id === currentModule?.id
                        ? {
                            ...module,
                            quizzs: module.quizzs?.map(q =>
                                q.id === (selectedQuiz?.id || quizData?.id)
                                    ? {
                                        ...q,
                                        userQuizzId: refreshedQuiz?.userQuizzId,
                                        isPass: refreshedQuiz?.isPass,
                                        score: refreshedQuiz?.score
                                    }
                                    : q
                            )
                        }
                        : module
                )
            );

            // Cập nhật lại quizData để nội dung chính hiển thị đúng
            setQuizData(prev => ({
                ...prev,
                userQuizzId: refreshedQuiz?.userQuizzId,
                isPass: refreshedQuiz?.isPass,
                score: refreshedQuiz?.score,
                submitAt: refreshedQuiz?.submitAt,
                duration: refreshedQuiz?.duration
            }));

        } catch (err) {
            console.error('Error submitting quiz:', err);
            alert('Có lỗi khi nộp bài. Vui lòng thử lại.');
        } finally {
            setSubmitLoading(false);
        }
    };

    const canTakeQuiz = () => {
        return currentModule?.moduleProgressID &&
            currentModule.moduleProgressID !== 0 &&
            lessons.length > 0 &&
            lessons.every(lesson => lesson.status === true);
    };

    const calculateModuleProgress = (module) => {
        if (!module.lessons || module.lessons.length === 0) return 0;
        const completedLessons = module.lessons.filter(lesson => lesson.status === true).length;
        return Math.round((completedLessons / module.lessons.length) * 100);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const renderMainContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600">Đang tải dữ liệu...</span>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-6xl mb-4">❌</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h3>
                    <p className="text-gray-600">{error}</p>
                </div>
            );
        }

        switch (contentType) {
            case 'video':
                return renderVideoContent();
            case 'quiz-intro':
                return renderQuizIntro();
            case 'quiz-taking':
                return renderQuizTaking();
            default:
                return renderModuleOverview();
        }
    };

    const renderModuleOverview = () => {
        return (
            <div className="module-overview-content">
                <div className="overview-header">
                    <h2>📚 {currentModule?.moduleName || 'Chào mừng đến với khóa học'}</h2>
                    <p>Chọn một video bài học để bắt đầu học tập.</p>
                </div>

                {currentModule && (
                    <div className="module-stats">
                        <div className="stat-card">
                            <div className="stat-number">{calculateModuleProgress(currentModule)}%</div>
                            <div className="stat-label">Hoàn thành</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-number">{lessons.length}</div>
                            <div className="stat-label">Video bài học</div>
                        </div>
                    </div>
                )}

                <div className="learning-tip">
                    💡 <strong>Mẹo:</strong> Xem hết tất cả video để mở khóa quiz đánh giá cuối module
                </div>
            </div>
        );
    };

    const renderVideoContent = () => {
        if (!selectedLesson) return null;

        return (
            <div className="video-content">
                <div className="video-header-course">
                    <h1>{selectedLesson.videoNum}. {selectedLesson.lessonName}</h1>
                    <p>{selectedLesson.description}</p>
                </div>
                <div className="video-player-container">
                    {selectedLesson.securedVideoLink ? (
                        <video
                            key={selectedLesson.id} // Force re-render when lesson changes
                            ref={videoRef}
                            controls
                            width="100%"
                            height="500"
                            onPlay={handlePlay}
                            onPause={handlePause}
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={handleEnded}
                            onLoadedMetadata={() => {
                                console.log('📺 Video loaded metadata for lesson:', selectedLesson.id);
                                initializeVideoProgress();
                            }}
                        >
                            <source src={selectedLesson.securedVideoLink} type="video/mp4" />
                            Trình duyệt của bạn không hỗ trợ video HTML5.
                        </video>
                    ) : (
                        <div className="video-placeholder" key={selectedLesson.id}>
                            <div className="play-icon">▶️</div>
                            <p>Video: {selectedLesson.lessonName}</p>
                            <p>Thời lượng: {selectedLesson.duration || '10:00'}</p>
                            <p>✅ Đã đánh dấu hoàn thành khi click vào lesson</p>
                        </div>
                    )}
                </div>
                <div className="video-info">
                    {selectedLesson.description && (
                        <div className="lesson-description">
                            <h3>Mô tả</h3>
                            <p>{selectedLesson.description}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderQuizIntro = () => {
        if (!quizData) {
            return (
                <div className="quiz-loading">
                    <div>Đang tải thông tin quiz...</div>
                </div>
            );
        }

        return (
            <div className="quiz-intro-content">
                <div className="quiz-header">
                    <h1>{quizData.title}</h1>
                    <p>{quizData.description}</p>
                </div>

                <div className="quiz-info-grid">
                    <div className="quiz-info-card">
                        <h3>📋 Số câu hỏi</h3>
                        <div className="info-value">{quizData.questionCount}</div>
                    </div>
                    <div className="quiz-info-card">
                        <h3>⏱️ Thời gian</h3>
                        <div className="info-value">{quizData.timeLimit} phút</div>
                    </div>
                    <div className="quiz-info-card">
                        <h3>🎯 Điểm qua</h3>
                        <div className="info-value">{quizData.passingScore}%</div>
                    </div>
                </div>

                {typeof quizData.isPass === 'boolean' ? (
                    <div
                        className="quiz-completed"
                        style={{
                            backgroundColor: quizData.isPass ? '#eafaf1' : '#fdecea',
                            border: `2px solid ${quizData.isPass ? '#27ae60' : '#e74c3c'}`
                        }}
                    >
                        <h3
                            style={{
                                color: quizData.isPass ? '#27ae60' : '#e74c3c',
                                fontWeight: 'bold'
                            }}
                        >
                            {quizData.isPass ? '✅ Hoàn thành' : '❌ Không đạt'}
                        </h3>
                        <div className="result-summary">
                            <div className="result-item">
                                <span>Điểm số:</span>
                                <strong>{quizData.score}%</strong>
                            </div>
                            <div className="result-item">
                                <span>Kết quả:</span>
                                <strong
                                    className={quizData.isPass ? 'pass' : 'fail'}
                                    style={{ color: quizData.isPass ? '#27ae60' : '#e74c3c' }}
                                >
                                    {quizData.isPass ? 'Đạt' : 'Không đạt'}
                                </strong>
                            </div>
                            {quizData.submitAt && (
                                <div className="result-item">
                                    <span>Thời gian nộp bài:</span>
                                    <strong>{new Date(quizData.submitAt).toLocaleString('vi-VN')}</strong>
                                </div>
                            )}
                            {quizData.duration && (
                                <div className="result-item">
                                    <span>Thời gian làm bài:</span>
                                    <strong>{quizData.duration.toFixed(1)} phút</strong>
                                </div>
                            )}
                        </div>
                        <button
                            className="start-quiz-btn"
                            onClick={startQuiz}
                            style={{ marginTop: '20px', backgroundColor: '#f39c12' }}
                        >
                            🔄 Làm lại Quiz
                        </button>
                        <button
                            className="start-quiz-btn"
                            style={{ marginTop: '20px', backgroundColor: '#3498db', color: '#fff' }}
                            onClick={() => navigate('/quiz-complete', {
                                state: {
                                    studentCourseId,
                                    moduleId: currentModule?.id,
                                    userQuizzId: quizData?.userQuizzId
                                }
                            })}
                        >
                            👀 Xem chi tiết bài làm
                        </button>

                    </div>
                ) : (
                    <div className="quiz-start">
                        <div className="quiz-instructions">
                            <h3>🎯 Hướng dẫn làm bài</h3>
                            <ul>
                                <li>Bạn có {quizData.timeLimit} phút để hoàn thành {quizData.questionCount} câu hỏi</li>
                                <li>Cần đạt ít nhất {quizData.passingScore}% để vượt qua</li>
                                <li>Bạn có thể xem lại câu trả lời sau khi hoàn thành</li>
                                <li>Không có giới hạn thời gian cho mỗi câu hỏi</li>
                            </ul>
                        </div>
                        <button
                            className="start-quiz-btn"
                            onClick={startQuiz}
                        >
                            🚀 Bắt đầu Quiz
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderQuizTaking = () => {
        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            return (
                <div className="quiz-loading">
                    <div>Đang tải câu hỏi...</div>
                </div>
            );
        }

        const currentQuestion = quizData.questions[currentQuestionIndex];

        return (
            <div className="quiz-taking-content">
                {/* Quiz Header */}
                <div className="quiz-taking-header">
                    <div className="quiz-progress">
                        <span>Câu {currentQuestionIndex + 1} / {quizData.questions.length}</span>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${((currentQuestionIndex + 1) / quizData.questions.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="quiz-timer">
                        ⏰ {formatTime(timeLeft)}
                    </div>
                </div>

                {/* Question */}
                <div className="question-container">
                    <h2>Câu {currentQuestionIndex + 1}: {currentQuestion.questionContent}</h2>

                    <div className="answers-grid">
                        {currentQuestion.answers.map((answer) => (
                            <div
                                key={answer.id}
                                className={`answer-option ${selectedAnswers[currentQuestion.id] === answer.id ? 'selected' : ''}`}
                                onClick={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                            >
                                <div className="answer-radio">
                                    {selectedAnswers[currentQuestion.id] === answer.id ? '●' : '○'}
                                </div>
                                <span className="answer-text">{answer.answerContent}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation */}
                <div className="quiz-navigation">
                    <button
                        className="nav-btn prev-btn"
                        onClick={prevQuestion}
                        disabled={currentQuestionIndex === 0}
                    >
                        ← Câu trước
                    </button>

                    <div className="question-indicators">
                        {quizData.questions.map((_, index) => (
                            <div
                                key={index}
                                className={`question-indicator ${index === currentQuestionIndex ? 'current' : ''
                                    } ${selectedAnswers[quizData.questions[index].id] ? 'answered' : ''}`}
                                onClick={() => setCurrentQuestionIndex(index)}
                            >
                                {index + 1}
                            </div>
                        ))}
                    </div>

                    {currentQuestionIndex === quizData.questions.length - 1 ? (
                        <button
                            className="nav-btn submit-btn"
                            onClick={handleSubmitQuiz}
                            disabled={submitLoading}
                        >
                            {submitLoading ? 'Đang nộp...' : 'Nộp bài ✓'}
                        </button>
                    ) : (
                        <button
                            className="nav-btn next-btn"
                            onClick={nextQuestion}
                        >
                            Câu tiếp →
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="learning-interface">
            {/* Success Message */}
            {showMessage && successMessage && (
                <div className="success-message">
                    {successMessage}
                </div>
            )}

            {/* ChatBubble chỉ hiển thị khi không ở quiz */}
            {contentType !== 'quiz-intro' && contentType !== 'quiz-taking' && <ChatBubble />}

            {/* Sidebar */}
            <div className="modules-sidebar">
                {/* Header */}
                <div className="sidebar-header">
                    <div className="back-button-container-learning">
                        <button
                            onClick={() => navigate(-1)}
                            className="back-button-learning"
                        >
                            ← Về trang khóa học
                        </button>
                    </div>
                    <h3>Nội dung khóa học</h3>
                </div>

                {/* Module List */}
                <div className="modules-list">
                    {loading ? (
                        <div className="loading-container">
                            <span>Đang tải...</span>
                        </div>
                    ) : (
                        modules.map((module, index) => {
                            const isExpanded = expandedModules.has(module.id);
                            const progress = calculateModuleProgress(module);
                            const isCompleted = progress === 100;
                            const completedLessons = module.lessons?.filter(l => l.status).length || 0;
                            const totalLessons = module.lessons?.length || 0;

                            return (
                                <div key={module.id} className="module-item">
                                    <div
                                        className={`module-header ${isExpanded ? 'expanded' : ''}`}
                                        onClick={() => handleModuleToggle(module.id)}
                                    >
                                        <div className="module-toggle">
                                            {isExpanded ? '▼' : '▶'}
                                        </div>
                                        <div className="module-info">
                                            <div className="module-details">
                                                <h4>Module {index + 1}: {module.moduleName}</h4>
                                            </div>
                                        </div>
                                        <div className="module-progress">
                                            {completedLessons}/{totalLessons}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="module-content">
                                            {/* Lessons */}
                                            {module.lessons && module.lessons.map((lesson, lessonIndex) => (
                                                <div
                                                    key={lesson.id}
                                                    className={`lesson-item ${lesson.status ? 'completed' : ''} ${selectedLesson?.id === lesson.id ? 'active' : ''}`}
                                                    onClick={() => handleLessonItemClick(lesson, module)}
                                                >
                                                    <div className="lesson-icon">
                                                        {lesson.status ? '✓' : '▶'}
                                                    </div>
                                                    <div className="lesson-info">
                                                        <h5>{lesson.title}</h5>
                                                    </div>
                                                </div>
                                            ))}
                                            {/* Đóng map lesson trước khi render quiz-section */}
                                            {module.quizzs && module.quizzs.length > 0 && (
                                                <div className="quiz-section">
                                                    {module.quizzs.map((quiz, quizIndex) => {
                                                        const isQuizUnlocked = completedLessons === totalLessons && totalLessons > 0;
                                                        const isQuizCompleted = quiz.userQuizzId && typeof quiz.isPass !== 'undefined';
                                                        const isQuizPassed = isQuizCompleted && quiz.isPass;
                                                        const isQuizFailed = isQuizCompleted && !quiz.isPass;

                                                        let bgColor = '#fff';
                                                        let borderColor = '#eee';
                                                        let icon = '?';
                                                        let titleColor = undefined;

                                                        if (isQuizPassed) {
                                                            bgColor = '#eafaf1';
                                                            borderColor = '#27ae60';
                                                            icon = '✓';
                                                            titleColor = '#27ae60';
                                                        } else if (isQuizFailed) {
                                                            bgColor = '#fdecea';
                                                            borderColor = '#e74c3c';
                                                            icon = '❌';
                                                            titleColor = '#e74c3c';
                                                        } else if (!isQuizUnlocked) {
                                                            icon = '🔒';
                                                        }

                                                        return (
                                                            <div
                                                                key={quiz.id}
                                                                className={`quiz-item lesson-item${isQuizPassed ? ' completed' : ''}${isQuizFailed ? ' fail' : ''}${!isQuizUnlocked ? ' locked' : ''}`}
                                                                style={{
                                                                    backgroundColor: bgColor,
                                                                    borderColor: borderColor
                                                                }}
                                                                onClick={() => {
                                                                    if (isQuizUnlocked) {
                                                                        handleQuizClick(quiz, module);
                                                                    } else {
                                                                        alert('Hãy hoàn thành tất cả video trước khi làm quiz!');
                                                                    }
                                                                }}
                                                            >
                                                                <div className="lesson-icon">{icon}</div>
                                                                <div className="lesson-info">
                                                                    <h5
                                                                        className="quiz-title"
                                                                        style={{
                                                                            color: titleColor
                                                                        }}
                                                                    >
                                                                        {quiz.title}
                                                                    </h5>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="content-area">
                {renderMainContent()}
            </div>
        </div>
    );
};

export default LearningInterface;