//C:\Users\selin\OneDrive\Masaüstü\trae\yoklama-sistemi\src\App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import CoursePage from "./pages/CoursePage";
import CheckinPage from "./pages/CheckinPage";
import PendingApprovals from "./pages/PendingApprovals";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Giriş ve kayıt sayfaları */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Korumalı rotalar */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<TeacherDashboard />} />
          <Route path="/course/:courseCode" element={<CoursePage />} />
          <Route path="/course/:code" element={<CoursePage />} />
          <Route path="/checkin/:code" element={<CheckinPage />} />
          <Route path="/course/:code/pending" element={<PendingApprovals />} />
        </Route>

        {/* Tanımsız rotalar için yönlendirme */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
