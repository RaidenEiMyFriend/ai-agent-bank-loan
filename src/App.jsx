import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import Home from './pages/Home';
import Profile from './pages/Profile';
import ProfileDetail from './pages/ProfileDetail';
import Dashboard from './pages/Dashboard';
import OCRResult from './pages/OCR_result';
import Login from './pages/Login'; // 👈 import thêm Login

export default function App() {
  const user = JSON.parse(localStorage.getItem("user")); // 👈 Lấy thông tin user từ localStorage

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={user ? <MainLayout /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard />} />
          <Route path="smart-bank" element={<Home />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:profileName" element={<ProfileDetail />} />
          <Route path="ocr-result/:profileName" element={<OCRResult />} />
        </Route>

        {/* Nếu không khớp route nào -> chuyển về login nếu chưa login */}
        <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
      </Routes>
    </Router>
  );
}
