import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import QuestPage from './pages/QuestPage';
import ProgressPage from './pages/ProgressPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import CreateQuestPage from './pages/CreateQuestPage';
import EditQuestPage from './pages/EditQuestPage';
import MyQuestsPage from './pages/MyQuestsPage';
import AdminPage from './pages/AdminPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Загрузка...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function AppRoutes() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="/leaderboard" element={
          <ProtectedRoute>
            <LeaderboardPage />
          </ProtectedRoute>
        } />
        <Route path="/quest/:id" element={
          <ProtectedRoute>
            <QuestPage />
          </ProtectedRoute>
        } />
        <Route path="/quest/:id/progress/:progressId" element={
          <ProtectedRoute>
            <ProgressPage />
          </ProtectedRoute>
        } />
        <Route path="/create-quest" element={
          <ProtectedRoute>
            <CreateQuestPage />
          </ProtectedRoute>
        } />
        <Route path="/quest/:id/edit" element={
          <ProtectedRoute>
            <EditQuestPage />
          </ProtectedRoute>
        } />
        <Route path="/my-quests" element={
          <ProtectedRoute>
            <MyQuestsPage />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;