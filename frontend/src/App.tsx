import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { BottomTabBar } from "./components/BottomTabBar";
import { GroupHeader } from "./components/GroupHeader";
import { BacklogPage } from "./pages/BacklogPage";
import { CompletedPage } from "./pages/CompletedPage";
import { ConexaoPage } from "./pages/ConexaoPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { GroupMembersPage } from "./pages/GroupMembersPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { ReviewsPage } from "./pages/ReviewsPage";

function ProtectedLayout() {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/conexao" element={<ConexaoPage />} />
        <Route path="/groups" element={<Navigate to="/conexao" replace />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/groups/:groupId" element={<GroupLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="backlog" element={<BacklogPage />} />
          <Route path="zerados" element={<CompletedPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="membros" element={<GroupMembersPage />} />
        </Route>
      </Routes>
      <BottomTabBar />
    </div>
  );
}

function GroupLayout() {
  const { groupId = "" } = useParams();
  return (
    <>
      <GroupHeader groupId={groupId} />
      <Outlet />
    </>
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