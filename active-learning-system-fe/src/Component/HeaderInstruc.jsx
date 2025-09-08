// import "../css/components/Header.css";
// import logo from "../css/icon/favicon11.png";
// import { Link, useNavigate } from "react-router-dom";
// import { useEffect, useState } from "react";

// const Header = () => {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [name, setName] = useState("");
//   const [avatar, setAvatar] = useState("");
//   const navigate = useNavigate();

//   useEffect(() => {
//     const updateAuthState = () => {
//       const loggedIn = localStorage.getItem("isLoggedIn") === "true";
//       const user = JSON.parse(localStorage.getItem("user") || "{}");
//       setIsLoggedIn(loggedIn);
//       setName(localStorage.getItem("name") || "");
//       const userAvatar = user?.avatar;
//       const normalizedAvatar = userAvatar?.startsWith("https")
//         ? userAvatar
//         : `https://localhost:5000/${userAvatar?.startsWith("/") ? userAvatar.slice(1) : userAvatar}`;

//       setAvatar(normalizedAvatar || "https://localhost:5000/profile/default.jpg");

//     };

//     updateAuthState();
//     const handleStorageChange = () => updateAuthState();
//     window.addEventListener("storage", handleStorageChange);

//     return () => window.removeEventListener("storage", handleStorageChange);
//   }, []);

//   const handleLogout = () => {
//     localStorage.removeItem("isLoggedIn");
//     localStorage.removeItem("name");
//     localStorage.removeItem("user");
//     localStorage.removeItem("token");
//     setIsLoggedIn(false);
//     navigate("/homepage");
//   };

//   return (
//     <div className="header">
//       <Link to="/homepage" className="logo">
//         <img src={logo} alt="Logo" />
//       </Link>

//       <div className="navbar">
//         <Link to="/homepage">Trang chủ</Link>
//         <a href="/instructor-courselist">Bảng điều khiển</a>
//       </div>

//       <div className="auth-buttons">
//         {!isLoggedIn ? (
//           <>
//             <Link to="/login">
//               <button>👤 Đăng nhập</button>
//             </Link>
//             <Link to="/register">
//               <button>🧑‍💻 Đăng ký</button>
//             </Link>
//           </>
//         ) : (
//           <>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Header;