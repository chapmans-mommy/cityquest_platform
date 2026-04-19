import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './LeaderboardPage.css';

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

  const currentData = activeTab === 'global' ? globalLeaderboard : weeklyLeaderboard;
  const title = activeTab === 'global' ? 'Глобальный рейтинг' : 'Топ за неделю';

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1 className="leaderboard-title">Рейтинг игроков</h1>
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'global' ? 'active' : ''}`}
            onClick={() => setActiveTab('global')}
          >
            Глобальный
          </button>
          <button 
            className={`tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
            onClick={() => setActiveTab('weekly')}
          >
            За неделю
          </button>
        </div>
      </div>

      <div className="leaderboard-table-container">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Место</th>
              <th>Игрок</th>
              <th>Очки</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan="3" className="empty-row">Нет данных</td>
              </tr>
            ) : (
              currentData.map((player, idx) => (
                <tr key={player.id}>
                  <td className="rank-cell">
                    {idx === 0 && '🥇'}
                    {idx === 1 && '🥈'}
                    {idx === 2 && '🥉'}
                    {idx > 2 && `#${idx + 1}`}
                  </td>
                  <td className="player-cell">
                    <span className="player-name">{player.nickname}</span>
                  </td>
                  <td className="points-cell">
                    {player.total_points || player.weekly_points || 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardPage;