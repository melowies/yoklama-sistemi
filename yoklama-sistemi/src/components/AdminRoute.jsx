//C:\Users\selin\OneDrive\Masaüstü\yoklama-sistemi\yoklama-sistemi\src\components\AdminRoute.jsx
import { Navigate, Outlet } from "react-router-dom";

const AdminRoute = () => {
  const adminToken = localStorage.getItem("adminToken");
  return adminToken ? <Outlet /> : <Navigate to="/admin/login" />;
};

export default AdminRoute;