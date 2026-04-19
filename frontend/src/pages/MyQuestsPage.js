import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { questsAPI } from '../services/api';
import './MyQuestsPage.css';

const MyQuestsPage = () => {
  const navigate = useNavigate();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyQuests();
  }, []);

  const loadMyQuests = async () => {
    try {
      const res = await questsAPI.getMyQuests();
      setQuests(res.data);
    } catch (err) {
      console.error('Ошибка загрузки квестов:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'draft': return 'Черновик';
      case 'pending': return 'На модерации';
      case 'published': return 'Опубликован';
      case 'rejected': return 'Отклонён';
      default: return status;
    }
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'published': return 'status-published';
      case 'pending': return 'status-pending';
      case 'draft': return 'status-draft';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
    </div>
  );

  return (
    <div className="my-quests-container">
      <div className="my-quests-header">
        <h1 className="my-quests-title">Мои квесты</h1>
        <button 
          onClick={() => navigate('/create-quest')}
          className="create-quest-btn"
        >
          + Создать квест
        </button>
      </div>
      
      {quests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"></div>
          <p className="empty-text">У вас пока нет квестов</p>
          <button 
            onClick={() => navigate('/create-quest')}
            className="empty-create-btn"
          >
            Создать первый квест
          </button>
        </div>
      ) : (
        <div className="my-quests-list">
          {quests.map(quest => (
            <div 
              key={quest.id}
              className="my-quest-card"
              onClick={() => navigate(`/quest/${quest.id}`)}
            >
              <div className="my-quest-card-content">
                <div className="my-quest-info">
                  <h3 className="my-quest-title">{quest.title}</h3>
                  <p className="my-quest-description">
                    {quest.description?.substring(0, 120)}...
                  </p>
                  <div className="my-quest-meta">
                    <span className="meta-item">
                      <span className="meta-icon"></span>
                      количество локаций: {quest.locations?.length || 0} 
                    </span>
                    <span className="meta-item">
                      <span className="meta-icon"></span>
                      {quest.author_name}
                    </span>
                  </div>
                </div>
                <div className="my-quest-status">
                  <span className={`status-badge ${getStatusClass(quest.status)}`}>
                    {getStatusText(quest.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyQuestsPage;