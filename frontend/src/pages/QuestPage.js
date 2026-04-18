import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import QuestMap from '../components/QuestMap';
import Reviews from '../components/Reviews';

const QuestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState('easy');
  const [starting, setStarting] = useState(false);

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

  // Проверка, может ли пользователь редактировать квест (автор или админ)
  const canEdit = user && (user.role === 'admin' || (quest && user.id === quest.author_id));

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Загрузка...</div>;
  if (!quest) return <div style={{ textAlign: 'center', padding: '50px' }}>Квест не найден</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          ← Назад
        </button>
        
        {canEdit && (
          <button 
            onClick={() => navigate(`/quest/${id}/edit`)}
            style={{ padding: '8px 16px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Редактировать
          </button>
        )}
      </div>
      
      <h1>{quest.title}</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>{quest.description}</p>
      
      <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
        <p><strong>Статус:</strong> {
          quest.status === 'published' ? 'Опубликован' :
          quest.status === 'pending' ? 'На модерации' :
          quest.status === 'draft' ? 'Черновик' : 'Отклонён'
        }</p>
        <p><strong>Автор:</strong> {quest.author_name}</p>
        <p><strong>Локаций:</strong> {quest.locations?.length || 0}</p>
      </div>
      
      <h3>Локации квеста</h3>
      <QuestMap locations={quest.locations} />
      
      {quest.status === 'published' && (
        <div style={{ marginTop: '30px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3>Начать квест</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ marginRight: '15px' }}>
              <input
                type="radio"
                value="easy"
                checked={difficulty === 'easy'}
                onChange={(e) => setDifficulty(e.target.value)}
              /> Лёгкий
            </label>
            <label style={{ marginRight: '15px' }}>
              <input
                type="radio"
                value="medium"
                checked={difficulty === 'medium'}
                onChange={(e) => setDifficulty(e.target.value)}
              /> Средний
            </label>
            <label>
              <input
                type="radio"
                value="hard"
                checked={difficulty === 'hard'}
                onChange={(e) => setDifficulty(e.target.value)}
              /> Сложный
            </label>
          </div>
          <button 
            onClick={handleStart}
            disabled={starting}
            style={{ padding: '10px 24px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            {starting ? 'Запуск...' : 'Начать квест'}
          </button>
        </div>
      )}
      <Reviews questId={id} />
    </div>
  );
};

export default QuestPage;