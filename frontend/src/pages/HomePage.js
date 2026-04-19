import React, { useState, useEffect } from 'react';
import { questsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import QuestCard from '../components/QuestCard';
import Hero from '../components/Hero';
import './HomePage.css';

const HomePage = () => {
  const { user } = useAuth();
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

  const isAdminOrOrganizer = user && (user.role === 'admin' || user.role === 'organizer');

  return (
    <div>
      <Hero />
      
      <div className="quests-section">
        <div className="container">
          <div className="quests-header">
            <h2 className="section-title">
              {isAdminOrOrganizer ? 'Доступные квесты' : 'Доступные квесты'}
            </h2>
            <input
              type="text"
              placeholder="Поиск квестов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          
          {loading ? (
            <div className="loading">Загрузка...</div>
          ) : filteredQuests.length === 0 ? (
            <p className="empty-message">Квесты не найдены</p>
          ) : (
            <div className="quests-grid">
              {filteredQuests.map(quest => (
                <QuestCard key={quest.id} quest={quest} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;