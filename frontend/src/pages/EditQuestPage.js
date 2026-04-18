import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questsAPI } from '../services/api';
import QuestMap from '../components/QuestMap';

const EditQuestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Форма для новой локации
  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    points_award: 10,
    hint_text: ''
  });

  useEffect(() => {
    loadQuest();
  }, [id]);

  const loadQuest = async () => {
    try {
      const res = await questsAPI.getById(id);
      setQuest(res.data);
    } catch (err) {
      console.error('Ошибка загрузки квеста:', err);
      navigate('/my-quests');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLocation.name || !newLocation.latitude || !newLocation.longitude) {
      alert('Заполните название и координаты');
      return;
    }
    
    setSaving(true);
    try {
      await questsAPI.addLocation(id, {
        name: newLocation.name,
        description: newLocation.description,
        latitude: parseFloat(newLocation.latitude),
        longitude: parseFloat(newLocation.longitude),
        points_award: parseInt(newLocation.points_award),
        hint_text: newLocation.hint_text
      });
      
      // Очищаем форму и перезагружаем квест
      setNewLocation({
        name: '',
        description: '',
        latitude: '',
        longitude: '',
        points_award: 10,
        hint_text: ''
      });
      await loadQuest();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка добавления локации');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    if (!window.confirm('Удалить эту локацию?')) return;
    
    try {
      await questsAPI.deleteLocation(locationId);
      await loadQuest();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка удаления');
    }
  };

  const handlePublish = async () => {
    try {
      await questsAPI.publish(id);
      alert('Квест отправлен на модерацию');
      loadQuest();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка публикации');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Загрузка...</div>;
  if (!quest) return <div style={{ textAlign: 'center', padding: '50px' }}>Квест не найден</div>;

  const isOwner = true; // Бэкенд проверит права

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <button onClick={() => navigate('/my-quests')} style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer' }}>
        ← К моим квестам
      </button>
      
      <h1>Редактирование: {quest.title}</h1>
      <p>Статус: {quest.status === 'draft' ? 'Черновик' : quest.status === 'pending' ? 'На модерации' : quest.status === 'published' ? 'Опубликован' : 'Отклонён'}</p>
      
      {quest.status === 'draft' && (
        <button 
          onClick={handlePublish}
          style={{ marginBottom: '20px', padding: '10px 20px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Отправить на модерацию
        </button>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Список локаций */}
        <div>
          <h2>Локации квеста</h2>
          {quest.locations?.length === 0 ? (
            <p>Локации не добавлены</p>
          ) : (
            quest.locations?.map((loc, idx) => (
              <div key={loc.id} style={{ border: '1px solid #ddd', padding: '12px', marginBottom: '10px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0 }}>{loc.order_number}. {loc.name}</h4>
                  <button 
                    onClick={() => handleDeleteLocation(loc.id)}
                    style={{ background: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
                  >
                    Удалить
                  </button>
                </div>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>{loc.description}</p>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                  Координаты: {loc.latitude}, {loc.longitude} | Очки: {loc.points_award}
                </p>
              </div>
            ))
          )}
        </div>
        
        {/* Форма добавления локации */}
        <div>
          <h2>Добавить локацию</h2>
          <form onSubmit={handleAddLocation}>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Название *"
                value={newLocation.name}
                onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <textarea
                placeholder="Описание"
                value={newLocation.description}
                onChange={(e) => setNewLocation({...newLocation, description: e.target.value})}
                rows="2"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <input
                type="number"
                step="any"
                placeholder="Широта *"
                value={newLocation.latitude}
                onChange={(e) => setNewLocation({...newLocation, latitude: e.target.value})}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
              <input
                type="number"
                step="any"
                placeholder="Долгота *"
                value={newLocation.longitude}
                onChange={(e) => setNewLocation({...newLocation, longitude: e.target.value})}
                style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="number"
                placeholder="Очки за отметку"
                value={newLocation.points_award}
                onChange={(e) => setNewLocation({...newLocation, points_award: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Подсказка"
                value={newLocation.hint_text}
                onChange={(e) => setNewLocation({...newLocation, hint_text: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            <button 
              type="submit" 
              disabled={saving}
              style={{ width: '100%', padding: '10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              {saving ? 'Добавление...' : 'Добавить локацию'}
            </button>
          </form>
        </div>
      </div>
      
      <div style={{ marginTop: '30px' }}>
        <h3>Карта квеста</h3>
        <QuestMap locations={quest.locations || []} />
      </div>
    </div>
  );
};

export default EditQuestPage;