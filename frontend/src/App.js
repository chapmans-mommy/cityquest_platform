import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
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
  if (loading) return <div>Загрузка...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function AppRoutes() {
  const { user, logout } = useAuth();

  return (
    <div>
      {user && (
        <div style={{ padding: '10px', background: '#f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span>Привет, {user.nickname} ({user.role})</span>
          
          {/* Ссылка на главную — для всех */}
          <a href="/" style={{ marginLeft: '15px' }}>Главная</a>
          
          {/* Ссылка на профиль — для всех */}
          <a href="/profile" style={{ marginLeft: '15px' }}>Профиль</a>
          
          {/* Ссылка на рейтинг — для всех */}
          <a href="/leaderboard" style={{ marginLeft: '15px' }}>Рейтинг</a>
          
          {/* Ссылки для организатора */}
          {user.role === 'organizer' && (
            <>
              <a href="/my-quests" style={{ marginLeft: '15px' }}>Мои квесты</a>
              <a href="/create-quest" style={{ marginLeft: '15px' }}>Создать квест</a>
            </>
          )}
          
          {/* Ссылки для админа */}
          {user.role === 'admin' && (
            <>
              <a href="/admin" style={{ marginLeft: '15px' }}>Админ-панель</a>
              <a href="/my-quests" style={{ marginLeft: '15px' }}>Мои квесты</a>
              <a href="/create-quest" style={{ marginLeft: '15px' }}>Создать квест</a>
            </>
          )}
        </div>
        <button onClick={logout}>Выйти</button>
      </div>       
      )}
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <HomePage />
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