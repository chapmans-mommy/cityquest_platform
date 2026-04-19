import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import './AdminManualRequests.css';

const AdminManualRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    loadRequests();
    const interval = setInterval(loadRequests, 10000); // Обновляем каждые 10 секунд
    return () => clearInterval(interval);
  }, []);

  const loadRequests = async () => {
    try {
      const res = await adminAPI.getManualRequests();
      setRequests(res.data);
    } catch (err) {
      console.error('Ошибка загрузки запросов:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setProcessing(prev => ({ ...prev, [id]: true }));
    try {
      const res = await adminAPI.approveRequest(id);
      alert(res.data.message);
      loadRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка подтверждения');
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id) => {
    setProcessing(prev => ({ ...prev, [id]: true }));
    try {
      await adminAPI.rejectRequest(id);
      alert('Запрос отклонён');
      loadRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка отклонения');
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }));
    }
  };
  
  if (loading) return <div className="admin-requests-loading">Загрузка запросов...</div>;

  return (
    
    <div className="admin-manual-requests">
      
      {requests.length === 0 ? (
        <p className="requests-empty">Нет активных запросов</p>
      ) : (
        <div className="requests-list">
          {requests.map(req => (
            <div key={req.id} className="request-card">
              <div className="request-info">
                <div className="request-user">
                  <span className="request-icon"></span>
                  <span className="request-user-name">{req.user_nickname}</span>
                </div>
                <div className="request-details">
                  <div className="request-quest">
                    <span className="request-icon"></span>
                    <span>{req.quest_title}</span>
                  </div>
                  <div className="request-location">
                    <span className="request-icon"></span>
                    <span>{req.location_name} (+{req.points_award} очков)</span>
                  </div>
                </div>
                <div className="request-time">
                  {new Date(req.created_at).toLocaleTimeString()}
                </div>
              </div>
              <div className="request-actions">
                <button 
                  onClick={() => handleApprove(req.id)}
                  disabled={processing[req.id]}
                  className="approve-btn"
                >
                   Подтвердить
                </button>
                <button 
                  onClick={() => handleReject(req.id)}
                  disabled={processing[req.id]}
                  className="reject-btn"
                >
                   Отклонить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminManualRequests;