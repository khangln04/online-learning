import axios from "axios";

const API_BASE_URL = "https://localhost:5000/api/homepage";

// ✅ Helper để nối đúng URL ảnh từ wwwroot
export const resolveImageUrl = (path, type = "") => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Nếu path đã chứa thư mục (vd: "Blog/pic1.jpg") thì không cần thêm
  if (path.includes("/") || path.includes("\\")) {
    return `https://localhost:5000/${path.replace(/^\/+/, "")}`;
  }

  // Nếu chỉ là tên file (vd: "pic1.jpg") thì thêm folder
  let folder = "";
  switch (type.toLowerCase()) {
    case "blog":
      folder = "Blog";
      break;
    case "course":
      folder = "Course";
      break;
    case "banner":
      folder = "Banner";
      break;
    default:
      folder = "";
  }

  return `https://localhost:5000/${folder}/${path}`;
};

// ✅ Khóa học
export const getCourses = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/courses`);
    return res.data.map(course => ({
      ...course,
      image: resolveImageUrl(course.image, "course")
    }));
  } catch (err) {
    console.error("Lỗi khi lấy khóa học:", err);
    return [];
  }
};

// ✅ Banner (từ blog thumbnail)
export const getBanners = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/banners`);
    return res.data.map(b => ({
      thumbnail: resolveImageUrl(b.thumbnail, "banner")
    }));
  } catch (err) {
    console.error("Lỗi khi lấy banner:", err);
    return [];
  }
};

// ✅ Blog
export const getBlogs = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/blogs`);
    return res.data.map(blog => ({
      ...blog,
      thumbnail: resolveImageUrl(blog.thumbnail, "blog")
    }));
  } catch (err) {
    console.error("Lỗi khi lấy blog:", err);
    return [];
  }
};
export const getFeedbacks = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/feedbacks`);
    return res.data;
  } catch (err) {
    console.error("Lỗi khi lấy feedback:", err);
    return [];
  }
};

