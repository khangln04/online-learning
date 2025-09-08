import axios from "axios";

const API_BASE_URL = "https://localhost:5000/api/manager/course";
const API_TIMEOUT = 5000;

/**
 * Lấy danh sách khóa học từ API /api/manager/course/all
 */
const validateImage = (imageFile, required = true) => {
  if (!imageFile && required) return "Ảnh khóa học là bắt buộc.";
  if (imageFile) {
    const validImageTypes = ["image/jpeg", "image/png", "image/gif"];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!validImageTypes.includes(imageFile.type)) return "Ảnh phải là JPEG, PNG hoặc GIF.";
    if (imageFile.size > maxSize) return "Ảnh phải nhỏ hơn 5MB.";
  }
  return null;
};
const handleApiError = (err, defaultMessage) => {
  const message =
    err.response?.data?.message ||
    err.response?.data ||
    err.message ||
    defaultMessage;
  console.error("API Error:", err.response ? err.response.data : err.message);
  return typeof message === "string" ? message : JSON.stringify(message);
};
export const getCourses = async (
  pageIndex = 1,
  keyword = "",
  className = null,
  categoryName = null,
  pageSize = 5
) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }

    const response = await axios.get(`${API_BASE_URL}/all`, {
      params: {
        pageIndex,
        keyword,
        className,
        categoryName,
        pageSize,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 5000,
    });

    console.log("Phản hồi API getCourses:", response.data);

    const validCourses = Array.isArray(response.data.data)
      ? response.data.data.filter(
          (c) =>
            c &&
            typeof c.courseId === "number" &&
            typeof c.courseName === "string" &&
            typeof c.authorName === "string" &&
            typeof c.status === "boolean" &&
            (c.authorId === undefined || typeof c.authorId === "number") && // Cho phép authorId là undefined
            (c.categoryId === undefined || typeof c.categoryId === "number") && // Cho phép categoryId là undefined
            (c.classId === undefined || typeof c.classId === "string" || typeof c.classId === "number") // Cho phép classId linh hoạt
        )
      : [];

    return {
      courses: validCourses,
      totalRecords: response.data.totalRecords ?? validCourses.length ?? 0,
      totalPages: response.data.totalPages ?? 1,
      currentPage: pageIndex,
    };
  } catch (err) {
    console.error("Lỗi khi gọi getCourses:", err);
    throw "Không thể lấy danh sách khóa học. Vui lòng thử lại.";
  }
};
export const createCourse = async (formData) => {
  try {
    if (!(formData instanceof FormData)) {
      throw new Error("Dữ liệu gửi đến không phải là FormData.");
    }

    const requiredFields = ["CourseName", "Price", "CategoryId", "image"];
    const missingFields = requiredFields.filter((field) => !formData.get(field)?.toString().trim());
    if (missingFields.length > 0) {
      throw new Error(`Vui lòng điền đầy đủ: ${missingFields.join(", ")}`);
    }

    const price = parseFloat(formData.get("Price"));
    if (isNaN(price) || price < 0) {
      throw new Error("Giá khóa học không hợp lệ.");
    }

    const imageError = validateImage(formData.get("image"), true);
    if (imageError) throw new Error(imageError);

    const token = localStorage.getItem("token");
    if (!token) throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");

    const response = await axios.post(`${API_BASE_URL}/add`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
      timeout: API_TIMEOUT,
    });

    return response.data;
  } catch (err) {
    throw new Error(handleApiError(err, "Không thể thêm khóa học."));
  }
};

/**
 * Cập nhật khóa học
 */
export const updateCourse = async (courseId, formData) => {
  try {
    if (!(formData instanceof FormData)) {
      throw new Error("Dữ liệu gửi đến không phải là FormData.");
    }

    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }

    const requiredFields = ["CourseName", "Price", "CategoryId"];
    const missingFields = requiredFields.filter((field) => !formData.get(field)?.toString().trim());
    if (missingFields.length > 0) {
      throw new Error(`Vui lòng điền đầy đủ: ${missingFields.join(", ")}`);
    }

    const price = parseFloat(formData.get("Price"));
    if (isNaN(price) || price < 0) {
      throw new Error("Giá khóa học không hợp lệ.");
    }

    const imageFile = formData.get("Image");
    if (imageFile) {
      const validImageTypes = ["image/jpeg", "image/png", "image/gif"];
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (!validImageTypes.includes(imageFile.type) || imageFile.size > maxSize) {
        throw new Error("Ảnh khóa học phải là JPEG/PNG/GIF và nhỏ hơn 5MB.");
      }
    }

    // Log dữ liệu gửi đi
    const formDataEntries = {};
    for (let [key, value] of formData.entries()) {
      formDataEntries[key] = value instanceof File
        ? { name: value.name, type: value.type, size: value.size }
        : value;
    }
    console.log("Dữ liệu gửi đi (Update Course) - 02:37 AM +07, 04/07/2025:", formDataEntries);

    const response = await axios.put(`${API_BASE_URL}/${courseId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
      timeout: API_TIMEOUT,
    });

    console.log("Update course response - 02:37 AM +07, 04/07/2025:", response.data);
    return response.data;
  } catch (err) {
    throw new Error(handleApiError(err, "Không thể cập nhật khóa học."));
  }
};

/**
 * Xóa khóa học
 */
export const setCourseStatus = async (courseId, status) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }

    const response = await axios.put(
      `${API_BASE_URL}/set-status/${courseId}`,
      {},
      {
        params: { status },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: API_TIMEOUT,
      }
    );
    console.log("Set course status response:", response.data);
    return response.data;
  } catch (err) {
    throw new Error(handleApiError(err, "Không thể thay đổi trạng thái khóa học."));
  }
};

/**
 * Lấy chi tiết khóa học
 */
export const getCourseDetail = async (courseId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }

    const response = await axios.get(`${API_BASE_URL}/detail/${courseId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: API_TIMEOUT,
    });
    return response.data;
  } catch (err) {
    throw new Error(handleApiError(err, "Không thể lấy chi tiết khóa học."));
  }
};

/**
 * Lấy danh sách danh mục
 */
export const getCategories = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/list-category`, {
      timeout: API_TIMEOUT,
    });
    return response.data;
  } catch (err) {
    throw new Error(handleApiError(err, "Không thể lấy danh sách danh mục."));
  }
};

/**
 * Lấy danh sách lớp
 */
export const getClasses = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/list-class`, {
      timeout: API_TIMEOUT,
    });
    return response.data;
  } catch (err) {
    throw new Error(handleApiError(err, "Không thể lấy danh sách lớp."));
  }
};
