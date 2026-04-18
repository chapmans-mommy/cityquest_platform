import React from 'react';
import { useNavigate } from 'react-router-dom';

const QuestCard = ({ quest }) => {
  const navigate = useNavigate();
  
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    for (let i = fullStars; i < 5; i++) {
      stars.push('☆');
    }
    return stars.join('');
  };

  return (
    <div 
      onClick={() => navigate(`/quest/${quest.id}`)}
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        backgroundColor: 'white'
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
    >
      {quest.cover_image_url && (
        <img 
          src={quest.cover_image_url} 
          alt={quest.title}
          style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '12px' }}
        />
      )}
      <h3 style={{ margin: '0 0 8px 0' }}>{quest.title}</h3>
      <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>
        {quest.description?.substring(0, 100)}...
      </p>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ color: '#f5a623' }}>{renderStars(quest.avg_rating || 0)}</span>
        <span style={{ fontSize: '12px', color: '#999' }}> Количество локаций: {quest.locations_count || quest.locations?.length || 0}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: '#999' }}>Автор: {quest.author_name}</span>
      </div>
    </div>
  );
};

export default QuestCard;