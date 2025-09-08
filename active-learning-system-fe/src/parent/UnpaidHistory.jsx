import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/parent/PaidHistory.css"; 

const UnpaidHistory = () => {
  const [unpaidHistory, setUnpaidHistory] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUnpaid = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setErrorMessage("Bạn chưa đăng nhập.");
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get("https://localhost:5000/api/Parent/unpaid-history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUnpaidHistory(response.data);
      } catch (error) {
        const apiError =
          error.response?.data?.message ||
          error.response?.data?.title ||
          JSON.stringify(error.response?.data) ||
          "Không thể tải dữ liệu các khoá học chưa thanh toán.";
        setErrorMessage(apiError);
      } finally {
        setLoading(false);
      }
    };

    fetchUnpaid();
  }, []);

  const handlePay = async (coursePaymentId) => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        `https://localhost:5000/api/Payment/create-payment/${coursePaymentId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const paymentUrl = res.data.paymentUrl;
      if (paymentUrl) window.location.href = paymentUrl;
      else alert("Không tìm thấy link thanh toán.");
    } catch (err) {
      alert("Thanh toán thất bại hoặc lỗi hệ thống.");
    }
  };

  return (
    <>
      <div className="paid-history-wrapper">
        <h3 className="paid-history-title">Các khoá học chưa thanh toán</h3>

        {errorMessage && <div className="alert-box error">{errorMessage}</div>}
        {loading && <div className="alert-box loading">Đang tải dữ liệu...</div>}

        {!loading && unpaidHistory.length === 0 && !errorMessage && (
          <div className="alert-box info">Không có khoá học nào cần thanh toán.</div>
        )}

        {!loading && unpaidHistory.length > 0 && (
          <table className="paid-history-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>TÊN KHÓA HỌC</th>
                <th>SỐ TIỀN</th>
                <th>TRẠNG THÁI</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {unpaidHistory.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.courseName}</td>
                  <td>{item.amount?.toLocaleString()} đ</td>
                  <td>
                    <span className="status-dot status-failed"></span>
                    Chưa thanh toán
                  </td>
                  <td>
                    <button
                      className="pay-button"
                      onClick={() => handlePay(item.coursepaymentId)}
                    >
                      Thanh toán
                    </button>
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

export default UnpaidHistory;
