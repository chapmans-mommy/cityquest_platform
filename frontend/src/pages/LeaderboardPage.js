import React, { useState, useEffect } from 'react';
import api from '../services/api';

const LeaderboardPage = () => {
  const [globalLeaderboard, setGlobalLeaderboard] = useState([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('global');

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      const [globalRes, weeklyRes] = await Promise.all([
        api.get('/leaderboard'),
        api.get('/leaderboard/weekly')
      ]);
      setGlobalLeaderboard(globalRes.data);
      setWeeklyLeaderboard(weeklyRes.data);
    } catch (err) {
      console.error('Ошибка загрузки рейтинга:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Загрузка...</div>;

  const currentData = activeTab === 'global' ? globalLeaderboard : weeklyLeaderboard;
  const title = activeTab === 'global' ? 'Глобальный рейтинг' : 'Топ за неделю';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Рейтинг игроков</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('global')}
          style={{ padding: '8px 16px', background: activeTab === 'global' ? '#4CAF50' : '#ddd', color: activeTab === 'global' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Глобальный
        </button>
        <button 
          onClick={() => setActiveTab('weekly')}
          style={{ padding: '8px 16px', background: activeTab === 'weekly' ? '#4CAF50' : '#ddd', color: activeTab === 'weekly' ? 'white' : 'black', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          За неделю
        </button>
      </div>
      
      <div style={{ background: '#f5f5f5', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#ddd' }}>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left' }}>Место</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Игрок</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Очки</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((player, idx) => (
              <tr key={player.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px' }}>{idx + 1}</td>
                <td style={{ padding: '12px' }}>{player.nickname}</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{player.total_points || player.weekly_points || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardPage;