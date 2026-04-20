import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import './RoleRequests.css';

const RoleRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const res = await adminAPI.getRoleRequests();
      setRequests(res.data);
    } catch (err) {
      console.error('Ошибка загрузки:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setProcessing(prev => ({ ...prev, [id]: true }));
    try {
      await adminAPI.approveRoleRequest(id);
      alert('Роль изменена на организатора');
      loadRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка');
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id) => {
    setProcessing(prev => ({ ...prev, [id]: true }));
    try {
      await adminAPI.rejectRoleRequest(id);
      alert('Запрос отклонён');
      loadRequests();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка');
    } finally {
      setProcessing(prev => ({ ...prev, [id]: false }));
    }
  };

  if (loading) return <div className="requests-loading">Загрузка...</div>;

  return (
    <div className="role-requests">
      
      
      {requests.length === 0 ? (
        <p className="requests-empty">Нет активных запросов</p>
      ) : (
        <div className="requests-list">
          {requests.map(req => (
            <div key={req.id} className="request-card">
              <div className="request-info">
                <div className="request-user">{req.nickname}</div>
                <div className="request-email">{req.email}</div>
                <div className="request-time">
                  {new Date(req.created_at).toLocaleString()}
                </div>
              </div>
              <div className="request-actions">
                <button 
                  onClick={() => handleApprove(req.id)}
                  disabled={processing[req.id]}
                  className="approve-btn"
                >
                  Одобрить
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

export default RoleRequests;