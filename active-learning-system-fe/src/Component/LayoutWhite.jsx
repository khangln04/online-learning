import React from "react";
import { useLocation, Link } from "react-router-dom";

export default function LayoutWhite({ children }) {
  const { pathname } = useLocation();
  const pathSegments = pathname.split("/").filter(Boolean);

  return (
    <main className="bg-white min-h-screen flex flex-col">
      {/* Breadcrumb */}
      <nav className="bg-gray-50 border-b py-3">
        <div className="container mx-auto px-4 text-sm text-gray-600">
          <ol className="list-reset flex">
            <li>
              <Link to="/" className="hover:underline">
                Home
              </Link>
            </li>
            {pathSegments.map((seg, idx) => {
              const to = "/" + pathSegments.slice(0, idx + 1).join("/");
              const label = seg.charAt(0).toUpperCase() + seg.slice(1);
              return (
                <li key={to} className="flex items-center">
                  <span className="mx-2">/</span>
                  {idx < pathSegments.length - 1 ? (
                    <Link to={to} className="hover:underline">
                      {label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-gray-800">{label}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>

      {/* Content area */}
      <div className="flex-grow container mx-auto px-4 py-8">
        {children}
      </div>
    </main>
  );
}
