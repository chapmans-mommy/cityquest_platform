import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Для аватарки
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [achievementsRes, questsRes] = await Promise.all([
        api.get('/user/achievements'),
        api.get('/user/completed-quests')
      ]);
      setAchievements(achievementsRes.data);
      setCompletedQuests(questsRes.data);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateAvatar = async () => {
    try {
      await api.put('/user/avatar', { avatar_url: avatarUrl });
      if (updateUser) {
        updateUser({ ...user, avatar_url: avatarUrl });
      }
      setEditingAvatar(false);
      alert('Аватар обновлён');
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка обновления аватара');
    }
  };

  const getRoleName = (role) => {
    switch(role) {
      case 'player': return 'Игрок';
      case 'organizer': return 'Организатор';
      case 'admin': return 'Администратор';
      default: return role;
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar" onClick={() => setEditingAvatar(true)} style={{ cursor: 'pointer' }}>
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="Аватар" />
          ) : (
            user.nickname?.[0]?.toUpperCase() || 'U'
          )}
          <div className="avatar-edit-hint">✏️</div>
        </div>
        <div className="profile-info">
          <h1 className="profile-name">{user.nickname}</h1>
          <p className="profile-email">{user.email}</p>
          <span className="profile-role">{getRoleName(user.role)}</span>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <div className="stat-value">{user.total_points || 0}</div>
          <div className="stat-label">Всего очков</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{completedQuests.length}</div>
          <div className="stat-label">Пройдено квестов</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{achievements.length}</div>
          <div className="stat-label">Достижений</div>
        </div>
      </div>

      <div className="profile-section">
        <h2 className="section-title">Достижения</h2>
        {achievements.length === 0 ? (
          <p className="empty-message">Пока нет достижений. Проходите квесты, чтобы их получить!</p>
        ) : (
          <div className="achievements-grid">
            {achievements.map(ach => (
              <div key={ach.id} className="achievement-card">
                <div className="achievement-icon"></div>
                <div className="achievement-info">
                  <div className="achievement-name">{ach.name}</div>
                  <div className="achievement-desc">{ach.description}</div>
                  <div className="achievement-points">+{ach.bonus_points} очков</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="profile-section">
        <h2 className="section-title">Пройденные квесты</h2>
        {completedQuests.length === 0 ? (
          <p className="empty-message">Вы ещё не прошли ни одного квеста</p>
        ) : (
          <div className="completed-quests-list">
            {completedQuests.map(quest => (
              <div key={quest.id} className="completed-quest-item">
                <div className="quest-icon"></div>
                <div className="quest-info">
                  <div className="quest-name">{quest.title}</div>
                  <div className="quest-date">
                    {new Date(quest.completed_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="quest-points">+{quest.total_points} очков</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно для редактирования аватара */}
      {editingAvatar && (
        <div className="avatar-modal" onClick={() => setEditingAvatar(false)}>
          <div className="avatar-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Изменить аватар</h3>
            <input
              type="url"
              className="form-input"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Ссылка на изображение"
            />
            <div className="modal-actions">
              <button onClick={updateAvatar}>Сохранить</button>
              <button onClick={() => setEditingAvatar(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;