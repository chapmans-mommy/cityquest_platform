import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questsAPI } from '../services/api';
import QuestMap from '../components/QuestMap';
import './ProgressPage.css';
import { progressAPI } from '../services/api';

const ProgressPage = () => {
  const { id, progressId } = useParams();
  const navigate = useNavigate();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nextLocation, setNextLocation] = useState(null);
  const [allLocations, setAllLocations] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [difficulty, setDifficulty] = useState('easy');
  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && !isPaused && !completed) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [timeLeft, isPaused, completed]);

  const loadProgress = async () => {
    try {
      const questRes = await questsAPI.getById(id);
      const locations = questRes.data.locations;
      setAllLocations(locations);
      const firstLocation = locations.find(l => l.order_number === 1);
      setCurrentLocation(firstLocation);
      startTimeRef.current = Date.now();
      setLoading(false);
    } catch (err) {
      console.error('Ошибка загрузки прогресса:', err);
      navigate(`/quest/${id}`);
    }
  };

  const getTimeSpent = () => {
    if (!startTimeRef.current) return 0;
    return Math.floor((Date.now() - startTimeRef.current) / 1000);
  };

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Геолокация не поддерживается'));
      }
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  const handleCheckLocation = async () => {
    if (checking || completed) return;
    setChecking(true);
    try {
      const position = await getCurrentPosition();
      const timeSpent = getTimeSpent();
      const res = await questsAPI.checkLocation(
        progressId,
        currentLocation.id,
        position.coords.latitude,
        position.coords.longitude,
        timeSpent
      );
      
      if (res.data.completed) {
        setCompleted(true);
        setTotalPoints(res.data.totalPoints);
        setTimeout(() => {
          navigate(`/quest/${id}`);
        }, 2000);
      } else {
        setTotalPoints(res.data.totalPoints);
        setNextLocation(res.data.nextLocation);
        setCurrentLocation(res.data.nextLocation);
        startTimeRef.current = Date.now();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка отметки');
    } finally {
      setChecking(false);
    }
  };

  const handlePause = async () => {
    try {
      await questsAPI.pause(progressId);
      setIsPaused(true);
      setPauseCount(prev => prev + 1);
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка паузы');
    }
  };

  const handleResume = async () => {
    try {
      await questsAPI.resume(progressId);
      setIsPaused(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка возобновления');
    }
  };

  const handleAbort = async () => {
    if (window.confirm('Вы уверены, что хотите прервать квест?')) {
      try {
        await questsAPI.abort(progressId);
        navigate(`/quest/${id}`);
      } catch (err) {
        alert(err.response?.data?.error || 'Ошибка прерывания');
      }
    }
  };

  const [requestSent, setRequestSent] = useState(false);

const handleRequestManualCheck = async () => {
  if (requestSent) return;
  
  try {
    await progressAPI.requestManualCheck(progressId, currentLocation.id);
    setRequestSent(true);
    alert('Запрос отправлен администратору. Ожидайте подтверждения.');
  } catch (err) {
    alert(err.response?.data?.error || 'Ошибка отправки запроса');
  }
};

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
    </div>
  );
  
  if (completed) return (
    <div className="completion-screen">
      <div className="completion-card">
        <div className="completion-icon">🎉</div>
        <h2>Квест завершён!</h2>
        <p>Вы набрали {totalPoints} очков</p>
        <button onClick={() => navigate(`/quest/${id}`)} className="completion-btn">
          Вернуться к квесту
        </button>
      </div>
    </div>
  );

  const currentLocationNumber = currentLocation?.order_number || 0;
  const totalLocations = allLocations.length;

  return (
    <div className="progress-container">
      <div className="progress-header">
        <button onClick={handleAbort} className="abort-btn">
          Прервать квест
        </button>
        <div className="progress-stats">
          <div className="stat-badge">
            <span className="stat-label">Локация</span>
            <span className="stat-value">{currentLocationNumber}/{totalLocations}</span>
          </div>
          <div className="stat-badge">
            <span className="stat-label">Очки</span>
            <span className="stat-value">{totalPoints}</span>
          </div>
        </div>
      </div>
      
      <div className="current-location-card">
        <h2 className="location-name">{currentLocation?.name}</h2>
        <p className="location-description">{currentLocation?.description}</p>
        {currentLocation?.hint_text && (
          <div className="hint-box">
            <span className="hint-icon"></span>
            <span className="hint-text">{currentLocation.hint_text}</span>
          </div>
        )}
        <div className="location-points">
           {currentLocation?.points_award} очков
        </div>
      </div>
      
      <div className="progress-controls">
        {!isPaused ? (
          <button 
            onClick={handlePause}
            disabled={pauseCount >= 2}
            className="pause-btn"
          >
            ⏸ Пауза ({pauseCount}/2)
          </button>
        ) : (
          <button onClick={handleResume} className="resume-btn">
            ▶ Возобновить
          </button>
        )}
        <button 
          onClick={handleCheckLocation}
          disabled={checking || isPaused}
          className="checkin-btn"
        >
          {checking ? 'Проверка...' : 'Отметиться на локации по GPS'}
        </button>

        <button 
            onClick={handleRequestManualCheck}
            disabled={requestSent || checking || isPaused}
            className="manual-request-btn"
            >
            {requestSent ? ' Запрос отправлен' : ' Отметиться через администратора'}
        </button>
      </div>
      
      <div className="map-container">
        <h3 className="map-title">Карта маршрута</h3>
        <QuestMap locations={allLocations} />
      </div>
      
      {nextLocation && (
        <div className="next-location-card">
          <h4>Следующая локация</h4>
          <p className="next-location-name">{nextLocation.name}</p>
          <p className="next-location-desc">{nextLocation.description}</p>
        </div>
      )}
    </div>
  );
};

export default ProgressPage;