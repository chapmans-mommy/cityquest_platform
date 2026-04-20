import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import './ActiveUsers.css';

const ActiveUsers = () => {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kicking, setKicking] = useState({});

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const res = await adminAPI.getActiveUsers();
      setQuests(res.data);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKick = async (progressId, nickname, questTitle) => {
    if (!window.confirm(`Удалить игрока "${nickname}" из квеста "${questTitle}"?`)) return;
    
    setKicking(prev => ({ ...prev, [progressId]: true }));
    try {
      await adminAPI.kickUser(progressId);
      alert('Игрок удалён из квеста');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка');
    } finally {
      setKicking(prev => ({ ...prev, [progressId]: false }));
    }
  };

  if (loading) return <div className="active-loading">Загрузка...</div>;

  return (
    <div className="active-users">
      
      {quests.length === 0 ? (
        <p className="active-empty">Нет активных прохождений</p>
      ) : (
        quests.map(quest => (
          <div key={quest.quest_id} className="active-quest-card">
            <div className="active-quest-header">
              <span className="active-quest-title">{quest.quest_title}</span>
              <span className="active-count">{quest.active_players.length} игроков</span>
            </div>
            <div className="active-players-list">
              {quest.active_players.map(player => (
                <div key={player.progress_id} className="active-player-item">
                  <div className="player-info">
                    <span className="player-name">{player.nickname}</span>
                    <span className="player-time">
                      с {new Date(player.started_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleKick(player.progress_id, player.nickname, quest.quest_title)}
                    disabled={kicking[player.progress_id]}
                    className="kick-btn"
                  >
                    {kicking[player.progress_id] ? '...' : 'Удалить'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ActiveUsers;