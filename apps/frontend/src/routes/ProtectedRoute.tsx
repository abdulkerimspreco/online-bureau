import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/auth/AuthContext";

interface ProtectedRouteProps {
  allowedRoles?: Array<"JOB_SEEKER" | "EMPLOYER" | "ADMIN">;
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div style={{ padding: "2rem" }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
