import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FileText, Calendar, User, MessageSquare, Plus, Clock, TrendingUp, CheckCircle, Bell, File, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE, fetchUserProfile } from '../js/profileApi';
import SignalRService from '../utils/SignalR.js';
import InstructorSidebar from '../Component/InstructorSidebar.jsx';
import MarketerSidebar from '../Component/MarketerSidebar.jsx';
import ManagerSidebar from '../Component/ManagerSidebar.jsx';
import '../css/manager/managerReport.css';

const ReportManager = () => {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState({ name: '' });
  const signalRRef = useRef(null);
  const [newReport, setNewReport] = useState({ title: '', details: '', manager: '', files: [] });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [reports, setReports] = useState([]);
  const [managers, setManagers] = useState([]);
  const [stats, setStats] = useState([]);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const errorTimeoutRef = useRef(null);
  const successTimeoutRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const navigate = useNavigate();

  const managerCommentCallback = useCallback((newReportData) => {
    setReports((prevReports) => [...prevReports, newReportData]);
    setSuccessMessage('✅ Báo cáo mới đã được thêm!');
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(''), 3500);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      setSuccessMessage('');
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Không tìm thấy token. Vui lòng đăng nhập lại.');
          navigate('/login');
          return;
        }

        const savedRole = localStorage.getItem('role');
        if (!savedRole) {
          setError('Không tìm thấy vai trò. Vui lòng đăng nhập lại.');
          navigate('/login');
          return;
        }
        setRole(savedRole);

        const userData = await fetchUserProfile();
        setUser(userData || { name: 'Người dùng' });

        const reportsResponse = await axios.get(`${API_BASE}/Report/list`, {
          headers: { Authorization: `Bearer ${token.trim()}` },
          timeout: 10000,
        });
        const reportsData = Array.isArray(reportsResponse.data) ? reportsResponse.data : [];
        setReports(reportsData);

        if (savedRole === 'Marketer') {
          const managersResponse = await axios.get(`${API_BASE}/Report/managers`, {
            headers: { Authorization: `Bearer ${token.trim()}` },
            timeout: 10000,
          });
          setManagers(managersResponse.data);
        } else {
          setManagers([]);
        }

        const statsData = [
          { title: 'Tổng đề xuất ', value: reportsData.length, icon: FileText, color: '#3b82f6' },
          {
            title: 'Chờ phê duyệt',
            value: reportsData.filter(r => r.statusName === 'summit').length,
            icon: Clock,
            color: '#f59e0b',
          },
          {
            title: 'Cần kiểm thử',
            value: reportsData.filter(r => r.statusName === 'created').length,
            icon: TrendingUp,
            color: '#ef4444',
          },
          {
            title: 'Hoàn thành',
            value: reportsData.filter(r => r.statusName === 'done').length,
            icon: CheckCircle,
            color: '#10b981',
          },
        ];
        setStats(statsData);
      } catch (err) {
        setError('Không thể tải dữ liệu: ' + (err.response?.data?.message || err.message));
      } finally {
        setIsLoading(false);
      }
    };

    const initializeSignalR = async () => {
      try {
        signalRRef.current = new SignalRService();
        const signalR = signalRRef.current;

        await signalR.start();
        signalR.onReceiveComment(managerCommentCallback);
      } catch (err) { }
    };

    fetchData();
    initializeSignalR();

    const handleBeforeUnload = () => { };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (signalRRef.current) {
        const signalR = signalRRef.current;
        signalRRef.current = null;
        Promise.resolve().then(() => {
          try {
            signalR.stop();
          } catch (error) { }
        });
      }
    };
  }, [navigate, managerCommentCallback]);

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!newReport.title || !newReport.details || !newReport.manager) {
      setError('Vui lòng điền đầy đủ tiêu đề, nội dung và chọn Manager.');
      setSuccessMessage('');
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setError(''), 3500);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    try {
      const formData = new FormData();
      formData.append('Title', newReport.title);
      formData.append('ContentDetail', newReport.details);
      formData.append('ReceiverName', newReport.manager);
      if (newReport.files.length > 0) {
        newReport.files.forEach((file) => {
          formData.append('Files', file);
        });
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/Report/create`, formData, {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000,
      });
      if (response.status === 200 || response.status === 201) {
        setSuccessMessage(response.data?.message || '✅ Tạo đề xuất  thành công, trạng thái đã set thành "Đã gửi", email thông báo đã được gửi');
        if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = setTimeout(() => setSuccessMessage(''), 3500);

        const reportsResponse = await axios.get(`${API_BASE}/Report/list`, {
          headers: { Authorization: `Bearer ${token.trim()}` },
          timeout: 10000,
        });

        if (Array.isArray(reportsResponse.data)) {
          setReports(reportsResponse.data);
          setCurrentPage(1);
          // Update stats immediately after creating a report
          const updatedReports = reportsResponse.data;
          const statsData = [
            { title: 'Tổng đề xuất ', value: updatedReports.length, icon: FileText, color: '#3b82f6' },
            {
              title: 'Chờ phê duyệt',
              value: updatedReports.filter(r => r.statusName === 'summit').length,
              icon: Clock,
              color: '#f59e0b',
            },
            {
              title: 'Cần kiểm thử',
              value: updatedReports.filter(r => r.statusName === 'created').length,
              icon: TrendingUp,
              color: '#ef4444',
            },
            {
              title: 'Hoàn thành',
              value: updatedReports.filter(r => r.statusName === 'done').length,
              icon: CheckCircle,
              color: '#10b981',
            },
          ];
          setStats(statsData);
        }

        setNewReport({ title: '', details: '', manager: '', files: [] });
        setShowCreateForm(false);
      } else {
        throw new Error(`Yêu cầu thất bại với mã trạng thái ${response.status}: ${response.data?.message || 'Không xác định'}`);
      }
    } catch (err) {
      if (err.response?.status === 400) {
        const errors = err.response.data.errors?.join(', ') || err.response.data.message;
        setError(`Lỗi dữ liệu: ${errors}`);
      } else if (err.response?.status === 401) {
        setError('Phiên đăng nhập hết hạn hoặc bạn không có quyền tạo đề xuất . Vui lòng đăng nhập lại.');
        navigate('/login');
      } else if (err.response?.status === 500) {
        setError('Không thể tạo đề xuất . Vui lòng thử lại.');
      } else {
        setError('Lỗi mạng hoặc server: ' + (err.message || 'Không xác định'));
      }
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => setError(''), 3500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setNewReport({ ...newReport, files: selectedFiles });
  };

  const handleRemoveFile = (indexToRemove) => {
    setNewReport(prev => ({
      ...prev,
      files: prev.files.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleViewDetail = async (id) => {
    if (signalRRef.current) {
      const signalR = signalRRef.current;
      signalRRef.current = null;
      Promise.resolve().then(() => {
        try {
          signalR.stop();
        } catch (error) { }
      });
    }
    navigate(`/report-detail/${id}?role=${role}`);
  };

  const handleReportClick = (reportId, event) => {
    if (event.target.closest('button')) {
      return;
    }
    handleViewDetail(reportId);
  };

  const totalPages = Math.ceil(reports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReports = reports.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => (
    <div className="rm-pagination">
      <button
        className="rm-page-btn"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Trang trước"
      >
        <ChevronLeft size={16} />
        Trước
      </button>
      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index + 1}
          className={`rm-page-btn ${currentPage === index + 1 ? 'rm-page-btn-active' : ''}`}
          onClick={() => handlePageChange(index + 1)}
          aria-label={`Trang ${index + 1}`}
        >
          {index + 1}
        </button>
      ))}
      <button
        className="rm-page-btn"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Trang sau"
      >
        Sau
        <ChevronRight size={16} />
      </button>
    </div>
  );

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <span role="img" aria-label="PDF">📄</span>;
      case 'doc':
      case 'docx':
        return <span role="img" aria-label="Word">📝</span>;
      case 'xls':
      case 'xlsx':
        return <span role="img" aria-label="Excel">📊</span>;
      case 'ppt':
      case 'pptx':
        return <span role="img" aria-label="PowerPoint">📽️</span>;
      default:
        return <span role="img" aria-label="File">📑</span>;
    }
  };

  return (
    <>
      <div className="rm-report-manager-page" style={{ display: 'flex', minHeight: '100vh' }}>
        {role === 'Instructor' && <InstructorSidebar />}
        {role === 'Marketer' && <MarketerSidebar />}
        {role === 'Manager' && <ManagerSidebar />}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '200%' }}>
          <header className="rm-header">
            <div className="rm-header-left">
              <h1>Hệ thống quản lý đề xuất </h1>
              <span className={`rm-role rm-role-${role ? role.toLowerCase().replace(/[^a-z0-9-]/g, '') : ''}`}>
                {role === 'Marketer' ? 'Marketer' : role === 'Manager' ? 'Manager' : role === 'Instructor' ? 'Giảng viên' : 'Đang tải...'}
              </span>
            </div>
            <div className="rm-header-right">
              {role === 'Marketer' && (
                <button className="rm-create-report-btn" onClick={() => setShowCreateForm(true)} aria-label="Tạo đề xuất  mới">
                  <Plus size={16} />
                  Tạo đề xuất  mới
                </button>
              )}
              {role === 'Instructor' && (
                <div className="rm-notification">
                  {/* <Bell size={20} />
                  <span className="rm-notification-count">2</span> */}
                </div>
              )}

            </div>
          </header>

          <main className="rm-main" style={{ flex: 1, padding: role === 'Instructor' ? '20px 20px 20px 0' : '20px' }}>
            {isLoading && <div className="rm-loading">Đang tải...</div>}

            {error && (
              <div className="rm-error-message">{error}</div>
            )}
            {successMessage && <div className="rm-report-success-message">{successMessage}</div>}
            <div className="rm-page-title">
              <div>
                {/* <h2>Quản lý đề xuất  khóa học</h2> */}
                <p>
                  {role === 'Marketer' ? 'Quản lý các đề xuất  yêu cầu tạo khóa học và kiểm thử khóa học đã tạo' :
                    role === 'Manager' ? 'Phê duyệt và gán đề xuất  cho giảng viên' :
                      role === 'Instructor' ? 'Xem các đề xuất  được gán và tạo khóa học' : 'Vui lòng chọn vai trò'}
                </p>
              </div>
            </div>

            <div className="rm-stats-cards">
              {stats.map((stat, index) => (
                <div key={index} className="rm-stats-card">
                  <div className="rm-stats-card-header">
                    <h3>{stat.title}</h3>
                    <stat.icon size={20} style={{ color: stat.color }} />
                  </div>
                  <div className="rm-value">{stat.value}</div>
                </div>
              ))}
            </div>

            <div className="rm-report-list">
              {currentReports.length === 0 && !isLoading && <div className="rm-no-reports">Không có đề xuất  nào.</div>}
              {currentReports.map((report) => (
                <div
                  key={report.id}
                  className="rm-report-item rm-clickable"
                  onClick={(e) => handleReportClick(report.id, e)}
                >
                  <div className="rm-report-header">
                    <h3>{report.title}</h3>
                    <span className="rm-status" style={{ backgroundColor: getStatusColor(report.statusName) }}>
                      {getVietnameseStatus(report.statusName)}
                    </span>
                  </div>
                  <div className="rm-meta">
                    <div><Calendar size={14} /> {new Date(report.createdDate).toLocaleDateString('vi-VN')}</div>
                    <div><User size={14} /> {report.userName}</div>
                  </div>
                  <p>{report.contentDetail}</p>
                  <div className="rm-actions">
                    <div className="rm-details">
                      <div><File size={14} /> {report.fileCount || (report.fileNames ? report.fileNames.length : 0)} file</div>
                      <div><MessageSquare size={14} /> {report.commentCount || 0} thảo luận</div>
                    </div>
                    <div className="rm-instructor">
                      <span>Giảng viên:</span>
                      <span>{report.instructorName || 'Chưa gán'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {reports.length > 0 && renderPagination()}

            {showCreateForm && (
              <div className="rm-modal-overlay" onClick={() => setShowCreateForm(false)}>
                <div className="rm-modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>Tạo đề xuất  mới</h2>
                  <button className="rm-modal-close" onClick={() => setShowCreateForm(false)} aria-label="Đóng">
                    &times;
                  </button>
                  <form onSubmit={handleCreateReport}>
                    <div className="rm-form-group">
                      <label className="rm-form-label">Tiêu đề đề xuất  *</label>
                      <input
                        type="text"
                        value={newReport.title}
                        onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                        className="rm-form-input"
                        required
                        placeholder="Nhập tiêu đề đề xuất "
                        aria-label="Tiêu đề đề xuất "
                      />
                    </div>
                    <div className="rm-form-group">
                      <label className="rm-form-label">Chi tiết nội dung đề xuất  *</label>
                      <textarea
                        value={newReport.details}
                        onChange={(e) => setNewReport({ ...newReport, details: e.target.value })}
                        className="rm-form-input rm-textarea"
                        placeholder="Nhập chi tiết nội dung"
                        required
                        aria-label="Chi tiết nội dung đề xuất "
                      />
                      <small className="rm-form-hint">Nội dung tóm tắt ngắn gọn. Chi tiết đầy đủ nên được đính kèm trong file.</small>
                    </div>
                    <div className="rm-form-group">
                      <label className="rm-form-label">Chọn Manager *</label>
                      <select
                        value={newReport.manager}
                        onChange={(e) => setNewReport({ ...newReport, manager: e.target.value })}
                        className="rm-form-input"
                        required
                        aria-label="Chọn Manager"
                      >
                        <option value="">Chọn Manager</option>
                        {managers.map((manager) => (
                          <option key={manager.id} value={manager.fullName}>{manager.fullName}</option>
                        ))}
                      </select>
                      <small className="rm-form-hint">Chọn manager sẽ nhận và xem xét đề xuất  này.</small>
                    </div>
                    <div className="rm-form-group">
                      <label className="rm-form-label">Tệp đính kèm</label>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="rm-form-input rm-file-input"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                        aria-label="Tệp đính kèm"
                      />
                      <small className="rm-form-hint">Hỗ trợ: PDF, Word, Excel, PowerPoint (Max: 10MB mỗi file)</small>
                      {newReport.files.length > 0 && (
                        <div className="rm-selected-files">
                          <p>Đã chọn {newReport.files.length} tệp:</p>
                          <ul className="rm-file-list">
                            {newReport.files.map((file, index) => (
                              <li key={index} className="rm-file-item">
                                {getFileIcon(file.name)}
                                <span className="rm-file-name">{file.name}</span>
                                <button
                                  type="button"
                                  className="rm-remove-file"
                                  onClick={() => handleRemoveFile(index)}
                                  aria-label={`Xóa ${file.name}`}
                                >
                                  ×
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="rm-form-actions">
                      <button type="button" className="rm-cancel-btn" onClick={() => setShowCreateForm(false)} aria-label="Hủy">
                        Hủy
                      </button>
                      <button type="submit" className="rm-submit-btn" aria-label="Gửi đề xuất ">
                        Gửi đề xuất
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
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
    'done': 'Hoàn Thành Kiểm Thử và Set Khóa Học', // status 7
    'completed': 'Hoàn thành', // published
    'published': 'Hoàn thành'
  };
  return statusMap[status?.toLowerCase()] || status || 'Không xác định';
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
    case 'hoàn thành kiểm thử':
      return '#f97316'; // orange for status 7
    case 'completed':
    case 'hoàn thành':
    case 'published':
    case 'hoàn thành':
      return '#10b981'; // green for published
    default:
      return '#6b7280';
  }
};

export default ReportManager;