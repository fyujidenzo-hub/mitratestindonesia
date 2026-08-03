import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import { I18nProvider } from "./lib/i18n";

const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const CustomerHomePage = lazy(() => import("./pages/CustomerHomePage"));
const TaskCenterPage = lazy(() => import("./pages/TaskCenterPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const FinancePage = lazy(() => import("./pages/FinancePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));
const SecurityPage = lazy(() => import("./pages/SecurityPage"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

export default function App() {
  return <I18nProvider><BrowserRouter><AuthProvider><Suspense fallback={<PageLoader />}><Routes><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route element={<ProtectedRoute roles={["CUSTOMER"]} />}><Route path="/" element={<CustomerHomePage />} /><Route path="/task-center" element={<TaskCenterPage />} /><Route path="/orders" element={<OrdersPage />} /><Route path="/history" element={<HistoryPage />} /><Route path="/finance" element={<FinancePage />} /><Route path="/profile" element={<ProfilePage />} /><Route path="/security/password" element={<SecurityPage mode="account" />} /><Route path="/security/withdrawal" element={<SecurityPage mode="withdrawal" />} /><Route path="/support" element={<SupportPage />} /></Route><Route path="/admin" element={<AdminEntry />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></Suspense></AuthProvider></BrowserRouter></I18nProvider>;
}

function PageLoader() {
  return <div className="grid min-h-screen place-items-center bg-transparent"><div className="h-11 w-11 animate-spin rounded-full border-4 border-shopee-100 border-t-shopee-500" /></div>;
}

function AdminEntry() {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-transparent"><div className="h-11 w-11 animate-spin rounded-full border-4 border-shopee-100 border-t-shopee-500" /></div>;
  if (!user) return <LoginPage area="admin" />;
  if (user.role === "CUSTOMER") return <Navigate to="/" replace />;
  return <div className="app-shell min-h-screen"><AdminPage /></div>;
}
