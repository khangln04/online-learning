import React from "react";
import { useLocation, Link } from "react-router-dom";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import "../css/parent/PaymentResult.css"; 
function PaymentResult() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const status = searchParams.get("status") || "success"; 
  const message = searchParams.get("message") || "";

  const isSuccess = status === "success";

  return (
    <>
      <Header />
      <main className="payment-result-container">
        <div className={`payment-result-box ${isSuccess ? "success-style" : "error-style"}`}>
          <h2>{isSuccess ? "🎉 Thanh toán thành công!" : "❌ Thanh toán thất bại"}</h2>
          <p>
            {isSuccess
              ? "Cảm ơn bạn đã mua khóa học. Bạn có thể truy cập khóa học trong hồ sơ của mình."
              : message || "Đã xảy ra lỗi khi xử lý thanh toán. Vui lòng thử lại sau."}
          </p>

          <div className="btn-group">
            <Link to="/homepage">
              <button className="submit-btn">🏠 Trang chủ</button>
            </Link>
            {isSuccess ? (
              <Link to="/profile">
                <button className="submit-btn">📘 Xem khóa học</button>
              </Link>
            ) : (
              <Link to="/profile">
                <button className="submit-btn retry-btn">🔁 Thử lại</button>
              </Link>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default PaymentResult;
