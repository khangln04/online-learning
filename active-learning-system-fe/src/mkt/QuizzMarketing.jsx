import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizzQuestions } from '../js/marketer/marketerCourseApi';
import MarketerSidebar from '../Component/MarketerSidebar';
import '../css/mkt/quizz-marketing.css';


const QuizzMarketing = () => {
	const { quizzId } = useParams();
	const [questions, setQuestions] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [search, setSearch] = useState('');
	const [searchError, setSearchError] = useState('');
	const [filteredQuestions, setFilteredQuestions] = useState([]);
	const navigate = useNavigate();
	// Lấy courseId từ localStorage hoặc query nếu cần
	const [courseId, setCourseId] = useState(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const cid = urlParams.get('courseId');
		if (cid) {
			localStorage.setItem('lastCourseId', cid);
			return cid;
		}
		return localStorage.getItem('lastCourseId');
	});

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (!token) {
			setError('Vui lòng đăng nhập lại.');
			setLoading(false);
			return;
		}
		const fetchQuestions = async () => {
			setLoading(true);
			setError('');
			try {
				const data = await getQuizzQuestions(quizzId, token);
				setQuestions(data);
				setFilteredQuestions(data);
			} catch (err) {
				setError(err.message || 'Không thể tải câu hỏi quizz.');
			} finally {
				setLoading(false);
			}
		};
		fetchQuestions();
	}, [quizzId]);

	const handleSearch = (e) => {
		e.preventDefault();
		setSearchError('');
		const trimmed = search.trim();
		if (!trimmed) {
			setSearchError('Vui lòng nhập nội dung cần tìm.');
			setFilteredQuestions(questions);
			return;
		}
		const filtered = questions.filter(q => q.content.toLowerCase().includes(trimmed.toLowerCase()));
		if (filtered.length === 0) {
			setSearchError('Không tìm thấy câu hỏi phù hợp.');
		}
		setFilteredQuestions(filtered);
	};

	const handleBack = () => {
		if (courseId) {
			navigate(`/courses/${courseId}`);
		} else {
			navigate('/courses');
		}
	};

	if (loading) return <p>Đang tải câu hỏi...</p>;
	if (error) return <p style={{ color: 'red' }}>{error}</p>;
	if (!filteredQuestions || filteredQuestions.length === 0) return <p>Không có câu hỏi nào cho quizz này.</p>;

	return (
		<div style={{ display: 'flex', background: 'transparent' }}>
			<MarketerSidebar activeSidebar={null} setActiveSidebar={() => {}} />
			<div className="quizz-marketing-container">
				<button className="quizz-marketing-back-btn" onClick={handleBack}>← Quay lại</button>
				<h2 className="quizz-marketing-title">Danh sách câu hỏi Quizz #{quizzId}</h2>
				<form className="quizz-marketing-search-form" onSubmit={handleSearch} autoComplete="off">
					<input
						className="quizz-marketing-search-input"
						type="text"
						placeholder="Tìm kiếm nội dung câu hỏi..."
						value={search}
						onChange={e => setSearch(e.target.value)}
					/>
					<button className="quizz-marketing-search-btn" type="submit">Tìm kiếm</button>
				</form>
				{filteredQuestions.map((q, idx) => (
					<div key={q.id} className="quizz-marketing-question">
						<div className="quizz-marketing-question-content">{idx + 1}. {q.content}</div>
						<ul className="quizz-marketing-answer-list">
							{q.answers.map(ans => (
								<li key={ans.id} className={ans.isCorrect ? 'quizz-marketing-answer quizz-marketing-correct' : 'quizz-marketing-answer'}>
									{ans.content} {ans.isCorrect && <span className="quizz-marketing-correct-label"></span>}
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
		</div>
	);
};

export default QuizzMarketing;
