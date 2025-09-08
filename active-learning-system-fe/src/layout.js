import React from "react";
import { Link, Outlet,  useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

export default function Layout() {
    const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/") {
      navigate("/homepage", { replace: true });
    }
  }, [location.pathname, navigate]);
  return (
        <Outlet />
  );
}
