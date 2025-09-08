import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom"; // Added Link for navigation
import { resolveImageUrl } from "../js/homepageApi";
import Instructor from "../Component/InstructorSidebar";
import "../css/instructor/instructorcourselist.css";

// Đã chuyển sidebar sang component Instructor

const InstructorCourselist = () => {
    const [editSubmitting, setEditSubmitting] = useState(false);
    const [editError, setEditError] = useState("");
    const [courses, setCourses] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createData, setCreateData] = useState({
        name: "",
        description: "",
        category: "",
        class: "",
        price: 0,
        image: null,
        imagePreview: ""
    });
    const [categories, setCategories] = useState([]);
    const [classes, setClasses] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({
        courseId: null,
        name: "",
        description: "",
        category: "",
        class: "",
        price: 0,
        image: null,
        imagePreview: ""
    });
    const navigate = useNavigate();
    // Hàm mở modal chỉnh sửa và đổ dữ liệu vào state
    const openEditModal = (course) => {
        setEditData({
            courseId: course.courseId,
            name: course.courseName,
            description: course.description,
            category: course.categoryId,
            class: course.classId,
            price: course.price,
            image: null,
            imagePreview: course.image ? resolveImageUrl(course.image) : "",
            status: course.status // Thêm status để biết đã xuất bản hay chưa
        });
        setShowEditModal(true);
        setEditError("");
    };

    // Hàm gọi API cập nhật khóa học
    const handleEditCourse = async () => {
        // Check for duplicate name (excluding the course being edited)
        if (courses.some(c => c.courseId !== editData.courseId && c.courseName.trim().toLowerCase() === editData.name.trim().toLowerCase())) {
            setEditError("Tên khóa học đã tồn tại.");
            return;
        }
        // Check for name length
        if (editData.name.trim().length > 100) {
            setEditError("Tên khóa học không được vượt quá 100 ký tự.");
            return;
        }
        // Check for name min length
        if (editData.name.trim().length < 5) {
            setEditError("Tên khóa học phải có ít nhất 5 ký tự.");
            return;
        }
        // Check for description min length
        if (editData.description.trim().length < 10) {
            setEditError("Mô tả phải có ít nhất 10 ký tự.");
            return;
        }
        // Validate image type if user selected a new image
        if (editData.image) {
            const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
            if (!allowedTypes.includes(editData.image.type)) {
                setEditError("Chỉ cho phép các định dạng ảnh: JPG, JPEG, PNG.");
                return;
            }
        }
        setEditSubmitting(true);
        setEditError("");
        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("CourseName", editData.name);
            formData.append("Description", editData.description);
            formData.append("Price", editData.price);
            formData.append("CategoryId", editData.category);
            formData.append("ClassId", editData.class);
            if (editData.image) formData.append("Image", editData.image);
            await axios.put(`https://localhost:5000/api/manager/course/${editData.courseId}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            // Refresh course list
            const fetchCoursesResponse = await axios.get("https://localhost:5000/api/manager/course/my-courses", {
                headers: { Authorization: `Bearer ${token}` },
                params: { pageIndex: 1, pageSize: 20, keyword: '', className: '', categoryName: '' }
            });
            let data = fetchCoursesResponse.data.data || [];
            setCourses(data);
            setShowEditModal(false);
            setEditData({
                courseId: null,
                name: "",
                description: "",
                category: "",
                class: "",
                price: 0,
                image: null,
                imagePreview: ""
            });
        } catch (err) {
            setEditError(err?.response?.data?.message || "Cập nhật khóa học thất bại.");
        } finally {
            setEditSubmitting(false);
        }
    };
    // Search, filter, pagination
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const PAGE_SIZE = 6;

    // Fetch categories and classes when either modal opens
    useEffect(() => {
        if (showCreateModal || showEditModal) {
            const token = localStorage.getItem("token");
            Promise.all([
                axios.get("https://localhost:5000/api/manager/course/list-class", { headers: { Authorization: `Bearer ${token}` } }),
                axios.get("https://localhost:5000/api/manager/course/list-category", { headers: { Authorization: `Bearer ${token}` } })
            ]).then(([classRes, catRes]) => {
                setClasses(classRes.data.data || classRes.data || []);
                setCategories(catRes.data.data || catRes.data || []);
            }).catch(() => {
                setCategories([]);
                setClasses([]);
            });
        }
    }, [showCreateModal, showEditModal]);

    // Fetch courses on component mount
    useEffect(() => {
        const fetchCourses = async () => {
            const role = localStorage.getItem("role");
            if (role !== "Instructor") {
                navigate("/error");
                setCourses([]);
                return;
            }
            try {
                const token = localStorage.getItem("token");
                const params = {
                    pageIndex: page,
                    pageSize: PAGE_SIZE,
                    keyword: search
                };
                const response = await axios.get("https://localhost:5000/api/manager/course/my-courses", {
                    headers: { Authorization: `Bearer ${token}` },
                    params
                });
                let data = response.data.data || [];
                setCourses(data);
                if (response.data.totalPages) {
                    setTotalPages(response.data.totalPages);
                } else if (response.data.total) {
                    setTotalPages(Math.ceil(response.data.total / PAGE_SIZE));
                } else {
                    setTotalPages(data.length < PAGE_SIZE ? 1 : page + 1);
                }
            } catch (err) {
                setCourses([]);
            }
        };
        fetchCourses();
    }, [search, page, navigate]);

    const handleCreateCourse = async () => {
        if (courses.some(c => c.courseName.trim().toLowerCase() === createData.name.trim().toLowerCase())) {
            setSubmitError("Tên khóa học đã tồn tại.");
            return;
        }
        if (createData.name.trim().length > 100) {
            setSubmitError("Tên khóa học không được vượt quá 100 ký tự.");
            return;
        }
        setSubmitting(true);
        setSubmitError("");
        try {
            const token = localStorage.getItem("token");
            const formData = new FormData();
            formData.append("CourseName", createData.name);
            formData.append("Description", createData.description);
            formData.append("Price", 0); // Always send price as 0
            formData.append("CategoryId", createData.category);
            formData.append("ClassId", createData.class);
            if (createData.image) formData.append("Image", createData.image);
            await axios.post("https://localhost:5000/api/manager/course/add", formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            // Refresh course list
            const fetchCoursesResponse = await axios.get("https://localhost:5000/api/manager/course/my-courses", {
                headers: { Authorization: `Bearer ${token}` },
                params: { pageIndex: 1, pageSize: 20, keyword: '', className: '', categoryName: '' }
            });
            let data = fetchCoursesResponse.data.data || [];
            setCourses(data);
            setShowCreateModal(false);
            setCreateData({
                name: "",
                description: "",
                category: "",
                class: "",
                price: 0,
                image: null,
                imagePreview: ""
            });
        } catch (err) {
            setSubmitError(err?.response?.data?.message || "Tạo khóa học thất bại.");
        } finally {
            setSubmitting(false);
        }
    };

   function canContinue() {
    if (!createData.name.trim() || createData.name.length < 5) return false;
    if (!createData.description.trim() || createData.description.length < 10) return false;
    if (!createData.category) return false;
    if (!createData.class) return false;
    return true;
}

    return (
        <>
            <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>
                {/* Sidebar cố định */}
                <div style={{ width: 270, minWidth: 220, maxWidth: 320, height: '100vh', position: 'sticky', top: 0, left: 0, zIndex: 100 }}>
                    <Instructor />
                </div>
                {/* Main content */}
                <main className="main-instructor" style={{ flex: 1, minWidth: 0, paddingLeft: 50, overflow: 'auto' }}>
                                        <section className="courses-instructor">
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                           
                                                            <h2 style={{ margin: 0 }}>Khóa học của tôi</h2>
                                                        </div>
                            <div className="search-bar-instructor">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm tên khóa học..."
                                    value={searchInput}
                                    onChange={e => setSearchInput(e.target.value)}
                                    style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #e5e7eb', minWidth: 200, fontSize: 16 }}
                                />
                                <button
                                    className="search-btn-instructor"
                                    style={{ padding: '8px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: 16, marginLeft: 8, cursor: 'pointer' }}
                                    onClick={() => { setSearch(searchInput); setPage(1); }}
                                >
                                    Tìm kiếm
                                </button>
                                <button className="add-btn-instructor" style={{ padding: '8px 18px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: 16, marginLeft: 8, cursor: 'pointer' }} onClick={() => setShowCreateModal(true)}>
                                    + Thêm khóa học
                                </button>
                            </div>
                        </div>
                        {showEditModal && (
                            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#fff', zIndex: 9999, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 32 }}>
                                <div style={{ display: 'flex', background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.10)', width: '100%', maxWidth: 1100, minHeight: 600 }}>
                                    {/* Cột trái: Form nhập */}
                                    <div style={{ flex: 1.2, padding: '32px 32px 32px 32px', borderRight: '1px solid #f3f4f6', minWidth: 350 }}>
                                        <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 500, fontSize: 16, marginBottom: 18, cursor: 'pointer' }}>← Quay lại</button>
                                        <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 2 }}>Chỉnh sửa khóa học</h2>
                                        {editData.status ? (
                                            <>
                                                <div style={{ color: '#059669', fontWeight: 600, marginBottom: 10 }}>
                                                    Khóa học đã xuất bản, không thể chỉnh sửa thông tin.
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                                    <div>
                                                        <label style={{ fontWeight: 500 }}>Tên khóa học *</label>
                                                        <input type="text" value={editData.name} disabled style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, background: '#f7f7fa', color: '#888' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 500 }}>Mô tả khóa học *</label>
                                                        <textarea value={editData.description} disabled style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, background: '#f7f7fa', minHeight: 60, color: '#888' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 12 }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ fontWeight: 500 }}>Danh mục *</label>
                                                            <select value={editData.category} disabled style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, background: '#f7f7fa', color: '#888' }}>
                                                                <option value="">Chọn danh mục phù hợp</option>
                                                                {categories.map(cat => <option key={cat.categoryId || cat.id} value={cat.categoryId || cat.id}>{cat.categoryName || cat.name}</option>)}
                                                            </select>
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ fontWeight: 500 }}>Lớp *</label>
                                                            <select value={editData.class} disabled style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, background: '#f7f7fa', color: '#888' }}>
                                                                <option value="">Chọn lớp học</option>
                                                                {classes.map(cls => <option key={cls.classId || cls.id} value={cls.classId || cls.id}>{cls.className || cls.name}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 500 }}>Hình ảnh khóa học</label>
                                                        {editData.imagePreview && <img src={editData.imagePreview} alt="preview" style={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 10, marginBottom: 8, display: 'block' }} />}
                                                        <input type="file" accept="image/*" id="course-image-edit-upload" style={{ display: 'none' }} disabled />
                                                        <label htmlFor="course-image-edit-upload" style={{ display: 'inline-block', padding: '7px 16px', background: '#f3f4f6', borderRadius: 6, border: '1px solid #e5e7eb', color: '#aaa', fontWeight: 500, cursor: 'not-allowed' }}>↻ Thay đổi hình ảnh</label>
                                                    </div>
                                                    {editError && <div style={{ color: 'red', fontSize: 14 }}>{editError}</div>}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 28 }}>
                                                    <button onClick={() => setShowEditModal(false)} style={{ padding: '10px 22px', background: '#e5e7eb', color: '#222', border: 'none', borderRadius: 7, fontWeight: 500, cursor: 'pointer', fontSize: 16 }}>Đóng</button>
                                                    <button disabled style={{ padding: '10px 22px', background: '#a7f3d0', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, fontSize: 16, cursor: 'not-allowed' }}>Lưu thay đổi</button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ fontWeight: 600, fontSize: 19, marginBottom: 12 }}>Thông tin cơ bản</div>
                                                <div style={{ color: '#666', fontSize: 15, marginBottom: 18 }}>Cập nhật thông tin cơ bản về khóa học. Bạn có thể thay đổi module và nội dung sau.</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                                    <div>
                                                        <label style={{ fontWeight: 500 }}>Tên khóa học *</label>
                                                        {editData.name && editData.name.length < 5 && (
                                                            <div style={{ color: 'red', fontSize: 13, marginBottom: 4 }}>
                                                                Tên khóa học phải có ít nhất 5 ký tự.
                                                            </div>
                                                        )}
                                                        <input type="text" placeholder="Ví dụ: Lập trình React từ cơ bản đến nâng cao" value={editData.name} onChange={e => setEditData(d => ({ ...d, name: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, background: '#f7f7fa' }} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 500 }}>Mô tả khóa học *</label>
                                                        {editData.description && editData.description.length < 10 && (
                                                            <div style={{ color: 'red', fontSize: 13, marginBottom: 4 }}>
                                                                Mô tả phải có ít nhất 10 ký tự.
                                                            </div>
                                                        )}
                                                        <textarea placeholder="Mô tả chi tiết về nội dung và mục tiêu của khóa học..." value={editData.description} onChange={e => setEditData(d => ({ ...d, description: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, background: '#f7f7fa', minHeight: 60 }} />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 12 }}>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ fontWeight: 500 }}>Danh mục *</label>
                                                            <select value={editData.category} onChange={e => setEditData(d => ({ ...d, category: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, background: '#f7f7fa' }}>
                                                                <option value="">Chọn danh mục phù hợp</option>
                                                                {categories.map(cat => <option key={cat.categoryId || cat.id} value={cat.categoryId || cat.id}>{cat.categoryName || cat.name}</option>)}
                                                            </select>
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <label style={{ fontWeight: 500 }}>Lớp *</label>
                                                            <select value={editData.class} onChange={e => setEditData(d => ({ ...d, class: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, background: '#f7f7fa' }}>
                                                                <option value="">Chọn lớp học</option>
                                                                {classes.map(cls => <option key={cls.classId || cls.id} value={cls.classId || cls.id}>{cls.className || cls.name}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label style={{ fontWeight: 500 }}>Hình ảnh khóa học</label>
                                                        {editData.imagePreview && <img src={editData.imagePreview} alt="preview" style={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 10, marginBottom: 8, display: 'block' }} />}
                                                        <input type="file" accept="image/*" id="course-image-edit-upload" style={{ display: 'none' }} onChange={e => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                setEditData(d => ({ ...d, image: file, imagePreview: URL.createObjectURL(file) }));
                                                            }
                                                        }} />
                                                        <label htmlFor="course-image-edit-upload" style={{ display: 'inline-block', padding: '7px 16px', background: '#f3f4f6', borderRadius: 6, border: '1px solid #e5e7eb', color: '#222', fontWeight: 500, cursor: 'pointer' }}>↻ Thay đổi hình ảnh</label>
                                                    </div>
                                                    {editError && <div style={{ color: 'red', fontSize: 14 }}>{editError}</div>}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 28 }}>
                                                    <button onClick={() => setShowEditModal(false)} style={{ padding: '10px 22px', background: '#e5e7eb', color: '#222', border: 'none', borderRadius: 7, fontWeight: 500, cursor: 'pointer', fontSize: 16 }}>Hủy</button>
                                                    <button onClick={handleEditCourse} disabled={editSubmitting || !editData.name.trim() || editData.name.length < 5 || !editData.description.trim() || editData.description.length < 10 || !editData.category || !editData.class || isNaN(Number(editData.price)) || editData.price === "" || Number(editData.price) < 0} style={{ padding: '10px 22px', background: (!editSubmitting && editData.name.trim() && editData.name.length >= 5 && editData.description.trim() && editData.description.length >= 10 && editData.category && editData.class && !isNaN(Number(editData.price)) && editData.price !== "" && Number(editData.price) >= 0) ? '#10b981' : '#a7f3d0', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, fontSize: 16, cursor: (!editSubmitting && editData.name.trim() && editData.name.length >= 5 && editData.description.trim() && editData.description.length >= 10 && editData.category && editData.class && !isNaN(Number(editData.price)) && editData.price !== "" && Number(editData.price) >= 0) ? 'pointer' : 'not-allowed' }}>{editSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {/* Cột phải: Preview */}
                                    <div style={{ flex: 1, padding: '32px 24px 32px 24px', background: '#f7f7fa', minWidth: 320, maxWidth: 400 }}>
                                        <div style={{ fontWeight: 500, color: '#3b82f6', marginBottom: 12 }}>🖥️ Preview khóa học</div>
                                        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: 18 }}>
                                            <img src={editData.imagePreview || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=cover&w=400&q=80'} alt="preview" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
                                            <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 2 }}>{editData.name || 'Tên khóa học'}</div>
                                            <div style={{ color: '#888', fontSize: 14, marginBottom: 10 }}>{editData.description ? editData.description.slice(0, 50) + (editData.description.length > 50 ? '...' : '') : 'Mô tả khóa học sẽ hiển thị ở đây...'}</div>
                                            <div style={{ display: 'flex', gap: 18, fontSize: 14, marginBottom: 8 }}>
                                            </div>
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
                                          
                                            <div style={{ fontSize: 14, color: '#059669', marginTop: 10, marginBottom: 2, fontWeight: 500 }}>Sau khi chỉnh sửa khóa học:</div>
                                            <ul style={{ color: '#444', fontSize: 14, marginLeft: 18, marginBottom: 0, paddingLeft: 0 }}>
                                                <li>✔️ Thêm module và video</li>
                                                <li>✔️ Tạo quiz cho từng module</li>
                                                <li>✔️ Xuất bản khóa học</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {showCreateModal && (
                            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#fff', zIndex: 9999, overflowY: 'auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 32 }}>
                                <div style={{ display: 'flex', background: '#fff', borderRadius: 16, boxShadow: '0 4px 32px rgba(0,0,0,0.10)', width: '100%', maxWidth: 1100, minHeight: 600 }}>
                                    {/* Cột trái: Form nhập */}
                                    <div style={{ flex: 1.2, padding: '32px 32px 32px 32px', borderRight: '1px solid #f3f4f6', minWidth: 350 }}>
                                        <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: 500, fontSize: 16, marginBottom: 18, cursor: 'pointer' }}>← Quay lại</button>
                                        <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 2 }}>Tạo khóa học mới</h2>
                                        <div style={{ fontWeight: 600, fontSize: 19, marginBottom: 12 }}>Thông tin cơ bản</div>
                                        <div style={{ color: '#666', fontSize: 15, marginBottom: 18 }}>Điền thông tin cơ bản về khóa học. Bạn sẽ thêm module và nội dung sau.</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                            <div>
                                                <label style={{ fontWeight: 500 }}>Tên khóa học *</label>
                                                {createData.name && createData.name.length < 5 && (
                                                    <div style={{ color: 'red', fontSize: 13, marginBottom: 4 }}>
                                                        Tên khóa học phải có ít nhất 5 ký tự.
                                                    </div>
                                                )}
                                                <input type="text" placeholder="Ví dụ: Lập trình React từ cơ bản đến nâng cao" value={createData.name} onChange={e => setCreateData(d => ({ ...d, name: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, background: '#f7f7fa' }} />
                                            </div>
                                            <div>
                                                <label style={{ fontWeight: 500 }}>Mô tả khóa học *</label>
                                                {createData.description && createData.description.length < 10 && (
                                                    <div style={{ color: 'red', fontSize: 13, marginBottom: 4 }}>
                                                        Mô tả phải có ít nhất 10 ký tự.
                                                    </div>
                                                )}
                                                <textarea placeholder="Mô tả chi tiết về nội dung và mục tiêu của khóa học..." value={createData.description} onChange={e => setCreateData(d => ({ ...d, description: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, background: '#f7f7fa', minHeight: 60 }} />
                                            </div>
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontWeight: 500 }}>Danh mục *</label>
                                                    <select value={createData.category} onChange={e => setCreateData(d => ({ ...d, category: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, background: '#f7f7fa' }}>
                                                        <option value="">Chọn danh mục phù hợp</option>
                                                        {categories.map(cat => <option key={cat.categoryId || cat.id} value={cat.categoryId || cat.id}>{cat.categoryName || cat.name}</option>)}
                                                    </select>
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={{ fontWeight: 500 }}>Lớp *</label>
                                                    <select value={createData.class} onChange={e => setCreateData(d => ({ ...d, class: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', marginTop: 4, background: '#f7f7fa' }}>
                                                        <option value="">Chọn lớp học</option>
                                                        {classes.map(cls => <option key={cls.classId || cls.id} value={cls.classId || cls.id}>{cls.className || cls.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label style={{ fontWeight: 500 }}>Hình ảnh khóa học</label>
                                                {createData.imagePreview && <img src={createData.imagePreview} alt="preview" style={{ width: 180, height: 120, objectFit: 'cover', borderRadius: 10, marginBottom: 8, display: 'block' }} />}
                                                <input type="file" accept="image/*" id="course-image-upload" style={{ display: 'none' }} onChange={e => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setCreateData(d => ({ ...d, image: file, imagePreview: URL.createObjectURL(file) }));
                                                    }
                                                }} />
                                                <label htmlFor="course-image-upload" style={{ display: 'inline-block', padding: '7px 16px', background: '#f3f4f6', borderRadius: 6, border: '1px solid #e5e7eb', color: '#222', fontWeight: 500, cursor: 'pointer' }}>↻ Thay đổi hình ảnh</label>
                                            </div>
                                            {submitError && <div style={{ color: 'red', fontSize: 14 }}>{submitError}</div>}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 28 }}>
                                            <button onClick={() => setShowCreateModal(false)} style={{ padding: '10px 22px', background: '#e5e7eb', color: '#222', border: 'none', borderRadius: 7, fontWeight: 500, cursor: 'pointer', fontSize: 16 }}>Hủy</button>
                                            <button onClick={handleCreateCourse} disabled={!canContinue() || submitting} style={{ padding: '10px 22px', background: canContinue() && !submitting ? '#10b981' : '#a7f3d0', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, fontSize: 16, cursor: canContinue() && !submitting ? 'pointer' : 'not-allowed' }}>{submitting ? 'Đang tạo...' : '+ Tạo khóa học'}</button>
                                        </div>
                                    </div>
                                    {/* Cột phải: Preview */}
                                    <div style={{ flex: 1, padding: '32px 24px 32px 24px', background: '#f7f7fa', minWidth: 320, maxWidth: 400 }}>
                                        <div style={{ fontWeight: 500, color: '#3b82f6', marginBottom: 12 }}>🖥️ Preview khóa học</div>
                                        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.04)', padding: 18 }}>
                                            <img src={createData.imagePreview || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=cover&w=400&q=80'} alt="preview" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
                                            <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 2 }}>{createData.name || 'Tên khóa học'}</div>
                                            <div style={{ color: '#888', fontSize: 14, marginBottom: 10 }}>{createData.description ? createData.description.slice(0, 50) + (createData.description.length > 50 ? '...' : '') : 'Mô tả khóa học sẽ hiển thị ở đây...'}</div>
                                            <div style={{ display: 'flex', gap: 18, fontSize: 14, marginBottom: 8 }}>
                                              
                                            </div>
                                            <div style={{ display: 'flex', gap: 24, fontSize: 14, marginBottom: 8 }}>
                                                <span style={{ color: '#888' }}>
                                                    Danh mục: {(() => {
                                                        const cat = categories.find(c => String(c.categoryId ?? c.id) === String(createData.category));
                                                        return cat?.categoryName || cat?.name || '...';
                                                    })()}
                                                </span>
                                                <span style={{ color: '#888' }}>
                                                     {(() => {
                                                        const cls = classes.find(c => String(c.classId ?? c.id) === String(createData.class));
                                                        return cls?.className || cls?.name || '...';
                                                    })()}
                                                </span>
                                            </div>
                                          
                                            <div style={{ fontSize: 14, color: '#059669', marginTop: 10, marginBottom: 2, fontWeight: 500 }}>Sau khi tạo khóa học:</div>
                                            <ul style={{ color: '#444', fontSize: 14, marginLeft: 18, marginBottom: 0, paddingLeft: 0 }}>
                                                <li>✔️ Thêm module và video</li>
                                                <li>✔️ Tạo quiz cho từng module</li>
                                                <li>✔️ Xuất bản khóa học</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                            <>
                                <div className="course-list-instructor">
                                    {courses.map(course => (
                                        <div key={course.courseId} className="course-card-instructor">
                                            <img src={resolveImageUrl(course.image) || '/default-course.jpg'} alt={course.courseName} className="course-image-instructor" />
                                            <div className="course-info-instructor">
                                                <h3>{course.courseName}</h3>
                                                <p>{course.description}</p>
                                                <div className={`status-instructor ${course.status ? 'published' : 'draft'}`}>{course.status ? 'Đã xuất bản' : 'Bản nháp'}</div>
                                                <div className="meta-instructor">
                                                    <span>Ngày cập nhật: {course.updatedDate || course.createdDate || ''}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                                    <Link to={`/manager/course/${course.courseId}/modules`}>
                                                        <button style={{ padding: '6px 12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                            Xem module
                                                        </button>
                                                    </Link>
                                                    <button style={{ padding: '6px 12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => openEditModal(course)}>
                                                        Chỉnh sửa
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {courses.length === 0 && <div>Không có khóa học nào.</div>}
                                </div>
                                {/* Pagination */}
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, margin: '18px 0' }}>
                                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e5e7eb', background: page === 1 ? '#f3f4f6' : '#fff', color: '#222', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Trước</button>
                                    <span style={{ fontWeight: 500 }}>Trang {page} / {totalPages}</span>
                                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e5e7eb', background: page === totalPages ? '#f3f4f6' : '#fff', color: '#222', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>Sau</button>
                                </div>
                            </>
                        
                    </section>
                </main>
            </div>
        </>
    );

};

export default InstructorCourselist;