import React, { useState, useEffect } from 'react';
import { questsAPI } from '../services/api';
import QuestCard from '../components/QuestCard';

const HomePage = () => {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      const res = await questsAPI.getAll();
      setQuests(res.data);
    } catch (err) {
      console.error('Ошибка загрузки квестов:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuests = quests.filter(quest =>
    quest.title.toLowerCase().includes(search.toLowerCase()) ||
    quest.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Загрузка...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Доступные квесты</h1>
      
      <input
        type="text"
        placeholder="Поиск квестов..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '12px',
          marginBottom: '20px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          fontSize: '16px'
        }}
      />
      
      {filteredQuests.length === 0 ? (
        <p>Квесты не найдены</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredQuests.map(quest => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;