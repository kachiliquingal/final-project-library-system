import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // 1. WHILE CHARGING: Spinner to prevent flickering
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 2. FIRST FILTER: Is the user logged in?
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 3. SECOND FILTER (ROLES): Does the user have permission to be here?
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If the user is 'user' and wants to enter a forbidden route (Admin),
    // we forcefully redirect them to their catalog.
    if (user.role === "user") {
      return <Navigate to="/user/catalog" replace />;
    }

    // If the user is 'admin' and wants to enter a 'user' route (optional),
    // we redirect them to the dashboard.
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  // 4. IF IT PASSES ALL THE FILTERS
  return <Outlet />;
};

export default ProtectedRoute;
