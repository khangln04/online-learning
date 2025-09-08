import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import MarketerSidebar from '../Component/MarketerSidebar';
import '../css/mkt/feedback-mrk.css';


const FeedbackMrkDetail = () => {
	const { courseId } = useParams();
	const navigate = useNavigate();
	const [detail, setDetail] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	// Lưu status từ location state nếu có (truyền từ dashboard sang)
	const [status, setStatus] = useState(undefined);
	// Feedback pagination state
	const [feedbackPage, setFeedbackPage] = useState(1);
	const feedbacksPerPage = 5;

	useEffect(() => {
		// Lấy status từ location state nếu có
		if (window.history.state && window.history.state.usr && typeof window.history.state.usr.status !== 'undefined') {
			setStatus(window.history.state.usr.status);
		}
		const fetchDetail = async () => {
			setLoading(true);
			setError('');
			try {
				const token = localStorage.getItem('token');
				const res = await axios.get(`https://localhost:5000/api/Stat/course-detail/${courseId}`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				setDetail(res.data);
				// Nếu API trả về status thì ưu tiên lấy, nếu không thì dùng status từ state
				if (typeof res.data.status !== 'undefined') {
					setStatus(res.data.status);
				}
			} catch (err) {
				setError('Không thể tải dữ liệu chi tiết khoá học.');
			} finally {
				setLoading(false);
			}
		};
		fetchDetail();
	}, [courseId]);

	if (loading) return <div style={{padding: 32}}>Đang tải dữ liệu...</div>;
	if (error) return <div style={{color: 'red', padding: 32}}>{error}</div>;
	if (!detail) return null;

	// Feedback pagination logic
	const feedbacks = detail.feedbacks || [];
	const totalFeedbackPages = Math.max(1, Math.ceil(feedbacks.length / feedbacksPerPage));
	const paginatedFeedbacks = feedbacks.slice((feedbackPage - 1) * feedbacksPerPage, feedbackPage * feedbacksPerPage);

	return (
		<div style={{display: 'flex', background: 'transparent'}}>
			<MarketerSidebar activeSidebar={null} setActiveSidebar={() => {}} />
			<div className="dashboard-mrk-container-feedback">
				<button onClick={() => navigate(-1)} style={{marginBottom: 16, background: '#f3f4f6', border: '1px solid #ddd', borderRadius: 6, padding: '6px 18px', color: '#2563eb', fontWeight: 600, cursor: 'pointer'}}>← Quay lại</button>
				   <h2 className="dashboard-mrk-title-feedback">Chi tiết khoá học</h2>
				   <div className="dashboard-mrk-stats-feedback" style={{marginBottom: 24}}>
					   <div className="dashboard-mrk-stat-card-feedback">
						   <div className="stat-label-feedback">Tổng feedback</div>
						   <div className="stat-value-feedback">{detail.totalFeedback}</div>
					   </div>
					   <div className="dashboard-mrk-stat-card-feedback">
						   <div className="stat-label-feedback">Đánh giá TB</div>
						   <div className="stat-value-feedback">{detail.averageRate} ★</div>
					   </div>
					   <div className="dashboard-mrk-stat-card-feedback">
						   <div className="stat-label-feedback">Đã đăng ký (chưa thanh toán)</div>
						   <div className="stat-value-feedback">{detail.registeredNotPaid}</div>
					   </div>
					   <div className="dashboard-mrk-stat-card-feedback">
						   <div className="stat-label-feedback">Đã thanh toán</div>
						   <div className="stat-value-feedback">{detail.paidUsers}</div>
					   </div>
					   <div className="dashboard-mrk-stat-card-feedback">
						   <div className="stat-label-feedback">Đã hoàn thành</div>
						   <div className="stat-value-feedback">{detail.completedUsers}</div>
					   </div>
					   <div className="dashboard-mrk-stat-card-feedback">
						   <div className="stat-label-feedback">Tổng doanh thu</div>
						   <div className="stat-value-feedback">{detail.totalRevenue?.toLocaleString('vi-VN')} đ</div>
					   </div>
				   </div>
				   <div className="dashboard-mrk-course-card-feedback" style={{marginBottom: 24}}>
					   <div className="course-header-feedback">
						   <h3 className="course-title-feedback">{detail.courseName}</h3>
						   <span className={`course-status-feedback ${status === true ? 'published-feedback' : 'draft-feedback'}`}>{status === true ? 'Đã xuất bản' : 'Chưa xuất bản'}</span>
					   </div>
					   <div className="course-desc-feedback">{detail.description}</div>
					   <div className="course-meta-feedback">
						   <span className="course-price-feedback">{detail.price?.toLocaleString('vi-VN')} đ</span>
						   <span className="course-date-feedback">Cập nhật: {detail.updatedDate ? new Date(detail.updatedDate).toLocaleDateString('vi-VN') : ''}</span>
					   </div>
					   <div style={{marginTop: 8, color: '#888'}}>Giảng viên: <b>{detail.instructorName}</b> | Trình độ: <b>{detail.level}</b></div>
				   </div>
				<h3 style={{margin: '18px 0 8px 0'}}>Feedback học viên</h3>
				<div style={{background: '#fff', borderRadius: 10, boxShadow: '0 2px 8px #0001', padding: 18}}>
					{paginatedFeedbacks.length > 0 ? paginatedFeedbacks.map((fb, idx) => (
						<div key={idx} style={{borderBottom: '1px solid #eee', padding: '10px 0'}}>
							<div style={{fontWeight: 600, color: '#2563eb'}}>{fb.userName} <span style={{color: '#f39c12', fontWeight: 500, marginLeft: 8}}>{fb.rate} ★</span></div>
							<div style={{color: '#888', fontSize: 13}}>{new Date(fb.createdDate).toLocaleDateString('vi-VN')}</div>
							<div style={{marginTop: 4}}>{fb.content}</div>
						</div>
					)) : <div style={{color: '#888'}}>Chưa có feedback nào cho khoá học này.</div>}
				</div>
				{/* Pagination controls for feedbacks */}
				{totalFeedbackPages > 1 && (
					<div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, gap: 8 }}>
						<button
							onClick={() => setFeedbackPage(feedbackPage - 1)}
							disabled={feedbackPage === 1}
							style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #ddd', background: feedbackPage === 1 ? '#eee' : '#fff', cursor: feedbackPage === 1 ? 'not-allowed' : 'pointer' }}
						>Trước</button>
						<span style={{ alignSelf: 'center', fontWeight: 600 }}>Trang {feedbackPage} / {totalFeedbackPages}</span>
						<button
							onClick={() => setFeedbackPage(feedbackPage + 1)}
							disabled={feedbackPage === totalFeedbackPages}
							style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #ddd', background: feedbackPage === totalFeedbackPages ? '#eee' : '#fff', cursor: feedbackPage === totalFeedbackPages ? 'not-allowed' : 'pointer' }}
						>Sau</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default FeedbackMrkDetail;

			
