import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CustomerHomePage from "./pages/CustomerHomePage";
import TaskCenterPage from "./pages/TaskCenterPage";
import OrdersPage from "./pages/OrdersPage";
import FinancePage from "./pages/FinancePage";
import ProfilePage from "./pages/ProfilePage";
import SupportPage from "./pages/SupportPage";
import SecurityPage from "./pages/SecurityPage";
import HistoryPage from "./pages/HistoryPage";
import AdminPage from "./pages/AdminPage";
import { I18nProvider } from "./lib/i18n";

export default function App() {
  return <I18nProvider><BrowserRouter><AuthProvider><Routes><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route element={<ProtectedRoute roles={["CUSTOMER"]} />}><Route path="/" element={<CustomerHomePage />} /><Route path="/task-center" element={<TaskCenterPage />} /><Route path="/orders" element={<OrdersPage />} /><Route path="/history" element={<HistoryPage />} /><Route path="/finance" element={<FinancePage />} /><Route path="/profile" element={<ProfilePage />} /><Route path="/security/password" element={<SecurityPage mode="account" />} /><Route path="/security/withdrawal" element={<SecurityPage mode="withdrawal" />} /><Route path="/support" element={<SupportPage />} /></Route><Route path="/admin" element={<AdminEntry />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></AuthProvider></BrowserRouter></I18nProvider>;
}

function AdminEntry() {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-canvas"><div className="h-11 w-11 animate-spin rounded-full border-4 border-shopee-100 border-t-shopee-500" /></div>;
  if (!user) return <LoginPage area="admin" />;
  if (user.role === "CUSTOMER") return <Navigate to="/" replace />;
  return <AdminPage />;
}
