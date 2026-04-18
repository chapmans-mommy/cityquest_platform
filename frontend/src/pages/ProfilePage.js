import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ProfilePage = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Загрузка...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Личный кабинет</h1>
      
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2>Информация</h2>
        <p><strong>Никнейм:</strong> {user.nickname}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Роль:</strong> {user.role === 'player' ? 'Игрок' : user.role === 'organizer' ? 'Организатор' : 'Администратор'}</p>
        <p><strong>Всего очков:</strong> {user.total_points || 0}</p>
      </div>
      
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h2>Достижения</h2>
        {achievements.length === 0 ? (
          <p>Пока нет достижений. Проходите квесты, чтобы их получить!</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {achievements.map(ach => (
              <div key={ach.id} style={{ background: '#4CAF50', color: 'white', padding: '8px 16px', borderRadius: '20px' }}>
                {ach.name} +{ach.bonus_points}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        <h2>Пройденные квесты</h2>
        {completedQuests.length === 0 ? (
          <p>Вы ещё не прошли ни одного квеста</p>
        ) : (
          <ul>
            {completedQuests.map(q => (
              <li key={q.id}>{q.title} — {q.total_points} очков</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;