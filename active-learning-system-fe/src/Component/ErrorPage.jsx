import React from "react";
import { useNavigate } from "react-router-dom";

export default function ErrorPage() {
  const navigate = useNavigate();

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoLogin = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");

    navigate("/login");
  };


  return (
    <div style={styles.container}>
      <div style={styles.icon}>⚠️</div>
      <h2 style={styles.title}>Đã có lỗi!</h2>
      <p style={styles.subtitle}>Vui lòng thử lại!</p>
      <div style={styles.errorBox}>
        Có lỗi không mong muốn xảy ra. Vui lòng thử lại sau!.
      </div>
      <div style={styles.buttonGroup}>
        <button style={{ ...styles.button, backgroundColor: "#000", color: "#fff" }} onClick={handleGoLogin}>
          Trở về trang đăng nhập
        </button>
        <button style={{ ...styles.button, backgroundColor: "#fff", color: "#000", border: "1px solid #ccc" }} onClick={handleRetry}>
          Thử lại
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    padding: "50px 20px",
    fontFamily: "sans-serif",
  },
  icon: {
    fontSize: "50px",
    marginBottom: "10px",
  },
  title: {
    color: "red",
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "5px",
  },
  subtitle: {
    color: "#555",
    fontSize: "16px",
    marginBottom: "20px",
  },
  errorBox: {
    backgroundColor: "#ffe6e6",
    padding: "15px",
    borderRadius: "8px",
    color: "#555",
    marginBottom: "30px",
    maxWidth: "500px",
    margin: "0 auto 30px",
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
  },
  button: {
    padding: "10px 20px",
    fontSize: "14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
