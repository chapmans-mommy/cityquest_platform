import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { questsAPI } from '../services/api';
import './CreateQuestPage.css';

const CreateQuestPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await questsAPI.create({
        title,
        description,
        cover_image_url: coverImageUrl
      });
      navigate(`/quest/${res.data.id}/edit`);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка создания квеста');
      setLoading(false);
    }
  };

  return (
    <div className="create-quest-container">
      <div className="create-quest-card">
        <h1 className="create-quest-title">Создать новый квест</h1>
        <p className="create-quest-subtitle">Заполните основную информацию</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Название квеста *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Тайны Арбата"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Описание</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Расскажите, что ждёт участников..."
              rows="5"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Ссылка на обложку</label>
            <input
              type="url"
              className="form-input"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="Cсылка https"
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="button"
              onClick={() => navigate('/my-quests')}
              className="btn-secondary"
            >
              Отмена
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Создание...' : 'Создать квест'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateQuestPage;