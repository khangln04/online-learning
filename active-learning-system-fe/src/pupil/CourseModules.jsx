import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../css/pupil/courseModules.css';

const CourseModules = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { studentCourseId } = location.state || {};

    const [courseData, setCourseData] = useState(null);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [insertingProgress, setInsertingProgress] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
    
        const allowed = !token || ["Pupil"].includes(role);
    
        if (!allowed) {
          setTimeout(() => navigate("/error"), 0);
        }
      }, [navigate]);

    useEffect(() => {
        if (studentCourseId) {
            initializeCourseProgress();
        } else {
            setError('Thiếu thông tin studentCourseId');
            setLoading(false);
        }
    }, [studentCourseId]);

    const initializeCourseProgress = async () => {
        try {
            setLoading(true);
            setInsertingProgress(true);
            
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            // 1. Gọi API insertprogress và đợi hoàn thành
            console.log('Inserting course progress...');
            const insertProgressResponse = await insertProgress();
            console.log('InsertProgress response:', insertProgressResponse);
            
            // 2. Đợi một chút để server cập nhật dữ liệu
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 3. Gọi API get-completion để lấy danh sách modules
            console.log('Fetching course completion data...');
            const completionResponse = await axios.get(
                `https://localhost:5000/api/CourseProgress/get-completion/${studentCourseId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (completionResponse.data) {
                console.log('Course data received:', completionResponse.data);
                setCourseData(completionResponse.data);
                setModules(completionResponse.data.moduleCompletionVMs || []);
            }

        } catch (err) {
            console.error('Error initializing course progress:', err);
            setError('Không thể tải thông tin khóa học. Vui lòng thử lại sau.');
            if (err.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
            setInsertingProgress(false);
        }
    };

    const insertProgress = async () => {
        try {
            const token = localStorage.getItem('token');
            
            const progressData = {
                courseStudentId: studentCourseId
            };

            const response = await axios.post(
                'https://localhost:5000/api/CourseProgress/InsertCourseProgress',
                progressData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('InsertCourseProgress response:', response.data);
            return response.data; // Trả về response để có thể lấy courseProgressId
        } catch (err) {
            console.error('Error inserting progress:', err);
            console.error('Error details:', err.response?.data);
            return null;
        }
    };

    const refreshCourseData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            const completionResponse = await axios.get(
                `https://localhost:5000/api/CourseProgress/get-completion/${studentCourseId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (completionResponse.data) {
                console.log('Refreshed course data:', completionResponse.data);
                setCourseData(completionResponse.data);
                setModules(completionResponse.data.moduleCompletionVMs || []);
            }
        } catch (err) {
            console.error('Error refreshing course data:', err);
        }
    };

    const insertModuleProgress = async (moduleId) => {
        try {
            const token = localStorage.getItem('token');
            
            console.log('=== INSERT MODULE PROGRESS DEBUG ===');
            console.log('courseData:', courseData);
            console.log('courseProgressId:', courseData?.courseProgressId);
            console.log('moduleId:', moduleId);
            console.log('token exists:', !!token);
            
            if (!courseData?.courseProgressId) {
                console.error('courseProgressId is missing from courseData');
                return null;
            }
            
            const moduleProgressData = {
                courseProcessId: parseInt(courseData.courseProgressId),
                moduleId: parseInt(moduleId)
            };

            console.log('InsertModuleProgress data to send:', moduleProgressData);

            const response = await axios.post(
                'https://localhost:5000/api/CourseProgress/InsertModuleProgress',
                moduleProgressData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Module progress response status:', response.status);
            console.log('Module progress response data:', response.data);
            
            // Trả về moduleProgressID mới từ response
            if (response.data && response.data.id) {
                console.log('Returning moduleProgressID from response.data.id:', response.data.id);
                return response.data.id;
            } else if (response.data && typeof response.data === 'number') {
                console.log('Returning moduleProgressID from response.data (number):', response.data);
                return response.data;
            } else {
                console.log('Unexpected response format:', response.data);
                return response.data; // Thử trả về response.data trực tiếp
            }
            
        } catch (err) {
            console.error('=== INSERT MODULE PROGRESS ERROR ===');
            console.error('Error inserting module progress:', err);
            console.error('Error status:', err.response?.status);
            console.error('Error data:', err.response?.data);
            console.error('Error message:', err.message);
            console.error('Full error:', err);
            
            // Chỉ log lỗi, không hiển thị alert để không làm gián đoạn UX
            console.error(`API Error (${err.response?.status}): ${err.response?.data?.message || err.message}`);
            
            return null;
        }
    };

    const handleModuleClick = async (module) => {
        let moduleProgressID = module.moduleProgressID;
        
        console.log('Module clicked:', {
            moduleId: module.id,
            moduleProgressID: module.moduleProgressID,
            status: module.status,
            moduleName: module.moduleName
        });
        
        // Kiểm tra nếu đã có moduleProgressID > 0, sử dụng luôn
        if (moduleProgressID > 0) {
            console.log('Module already has progress, using existing moduleProgressID:', moduleProgressID);
        } else {
            // Chỉ insert module progress nếu moduleProgressID = 0 (chưa có progress)
            console.log('Creating module progress for moduleId:', module.id);
            const newModuleProgressID = await insertModuleProgress(module.id);
            
            if (newModuleProgressID) {
                moduleProgressID = newModuleProgressID;
                console.log('Got new moduleProgressID:', moduleProgressID);
                
                // Refresh data để cập nhật moduleProgressID trong UI
                console.log('Refreshing course data to update moduleProgressID in UI...');
                await refreshCourseData();
                
            } else {
                console.error('Failed to create module progress, using moduleId as fallback');
                // Sử dụng moduleId làm moduleProgressID tạm thời
                moduleProgressID = module.id;
                console.log('Using moduleId as moduleProgressID fallback:', moduleProgressID);
            }
        }
        
        console.log('Navigating with moduleProgressID:', moduleProgressID);
        
        // Navigate to lesson list
        navigate(`/course/${courseId}/module/${module.id}/lessons`, { 
            state: { 
                studentCourseId: studentCourseId,
                moduleProgressID: moduleProgressID,
                courseProgressId: courseData?.courseProgressId,
                courseId: courseId
            } 
        });
    };

    const getModuleStatus = (module) => {
        if (module.status === true) {
            return { status: 'completed', text: 'Hoàn thành', color: '#28a745' };
        } else if (module.moduleProgressID > 0) {
            return { status: 'in-progress', text: 'Đang học', color: '#007bff' };
        }
        return { status: 'not-started', text: 'Chưa bắt đầu', color: '#6c757d' };
    };

    const calculateProgress = () => {
        if (!modules.length) return { completed: 0, total: modules.length };
        const completedModules = modules.filter(m => m.status === true).length;
        return { completed: completedModules, total: modules.length };
    };

    if (loading) {
        return (
            <div className="pupil-course-modules-container">
                <div className="pupil-course-modules-loading">
                    <div className="pupil-course-modules-loading-spinner"></div>
                    <div>
                        {insertingProgress ? 'Đang khởi tạo tiến độ học tập...' : 'Đang tải nội dung khóa học...'}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pupil-course-modules-container">
                <div className="pupil-course-modules-error">
                    <div className="pupil-course-modules-error-icon">❌</div>
                    <h3>Có lỗi xảy ra</h3>
                    <p>{error}</p>
                    <button onClick={() => navigate(-1)} className="pupil-course-modules-back-btn">
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pupil-course-modules-container">
            {/* Header */}
            <div className="pupil-course-modules-header">
                <button onClick={() => navigate(-1)} className="pupil-back-button">
                    ← Quay lại
                </button>
                
                <div className="pupil-course-info">
                    <div className="pupil-course-image">
                        {courseData?.image ? (
                            <img src={`https://localhost:5000${courseData.image}`} alt="Course" className="pupil-course-img" />
                        ) : (
                            <span className="pupil-course-icon">📚</span>
                        )}
                    </div>
                    
                    <div className="pupil-course-details">
                        <h1 className="pupil-course-title">{courseData?.courseName || 'Khóa học'}</h1>
                        <p className="pupil-course-description">
                            {courseData?.description || 'Mô tả khóa học'}
                        </p>
                        
                        <div className="pupil-course-stats">
                            <div className="pupil-course-stat">
                                <span className="pupil-stat-icon">📅</span>
                                <span>Bắt đầu: {courseData?.startDate ? new Date(courseData.startDate).toLocaleDateString('vi-VN') : '27/7/2025'}</span>
                            </div>
                            <div className="pupil-course-stat">
                                <span className="pupil-stat-icon">🔄</span>
                                <span>Truy cập cuối: {courseData?.lastAccess ? new Date(courseData.lastAccess).toLocaleDateString('vi-VN') : '4/8/2025'}</span>
                            </div>
                        </div>

                        <div className="pupil-progress-section">
                            <div className="pupil-progress-header">
                                <span>Tiến độ khóa học</span>
                                <span className="pupil-progress-percentage">{calculateProgress().completed}/{calculateProgress().total} module</span>
                            </div>
                            <div className="pupil-progress-bar">
                                <div 
                                    className="pupil-progress-fill" 
                                    style={{ width: `${calculateProgress().total > 0 ? (calculateProgress().completed / calculateProgress().total) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="pupil-course-status">
                        <span className={`pupil-status-badge ${courseData?.status ? 'pupil-status-completed' : 'pupil-status-learning'}`}>
                            {courseData?.status ? 'Hoàn thành' : 'Đang học'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Module List */}
            <div className="pupil-modules-section">
                <h2 className="pupil-modules-title">Danh sách bài học</h2>
                
                <div className="pupil-modules-list">
                    {modules.map((module, index) => {
                        const moduleStatus = getModuleStatus(module);
                        
                        return (
                            <div 
                                key={module.id} 
                                className={`pupil-module-item pupil-${moduleStatus.status}`}
                                onClick={() => handleModuleClick(module)}
                            >
                                <div className="pupil-module-icon">
                                    {moduleStatus.status === 'completed' ? '✅' : 
                                     moduleStatus.status === 'in-progress' ? '📚' : '📖'}
                                </div>
                                
                                <div className="pupil-module-content">
                                    <div className="pupil-module-header">
                                        <h3 className="pupil-module-title">
                                            {module.moduleNum}. {module.moduleName}
                                        </h3>
                                        <span 
                                            className="pupil-module-status-badge"
                                            style={{ color: moduleStatus.color }}
                                        >
                                            {moduleStatus.text}
                                        </span>
                                    </div>
                                    
                                    <p className="pupil-module-description">
                                        {module.description}
                                    </p>
                                    
                                    <div className="pupil-module-meta">
                                        <span className="pupil-module-lessons">{module.totalLessons || 2} video bài học</span>
                                        <span className="pupil-module-action">
                                            {moduleStatus.status === 'completed' ? 'Hoàn thành' : 
                                             moduleStatus.status === 'in-progress' ? 'Tiếp tục học' : 'Bắt đầu học'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CourseModules;
