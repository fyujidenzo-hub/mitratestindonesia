import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";
import type { UserRole } from "../types";

export function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-canvas"><div className="h-11 w-11 animate-spin rounded-full border-4 border-shopee-100 border-t-shopee-500" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === "CUSTOMER" ? "/" : "/admin"} replace />;
  return <Outlet />;
}
