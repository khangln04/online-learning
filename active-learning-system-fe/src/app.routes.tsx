// import { Navigate, Route, Routes } from "react-router-dom";
// import { companyRoutes, guestRoutes } from "./roleBased.routes";
// import AuthLoader from "../store/authReduxs/authLoader";
// import { ToastContainer } from "react-toastify";
// import PrivateRoutes from "../layouts/AnonymousLayout";
// import PrivateRoutesCompany from "../layouts/CompanyLayout";

// // 👈 thêm dòng này
// import Login from "./components/login/Login";
// import Register from "../components/Register/Register";
// import ForgotPassword from "../components/forgetpassword/Forgetpassword";
// import AuthLayout from "../layouts/AuthLayout/AuthLayout";

// const AppRouter = () => {
//   return (
//     <>
//       <AuthLoader />
//       <Routes>
//         {/* <Route path="/" element={<AuthLayout />}>
//           {guestRoutes.map((route, index) => (
//             <Route
//               key={index}
//               path={route.path}
//               element={<route.element />}
//             />
//           ))}
//           <Route path="*" element={<Navigate to="/not-found" />} />
//         </Route> */}

//         <Route path="/" element={<PrivateRoutes />}>
//           {guestRoutes.map((route, index) => (
//             <Route
//               key={index}
//               path={route.path}
//               element={<route.element />}
//             />
//           ))}
//           <Route path="*" element={<Navigate to="/not-found" />} />
//         </Route>

//         <Route path="/admin" element={<PrivateRoutesCompany />}>
//           {companyRoutes.map((route, index) => (
//             <Route
//               key={index}
//               path={route.path}
//               element={<route.element />}
//             />
//           ))}
//           <Route path="*" element={<Navigate to="/not-found" />} />
//         </Route>

//       </Routes>
//     </>
//   );
// };

// export default AppRouter;
