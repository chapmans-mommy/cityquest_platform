import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { questsAPI } from '../services/api';

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

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Загрузка...</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Мои квесты</h1>
        <button 
          onClick={() => navigate('/create-quest')}
          style={{ padding: '10px 20px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          + Создать квест
        </button>
      </div>
      
      {quests.length === 0 ? (
        <p>У вас пока нет квестов. Создайте первый!</p>
      ) : (
        quests.map(quest => (
          <div 
            key={quest.id}
            onClick={() => navigate(`/quest/${quest.id}/edit`)}
            style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '16px',
              cursor: 'pointer',
              backgroundColor: 'white'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>{quest.title}</h3>
              <span style={{ 
                padding: '4px 12px', 
                borderRadius: '20px', 
                fontSize: '12px',
                backgroundColor: 
                  quest.status === 'published' ? '#4CAF50' :
                  quest.status === 'pending' ? '#ff9800' :
                  quest.status === 'rejected' ? '#f44336' : '#999',
                color: 'white'
              }}>
                {getStatusText(quest.status)}
              </span>
            </div>
            <p style={{ color: '#666', marginTop: '8px' }}>{quest.description?.substring(0, 100)}</p>
            <p style={{ fontSize: '12px', color: '#999' }}>Локаций: {quest.locations?.length || 0}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default MyQuestsPage;