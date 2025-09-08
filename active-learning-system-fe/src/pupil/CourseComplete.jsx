import React, { useState, useEffect } from 'react';
import aiIcon from "../css/icon/AI.png";
import "../css/page/homepage.css";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import '../css/pupil/courseComplete.css';

const CourseComplete = () => {
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [displayedCourses, setDisplayedCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [searchError, setSearchError] = useState('');
    const [filterStatus, setFilterStatus] = useState('Tất cả');
    const [filterLastAccess, setFilterLastAccess] = useState('Tất cả');
    const [filterStartDate, setFilterStartDate] = useState('Tất cả');
    const [currentPage, setCurrentPage] = useState(1);
    const [coursesPerPage] = useState(6);
    const navigate = useNavigate();

    useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    const allowed = !token || ["Pupil"].includes(role);

    if (!allowed) {
      setTimeout(() => navigate("/error"), 0);
    }
  }, [navigate]);

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        filterCourses();
    }, [courses, searchTerm, filterStatus, filterLastAccess, filterStartDate]);

    useEffect(() => {
        paginateCourses();
    }, [filteredCourses, currentPage]);

    const paginateCourses = () => {
        const startIndex = (currentPage - 1) * coursesPerPage;
        const endIndex = startIndex + coursesPerPage;
        setDisplayedCourses(filteredCourses.slice(startIndex, endIndex));
    };

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                setError('Vui lòng đăng nhập để xem khóa học');
                navigate('/login');
                return;
            }

            const response = await axios.get('https://localhost:5000/api/CourseProgress/CourseList', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && Array.isArray(response.data)) {
                setCourses(response.data);
            } else {
                setCourses([]);
            }
        } catch (err) {
            console.error('Error fetching courses:', err);
            setError('Không thể tải danh sách khóa học. Vui lòng thử lại sau.');
            if (err.response?.status === 401) {
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const filterCourses = () => {
        let filtered = courses;

        // Filter by search term
        if (searchTerm.trim()) {
            const searchValue = searchTerm.trim().toLowerCase();
            filtered = filtered.filter(course =>
                course.courseName?.toLowerCase().includes(searchValue)
            );
        }

        // Filter by status
        if (filterStatus !== 'Tất cả') {
            filtered = filtered.filter(course => {
                const status = course.statusName?.toLowerCase();
                switch (filterStatus) {
                    case 'Đang học':
                        return (status === 'in progress' || status === 'đang học') ||
                               ((status === 'paid' || status === 'đã thanh toán') && course.lastAccess);
                    case 'Đã thanh toán':
                        return (status === 'paid' || status === 'đã thanh toán') && !course.lastAccess;
                    case 'Đã hoàn thành':
                        return status === 'completed' || status === 'hoàn thành';
                    case 'Chờ thanh toán':
                        return status === 'pending payment' || status === 'chờ thanh toán';
                    default:
                        return true;
                }
            });
        }

        // Filter by last access date
        if (filterLastAccess !== 'Tất cả') {
            const now = new Date();
            filtered = filtered.filter(course => {
                if (!course.lastAccess) return filterLastAccess === 'Chưa truy cập';
                const lastAccessDate = new Date(course.lastAccess);
                const diffDays = Math.floor((now - lastAccessDate) / (1000 * 60 * 60 * 24));
                
                switch (filterLastAccess) {
                    case 'Gần đây (7 ngày)':
                        return diffDays <= 7;
                    case '1 tháng':
                        return diffDays <= 30;
                    case '3 tháng':
                        return diffDays <= 90;
                    case 'Chưa truy cập':
                        return !course.lastAccess;
                    default:
                        return true;
                }
            });
        }

        // Filter by start date
        if (filterStartDate !== 'Tất cả') {
            filtered = filtered.sort((a, b) => {
                const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
                const dateB = b.startDate ? new Date(b.startDate) : new Date(0);
                
                if (filterStartDate === 'Gần đây nhất') {
                    return dateB - dateA;
                } else if (filterStartDate === 'Muộn nhất') {
                    return dateA - dateB;
                }
                return 0;
            });
        }

        setFilteredCourses(filtered);
        setCurrentPage(1);
    };

    const handleSearch = () => {
        const value = searchInput.trim();
        
        if (value) {
            const validSearchPattern = /^[a-zA-ZÀ-ỹ0-9\s]+$/;
            
            if (validSearchPattern.test(value)) {
                setSearchError('');
                setSearchTerm(value);
            } else {
                setSearchError('Từ khóa tìm kiếm chỉ được chứa chữ cái, số và khoảng trắng');
                return;
            }
        } else {
            setSearchError('');
            setSearchTerm('');
        }
    };

    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchInput(value);
        
        if (value.trim()) {
            const validSearchPattern = /^[a-zA-ZÀ-ỹ0-9\s]*$/;
            if (validSearchPattern.test(value)) {
                setSearchError('');
            }
        } else {
            setSearchError('');
        }
    };

    const clearSearch = () => {
        setSearchInput('');
        setSearchTerm('');
        setSearchError('');
    };

    const getStatusBadge = (course) => {
        const statusName = course.statusName?.toLowerCase();
        
        if (statusName === 'in progress' || statusName === 'đang học') {
            return { className: 'course-badge-learning', text: 'Đang học' };
        }
        
        if (statusName === 'paid' || statusName === 'đã thanh toán') {
            if (course.lastAccess) {
                return { className: 'course-badge-learning', text: 'Đang học' };
            } else {
                return { className: 'course-badge-paid', text: 'Đã thanh toán' };
            }
        }
        
        if (statusName === 'completed' || statusName === 'hoàn thành') {
            return { className: 'course-badge-completed', text: 'Đã hoàn thành' };
        }
        
        if (statusName === 'pending payment' || statusName === 'chờ thanh toán') {
            return { className: 'course-badge-pending', text: 'Chờ thanh toán' };
        }
        
        return { className: 'course-badge-pending', text: 'Chưa xác định' };
    };

    const getCourseImageClass = (courseName) => {
        const name = courseName?.toLowerCase() || '';
        if (name.includes('react')) return 'course-image-react';
        if (name.includes('node') || name.includes('backend')) return 'course-image-nodejs';
        if (name.includes('python')) return 'course-image-python';
        return '';
    };

    const getCourseIcon = (courseName) => {
        const name = courseName?.toLowerCase() || '';
        if (name.includes('react')) return '⚛️';
        if (name.includes('node') || name.includes('backend')) return '🟢';
        if (name.includes('python')) return '🐍';
        return '📚';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Chưa cập nhật';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    };

    const calculateProgress = (course) => {
        if (course.statusName?.toLowerCase() === 'completed' || course.statusName?.toLowerCase() === 'hoàn thành') {
            return 100;
        }
        if (course.statusName?.toLowerCase() === 'in progress' || course.statusName?.toLowerCase() === 'đang học') {
            return Math.floor(Math.random() * 70) + 20;
        }
        return 0;
    };

    const handleContinueCourse = async (course) => {
        try {
            console.log('Starting course with studentCourseId:', course.studentCourseId);
            
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.error('No token found');
                navigate('/login');
                return;
            }

            console.log('Calling InsertCourseProgress API...');
            const response = await axios.post(
                'https://localhost:5000/api/CourseProgress/InsertCourseProgress', 
                {
                    courseStudentId: course.studentCourseId
                }, 
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('InsertCourseProgress API response:', response.data);
            
        } catch (error) {
            console.error('Error calling InsertCourseProgress API:', error);
            console.error('Error details:', error.response?.data);
            
            if (error.response?.status === 401) {
                navigate('/login');
                return;
            }
        }
        
        console.log('Navigating to learning interface...');
        navigate(`/learning/${course.courseId}`, { 
            state: { 
                studentCourseId: course.studentCourseId,
                courseName: course.courseName
            } 
        });
    };

    const handleStartCourse = async (course) => {
        await handleContinueCourse(course);
    };

    const handleViewCourse = (course) => {
        navigate(`/course-overview/${course.courseId}`);
    };

    const stats = {
        total: courses.length,
        completed: courses.filter(c => {
            const status = c.statusName?.toLowerCase();
            return status === 'completed' || status === 'hoàn thành';
        }).length,
        inProgress: courses.filter(c => {
            const status = c.statusName?.toLowerCase();
            return (status === 'in progress' || status === 'đang học') ||
                   ((status === 'paid' || status === 'đã thanh toán') && c.lastAccess);
        }).length,
        paid: courses.filter(c => {
            const status = c.statusName?.toLowerCase();
            return (status === 'paid' || status === 'đã thanh toán') && !c.lastAccess;
        }).length,
        pending: courses.filter(c => {
            const status = c.statusName?.toLowerCase();
            return status === 'pending payment' || status === 'chờ thanh toán';
        }).length
    };

    if (loading) {
        return (
            <div className="course-complete-container-public">
                <div className="course-loading-public">
                    <div>Đang tải khóa học...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="course-complete-container-public">
                <div className="course-empty-public">
                    <div className="course-empty-icon-public">❌</div>
                    <h3 className="course-empty-title-public">Có lỗi xảy ra</h3>
                    <p className="course-empty-description-public">{error}</p>
                    <button className="course-empty-btn-public" onClick={fetchCourses}>
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="course-complete-container-public">
            <Header />
            <div className="course-complete-header-public">
                <h1 className="course-complete-title-public">Khóa học của tôi</h1>
                
                <div className="course-filter-search-container-public">
                    <div className="course-search-wrapper-public">
                        <span className="course-search-icon-public">🔍</span>
                        <input
                            type="text"
                            className={`course-search-input-public ${searchError ? 'course-search-error-public' : ''}`}
                            placeholder="Tìm kiếm khóa học..."
                            value={searchInput}
                            onChange={handleSearchInputChange}
                            onKeyPress={handleSearchKeyPress}
                        />
                        {searchInput && (
                            <button 
                                className="course-search-clear-public"
                                onClick={clearSearch}
                                type="button"
                            >
                                ✕
                            </button>
                        )}
                        <button 
                            className="course-search-btn-public"
                            onClick={handleSearch}
                            type="button"
                        >
                            Tìm kiếm
                        </button>
                    </div>
                    {searchError && (
                        <div className="course-search-error-message-public">
                            {searchError}
                        </div>
                    )}
                    <select
                        className="course-filter-dropdown-public"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="Tất cả">Tất cả trạng thái</option>
                        <option value="Đang học">Đang học</option>
                        <option value="Đã thanh toán">Đã thanh toán</option>
                        <option value="Đã hoàn thành">Đã hoàn thành</option>
                        <option value="Chờ thanh toán">Chờ thanh toán</option>
                    </select>
                    <select
                        className="course-filter-dropdown-public"
                        value={filterLastAccess}
                        onChange={(e) => setFilterLastAccess(e.target.value)}
                    >
                        <option value="Tất cả">Tất cả truy cập</option>
                        <option value="Gần đây (7 ngày)">Gần đây (7 ngày)</option>
                        <option value="1 tháng">1 tháng</option>
                        <option value="3 tháng">3 tháng</option>
                        <option value="Chưa truy cập">Chưa truy cập</option>
                    </select>
                   
                </div>
            </div>

            {filteredCourses.length === 0 ? (
                <div className="course-empty-public">
                    <div className="course-empty-icon-public">📚</div>
                    <h3 className="course-empty-title-public">
                        {searchTerm || filterStatus !== 'Tất cả' || filterLastAccess !== 'Tất cả' || filterStartDate !== 'Tất cả' 
                            ? 'Không tìm thấy khóa học' 
                            : 'Chưa có khóa học nào'}
                    </h3>
                    <p className="course-empty-description-public">
                        {searchTerm || filterStatus !== 'Tất cả' || filterLastAccess !== 'Tất cả' || filterStartDate !== 'Tất cả'
                            ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
                            : 'Hãy đăng ký khóa học để bắt đầu hành trình học tập của bạn'
                        }
                    </p>
                    {!searchTerm && filterStatus === 'Tất cả' && filterLastAccess === 'Tất cả' && filterStartDate === 'Tất cả' && (
                        <button className="course-empty-btn-public" onClick={() => navigate('/courselist')}>
                            Khám phá khóa học
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="course-grid-public">
                        {displayedCourses.map((course) => {
                            const statusBadge = getStatusBadge(course);
                            
                            return (
                                <div key={course.studentCourseId} className="course-card-public">
                                    <div className="course-image-container-public">
                                        {course.image ? (
                                            <img 
                                                src={`https://localhost:5000${course.image}`} 
                                                alt={course.courseName}
                                                className="course-image-public"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className={`course-image-placeholder-public ${getCourseImageClass(course.courseName)} ${course.image ? 'course-image-fallback-public' : ''}`}>
                                            <span>{getCourseIcon(course.courseName)}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="course-content-public">
                                        <span className={`course-badge-public ${statusBadge.className}-public`}>
                                            {statusBadge.text}
                                        </span>
                                        
                                        <h3 className="course-title-public">{course.courseName || 'Tên khóa học'}</h3>
                                        
                                        <div className="course-meta-public">
                                            <div className="course-meta-item-public">
                                                <span className="course-meta-icon-public">📅</span>
                                                <span>Bắt đầu: {formatDate(course.startDate)}</span>
                                            </div>
                                            <div className="course-meta-item-public">
                                                <span className="course-meta-icon-public">🔄</span>
                                                <span>Truy cập cuối: {formatDate(course.lastAccess)}</span>
                                            </div>
                                        </div>

                                        <div className="course-actions-public">
                                            {statusBadge.text === 'Đang học' ? (
                                                <button 
                                                    className="course-btn-public course-btn-primary-public course-btn-full-public"
                                                    onClick={() => handleContinueCourse(course)}
                                                >
                                                    Tiếp tục học
                                                </button>
                                            ) : statusBadge.text === 'Đã thanh toán' ? (
                                                <button 
                                                    className="course-btn-public course-btn-primary-public course-btn-full-public"
                                                    onClick={() => handleStartCourse(course)}
                                                >
                                                    Học ngay
                                                </button>
                                            ) : statusBadge.text === 'Đã hoàn thành' ? (
                                                <button 
                                                    className="course-btn-public course-btn-success-public course-btn-full-public"
                                                    onClick={() => handleViewCourse(course)}
                                                >
                                                    Học lại
                                                </button>
                                            ) : (
                                                <div className="course-pending-message-public">
                                                    <span>Chờ thanh toán để bắt đầu học</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {filteredCourses.length > coursesPerPage && (
                        <div className="course-pagination-public">
                            <button 
                                className="course-pagination-btn-public"
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                ‹ Trước
                            </button>
                            
                            {Array.from({ length: Math.ceil(filteredCourses.length / coursesPerPage) }, (_, i) => (
                                <button
                                    key={i + 1}
                                    className={`course-pagination-btn-public ${currentPage === i + 1 ? 'active-public' : ''}`}
                                    onClick={() => setCurrentPage(i + 1)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            
                            <button 
                                className="course-pagination-btn-public"
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredCourses.length / coursesPerPage)))}
                                disabled={currentPage === Math.ceil(filteredCourses.length / coursesPerPage)}
                            >
                                Tiếp ›
                            </button>
                        </div>
                    )}
                </>
            )}
            <ChatBubble />
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

export default CourseComplete;