import React, { useState, useEffect } from 'react';
import api from '../services/api';

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

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Загрузка...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>Админ-панель</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        <button onClick={() => setActiveTab('quests')} style={{ padding: '8px 16px', background: activeTab === 'quests' ? '#4CAF50' : '#ddd', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Квесты на модерации</button>
        <button onClick={() => setActiveTab('users')} style={{ padding: '8px 16px', background: activeTab === 'users' ? '#4CAF50' : '#ddd', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Пользователи</button>
        <button onClick={() => setActiveTab('logs')} style={{ padding: '8px 16px', background: activeTab === 'logs' ? '#4CAF50' : '#ddd', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Логи аудита</button>
      </div>
      
      {activeTab === 'quests' && (
        <div>
          <h2>Квесты на модерации</h2>
          {pendingQuests.length === 0 ? (
            <p>Нет квестов на модерации</p>
          ) : (
            pendingQuests.map(quest => (
              <div key={quest.id} style={{ border: '1px solid #ddd', padding: '16px', marginBottom: '16px', borderRadius: '8px' }}>
                <h3>{quest.title}</h3>
                <p>{quest.description}</p>
                <p><strong>Автор:</strong> {quest.author_name}</p>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button onClick={() => handleModerate(quest.id, 'published')} style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Одобрить</button>
                  <button onClick={() => handleModerate(quest.id, 'rejected')} style={{ padding: '8px 16px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Отклонить</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {activeTab === 'users' && (
        <div>
          <h2>Пользователи</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#ddd' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Никнейм</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Роль</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Очки</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px' }}>{user.id}</td>
                  <td style={{ padding: '8px' }}>{user.email}</td>
                  <td style={{ padding: '8px' }}>{user.nickname}</td>
                  <td style={{ padding: '8px' }}>{user.role}</td>
                  <td style={{ padding: '8px' }}>{user.total_points}</td>
                  <td style={{ padding: '8px' }}>
                    <select onChange={(e) => handleChangeRole(user.id, e.target.value)} defaultValue={user.role}>
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
      )}
      
      {activeTab === 'logs' && (
        <div>
          <h2>Логи аудита</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#ddd' }}>
                <th style={{ padding: '8px', textAlign: 'left' }}>Время</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Пользователь</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>Действие</th>
                <th style={{ padding: '8px', textAlign: 'left' }}>IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px' }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td style={{ padding: '8px' }}>{log.nickname || 'Гость'}</td>
                  <td style={{ padding: '8px' }}>{log.action}</td>
                  <td style={{ padding: '8px' }}>{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminPage;