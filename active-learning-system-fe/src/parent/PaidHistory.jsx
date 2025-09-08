import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/parent/PaidHistory.css";

const PaidHistory = () => {
  const [history, setHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Bạn chưa đăng nhập.");
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get("https://localhost:5000/api/Parent/paid-history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const paidItems = response.data.filter(item => item.isPaid === true);
        setHistory(paidItems);
      } catch (error) {
        const apiError =
          error.response?.data?.message ||
          error.response?.data?.title ||
          JSON.stringify(error.response?.data) ||
          "Không thể tải dữ liệu lịch sử thanh toán.";
        setErrorMessage(apiError);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return isNaN(date.getTime())
      ? "Không xác định"
      : date.toLocaleDateString("vi-VN");
  };

  return (
    <>
      <div className="paid-history-wrapper">
        <h3 className="paid-history-title">Lịch sử thanh toán thành công</h3>

        {errorMessage && <div className="alert-box error">{errorMessage}</div>}
        {loading && <div className="alert-box loading">Đang tải dữ liệu...</div>}

        {!loading && history.length === 0 && !errorMessage && (
          <div className="alert-box info">Không có khoản thanh toán nào được ghi nhận.</div>
        )}

        {!loading && history.length > 0 && (
          <table className="paid-history-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>TÊN KHÓA HỌC</th>
                <th>NGÀY THANH TOÁN</th>
                <th>SỐ TIỀN</th>
                <th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.courseName}</td>
                  <td>{formatDate(item.paidAt)}</td>
                  <td>{item.amount?.toLocaleString()} đ</td>
                  <td>
                    <div className="status-inline">
                      <span className="status-dot status-paid"></span>
                      <span className="status-text">Đã thanh toán</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

export default PaidHistory;
