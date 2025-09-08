import axios from "axios";

const API_BASE_URL = "https://localhost:5000/api";

const resolveImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.includes("/") || path.includes("\\")) {
    return `https://localhost:5000/${path.replace(/^\/+/, "")}`;
  }
  return `https://localhost:5000/Blog/${path}`;
};

export const getAllBlogs = async (pageNumber, pageSize, searchTerm = "") => {
  try {
    // Gọi trang hiện tại
    const resCurrent = await axios.get(`${API_BASE_URL}/blog/all`, {
      params: { pageNumber, pageSize, searchTerm: searchTerm || undefined },
    });

    const blogs = resCurrent.data.map((blog) => ({
      ...blog,
      thumbnail: resolveImageUrl(blog.thumbnail),
    }));

    // Gọi trang kế tiếp
    const resNext = await axios.get(`${API_BASE_URL}/blog/all`, {
      params: { pageNumber: pageNumber + 1, pageSize, searchTerm: searchTerm || undefined },
    });

    // ✅ Chỉ cho phép next nếu TRANG TIẾP THEO có ít nhất 1 blog
    const hasNextPage = resNext.data.length > 0;

    return { blogs, hasNextPage };
  } catch (err) {
    console.error("Lỗi khi gọi API blog:", err);
    return { blogs: [], hasNextPage: false };
  }
};
