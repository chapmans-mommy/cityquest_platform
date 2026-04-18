import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Reviews = ({ questId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    loadReviews();
    checkIfCompleted();
  }, [questId]);

  const loadReviews = async () => {
    try {
      const res = await api.get(`/quests/${questId}/reviews`);
      setReviews(res.data);
    } catch (err) {
      console.error('Ошибка загрузки отзывов:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkIfCompleted = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/user/completed-quests`);
      const completed = res.data.some(q => q.id === parseInt(questId));
      setHasCompleted(completed);
    } catch (err) {
      console.error('Ошибка проверки прохождения:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Войдите, чтобы оставить отзыв');
      return;
    }
    if (!hasCompleted) {
      alert('Отзыв можно оставить только после прохождения квеста');
      return;
    }
    
    setSubmitting(true);
    try {
      await api.post(`/quests/${questId}/reviews`, { rating, comment });
      setComment('');
      setRating(5);
      await loadReviews();
      alert('Отзыв оставлен!');
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка при отправке отзыва');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Удалить отзыв?')) return;
    try {
      await api.delete(`/reviews/${reviewId}`);
      await loadReviews();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка удаления');
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span 
          key={i} 
          style={{ 
            cursor: 'pointer', 
            color: i <= rating ? '#f5a623' : '#ddd',
            fontSize: '24px'
          }}
          onClick={() => setRating(i)}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  if (loading) return <div>Загрузка отзывов...</div>;

  return (
    <div style={{ marginTop: '40px', borderTop: '2px solid #eee', paddingTop: '20px' }}>
      <h3>Отзывы ({reviews.length})</h3>
      
      {/* Форма добавления отзыва */}
      {user && hasCompleted && (
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h4>Оставить отзыв</h4>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '10px' }}>
              <label>Оценка: </label>
              <div style={{ display: 'inline-block', marginLeft: '10px' }}>
                {renderStars(rating)}
              </div>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <textarea
                placeholder="Ваш комментарий..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="3"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={submitting}
              style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              {submitting ? 'Отправка...' : 'Отправить отзыв'}
            </button>
          </form>
        </div>
      )}
      
      {!user && (
        <p style={{ color: '#666' }}>Войдите, чтобы оставить отзыв</p>
      )}
      
      {user && !hasCompleted && (
        <p style={{ color: '#666' }}>Вы сможете оставить отзыв после прохождения квеста</p>
      )}
      
      {/* Список отзывов */}
      {reviews.length === 0 ? (
        <p style={{ color: '#666' }}>Пока нет отзывов. Будьте первым!</p>
      ) : (
        reviews.map(review => (
          <div key={review.id} style={{ borderBottom: '1px solid #eee', padding: '15px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{review.nickname}</strong>
                <span style={{ marginLeft: '10px', color: '#f5a623' }}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </span>
                <span style={{ marginLeft: '10px', fontSize: '12px', color: '#999' }}>
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {(user?.id === review.user_id || user?.role === 'admin') && (
                <button 
                  onClick={() => handleDelete(review.id)}
                  style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '18px' }}
                >
                  ✕
                </button>
              )}
            </div>
            <p style={{ marginTop: '8px', color: '#333' }}>{review.comment}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default Reviews;