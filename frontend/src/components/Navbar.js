import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          City<span>Quest</span>
        </Link>
        
        <div className="navbar-center">
          {user && (
            <>
              <Link to="/" className="nav-link">Главная</Link>
              <Link to="/profile" className="nav-link">Профиль</Link>
              <Link to="/leaderboard" className="nav-link">Рейтинг</Link>
              
              {(user.role === 'organizer' || user.role === 'admin') && (
                <Link to="/my-quests" className="nav-link">Мои квесты</Link>
              )}
              
              {(user.role === 'organizer' || user.role === 'admin')}
              
              {user.role === 'admin' && (
                <Link to="/admin" className="nav-link">Админ</Link>
              )}
            </>
          )}
        </div>
        
        <div className="navbar-right">
          {user ? (
            <>
              <span className="nav-username">{user.nickname}</span>
              <button onClick={handleLogout} className="nav-logout">Выйти</button>
            </>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="nav-link">Войти</Link>
              <Link to="/register" className="nav-link nav-link-primary">Регистрация</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;