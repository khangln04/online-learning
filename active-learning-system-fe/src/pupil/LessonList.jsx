import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useVideoProgress } from '../hooks/useVideoProgress';
import '../css/pupil/lessonList.css';

const LessonList = () => {
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

    const [moduleData, setModuleData] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [courseProgressId, setCourseProgressId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [showVideo, setShowVideo] = useState(false);
    const [currentLessonProgress, setCurrentLessonProgress] = useState(null);

    // Video progress tracking
    const {
        videoRef,
        handlePlay,
        handlePause,
        handleTimeUpdate,
        handleEnded,
        initializeVideoProgress,
        saveCurrentProgress
    } = useVideoProgress(currentLessonProgress, (newStatus) => {
        // Callback khi video đạt 90% - update lesson status
        if (newStatus && selectedLesson) {
            setSelectedLesson(prev => ({ ...prev, status: true }));
            // Cập nhật trong danh sách lessons
            setLessons(prev => prev.map(lesson => 
                lesson.id === selectedLesson.id 
                    ? { ...lesson, status: true }
                    : lesson
            ));
        }
    });

    useEffect(() => {
        if (studentCourseId) {
            fetchModuleLessons();
        } else {
            setError('Thiếu thông tin studentCourseId');
            setLoading(false);
        }
    }, [studentCourseId]);

    const fetchModuleLessons = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                navigate('/login');
                return;
            }

            console.log('Fetching module lessons for studentCourseId:', studentCourseId);

            // Gọi API get-completion để lấy lessons với status và lastWatch cập nhật
            const response = await axios.get(
                `https://localhost:5000/api/CourseProgress/get-completion/${studentCourseId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('API get-completion response:', response.data);

            if (response.data) {
                // Lưu courseProgressId từ props hoặc từ response
                const currentCourseProgressId = passedCourseProgressId || response.data.courseProgressId;
                setCourseProgressId(currentCourseProgressId);
                console.log('CourseProgressId:', currentCourseProgressId);
                
                // Tìm module theo moduleId
                const currentModule = response.data.moduleCompletionVMs?.find(
                    m => m.id === parseInt(moduleId)
                );

                if (currentModule) {
                    console.log('Current module found:', currentModule);
                    console.log('Module lessons:', currentModule.lessons);
                    
                    setModuleData(currentModule);
                    setLessons(currentModule.lessons || []);
                    
                    // Log lesson status để debug
                    currentModule.lessons?.forEach(lesson => {
                        console.log(`Lesson ${lesson.videoNum}:`, {
                            id: lesson.id,
                            lessonProgressId: lesson.lessonProgressId,
                            status: lesson.status,
                            lastWatch: lesson.lastWatch,
                            hasLessonProgressId: lesson.lessonProgressId !== null
                        });
                    });
                } else {
                    console.error('Module not found with id:', moduleId);
                    setError('Không tìm thấy thông tin module');
                }
            }

        } catch (err) {
            console.error('Error fetching module lessons:', err);
            setError('Không thể tải danh sách bài học. Vui lòng thử lại sau.');
            if (err.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const insertLessonProgress = async (videoId) => {
        try {
            console.log('=== INSERT LESSON PROGRESS START ===');
            const token = localStorage.getItem('token');
            console.log('Token exists:', !!token);
            
            // ✅ Sử dụng moduleProgressID từ moduleData hoặc props
            let currentModuleProgressID = moduleData?.moduleProgressID || moduleProgressID;
            console.log('Initial moduleProgressID:', currentModuleProgressID);
            console.log('ModuleProgressID from moduleData:', moduleData?.moduleProgressID);
            console.log('ModuleProgressID from props:', moduleProgressID);
            
            // ✅ Validation dữ liệu đầu vào
            if (!videoId || videoId === 0) {
                console.error('❌ Invalid videoId:', videoId);
                return null;
            }
            
            if (!courseProgressId || courseProgressId === 0) {
                console.error('❌ Invalid courseProgressId:', courseProgressId);
                return null;
            }
            
            if (!moduleId || moduleId === 0) {
                console.error('❌ Invalid moduleId:', moduleId);
                return null;
            }
            
            if (!currentModuleProgressID || currentModuleProgressID === 0) {
                console.log('Creating module progress first...');
                
                const moduleProgressData = {
                    courseProgressId: parseInt(courseProgressId),
                    moduleId: parseInt(moduleId)
                };
                console.log('Module progress data:', moduleProgressData);

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
                
                console.log('Module progress response:', moduleResponse.data);
                
                // Cập nhật moduleProgressID từ response
                if (moduleResponse.data && moduleResponse.data.id) {
                    currentModuleProgressID = moduleResponse.data.id;
                    console.log('New moduleProgressID created:', currentModuleProgressID);
                } else if (moduleResponse.data && typeof moduleResponse.data === 'number') {
                    currentModuleProgressID = moduleResponse.data;
                    console.log('New moduleProgressID (number):', currentModuleProgressID);
                } else {
                    console.error('Failed to get moduleProgressID from response:', moduleResponse.data);
                    return null;
                }
            } else {
                console.log('✅ Using existing moduleProgressID:', currentModuleProgressID);
            }
            
            console.log('Final moduleProgressID for lesson:', currentModuleProgressID);
            
            // ✅ Validation trước khi tạo lessonProgressData
            if (!currentModuleProgressID || currentModuleProgressID === 0) {
                console.error('❌ Invalid moduleProgressID:', currentModuleProgressID);
                return null;
            }
            
            const lessonProgressData = {
                moduleProgressId: parseInt(currentModuleProgressID),
                videoId: parseInt(videoId)
            };
            console.log('✅ Validated lesson progress data:', lessonProgressData);

            const response = await axios.post(
                'https://localhost:5000/api/CourseProgress/InsertLessonProgress',
                lessonProgressData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Lesson progress response:', response.data);
            console.log('Response status:', response.status);
            
            // ✅ Extract lessonProgressId từ response
            let lessonProgressId = null;
            if (response.data && response.data.id) {
                lessonProgressId = response.data.id;
                console.log('✅ Got lessonProgressId from response.data.id:', lessonProgressId);
            } else if (response.data && typeof response.data === 'number') {
                lessonProgressId = response.data;
                console.log('✅ Got lessonProgressId from response.data (number):', lessonProgressId);
            } else if (response.data && response.data.lessonProgressId) {
                lessonProgressId = response.data.lessonProgressId;
                console.log('✅ Got lessonProgressId from response.data.lessonProgressId:', lessonProgressId);
            } else {
                console.error('❌ Could not extract lessonProgressId from response:', response.data);
            }
            
            console.log('=== INSERT LESSON PROGRESS COMPLETED ===');
            console.log('Final lessonProgressId:', lessonProgressId);
            
            return lessonProgressId; // ✅ Return lessonProgressId để sử dụng
            
        } catch (err) {
            console.error('=== INSERT LESSON PROGRESS ERROR ===');
            console.error('Error inserting lesson progress:', err);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            console.error('Full error:', err);
            return null; // ✅ Return null nếu có lỗi
        }
    };

    const handleLessonClick = async (lesson) => {
        console.log('=== LESSON CLICK START ===');
        console.log('Lesson clicked:', {
            id: lesson.id,
            lessonProgressId: lesson.lessonProgressId,
            status: lesson.status,
            description: lesson.description,
            videoNum: lesson.videoNum,
            lastWatch: lesson.lastWatch
        });
        console.log('Current moduleProgressID:', moduleProgressID);
        console.log('Current studentCourseId:', studentCourseId);
        
        // Hiển thị video trước
        setSelectedLesson(lesson);
        setShowVideo(true);
        
        let lessonProgressId = lesson.lessonProgressId; // ✅ Kiểm tra lessonProgressId có sẵn
        
        // ✅ Chỉ gọi API nếu lessonProgressId là null
        if (!lessonProgressId || lessonProgressId === null) {
            console.log('❌ LessonProgressId is null, calling insertLessonProgress...');
            console.log('🔍 Debug data before API call:', {
                videoId: lesson.id,
                moduleProgressID: moduleProgressID,
                courseProgressId: courseProgressId,
                moduleId: moduleId
            });
            
            try {
                lessonProgressId = await insertLessonProgress(lesson.id);
                console.log('✅ Created new lessonProgressId:', lessonProgressId);
            } catch (error) {
                console.error('❌ Failed to create lessonProgressId:', error);
            }
        } else {
            console.log('✅ Using existing lessonProgressId:', lessonProgressId);
        }
        
        // ✅ Setup lesson progress tracking với lessonProgressId đúng
        if (lessonProgressId) {
            const lessonProgressData = {
                id: lessonProgressId, // ✅ Sử dụng lessonProgressId từ API
                videoId: lesson.id,   // ✅ videoId (5)
                watchedDuration: lesson.watchedDuration || 0,
                status: lesson.status
            };
            setCurrentLessonProgress(lessonProgressData);
            console.log('✅ Set current lesson progress:', lessonProgressData);
        } else {
            console.error('❌ Could not get lessonProgressId, video tracking may not work');
            // Fallback - setup basic tracking
            const lessonProgressData = {
                id: null,
                videoId: lesson.id,
                watchedDuration: lesson.watchedDuration || 0,
                status: lesson.status
            };
            setCurrentLessonProgress(lessonProgressData);
            console.log('⚠️ Using fallback lesson progress:', lessonProgressData);
        }
        
        console.log('=== LESSON CLICK COMPLETED ===');
    };

    const closeVideo = () => {
        // Save progress trước khi đóng video
        saveCurrentProgress();
        setShowVideo(false);
        setSelectedLesson(null);
        setCurrentLessonProgress(null);
    };

    const calculateProgress = () => {
        if (!lessons.length) return 0;
        const viewedLessons = lessons.filter(lesson => lesson.status === true).length;
        return Math.round((viewedLessons / lessons.length) * 100);
    };

    const canTakeQuiz = () => {
        // Kiểm tra có moduleProgressID hợp lệ và tất cả lessons đã xem
        return moduleProgressID && 
               moduleProgressID !== 0 && 
               lessons.length > 0 && 
               lessons.every(lesson => lesson.status === true);
    };

    const handleTakeQuiz = () => {
        if (!moduleProgressID || moduleProgressID === 0) {
            alert('Vui lòng hoàn thành ít nhất một bài học trước khi làm quiz.');
            return;
        }
        
        if (canTakeQuiz()) {
            navigate(`/quiz-pupil/${moduleId}`, { 
                state: { 
                    studentCourseId: studentCourseId,
                    moduleProgressID: moduleProgressID,
                    courseId: courseId
                } 
            });
        } else {
            alert('Bạn cần hoàn thành tất cả video bài học trước khi làm quiz.');
        }
    };

    if (loading) {
        return (
            <div className="lesson-list-container">
                <div className="lesson-loading">
                    <div className="lesson-loading-spinner"></div>
                    <div>Đang tải danh sách bài học...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="lesson-list-container">
                <div className="lesson-error">
                    <div className="lesson-error-icon">❌</div>
                    <h3>Có lỗi xảy ra</h3>
                    <p>{error}</p>
                    <button onClick={() => navigate(-1)} className="lesson-back-btn">
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="lesson-list-container">
            {/* Header */}
            <div className="lesson-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    ← Quay lại
                </button>
                
                <div className="module-info">
                    <h1 className="module-title">
                        {moduleData?.moduleNum}. {moduleData?.moduleName}
                    </h1>
                    <p className="module-description">
                        {moduleData?.description}
                    </p>
                    
                    <div className="progress-section">
                        <div className="progress-header">
                            <span>Tiến độ học tập</span>
                            <span className="progress-text">
                                {lessons.filter(l => l.status === true).length}/{lessons.length} video
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill" 
                                style={{ width: `${calculateProgress()}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lesson Tabs */}
            <div className="lesson-tabs">
                <div className="tab active">Video bài học</div>
                <div 
                    className={`tab ${canTakeQuiz() ? 'enabled' : 'disabled'}`}
                    onClick={handleTakeQuiz}
                >
                    Quiz
                </div>
            </div>

            {/* Lesson List */}
            <div className="lessons-section">
                <h2 className="lessons-title">Danh sách video</h2>
                
                <div className="lessons-list">
                    {lessons.map((lesson) => {
                        const isViewed = lesson.status === true;
                        
                        return (
                            <div 
                                key={lesson.id} 
                                className={`lesson-item ${isViewed ? 'viewed' : 'not-viewed'}`}
                                onClick={() => handleLessonClick(lesson)}
                            >
                                <div className="lesson-icon">
                                    {isViewed ? '✅' : '▶️'}
                                </div>
                                
                                <div className="lesson-content">
                                    <div className="lesson-header">
                                        <h3 className="lesson-title">
                                            {lesson.videoNum}. {lesson.description}
                                        </h3>
                                        <div className="lesson-meta">
                                            <span className="lesson-duration">10:00</span>
                                            <span className={`lesson-status ${isViewed ? 'viewed' : 'not-viewed'}`}>
                                                {isViewed ? 'Đã xem' : 'Chưa xem'}
                                            </span>
                                            {lesson.lastWatch && (
                                                <span className="lesson-last-watch">
                                                    Xem lần cuối: {new Date(lesson.lastWatch).toLocaleDateString('vi-VN')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quiz Section */}
                <div className={`quiz-section ${canTakeQuiz() ? 'enabled' : 'disabled'}`}>
                    <div className="quiz-info">
                        <h3>Kiểm tra kiến thức</h3>
                        <p>
                            {canTakeQuiz() 
                                ? 'Bạn đã xem hết tất cả video. Có thể làm quiz ngay bây giờ!'
                                : `Hãy xem hết ${lessons.length} video để mở khóa quiz`
                            }
                        </p>
                    </div>
                    <button 
                        className={`quiz-btn ${canTakeQuiz() ? 'enabled' : 'disabled'}`}
                        onClick={handleTakeQuiz}
                        disabled={!canTakeQuiz()}
                    >
                        {canTakeQuiz() ? 'Làm Quiz' : 'Quiz đã khóa'}
                    </button>
                </div>
            </div>

            {/* Video Modal */}
            {showVideo && selectedLesson && (
                <div className="video-modal" onClick={closeVideo}>
                    <div className="video-content" onClick={e => e.stopPropagation()}>
                        <div className="video-header">
                            <h3>{selectedLesson.videoNum}. {selectedLesson.description}</h3>
                            <button className="close-btn" onClick={closeVideo}>✕</button>
                        </div>
                        <div className="video-player">
                            {selectedLesson.securedVideoLink ? (
                                <video 
                                    ref={videoRef}
                                    controls 
                                    width="100%" 
                                    height="400"
                                    onPlay={handlePlay}
                                    onPause={handlePause}
                                    onTimeUpdate={handleTimeUpdate}
                                    onEnded={handleEnded}
                                    onLoadedMetadata={() => {
                                        // Khôi phục vị trí video từ watchedDuration
                                        initializeVideoProgress();
                                    }}
                                >
                                    <source src={selectedLesson.securedVideoLink} type="video/mp4" />
                                    Trình duyệt của bạn không hỗ trợ video HTML5.
                                </video>
                            ) : (
                                <div className="video-placeholder">
                                    <div className="play-icon">▶️</div>
                                    <p>Video: {selectedLesson.description}</p>
                                    <p>Thời lượng: 10:00</p>
                                    <p>✅ Đã đánh dấu hoàn thành khi click vào lesson</p>
                                </div>
                            )}
                        </div>
                        <div className="video-footer">
                            <span className="video-status">
                                {selectedLesson.status ? '✅ Đã hoàn thành' : '⏸️ Đang xem...'}
                            </span>
                            {currentLessonProgress?.watchedDuration > 0 && (
                                <span className="video-progress">
                                    📍 Đã xem: {Math.floor(currentLessonProgress.watchedDuration)}s
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LessonList;
