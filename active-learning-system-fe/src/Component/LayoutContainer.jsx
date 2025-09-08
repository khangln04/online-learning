import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function LayoutContainer({ children }) {
  const location = useLocation();

  useEffect(() => {
    console.log(location.pathname);
  }, [location.pathname]);

  const isLogin = location.pathname === "/login";

  return (
    <>
      {!isLogin && <Header />}
      <main>{children}</main>
      {!isLogin && <Footer />}
    </>
  );
}
