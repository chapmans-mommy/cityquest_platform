import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AdminPage.css';
import AdminManualRequests from '../components/AdminManualRequests';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [pendingQuests, setPendingQuests] = useState([]);
  const [activeTab, setActiveTab] = useState('quests');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await api.get('/admin/users');
        setUsers(res.data);
      } else if (activeTab === 'logs') {
        const res = await api.get('/admin/logs');
        setLogs(res.data);
      } else if (activeTab === 'quests') {
        const res = await api.get('/admin/quests/pending');
        setPendingQuests(res.data);
      }
    } catch (err) {
      console.error('Ошибка загрузки:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (questId, status) => {
    try {
      await api.post(`/admin/quests/${questId}/moderate`, { status });
      alert(`Квест ${status === 'published' ? 'опубликован' : 'отклонён'}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка');
    }
  };

  const handleChangeRole = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      alert('Роль изменена');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка');
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <div className="admin-container">
      <h1 className="admin-title">Админ-панель</h1>
      
      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'quests' ? 'active' : ''}`}
          onClick={() => setActiveTab('quests')}
        >
          Квесты на модерации
        </button>
        <button 
            className={`admin-tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
            >
            Ручная отметка
            </button>
        <button 
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Пользователи
        </button>
        <button 
          className={`admin-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          Логи аудита
        </button>
      </div>
      
      {activeTab === 'quests' && (
        <div className="admin-section">
          <h2 className="section-title">Квесты на модерации</h2>
          {pendingQuests.length === 0 ? (
            <p className="empty-message">Нет квестов на модерации</p>
          ) : (
            <div className="quests-moderate-list">
              {pendingQuests.map(quest => (
                <div key={quest.id} className="moderate-card">
                  <div className="moderate-card-header">
                    <h3>{quest.title}</h3>
                    <span className="quest-author">{quest.author_name}</span>
                  </div>
                  <p className="moderate-card-description">{quest.description}</p>
                  <div className="moderate-card-actions">
                    <button 
                      onClick={() => handleModerate(quest.id, 'published')}
                      className="btn-approve"
                    >
                      Одобрить
                    </button>
                    <button 
                      onClick={() => handleModerate(quest.id, 'rejected')}
                      className="btn-reject"
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="admin-section">
            <h2 className="section-title">Запросы на ручную отметку</h2>
            <AdminManualRequests />
        </div>
      )}

      {activeTab === 'users' && (
        <div className="admin-section">
          <h2 className="section-title">Пользователи</h2>
          <div className="users-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Никнейм</th>
                  <th>Роль</th>
                  <th>Очки</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.email}</td>
                    <td>{user.nickname}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {user.role === 'player' ? 'Игрок' : user.role === 'organizer' ? 'Организатор' : 'Админ'}
                      </span>
                    </td>
                    <td>{user.total_points}</td>
                    <td>
                      <select 
                        onChange={(e) => handleChangeRole(user.id, e.target.value)} 
                        defaultValue={user.role}
                        className="role-select"
                      >
                        <option value="player">Игрок</option>
                        <option value="organizer">Организатор</option>
                        <option value="admin">Админ</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {activeTab === 'logs' && (
        <div className="admin-section">
          <h2 className="section-title">Логи аудита</h2>
          <div className="logs-table-container">
            <table className="admin-table logs-table">
              <thead>
                <tr>
                  <th>Время</th>
                  <th>Пользователь</th>
                  <th>Действие</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-row">Нет логов</td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id}>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                      <td>{log.nickname || 'Гость'}</td>
                      <td className="log-action">{log.action}</td>
                      <td>{log.ip_address}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;