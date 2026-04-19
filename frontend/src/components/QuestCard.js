import React from 'react';
import { useNavigate } from 'react-router-dom';
import './QuestCard.css';

const QuestCard = ({ quest }) => {
  const navigate = useNavigate();
  
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= (rating || 0) ? 'star-filled' : 'star-empty'}>
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className="quest-card" onClick={() => navigate(`/quest/${quest.id}`)}>
      <div className="quest-card-image">
        {quest.cover_image_url ? (
          <img src={quest.cover_image_url} alt={quest.title} />
        ) : (
          <div className="quest-card-image-placeholder">
            <span></span>
          </div>
        )}
        <div className="quest-card-status">
          {quest.status === 'published' && <span className="status-badge published">Опубликован</span>}
          {quest.status === 'pending' && <span className="status-badge pending">На модерации</span>}
          {quest.status === 'draft' && <span className="status-badge draft">Черновик</span>}
        </div>
      </div>
      
      <div className="quest-card-content">
        <h3 className="quest-card-title">{quest.title}</h3>
        <p className="quest-card-description">
          {quest.description?.substring(0, 100)}...
        </p>
        <div className="quest-card-footer">
          <div className="quest-card-stats">
            <span className="stat">
              <span className="stat-icon"></span>
              количество локаций: {quest.locations_count || quest.locations?.length || 0}
            </span>
            <div className="stars">{renderStars(quest.avg_rating)}</div>
          </div>
          <div className="quest-card-author">
            {quest.author_name}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestCard;