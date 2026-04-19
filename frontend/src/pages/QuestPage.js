import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import QuestMap from '../components/QuestMap';
import Reviews from '../components/Reviews';
import './QuestPage.css';

const QuestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState('easy');
  const [starting, setStarting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadQuest();
  }, [id]);

  const loadQuest = async () => {
    try {
      const res = await questsAPI.getById(id);
      setQuest(res.data);
    } catch (err) {
      console.error('Ошибка загрузки квеста:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const res = await questsAPI.start(id, difficulty);
      navigate(`/quest/${id}/progress/${res.data.progressId}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка начала квеста');
      setStarting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Вы уверены, что хотите удалить этот квест? Это действие нельзя отменить.')) {
      return;
    }
    
    setDeleting(true);
    try {
      await questsAPI.delete(id);
      alert('Квест успешно удалён');
      navigate('/my-quests');
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка удаления квеста');
      setDeleting(false);
    }
  };
  
  // Проверка прав ДО использования в JSX
  const canEdit = user && (user.role === 'admin' || (quest && user.id === quest.author_id));
  const canDelete = user && (user.role === 'admin' || (quest && user.id === quest.author_id));

  const getStatusText = (status) => {
    switch(status) {
      case 'published': return 'Опубликован';
      case 'pending': return 'На модерации';
      case 'draft': return 'Черновик';
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
  
  if (!quest) return (
    <div className="empty-state">
      <div className="empty-icon"></div>
      <p>Квест не найден</p>
    </div>
  );

  return (
    <div className="quest-page-container">
      <div className="quest-page-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          ← Назад
        </button>
        
        <div className="header-actions">
          {canEdit && (
            <button onClick={() => navigate(`/quest/${id}/edit`)} className="edit-btn">
               Редактировать
            </button>
          )}
          {canDelete && (
            <button onClick={handleDelete} disabled={deleting} className="delete-btn">
              {deleting ? 'Удаление...' : ' Удалить'}
            </button>
          )}
        </div>
      </div>
      
      <div className="quest-page-content">
        <h1 className="quest-title">{quest.title}</h1>
        <p className="quest-description">{quest.description}</p>
        
        <div className="quest-info-grid">
          <div className="info-card">
            <span className="info-icon"></span>
            <div className="info-content">
              <span className="info-label">Статус</span>
              <span className={`status-badge ${getStatusClass(quest.status)}`}>
                {getStatusText(quest.status)}
              </span>
            </div>
          </div>
          
          <div className="info-card">
            <span className="info-icon"></span>
            <div className="info-content">
              <span className="info-label">Автор</span>
              <span className="info-value">{quest.author_name}</span>
            </div>
          </div>
          
          <div className="info-card">
            <span className="info-icon"></span>
            <div className="info-content">
              <span className="info-label">Количество локаций</span> 
              <span className="info-label"></span>
              <span className="info-value">{quest.locations?.length || 0}</span>
            </div>
          </div>
        </div>
        
        <div className="map-section">
          <h2 className="section-title">Карта маршрута</h2>
          <QuestMap locations={quest.locations} />
        </div>
        
        {quest.status === 'published' && (
          <div className="start-section">
            <h2 className="section-title">Начать квест</h2>
            <div className="difficulty-selector">
              <label className={`difficulty-option ${difficulty === 'easy' ? 'active' : ''}`}>
                <input
                  type="radio"
                  value="easy"
                  checked={difficulty === 'easy'}
                  onChange={(e) => setDifficulty(e.target.value)}
                />
                <span className="difficulty-name">Лёгкий</span>
                <span className="difficulty-desc">Без таймера</span>
              </label>
              
              <label className={`difficulty-option ${difficulty === 'medium' ? 'active' : ''}`}>
                <input
                  type="radio"
                  value="medium"
                  checked={difficulty === 'medium'}
                  onChange={(e) => setDifficulty(e.target.value)}
                />
                <span className="difficulty-name">Средний</span>
                <span className="difficulty-desc">10 мин на локацию, штраф 50%</span>
              </label>
              
              <label className={`difficulty-option ${difficulty === 'hard' ? 'active' : ''}`}>
                <input
                  type="radio"
                  value="hard"
                  checked={difficulty === 'hard'}
                  onChange={(e) => setDifficulty(e.target.value)}
                />
                <span className="difficulty-name">Сложный</span>
                <span className="difficulty-desc">5 мин на локацию, штраф 100%</span>
              </label>
            </div>
            
            <button onClick={handleStart} disabled={starting} className="start-btn">
              {starting ? 'Запуск...' : ' Начать квест'}
            </button>
          </div>
        )}       
        <Reviews questId={id} />
      </div>
    </div>
  );
};

export default QuestPage;