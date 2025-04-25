//C:\Users\selin\OneDrive\Masaüstü\trae\yoklama-sistemi\src\App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import CoursePage from "./pages/CoursePage";
import CheckinPage from "./pages/CheckinPage";
import PendingApprovals from "./pages/PendingApprovals";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<TeacherDashboard />} />
        <Route path="/course/:code" element={<CoursePage />} />
        <Route path="/checkin/:code" element={<CheckinPage />} />
        <Route path="/course/:code/pending" element={<PendingApprovals />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
