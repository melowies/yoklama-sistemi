//C:\Users\selin\OneDrive\Masaüstü\trae\yoklama-sistemi\src\App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import CoursePage from "./pages/CoursePage";
import CheckinPage from "./pages/CheckinPage";
import PendingApprovals from "./pages/PendingApprovals";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import AdminPanel from "./pages/AdminPanel";
import AdminLoginPage from "./pages/AdminLoginPage";
import CreateAdmin from './pages/CreateAdmin';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Giriş ve kayıt sayfaları */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/checkin/:courseCode" element={<CheckinPage />} />

        {/* Öğretmen korumalı rotaları */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<TeacherDashboard />} />
          <Route path="/course/:courseCode" element={<CoursePage />} />
          <Route path="/course/:courseCode/pending" element={<PendingApprovals />} />
        </Route>
        
        {/* Admin rotaları */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPanel />} />
        </Route>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/create-admin" element={<CreateAdmin />} />
        
        {/* Tanımsız rotalar için yönlendirme */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
