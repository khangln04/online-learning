import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, User, FileText, Download, MessageCircle, Clock, Calendar, CheckCircle } from 'lucide-react';
import SignalRService from '../utils/SignalR.js';
import { getReportDetail, downloadReport } from '../js/manager/reportApi.js';
import { fetchUserProfile } from '../js/profileApi';
import '../css/manager/reportDetail.css';

const ReportDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const signalRRef = useRef(null);
    const [message, setMessage] = useState('');
    const [report, setReport] = useState(null);
    const [discussions, setDiscussions] = useState([]);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState({});
    const [expandedComments, setExpandedComments] = useState(false);
    const role = (searchParams.get('role') || localStorage.getItem('role') || '').toLowerCase();
    const [selectedInstructor, setSelectedInstructor] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    const commentCallback = useCallback((comment) => {
        setDiscussions((prev) => {
            if (prev.some(c => c.id === comment.id)) {
                return prev;
            }
            const updatedDiscussions = [...prev, {
                id: comment.id,
                commentText: comment.commentText,
                createdAt: comment.createdAt,
                userName: comment.userName,
                role: comment.roleName || comment.role || 'Không xác định',
            }].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            return updatedDiscussions;
        });
        // Không hiển thị message log khi nhận bình luận mới
    }, []);

    const statusCallback = useCallback((updatedReport) => {
        setReport((prev) => ({
            ...prev,
            statusId: updatedReport.statusId,
            statusName: updatedReport.statusName,
            lastStatusUpdated: updatedReport.lastStatusUpdated || new Date().toISOString(),
            canApprove: updatedReport.canApprove ?? false,
            canReject: updatedReport.canReject ?? false,
            canReview: updatedReport.statusId === 6,
            canDone: updatedReport.statusId === 7,
            canProcess: updatedReport.statusId === 3,
            canCreate: updatedReport.statusId === 4,
            instructor: updatedReport.instructor || prev.instructor,
        }));
        setSuccessMessage('✅ Trạng thái Đề xuất khóa học đã được cập nhật!');
        setTimeout(() => setSuccessMessage(''), 3000);
    }, []);

    const workflowSteps = [
        { step: 1, title: 'Đã gửi', subtitle: 'Marketer gửi Đề xuất khóa học', role: 'marketer', statusId: 1 },
        { step: 2, title: 'Bị từ chối', subtitle: 'Manager từ chối Đề xuất khóa học', role: 'manager', statusId: 2 },
        { step: 3, title: 'Đã chấp nhận', subtitle: 'Manager chấp nhận và phân công giảng viên', role: 'manager', statusId: 3 },
        { step: 4, title: 'Đang thực hiện', subtitle: 'Giảng viên bắt đầu tạo khóa học', role: 'instructor', statusId: 4 },
        { step: 5, title: 'Khóa học đã tạo', subtitle: 'Giảng viên hoàn thành khóa học', role: 'instructor', statusId: 5 },
        { step: 6, title: 'Đang kiểm tra', subtitle: 'Marketer kiểm tra khóa học', role: 'marketer', statusId: 6 },
        { step: 7, title: 'Hoàn Thành Kiểm Thử và Set Khóa Học', subtitle: 'Marketer xác nhận hoàn thành kiểm thử và set khóa học', role: 'marketer', statusId: 7, apiName: 'done' },
        { step: 8, title: 'Hoàn Thành', subtitle: 'Manager xác nhận hoàn thành đề xuất', role: 'manager', statusId: 8, apiName: 'published' },
    ];

    const statusNameToId = {
        summit: 1,
        'đã gửi': 1,
        submitted: 1,
        reject: 2,
        'bị từ chối': 2,
        rejected: 2,
        approve: 3,
        'đã chấp nhận': 3,
        approved: 3,
        process: 4,
        'đang thực hiện': 4,
        'in progress': 4,
        created: 5,
        'khóa học đã tạo': 5,
        'course created': 5,
        reviewing: 6,
        'đang kiểm tra': 6,
        'under review': 6,
        'hoàn thành kiểm thử': 7,
        'hoan thanh kiem thu': 7,
        done: 7,
        'hoàn thành kiểm thử': 7,
        published: 8,
        'hoàn thành': 8,
        completed: 8,
    };

    const getVietnameseStatus = (status) => {
        const statusMap = {
            'summit': 'Đã gửi',
            'submitted': 'Đã gửi',
            'reject': 'Bị từ chối',
            'rejected': 'Bị từ chối',
            'approve': 'Đã chấp nhận',
            'approved': 'Đã chấp nhận',
            'process': 'Đang thực hiện',
            'in progress': 'Đang thực hiện',
            'created': 'Khóa học đã tạo',
            'course created': 'Khóa học đã tạo',
            'reviewing': 'Đang kiểm tra',
            'under review': 'Đang kiểm tra',
            'hoàn thành kiểm thử': 'Hoàn Thành Kiểm Thử và Set Khóa Học',
            'hoan thanh kiem thu': 'Hoàn Thành Kiểm Thử và Set Khóa Học',
            'done': 'Hoàn Thành Kiểm Thử và Set Khóa Học',
            'hoàn thành kiểm thử': 'Hoàn Thành Kiểm Thử',
            'published': 'Hoàn Thành',
            'hoàn thành': 'Hoàn Thành',
            'completed': 'Hoàn Thành',
        };
        return statusMap[status?.toLowerCase()] || status || 'Không xác định';
    };

    useEffect(() => {
        const runWithErrorSuppression = async () => {
            try {
                const fetchData = async () => {
                    try {
                        setIsLoading(true);
                        setError('');
                        setSuccessMessage('');
                        if (!role) {
                            setError('Không tìm thấy vai trò. Vui lòng đăng nhập lại.');
                            navigate('/login');
                            return;
                        }

                        const userData = await fetchUserProfile();
                        setUser(userData);

                        const response = await getReportDetail(id);
                        setReport(response);
                        const comments = (response.comments || response.reportComments || []).map(comment => ({
                            id: comment.id,
                            commentText: comment.commentText,
                            createdAt: comment.createdAt,
                            userName: comment.userName,
                            role: comment.roleName || 'Không xác định',
                        }));
                        setDiscussions(comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
                    } catch (err) {
                        setError('Không tải được Đề xuất khóa học: ' + (err.response?.data?.message || err.message));
                    } finally {
                        setIsLoading(false);
                    }
                };

                await fetchData();

                signalRRef.current = new SignalRService();
                const signalR = signalRRef.current;

                try {
                    await signalR.start();
                    setTimeout(() => {
                        if (signalRRef.current) {
                            try {
                                signalR.joinReportGroup(id);
                            } catch (joinError) { }
                        }
                    }, 100);

                    signalR.onReceiveComment(commentCallback);
                    signalR.onStatusUpdate(statusCallback);
                } catch (signalRError) { }
            } catch (globalError) { }
        };

        runWithErrorSuppression();

        const handleBeforeUnload = () => {
            if (signalRRef.current) {
                try {
                    signalRRef.current.leaveReportGroup(id);
                } catch (error) { }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (signalRRef.current) {
                const signalR = signalRRef.current;
                signalRRef.current = null;
                Promise.resolve().then(() => {
                    try {
                        signalR.leaveReportGroup(id);
                    } catch (error) { }
                    try {
                        signalR.stop();
                    } catch (error) { }
                });
            }
        };
    }, [id, role, navigate, commentCallback, statusCallback]);

    const handleBack = async () => {
        navigate(`/managerReport?role=${role}`);
    };

    const handleStatusUpdate = async () => {
        if (!selectedStatus) {
            setError('Vui lòng chọn trạng thái.');
            setSuccessMessage('');
            return;
        }
        if (selectedStatus === '3' && !selectedInstructor && role === 'manager') {
            setError('Vui lòng chọn giảng viên khi chấp nhận Đề xuất khóa học.');
            setSuccessMessage('');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
            }
            const payload = {
                newStatusId: parseInt(selectedStatus),
                instructorId: selectedInstructor ? parseInt(selectedInstructor) : null,
            };
            const response = await axios.post(`https://localhost:5000/api/Report/${id}/status`, payload, {
                headers: { Authorization: `Bearer ${token.trim()}` },
            });

            const statusId = response.data.statusId || parseInt(selectedStatus);
            const statusName = Object.keys(statusNameToId).find(key => statusNameToId[key] === statusId) || response.data.statusName || selectedStatus;

            setReport((prev) => ({
                ...prev,
                statusId: statusId,
                statusName: statusName,
                lastStatusUpdated: response.data.lastStatusUpdated || new Date().toISOString(),
                canApprove: response.data.canApprove ?? false,
                canReject: response.data.canReject ?? false,
                canReview: statusId === 6,
                canDone: statusId === 7,
                canProcess: statusId === 3,
                canCreate: statusId === 4,
                instructor: response.data.instructor || prev.instructor,
            }));

            setSuccessMessage('✅ Cập nhật trạng thái thành công!');
            setError('');
            setSelectedStatus('');
            setSelectedInstructor('');
        } catch (err) {
            const errorMessage = 'Không cập nhật được trạng thái: ' + (err.response?.data?.message || err.message);
            setError(errorMessage);
            setSuccessMessage('');
        }
    };

    const handleSendComment = async () => {
        if (!message.trim()) {
            setError('Bình luận không được để trống.');
            setSuccessMessage('');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
            const payload = {
                commentText: message,
                role: role
            };
            await axios.post(`https://localhost:5000/api/Report/${id}/comment`, payload, {
                headers: { Authorization: `Bearer ${token.trim()}` },
            });
            setMessage('');
            setError('');
        } catch (err) {
            setError('Không gửi được bình luận: ' + (err.response?.data?.message || err.message));
            setSuccessMessage('');
        }
    };

    const handleDownloadFiles = async (filePath) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
            const response = await downloadReport(id, filePath);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filePath.split('/').pop());
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setSuccessMessage('✅ Tải file thành công!');
            setError('');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError('Không tải được file: ' + (err.response?.data?.message || err.message));
            setSuccessMessage('');
        }
    };

    const handleUserClick = () => {
        navigate('/profile');
    };

    if (isLoading) return <div className="rd-not-found">Đang tải...</div>;
    if (error && !report) return <div className="rd-not-found">{error}</div>;
    if (!report) return <div className="rd-not-found">Không tìm thấy Đề xuất khóa học.</div>;

    const instructorName = report.instructor?.name || report.availableInstructors?.[0]?.fullName || 'Chưa phân công';
    const currentStatusId = statusNameToId[report.statusName?.toLowerCase()] ?? 0;

    const renderCommentSection = () => {
        const sortedComments = [...discussions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const commentsToShow = expandedComments ? sortedComments : sortedComments.slice(0, 3);

        return (
            <div className="rd-card">
                <h3 className="rd-section-title">💬 Bình luận</h3>
                {sortedComments.length === 0 ? (
                    <p className="rd-discussion-empty">Chưa có bình luận nào. Bắt đầu cuộc trò chuyện!</p>
                ) : (
                    <>
                        {commentsToShow.map((item, index) => {
                            const uniqueKey = item.id || `comment-${index}-${item.createdAt || Date.now()}`;
                            return (
                                <div key={uniqueKey} className="rd-discussion-item">
                                    <div className={`rd-avatar rd-avatar-${(item.role?.toLowerCase() || 'unknown').replace(/[^a-z0-9-]/g, '')}`}>
                                        {item.userName?.charAt(0) || 'U'}
                                    </div>
                                    <div className="rd-discussion-content">
                                        <div className="rd-discussion-header">
                                            <span className="rd-discussion-author">{item.userName || 'Người dùng'}</span>
                                            <span className={`rd-discussion-role rd-discussion-role-${(item.role?.toLowerCase() || 'unknown').replace(/[^a-z0-9-]/g, '')}`}>
                                                {item.role || 'Không xác định'}
                                            </span>
                                            <span className="rd-discussion-time">{new Date(item.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="rd-discussion-text">{item.commentText || 'Nội dung chưa tải'}</div>
                                    </div>
                                </div>
                            );
                        })}
                        {sortedComments.length > 3 && (
                            <button
                                className="rd-expand-comments-btn"
                                onClick={() => setExpandedComments(!expandedComments)}
                            >
                                {expandedComments
                                    ? `Thu gọn (đang hiển thị ${sortedComments.length} bình luận)`
                                    : `Xem thêm ${sortedComments.length - 3} bình luận cũ hơn`
                                }
                            </button>
                        )}
                    </>
                )}
                <div className="rd-comment-form">
                    <div className="rd-comment-label">Nhập bình luận của bạn...</div>
                    <textarea
                        className="rd-comment-input"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Nhập bình luận của bạn..."
                        aria-label="Nhập bình luận"
                    />
                    <div className="rd-comment-actions">
                        <span className="rd-comment-role-text">Đăng với vai trò:</span>
                        <span className={`rd-message-role rd-message-role-${role.replace(/[^a-z0-9-]/g, '')}`}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                        </span>
                        <button
                            onClick={handleSendComment}
                            className="rd-submit-btn"
                            aria-label="Gửi bình luận"
                        >
                            Gửi Bình luận
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="rd-app-container">
            <div className="rd-header">
                <div className="rd-header-left">
                    <button
                        className="rd-back-button"
                        onClick={handleBack}
                        aria-label="Quay lại"
                    >
                        <ArrowLeft size={16} />
                        Quay lại
                    </button>
                    <h1 className="rd-header-title">{report.title}</h1>
                    <span className={`rd-header-badge rd-header-badge-${role.replace(/[^a-z0-9-]/g, '')}`}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                </div>

                {role === 'manager' && report.statusName?.toLowerCase() === 'summit' && (
                    <div className="rd-notification-section">
                        <div className="rd-notification-item">
                            <User size={16} className="rd-notification-icon" />
                            <MessageCircle size={16} className="rd-notification-icon" />
                            <span className="rd-notification-user">
                                {report.receiverName || report.receiver?.name || 'Chưa phân công'}
                            </span>
                        </div>
                    </div>
                )}
                {role === 'instructor' && (report.statusName?.toLowerCase() === 'approve' || currentStatusId >= 3) && (
                    <div className="rd-notification-section">
                        <div className="rd-notification-item">
                            <User size={16} className="rd-notification-icon" />
                            <MessageCircle size={16} className="rd-notification-icon" />
                            <span className="rd-notification-user">
                                {report.instructor?.name || user.Name || user.name || instructorName}
                            </span>
                        </div>
                    </div>
                )}
                <div className="rd-status-header">
                    <span className="rd-status-text">Trạng thái: {getVietnameseStatus(report.statusName)}</span>
                    <span className="rd-status-time">
                        Cập nhật lúc: {new Date(report.lastStatusUpdated || report.createdDate).toLocaleString()}
                    </span>
                </div>
            </div>
                        {successMessage && !successMessage.includes('Nhận được bình luận mới') && (
                            <div className="rm-report-success-message">{successMessage}</div>
                        )}

            <div className="rd-content-grid">
                <div className="rd-left-column">
                    {/* Nội dung Đề xuất và Tệp đính kèm đưa lên trước */}
                    <div className="rd-content-section">
                        <h3 className="rd-content-title">📄 Nội dung Đề xuất khóa học</h3>
                        <p className="rd-content-text">{report.contentDetail}</p>
                    </div>
                    <div className="rd-files">
                        <h3 className="rd-files-title">📎 Tệp đính kèm ({report.fileNames?.length || 0})</h3>
                        {report.fileNames?.length > 0 ? (
                            report.fileNames.map((filePath, index) => (
                                <div key={index} className="rd-file-item">
                                    <div className="rd-file-info">
                                        <FileText size={16} className="rd-file-icon" />
                                        <div>
                                            <div className="rd-file-name">{filePath.split('/').pop()}</div>
                                            <div className="rd-file-size">Không xác định</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDownloadFiles(filePath)}
                                        className="rd-download-file-btn"
                                        aria-label={`Tải xuống ${filePath.split('/').pop()}`}
                                    >
                                        <Download size={12} />
                                        Tải xuống
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p>Không có tệp đính kèm.</p>
                        )}
                    </div>
                    {((role === 'manager' || role === 'marketer') || (role === 'instructor' && (report.canProcess || report.canCreate))) && (
                        <div className="rd-status-update">
                            <h3 className="rd-update-form-title">Cập nhật Trạng thái</h3>
                            <p className="rd-update-form-text">Chọn hành động tiếp theo cho Đề xuất khóa học này</p>
                            {role === 'manager' && (report.canReject || report.canApprove) && (
                                <div className="rd-form-group">
                                    <label className="rd-form-label">Chọn giảng viên để tạo khóa học *</label>
                                    <select
                                        value={selectedInstructor}
                                        onChange={(e) => setSelectedInstructor(e.target.value)}
                                        className="rd-form-input"
                                        aria-label="Chọn giảng viên"
                                    >
                                        <option value="">Chọn giảng viên</option>
                                        {report.availableInstructors?.map((instructor) => (
                                            <option key={instructor.id} value={instructor.id}>
                                                {instructor.fullName}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div className="rd-button-group">
                                {role === 'manager' && report.canReject && (
                                    <button
                                        onClick={() => setSelectedStatus('2')}
                                        className="rd-reject-btn"
                                    >
                                        Từ chối
                                    </button>
                                )}
                                {role === 'manager' && report.canApprove && (
                                    <button
                                        onClick={() => setSelectedStatus('3')}
                                        className="rd-accept-btn"
                                        disabled={!selectedInstructor}
                                    >
                                        Chấp nhận
                                    </button>
                                )}
                                {role === 'marketer' && report.statusName?.toLowerCase() === 'created' && (
                                    <button
                                        onClick={() => setSelectedStatus('6')}
                                        className="rd-status-button"
                                    >
                                        📝 Đang kiểm tra
                                    </button>
                                )}
                                {role === 'marketer' && report.statusName?.toLowerCase() === 'reviewing' && (
                                    <button
                                        onClick={() => setSelectedStatus('7')}
                                        className="rd-status-button"
                                    >
                                        📝 Hoàn Thành Kiểm Thử
                                    </button>
                                )}
                                {role === 'manager' && report.statusName && (report.statusName.toLowerCase() === 'hoàn thành kiểm thử' || report.statusName.toLowerCase() === 'hoan thanh kiem thu' || currentStatusId === 7) && (
                                    <button
                                        onClick={() => setSelectedStatus('8')}
                                        className="rd-status-button"
                                    >
                                        🏁 Hoàn Thành
                                    </button>
                                )}
                                {role === 'instructor' && report.canProcess && (
                                    <button
                                        onClick={() => setSelectedStatus('4')}
                                        className="rd-status-button"
                                    >
                                        📝 Đang thực hiện
                                    </button>
                                )}
                                {role === 'instructor' && report.canCreate && (
                                    <button
                                        onClick={() => setSelectedStatus('5')}
                                        className="rd-status-button"
                                    >
                                        📝 Khóa học đã tạo
                                    </button>
                                )}
                                {selectedStatus && (
                                    <button
                                        onClick={handleStatusUpdate}
                                        className="rd-status-button"
                                    >
                                        Xác nhận
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="rd-workflow">
                        <h3 className="rd-workflow-title">📋 Quy trình Đề xuất khóa học</h3>
                        {workflowSteps.map((step) => (
                            <div
                                key={step.step}
                                className={`rd-workflow-step ${currentStatusId >= step.statusId ? 'rd-workflow-step-active' : ''}`}
                            >
                                <div className={`rd-step-circle ${currentStatusId >= step.statusId ? 'rd-step-circle-completed' : ''}`}>
                                    {step.step}
                                </div>
                                <div
                                    className={`rd-step-content ${currentStatusId >= step.statusId ? 'rd-step-content-completed' : ''} ${report.statusName?.toLowerCase() === 'reject' && step.statusId === 2 ? 'rd-step-content-rejected' : ''
                                        }`}
                                >
                                    <div className="rd-step-title">
                                        <span className="rd-step-title-text">{step.title}</span>
                                        <span className={`rd-role-tag rd-role-tag-${step.role.replace(/[^a-z0-9-]/g, '')}`}>
                                            {step.role}
                                        </span>
                                    </div>
                                    <p className="rd-step-subtitle">{step.subtitle}</p>
                                </div>
                                {currentStatusId >= step.statusId && <CheckCircle size={16} className="rd-step-check" />}
                            </div>
                        ))}
                    </div>


                </div>
                <div className="rd-right-column">
                    <div className="rd-report-info">
                        <h3 className="rd-info-title">📊 Thông tin Đề xuất khóa học</h3>
                        <div className="rd-info-list">
                            <div className="rd-info-item">
                                <span className="rd-info-label">Tạo bởi:</span>
                                <span className="rd-info-value">{report.userName}</span>
                            </div>
                            <div className="rd-info-item">
                                <span className="rd-info-label">Gửi đến:</span>
                                <span className="rd-info-value">{report.receiverName || report.receiver?.name || 'Chưa phân công'}</span>
                            </div>
                            {(report.instructor?.name || (report.statusId >= 3 && instructorName !== 'Chưa phân công')) && (
                                <div className="rd-info-item">
                                    <span className="rd-info-label">Giảng viên:</span>
                                    <span className="rd-info-value">{instructorName}</span>
                                </div>
                            )}
                            <div className="rd-info-item">
                                <span className="rd-info-label">Tạo lúc:</span>
                                <span className="rd-info-value">{new Date(report.createdDate).toLocaleString()}</span>
                            </div>
                            <div className="rd-info-item">
                                <span className="rd-info-label">Cập nhật lúc:</span>
                                <span className="rd-info-value">{new Date(report.lastStatusUpdated || report.createdDate).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    {renderCommentSection()}
                </div>
            </div>
        </div>
    );
};

const getStatusColor = (statusName) => {
    switch (statusName?.toLowerCase()) {
        case 'summit':
        case 'đã gửi':
        case 'submitted':
            return '#3b82f6';
        case 'reject':
        case 'bị từ chối':
        case 'rejected':
            return '#ef4444';
        case 'approve':
        case 'đã chấp nhận':
        case 'approved':
            return '#10b981';
        case 'process':
        case 'đang thực hiện':
        case 'in progress':
            return '#f59e0b';
        case 'created':
        case 'khóa học đã tạo':
        case 'course created':
            return '#8b5cf6';
        case 'reviewing':
        case 'đang kiểm tra':
        case 'under review':
            return '#f59e0b';
        case 'done':
        case 'hoàn thành':
        case 'completed':
            return '#10b981';
        default:
            return '#6b7280';
    }
};

export default ReportDetail;