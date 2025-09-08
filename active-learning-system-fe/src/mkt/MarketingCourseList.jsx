import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/mkt/marketingcourselist.css';
import MarketerSidebar from '../Component/MarketerSidebar';
import ManagerSidebar from '../Component/ManagerSidebar';
import InstructorSidebar from '../Component/InstructorSidebar';
import { getMarketerCourses } from '../js/marketer/marketerCourseApi';
import { resolveImageUrl } from '../js/homepageApi';

const MarketingCourseList = () => {
  const [activeSidebar, setActiveSidebar] = useState('suggest');
  const [courses, setCourses] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [className, setClassName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [role, setRole] = useState('');
  // Search form state
  const [search, setSearch] = useState({ keyword: '', className: '', categoryName: '' });
  const [searchError, setSearchError] = useState('');
  const [categories, setCategories] = useState([]);
  const [classes, setClasses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
const savedRole = localStorage.getItem('role');
    setRole(savedRole);
    console.log('Auth Check:', { token: !!token, role: savedRole });    if (!token) {
      setError('Vui lòng đăng nhập lại.');
      navigate('/login');
      return;
    }
    if (savedRole !== 'Marketer' && savedRole !== 'Manager' && savedRole !== 'Instructor') {
      setError('Bạn không có quyền truy cập trang này.');
      setTimeout(() => navigate('/error'), 0);
      return;
    }
    // Fetch all categories and classes from backend endpoints
    const fetchCategoriesAndClasses = async () => {
      try {
        // Fetch categories
        const catRes = await fetch('https://localhost:5000/api/manager/course/list-category', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const catData = await catRes.json();
        setCategories(catData || []);
        // Fetch classes
        const classRes = await fetch('https://localhost:5000/api/manager/course/list-class', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const classData = await classRes.json();
    setClasses(classData || []); // This line remains unchanged
      } catch {}
    };
    fetchCategoriesAndClasses();
  }, [navigate]);

  // Fetch courses when search or page changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const fetchCourses = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getMarketerCourses({
          pageIndex: currentPage,
          keyword,
          className,
          categoryName, // now this is the name
          pageSize: 6,
          token,
        });
        setCourses(res.courses);
        setTotalPages(res.totalPages);
      } catch (err) {
        setError(err.message || 'Không thể tải danh sách khóa học.');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [currentPage, keyword, className, categoryName]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Only search when button is clicked. If all fields empty, fetch all.
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchError('');
    const { keyword, className, categoryName } = search;
    setKeyword(keyword);
    setClassName(className);
    setCategoryName(categoryName); // now categoryName is the name
    setCurrentPage(1);
  };

  const getStatusBadge = (course) => {
    return <span className="course-badge status-learning">Đang học</span>;
  };

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    courseId: '', name: '', description: '', category: '', class: '', image: null, imagePreview: '', price: '',
  });
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  // ...existing code...
  // Remove old classes effect, now fetched from backend
  // Open edit modal
  const openEditModal = (course) => {
    // Find category and class id from name
    const foundCat = categories.find(
      c => String(c.categoryName || c.name) === String(course.categoryName)
    );
    const foundClass = classes.find(
      c => String(c.className || c.name) === String(course.className)
    );
    setEditData({
      courseId: course.courseId,
      name: course.courseName,
      description: course.description,
      category: foundCat ? (foundCat.categoryId || foundCat.id) : '',
      class: foundClass ? (foundClass.classId || foundClass.id) : '',
      image: null,
      imagePreview: course.image ? resolveImageUrl(course.image, 'course') : '',
      price: course.price || '',
      status: course.status // Thêm status
    });
    setShowEditModal(true);
    setEditError('');
  };

  // Hàm lưu thay đổi giá cho Manager/Marketer (dùng đúng endpoint backend cung cấp)
  const handleSaveEdit = async () => {
    // Validate giá không âm
    if (editData.price !== '' && Number(editData.price) < 0) {
      setEditError('Giá khóa học không được âm!');
      return;
    }
    setEditSubmitting(true);
    setEditError('');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('CourseName', editData.name);
      formData.append('Description', editData.description);
      formData.append('Price', editData.price);
      formData.append('CategoryId', editData.category);
      formData.append('ClassId', editData.class);
      if (editData.image) {
        formData.append('Image', editData.image);
      }
      const response = await fetch(`https://localhost:5000/api/manager/course/${editData.courseId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      if (!response.ok) {
        let msg = 'Có lỗi khi lưu thay đổi.';
        try {
          const data = await response.json();
          msg = data?.message || data || msg;
        } catch {}
        throw new Error(msg);
      }
      setShowEditModal(false);
      setEditSubmitting(false);
      setLoading(true);
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3500);
      // Reload lại danh sách
      const res = await getMarketerCourses({
        pageIndex: currentPage,
        keyword,
        className,
        categoryName,
        pageSize: 6,
        token,
      });
      setCourses(res.courses);
      setTotalPages(res.totalPages);
      setLoading(false);
    } catch (err) {
      setEditError(err.message || 'Có lỗi khi lưu thay đổi.');
      setEditSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-marketing">
      {role === 'Manager' ? (
        <ManagerSidebar activeSidebar={activeSidebar} setActiveSidebar={setActiveSidebar} />
      ) : role === 'Instructor' ? (
        <InstructorSidebar activeSidebar={activeSidebar} setActiveSidebar={setActiveSidebar} />
      ) : (
        <MarketerSidebar activeSidebar={activeSidebar} setActiveSidebar={setActiveSidebar} />
      )}
      <main className="main-content-marketing">
        <h2 style={{ marginBottom: 24, marginLeft: 8 }}>Danh Sách Khóa Học</h2>
        <form className="filters" onSubmit={handleSearch} autoComplete="off">
          <input
            type="text"
            placeholder="Tìm kiếm khóa học..."
            value={search.keyword}
            onChange={e => setSearch(s => ({ ...s, keyword: e.target.value }))}
          />
          <select
            value={search.categoryName}
            onChange={e => {
              const value = e.target.value;
              setSearch(s => ({ ...s, categoryName: value }));
              setCategoryName(value);
              setCurrentPage(1);
            }}
            style={{ minWidth: 120 }}
          >
            <option value="">-- Môn học --</option>
            {(categories && categories.length > 0)
              ? categories.map(cat => (
                  <option key={cat.categoryId || cat.id} value={cat.categoryName || cat.name}>{cat.categoryName || cat.name}</option>
                ))
              : <option disabled>Không có danh mục</option>}
          </select>
          <button type="submit">
            <span role="img" aria-label="search">🔍</span> Tìm kiếm
          </button>
        </form>
        {/* No search error message needed */}
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : courses.length === 0 ? (
          <p>Không có khóa học nào.</p>
        ) : (
          <>
            {editSuccess && (
              <div style={{
                background: '#d1fae5',
                color: '#047857',
                border: '1.5px solid #34d399',
                borderRadius: 8,
                padding: '12px 24px',
                marginBottom: 18,
                fontWeight: 600,
                fontSize: 16,
                textAlign: 'center',
                boxShadow: '0 2px 8px 0 rgba(16,185,129,0.10)'
              }}>
                ✔️ Chỉnh sửa khóa học thành công!
              </div>
            )}
            <div className="course-grid-marketing">
              {courses.map((course) => (
                <div key={course.courseId} className="course-card-marketing">
                  <div className="course-card-img-wrap">
                    <img
                      src={course.image && course.image !== 'undefined' ? resolveImageUrl(course.image, 'course') : 'https://via.placeholder.com/400x220?text=No+Image'}
                      alt={course.courseName || 'No Name'}
                      className="course-card-img"
                    />
                  </div>
                  <div className="course-card-body">
                    <div className="course-card-title">{course.courseName}</div>
                    <div className="course-card-teacher">
                      <span role="img" aria-label="teacher">👤</span> Giáo viên {course.authorName}
                    </div>
                    <div style={{ margin: '6px 0 2px 0', fontSize: 15, fontWeight: 600 }}>
                      <span style={{
                        display: 'inline-block',
                        background: course.status ? '#059669' : '#f59e42',
                        color: '#fff',
                        borderRadius: 8,
                        padding: '2px 12px',
                        fontSize: 14,
                        marginRight: 8
                      }}>
                        {course.status ? 'Đã xuất bản' : 'Bản nháp'}
                      </span>
                      <span style={{ color: '#059669' }}>
                        {course.price && Number(course.price) > 0
                          ? `${Number(course.price).toLocaleString('vi-VN')} VND`
                          : 'Miễn phí'}
                      </span>
                    </div>
                    <div className="course-card-meta">
                      <span>
                        <span role="img" aria-label="cat">📖</span> {
                          (() => {
                            // Show category name from id if needed
                            let catName = course.categoryName;
                            if ((!catName || catName === course.categoryId || catName === course.category_id) && categories && categories.length > 0) {
                              const found = categories.find(c => String(c.categoryId || c.id) === String(course.categoryId || course.category_id));
                              catName = found ? (found.categoryName || found.name) : catName;
                            }
                            return catName || '---';
                          })()
                        } - {course.className}
                      </span>
                    </div>
                  </div>
                  <div className="course-card-footer" style={{ display: 'flex', gap: 8 }}>
                    {role === 'Marketer' && (
                      <button
                        className="course-card-btn"
                        style={{ background: '#f3f4f6', color: '#222', border: '1px solid #e5e7eb', fontWeight: 500, marginRight: 0 }}
                        onClick={() => openEditModal(course)}
                      >
                        Chỉnh sửa
                      </button>
                    )}
                    <button
                      className="course-card-btn"
                      onClick={() => navigate(`/courses/${course.courseId}`)}
                    >
                      {role === 'Instructor' ? 'Xem chi tiết' : 'Học thử'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="pagination" style={{ marginTop: 16, textAlign: 'center' }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Trước
                </button>
                <span style={{ margin: '0 16px' }}>
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Sau
                </button>
              </div>
            )}
            {/* Edit Modal for Marketer */}
            {showEditModal && (
              <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#fff', zIndex: 9999, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 32 }}>
                <div style={{ display: 'flex', background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.10)', width: '100%', maxWidth: 1100, minHeight: 600 }}>
                  {/* Cột trái: Form nhập */}
                  <div style={{ flex: 1.2, padding: '32px 32px 32px 32px', borderRight: '1px solid #f3f4f6', minWidth: 350 }}>
                    <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 500, fontSize: 16, marginBottom: 18, cursor: 'pointer' }}>← Quay lại</button>
                    <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 2 }}>Chỉnh sửa khóa học</h2>
                    <div style={{ fontWeight: 600, fontSize: 19, marginBottom: 12 }}>Thông tin cơ bản</div>
                    <div style={{ color: '#666', fontSize: 15, marginBottom: 18 }}>Cập nhật thông tin cơ bản về khóa học. Bạn có thể thay đổi nội dung sau.</div>
                    <div style={{ marginBottom: 10 }}>
                      <span style={{
                        display: 'inline-block',
                        background: editData.status ? '#059669' : '#f59e42',
                        color: '#fff',
                        borderRadius: 8,
                        padding: '2px 12px',
                        fontSize: 14,
                        marginRight: 8
                      }}>
                        {editData.status ? 'Đã xuất bản' : 'Bản nháp'}
                      </span>
                    </div>
                    {editData.status ? (
                      <div style={{ color: '#059669', fontWeight: 600, marginBottom: 16 }}>
                        Khóa học đã xuất bản, không thể chỉnh sửa thông tin.
                      </div>
                    ) : null}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      <div>
                        <label style={{ fontWeight: 500 }}>Tên khóa học *</label>
                        <input type="text" placeholder="Ví dụ: Lập trình React từ cơ bản đến nâng cao" value={editData.name} disabled style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, background: '#f3f4f6', color: '#888' }} />
                      </div>
                      <div>
                        <label style={{ fontWeight: 500 }}>Mô tả khóa học *</label>
                        <textarea placeholder="Mô tả chi tiết về nội dung và mục tiêu của khóa học..." value={editData.description} disabled style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, minHeight: 60, background: '#f3f4f6', color: '#888' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontWeight: 500 }}>Danh mục *</label>
                          <select value={editData.category} disabled style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, background: '#f3f4f6', color: '#888' }}>
                            <option value="">Chọn danh mục phù hợp</option>
                            {categories.map(cat => (
                              <option key={cat.categoryId || cat.id} value={cat.categoryId || cat.id}>{cat.categoryName || cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontWeight: 500 }}>Lớp *</label>
                          <select value={editData.class} disabled style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, background: '#f3f4f6', color: '#888' }}>
                            <option value="">Chọn lớp học</option>
                            {classes.map(cls => (
                              <option key={cls.classId || cls.id} value={cls.classId || cls.id}>{cls.className || cls.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label style={{ fontWeight: 500 }}>Giá khóa học *</label>
                        <input
                          type="number"
                          placeholder="VND 0"
                          value={editData.price}
                          onChange={e => setEditData(d => ({ ...d, price: e.target.value }))}
                          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, background: editData.status ? '#f3f4f6' : '#fff', color: editData.status ? '#888' : '#222' }}
                          disabled={!!editData.status}
                        />
                        <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Nhập 0 nếu khóa học miễn phí. Ví dụ: 500,000 VND</div>
                      </div>
                      <div>
                        <label style={{ fontWeight: 500 }}>Hình ảnh khóa học</label>
                        {editData.imagePreview && <img src={editData.imagePreview} alt="preview" style={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 10, marginBottom: 8, display: 'block', opacity: 0.7 }} />}
                        <input type="file" accept="image/*" id="course-image-edit-upload" style={{ display: 'none' }} disabled />
                        <label htmlFor="course-image-edit-upload" style={{ display: 'inline-block', padding: '7px 16px', background: '#f3f4f6', borderRadius: 6, border: '1px solid #e5e7eb', color: '#aaa', fontWeight: 500, cursor: 'not-allowed' }}>↻ Thay đổi hình ảnh</label>
                      </div>
                      {editError && <div style={{ color: 'red', fontSize: 14 }}>{editError}</div>}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 28 }}>
                      <button onClick={() => setShowEditModal(false)} style={{ padding: '10px 22px', background: '#e5e7eb', color: '#222', border: 'none', borderRadius: 7, fontWeight: 500, cursor: 'pointer', fontSize: 16 }}>Đóng</button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={editSubmitting || !!editData.status}
                        style={{
                          padding: '10px 22px',
                          background: !!editData.status ? '#a7f3d0' : 'linear-gradient(90deg,#3b82f6 0%,#06b6d4 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 7,
                          fontWeight: 700,
                          fontSize: 16,
                          cursor: !!editData.status ? 'not-allowed' : (editSubmitting ? 'not-allowed' : 'pointer'),
                          boxShadow: '0 2px 8px 0 rgba(59,130,246,0.10)',
                          transition: 'background 0.2s, box-shadow 0.2s, transform 0.2s',
                          opacity: editSubmitting || !!editData.status ? 0.7 : 1,
                        }}
                        onMouseOver={e => {
                          if (!editSubmitting && !editData.status) {
                            e.currentTarget.style.background = 'linear-gradient(90deg,#2563eb 0%,#0ea5e9 100%)';
                            e.currentTarget.style.boxShadow = '0 4px 16px 0 rgba(59,130,246,0.18)';
                            e.currentTarget.style.transform = 'scale(1.04)';
                          }
                        }}
                        onMouseOut={e => {
                          if (!editSubmitting && !editData.status) {
                            e.currentTarget.style.background = 'linear-gradient(90deg,#3b82f6 0%,#06b6d4 100%)';
                            e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(59,130,246,0.10)';
                            e.currentTarget.style.transform = 'none';
                          }
                        }}
                      >
                        {editSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  </div>
                  {/* Cột phải: Preview */}
                  <div style={{ flex: 1, padding: '32px 24px 32px 24px', background: '#f7f7fa', minWidth: 320, maxWidth: 400 }}>
                    <div style={{ fontWeight: 500, color: '#3b82f6', marginBottom: 12 }}>🖥️ Preview khóa học</div>
                    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: 18 }}>
                      <img src={editData.imagePreview || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=cover&w=400&q=80'} alt="preview" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
                      <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 2 }}>{editData.name || 'Tên khóa học'}</div>
                      <div style={{ color: '#888', fontSize: 14, marginBottom: 10 }}>{editData.description ? editData.description.slice(0, 50) + (editData.description.length > 50 ? '...' : '') : 'Mô tả khóa học sẽ hiển thị ở đây...'}</div>
                      <div style={{ display: 'flex', gap: 24, fontSize: 14, marginBottom: 8 }}>
                        <span style={{ color: '#888' }}>
                          Danh mục: {(() => {
                            const cat = categories.find(c => String(c.categoryId ?? c.id) === String(editData.category));
                            return cat?.categoryName || cat?.name || '...';
                          })()}
                        </span>
                        <span style={{ color: '#888' }}>
                           {(() => {
                            const cls = classes.find(c => String(c.classId ?? c.id) === String(editData.class));
                            return cls?.className || cls?.name || '...';
                          })()}
                        </span>
                      </div>
                      <div style={{ color: '#059669', fontWeight: 600, fontSize: 16, margin: '8px 0 8px 0' }}>
                        {editData.price && Number(editData.price) > 0
                          ? `${Number(editData.price).toLocaleString('vi-VN')} VND`
                          : 'Miễn phí'}
                      </div>
                     
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MarketingCourseList;