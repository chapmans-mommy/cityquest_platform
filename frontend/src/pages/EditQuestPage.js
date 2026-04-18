import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { questsAPI } from '../services/api';
import QuestMap from '../components/QuestMap';

// Компонент для перетаскиваемой локации
const SortableLocation = ({ location, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: location.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: '1px solid #ddd',
    padding: '12px',
    marginBottom: '10px',
    borderRadius: '8px',
    backgroundColor: isDragging ? '#e3f2fd' : 'white',
    cursor: 'grab',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <strong>{location.order_number}. {location.name}</strong>
          <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
            {location.latitude}, {location.longitude} | Очки: {location.points_award}
          </p>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(location.id);
          }}
          style={{ background: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}
        >
          Удалить
        </button>
      </div>
      <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
        ⋮⋮⋮ Перетащите для изменения порядка
      </div>
    </div>
  );
};

const EditQuestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quest, setQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState([]);
  
  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    points_award: 10,
    hint_text: ''
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadQuest();
  }, [id]);

  const loadQuest = async () => {
    try {
      const res = await questsAPI.getById(id);
      setQuest(res.data);
      setLocations(res.data.locations || []);
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

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = locations.findIndex(l => l.id === active.id);
      const newIndex = locations.findIndex(l => l.id === over.id);
      const newLocations = arrayMove(locations, oldIndex, newIndex);
      
      // Обновляем order_number для всех локаций
      const updatedLocations = newLocations.map((loc, idx) => ({
        id: loc.id,
        order_number: idx + 1
      }));
      
      setLocations(newLocations);
      
      // Сохраняем новый порядок на сервере
      try {
        await questsAPI.reorderLocations(id, updatedLocations);
      } catch (err) {
        console.error('Ошибка сохранения порядка:', err);
        alert('Ошибка сохранения порядка локаций');
        loadQuest();
      }
    }
  };

  const handlePublish = async () => {
    if (locations.length === 0) {
      alert('Нельзя опубликовать квест без локаций');
      return;
    }
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

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => navigate('/my-quests')} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          ← К моим квестам
        </button>
        <button 
          onClick={() => navigate(`/quest/${id}`)}
          style={{ padding: '8px 16px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Просмотр
        </button>
      </div>
      
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
        <div>
          <h2>Локации квеста (перетаскивайте для изменения порядка)</h2>
          {locations.length === 0 ? (
            <p>Локации не добавлены</p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={locations.map(l => l.id)}
                strategy={verticalListSortingStrategy}
              >
                {locations.map((loc) => (
                  <SortableLocation
                    key={loc.id}
                    location={loc}
                    onDelete={handleDeleteLocation}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
        
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
        <QuestMap locations={locations} />
      </div>
    </div>
  );
};

export default EditQuestPage;