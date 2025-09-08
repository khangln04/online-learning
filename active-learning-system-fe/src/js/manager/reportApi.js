// src/utils/api.js
const BASE_URL = "https://localhost:5000/api/Report"; // Sửa lại thành http cho phù hợp với local development

// Hàm chuyển hướng đến trang đăng nhập
const navigateToLogin = () => {
  console.warn("Chuyển hướng đến /login do thiếu hoặc token không hợp lệ");
  window.location.href = "/login";
};

// Xử lý lỗi xác thực
const handleUnauthorized = (errorMessage) => {
  navigateToLogin();
  throw new Error(errorMessage || "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
};

export const getReportList = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      handleUnauthorized("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    const response = await fetch(`${BASE_URL}/list`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.trim()}`,
      },
    });
    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorized("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      }
      throw new Error(`Lỗi khi lấy danh sách báo cáo: ${response.statusText}`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách báo cáo:", error.message);
    throw error;
  }
};

// Các hàm API khác (giữ nguyên từ mã bạn cung cấp)
export const getReportDetail = async (reportId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      handleUnauthorized("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    const response = await fetch(`${BASE_URL}/${reportId}/detail`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.trim()}`,
      },
    });
    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorized("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      }
      throw new Error(`Lỗi khi lấy chi tiết báo cáo: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết báo cáo:", error.message);
    throw error;
  }
};

export const uploadReport = async (receiverIdentifier, title, contentDetail, file) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      handleUnauthorized("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    if (!receiverIdentifier || !title || !contentDetail || !file) {
      throw new Error("Vui lòng điền đầy đủ thông tin và chọn file.");
    }

    const formData = new FormData();
    formData.append("ReceiverName", receiverIdentifier);
    formData.append("Title", title);
    formData.append("ContentDetail", contentDetail);
    formData.append("Files", file);

    const response = await fetch(`${BASE_URL}/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.trim()}`,
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Tải lên báo cáo thành công:", data);
      return { message: data || "Tải lên báo cáo thành công!", success: true };
    } else {
      const responseText = await response.text();
      let errorMessage = "Lỗi khi tải lên báo cáo";
      let errorDetails = "Vui lòng kiểm tra lại dữ liệu gửi lên.";
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
        errorDetails = errorData.errors ? errorData.errors.join(", ") : errorDetails;
      } catch (jsonError) {
        errorDetails = responseText || "Server trả về phản hồi không hợp lệ.";
        console.error("Phản hồi không phải JSON từ server:", errorDetails);
      }
      const error = new Error(errorMessage);
      error.details = errorDetails;
      throw error;
    }
  } catch (error) {
    console.error("Lỗi khi tải lên báo cáo:", error.message, error.details || "");
    throw error;
  }
};

export const downloadReport = async (reportId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      handleUnauthorized("Không tìm thấy token. Vui lòng đăng nhập lại.");
    }
    const response = await fetch(`${BASE_URL}/${reportId}/download`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token.trim()}`,
      },
    });
    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorized("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      }
      throw new Error(`Lỗi khi tải file: ${response.statusText}`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Report_${reportId}_Files.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Lỗi khi tải file:", error.message);
    throw error;
  }
};