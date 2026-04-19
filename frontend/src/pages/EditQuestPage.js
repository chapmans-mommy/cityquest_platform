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
import './EditQuestPage.css';

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
    border: '1px solid #2A2D3B',
    padding: '16px',
    marginBottom: '12px',
    borderRadius: '10px',
    backgroundColor: isDragging ? '#2A2D3B' : '#0F111A',
    cursor: 'grab',
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="sortable-location-header">
        <div>
          <strong className="location-order">{location.order_number}.</strong>
          <span className="location-name">{location.name}</span>
        </div>
        <button onClick={() => onDelete(location.id)} className="delete-location-btn">
          ✕
        </button>
      </div>
      <p className="location-coords">
        {location.latitude}, {location.longitude} | Очки: {location.points_award}
      </p>
      <div className="drag-handle">⋮⋮⋮ Перетащите для изменения порядка</div>
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
      const updatedLocations = newLocations.map((loc, idx) => ({
        id: loc.id,
        order_number: idx + 1
      }));
      setLocations(newLocations);
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

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
    </div>
  );
  
  if (!quest) return <div className="empty-message">Квест не найден</div>;

  return (
    <div className="edit-quest-container">
      <div className="edit-quest-header">
        <button onClick={() => navigate('/my-quests')} className="back-btn">
          ← К моим квестам
        </button>
        <button onClick={() => navigate(`/quest/${id}`)} className="preview-btn">
           Просмотр
        </button>
      </div>
      
      <div className="edit-quest-card">
        <h1 className="edit-quest-title">{quest.title}</h1>
        <div className="quest-status">
          Статус: 
          <span className={`status-badge ${quest.status === 'draft' ? 'status-draft' : quest.status === 'pending' ? 'status-pending' : quest.status === 'published' ? 'status-published' : 'status-rejected'}`}>
            {quest.status === 'draft' ? 'Черновик' : quest.status === 'pending' ? 'На модерации' : quest.status === 'published' ? 'Опубликован' : 'Отклонён'}
          </span>
        </div>
        
        {quest.status === 'draft' && (
          <button onClick={handlePublish} className="publish-btn">
            Отправить на модерацию
          </button>
        )}
      </div>
      
      <div className="edit-quest-grid">
        <div className="locations-section">
          <h2 className="section-title">Локации квеста</h2>
          {locations.length === 0 ? (
            <p className="empty-locations">Локации не добавлены</p>
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
        
        <div className="add-location-section">
          <h2 className="section-title">Добавить локацию</h2>
          <form onSubmit={handleAddLocation}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Название *"
                value={newLocation.name}
                onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <textarea
                placeholder="Описание"
                value={newLocation.description}
                onChange={(e) => setNewLocation({...newLocation, description: e.target.value})}
                className="form-textarea"
                rows="2"
              />
            </div>
            <div className="form-row">
              <input
                type="number"
                step="any"
                placeholder="Широта *"
                value={newLocation.latitude}
                onChange={(e) => setNewLocation({...newLocation, latitude: e.target.value})}
                className="form-input"
                required
              />
              <input
                type="number"
                step="any"
                placeholder="Долгота *"
                value={newLocation.longitude}
                onChange={(e) => setNewLocation({...newLocation, longitude: e.target.value})}
                className="form-input"
                required
              />
            </div>
            <div className="form-group">
              <input
                type="number"
                placeholder="Очки за отметку"
                value={newLocation.points_award}
                onChange={(e) => setNewLocation({...newLocation, points_award: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input
                type="text"
                placeholder="Подсказка"
                value={newLocation.hint_text}
                onChange={(e) => setNewLocation({...newLocation, hint_text: e.target.value})}
                className="form-input"
              />
            </div>
            <button type="submit" disabled={saving} className="add-location-btn">
              {saving ? 'Добавление...' : '+ Добавить локацию'}
            </button>
          </form>
        </div>
      </div>
      
      <div className="map-section">
        <h2 className="section-title">Карта квеста</h2>
        <QuestMap locations={locations} />
      </div>
    </div>
  );
};

export default EditQuestPage;