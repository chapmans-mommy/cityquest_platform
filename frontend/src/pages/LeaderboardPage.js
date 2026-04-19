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
  const subtitle = activeTab === 'global' 
    ? 'Лучшие игроки за всё время' 
    : 'Самые активные игроки за последние 7 дней';

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-hero">
        <h1 className="leaderboard-title"> Рейтинг игроков</h1>
        <p className="leaderboard-subtitle">Соревнуйтесь, проходите квесты и поднимайтесь в топ</p>
      </div>

      <div className="leaderboard-card">
        <div className="leaderboard-header">
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
          <div className="leaderboard-info">
            <span className="info-badge">{title}</span>
            <span className="info-text">{subtitle}</span>
          </div>
        </div>

        {currentData.length === 0 ? (
          <div className="empty-leaderboard">
            <div className="empty-icon"></div>
            <p>Пока нет данных</p>
            <span>Пройдите квест, чтобы попасть в рейтинг</span>
          </div>
        ) : (
          <div className="leaderboard-table-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Место</th>
                  <th>Игрок</th>
                  <th>Очки</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((player, idx) => (
                  <tr key={player.id} className={idx < 3 ? 'top-player' : ''}>
                    <td className="rank-cell">
                      {idx === 0 && <span className="medal gold">🥇</span>}
                      {idx === 1 && <span className="medal silver">🥈</span>}
                      {idx === 2 && <span className="medal bronze">🥉</span>}
                      {idx > 2 && <span className="rank-number">#{idx + 1}</span>}
                    </td>
                    <td className="player-cell">
                      <div className="player-avatar">
                        {player.nickname?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="player-name">{player.nickname}</span>
                    </td>
                    <td className="points-cell">
                      <span className="points-value">
                        {player.total_points || player.weekly_points || 0}
                      </span>
                    </td>
                    <td className="status-cell">
                      {idx === 0 && <span className="status-badge champion">Чемпион</span>}
                      {idx === 1 && <span className="status-badge contender">Претендент</span>}
                      {idx === 2 && <span className="status-badge rising">Восходящая звезда</span>}
                      {idx > 2 && <span className="status-badge player">Игрок</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;