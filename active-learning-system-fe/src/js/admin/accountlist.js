import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://localhost:5000/api/admin/Accountlist";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getAccountList = async (page = 1, pageSize = 10000, search = "", roleFilter = "") => {
  try {
    console.log("Calling API with page:", page, "pageSize:", pageSize, "search:", search, "roleFilter:", roleFilter);
    const res = await axios.get(`${API_BASE_URL}`, {
      params: { page, pageSize, search, roleFilter },
      headers: getAuthHeaders(),
    });
    console.log("API Full Response:", res);
    console.log("API Data Structure:", Object.keys(res.data));
    console.log("API Data Content:", res.data);

    // Trả về toàn bộ danh sách tài khoản, không cắt
    const accounts = Array.isArray(res.data.accounts) ? res.data.accounts : (Array.isArray(res.data) ? res.data : []);
    console.log("Accounts Length:", accounts.length);

    return {
      accounts: accounts,
      totalPages: Math.ceil(accounts.length / pageSize), // Tính totalPages dựa trên toàn bộ danh sách
    };
  } catch (err) {
    console.error("Lỗi lấy danh sách tài khoản:", err.message, err.response?.data);
    return { accounts: [], totalPages: 1 };
  }
};
export const getAccountDetails = async (accountId, profileId = null) => {
  try {
    let details = {};

    // Try profileId first (if provided and different from accountId)
    if (profileId && profileId !== accountId) {
      try {
        const profileResponse = await axios.get(`${API_BASE_URL}/details/${profileId}`, {
          headers: getAuthHeaders(),
        });
        console.log(`Profile details for ${profileId}:`, JSON.stringify(profileResponse.data, null, 2));
        details = profileResponse.data;
      } catch (err) {
        console.error(`Error fetching profile details for ${profileId}:`, err.message, err.response?.data);
      }
    }

    // Fall back to accountId
    try {
      const accountResponse = await axios.get(`${API_BASE_URL}/details/${accountId}`, {
        headers: getAuthHeaders(),
      });
      console.log(`Account details for ${accountId}:`, JSON.stringify(accountResponse.data, null, 2));
      details = { ...details, ...accountResponse.data };
    } catch (err) {
      console.error(`Error fetching account details for ${accountId}:`, err.message, err.response?.data);
      if (Object.keys(details).length === 0) {
        return {};
      }
    }

    return details;
  } catch (err) {
    console.error(`Error in getAccountDetails for account ${accountId}, profile ${profileId}:`, err.message);
    return {};
  }
};
export const updateAccountStatus = async (id, status) => {
  try {
    const res = await axios.put(`${API_BASE_URL}/ban/unban/${id}`, null, {
      params: { status },
      headers: getAuthHeaders(),
    });
    console.log("Update status response:", res.data);
    return res.data;
  } catch (err) {
    console.error("Lỗi khi cập nhật trạng thái tài khoản:", err.message, err.response?.data);
    throw err;
  }
};

export const createAccount = async (account) => {
  try {
    const payload = {
      username: account.username?.trim(),
      password: account.password?.trim(),
      name: account.name?.trim(),
      email: account.email?.trim(),
      address: account.address?.trim() || "",
      dob: account.dob || "",
      phone: account.phone?.trim() || "",
  sex: Number(account.sex) || 0,
      avatar: account.avatar?.trim() || "",
      roleName: account.roleName?.trim() || "",
      status: account.status ?? true,
      // Không gửi createdDate và updatedDate, để server xử lý
    };

    console.log("Gửi dữ liệu tạo tài khoản:", JSON.stringify(payload, null, 2));
    const res = await axios.post(`${API_BASE_URL}/create`, payload, {
      headers: getAuthHeaders(),
    });
    console.log("Phản hồi tạo tài khoản:", JSON.stringify(res.data, null, 2));
    return res.data;
  } catch (err) {
    console.error("Lỗi khi tạo tài khoản:", err.message, err.response?.data);
    
    // Xử lý lỗi từ server
    const errorData = err.response?.data;
    let errorMessage = "Không thể tạo tài khoản. Vui lòng thử lại.";

    if (errorData?.errors?.Password) {
      errorMessage = errorData.errors.Password[0]; // Ví dụ: "Mật khẩu phải có ít nhất 6 ký tự."
    } else if (errorData?.detail) {
      errorMessage = errorData.detail;
    } else if (err.message) {
      errorMessage = err.message;
    }

    // Ánh xạ các lỗi cụ thể
    if (errorMessage.includes("Username")) {
      errorMessage = "Tên đăng nhập đã tồn tại.";
    } else if (errorMessage.includes("Email")) {
      errorMessage = "Email đã được sử dụng.";
    } else if (errorMessage.includes("Dob")) {
      errorMessage = "Ngày sinh phải trước ngày hiện tại.";
    } else if (errorMessage.includes("Role")) {
      errorMessage = "Vai trò không hợp lệ. Chỉ được chọn: Manager, Marketer, Finance Manager, Instructor.";
    } else if (errorMessage.includes("Lỗi lưu dữ liệu")) {
      errorMessage = "Lỗi lưu dữ liệu vào hệ thống.";
    }

    throw new Error(errorMessage);
  }
};

export const getValidRoles = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/valid-roles`, {
      headers: getAuthHeaders(),
    });
    console.log("Get valid roles response:", res.data);
    return res.data;
  } catch (err) {
    console.error("Lỗi khi lấy danh sách vai trò:", err.message, err.response?.data);
    return [];
  }
};