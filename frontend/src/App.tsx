import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { BottomTabBar } from "./components/BottomTabBar";
import { BacklogPage } from "./pages/BacklogPage";
import { CompletedPage } from "./pages/CompletedPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";

function ProtectedLayout() {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/backlog" element={<BacklogPage />} />
        <Route path="/completed" element={<CompletedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      <BottomTabBar />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </BrowserRouter>
  );
}