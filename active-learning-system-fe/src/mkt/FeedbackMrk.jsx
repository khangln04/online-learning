
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MarketerSidebar from '../Component/MarketerSidebar';
import '../css/mkt/feedback-mrk.css';


const FeedbackMrk = () => {
	const [dashboard, setDashboard] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [currentPage, setCurrentPage] = useState(1);
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredCourses, setFilteredCourses] = useState([]);
	const [statusFilter, setStatusFilter] = useState("all"); // all | published | draft
	const pageSize = 8;
	const navigate = useNavigate();

	useEffect(() => {
		const fetchDashboard = async () => {
			setLoading(true);
			setError('');
			try {
				const token = localStorage.getItem('token');
				const res = await axios.get('https://localhost:5000/api/Stat/dashboard', {
					headers: { Authorization: `Bearer ${token}` }
				});
				setDashboard(res.data);
				setFilteredCourses(res.data.courses || []);
			} catch (err) {
				setError('Không thể tải dữ liệu dashboard.');
			} finally {
				setLoading(false);
			}
		};
		fetchDashboard();
	}, []);

	// Search handler (chỉ cho nút search hoặc enter)
	const handleSearch = (e) => {
		e.preventDefault();
		applyFilter(searchTerm, statusFilter);
	};

	// Filter realtime khi đổi status hoặc searchTerm
	const applyFilter = (search, status) => {
		let result = dashboard.courses || [];
		if (status !== "all") {
			result = result.filter(c => status === "published" ? c.status : !c.status);
		}
		if (!search.trim()) {
			setFilteredCourses(result);
		} else {
			const keyword = search.trim().toLowerCase();
			setFilteredCourses(result.filter(c => c.courseName.toLowerCase().includes(keyword)));
		}
		setCurrentPage(1);
	};

	// Re-filter khi đổi statusFilter
	useEffect(() => {
		if (dashboard) {
			applyFilter(searchTerm, statusFilter);
		}
	// eslint-disable-next-line
	}, [statusFilter, dashboard]);

	if (loading) return <div style={{padding: 32}}>Đang tải dữ liệu...</div>;
	if (error) return <div style={{color: 'red', padding: 32}}>{error}</div>;
	if (!dashboard) return null;

	// Pagination logic
	const courses = filteredCourses;
	const totalPages = Math.ceil(courses.length / pageSize);
	const paginatedCourses = courses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

		return (
			<div style={{display: 'flex', background: 'transparent'}}>
				<MarketerSidebar activeSidebar={null} setActiveSidebar={() => {}} />
				<div className="dashboard-mrk-container-feedback">
					<h2 className="dashboard-mrk-title-feedback">Quản lý khóa học</h2>
					<p className="dashboard-mrk-desc-feedback">Xem thống kê và quản lý tất cả các khóa học trong hệ thống</p>
					{/* Search & filter */}
										<form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center' }}>
											<input
												type="text"
												placeholder="Tìm kiếm tên khóa học..."
												value={searchTerm}
												onChange={e => {
													setSearchTerm(e.target.value);
													// Nếu muốn filter realtime khi gõ search thì gọi applyFilter ở đây
													// applyFilter(e.target.value, statusFilter);
												}}
												style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #e3e8ee', minWidth: 220 }}
											/>
											<select
												value={statusFilter}
												onChange={e => setStatusFilter(e.target.value)}
												style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #e3e8ee', minWidth: 150 }}
											>
												<option value="all">Tất cả trạng thái</option>
												<option value="published">Đã xuất bản</option>
												<option value="draft">Chưa xuất bản</option>
											</select>
											<button
												type="submit"
												style={{ padding: '7px 18px', borderRadius: 6, background: '#1976d2', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer' }}
											>
												Tìm kiếm
											</button>
										</form>
				<div className="dashboard-mrk-stats-feedback">
					<div className="dashboard-mrk-stat-card-feedback">
						<div className="stat-label-feedback">Tổng khóa học</div>
						<div className="stat-value-feedback">{dashboard.totalCourses}</div>
					</div>
					<div className="dashboard-mrk-stat-card-feedback">
						<div className="stat-label-feedback">Đã xuất bản</div>
						<div className="stat-value-feedback">{dashboard.publishedCourses}</div>
					</div>
					<div className="dashboard-mrk-stat-card-feedback">
						<div className="stat-label-feedback">Tổng học viên</div>
						<div className="stat-value-feedback">{dashboard.totalPupils}</div>
					</div>
				</div>
				<div className="dashboard-mrk-courses-list-feedback">
					{paginatedCourses.length > 0 ? paginatedCourses.map(course => (
						<div
							className="dashboard-mrk-course-card-feedback"
							key={course.courseId}
							style={{ cursor: 'pointer' }}
							onClick={() => navigate(`/marketer/feedback-detail/${course.courseId}`, { state: { status: course.status } })}
						>
							<div className="course-header-feedback">
								<h3 className="course-title-feedback">{course.courseName}</h3>
								<span className={`course-status-feedback ${course.status ? 'published-feedback' : 'draft-feedback'}`}>{course.status ? 'Đã xuất bản' : 'Chưa xuất bản'}</span>
							</div>
							<div className="course-desc-feedback">{course.description}</div>
							<div className="course-meta-feedback">
								<span className="course-price-feedback">{course.price?.toLocaleString('vi-VN')} đ</span>
								<span className="course-date-feedback">Cập nhật: {course.createdDate ? new Date(course.createdDate).toLocaleDateString('vi-VN') : ''}</span>
							</div>
						</div>
					)) : <div>Không có khóa học nào.</div>}
				</div>
				{/* Pagination controls */}
				{totalPages > 1 && (
					<div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
						<button
							disabled={currentPage === 1}
							onClick={() => setCurrentPage(currentPage - 1)}
							style={{ marginRight: 8, padding: '6px 14px', borderRadius: 6, border: '1px solid #ddd', background: currentPage === 1 ? '#eee' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
						>
							Trang trước
						</button>
						<span style={{ alignSelf: 'center', fontWeight: 600 }}>
							Trang {currentPage} / {totalPages}
						</span>
						<button
							disabled={currentPage === totalPages}
							onClick={() => setCurrentPage(currentPage + 1)}
							style={{ marginLeft: 8, padding: '6px 14px', borderRadius: 6, border: '1px solid #ddd', background: currentPage === totalPages ? '#eee' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
						>
							Trang sau
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default FeedbackMrk;
