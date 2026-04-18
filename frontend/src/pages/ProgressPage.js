import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questsAPI } from '../services/api';
import QuestMap from '../components/QuestMap';

const ProgressPage = () => {
  const { id, progressId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [nextLocation, setNextLocation] = useState(null);
  const [allLocations, setAllLocations] = useState([]);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
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
      // Загружаем квест с локациями
      const questRes = await questsAPI.getById(id);
      const locations = questRes.data.locations;
      setAllLocations(locations);
      
      // Первая локация (порядок 1)
      const firstLocation = locations.find(l => l.order_number === 1);
      setCurrentLocation(firstLocation);
      
      // Запоминаем время старта для таймера
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
        alert(`Квест завершён! Получено очков: ${res.data.totalPoints}`);
        navigate(`/quest/${id}`);
      } else {
        setPointsEarned(res.data.pointsEarned);
        setTotalPoints(res.data.totalPoints);
        setNextLocation(res.data.nextLocation);
        
        // Переход к следующей локации
        setCurrentLocation(res.data.nextLocation);
        startTimeRef.current = Date.now(); // Сброс таймера для новой локации
        
        alert(`Отмечено! +${res.data.pointsEarned} очков`);
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
      alert('Квест поставлен на паузу');
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка паузы');
    }
  };

  const handleResume = async () => {
    try {
      await questsAPI.resume(progressId);
      setIsPaused(false);
      alert('Квест возобновлён');
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

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Загрузка...</div>;
  if (completed) return <div style={{ textAlign: 'center', padding: '50px' }}>Квест завершён! Перенаправление...</div>;

  const currentLocationNumber = currentLocation?.order_number || 0;
  const totalLocations = allLocations.length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <button 
        onClick={handleAbort}
        style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '4px' }}
      >
        Прервать квест
      </button>
      
      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Прогресс: локация {currentLocationNumber} из {totalLocations}</h2>
        <p>Текущие очки: {totalPoints}</p>
        {timeLeft !== null && !isPaused && (
          <p>Осталось времени: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p>
        )}
        {isPaused && <p style={{ color: 'orange' }}>Квест на паузе</p>}
        <div>
          <button 
            onClick={isPaused ? handleResume : handlePause}
            disabled={pauseCount >= 2}
            style={{ padding: '8px 16px', marginRight: '10px', cursor: 'pointer' }}
          >
            {isPaused ? 'Возобновить' : 'Пауза'} ({pauseCount}/2)
          </button>
        </div>
      </div>
      
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ddd' }}>
        <h3>Текущая локация: {currentLocation?.name}</h3>
        <p>{currentLocation?.description}</p>
        {currentLocation?.hint_text && (
          <p style={{ color: '#666', fontStyle: 'italic' }}>Подсказка: {currentLocation.hint_text}</p>
        )}
        <p>Очки за эту локацию: {currentLocation?.points_award}</p>
      </div>
      
      <QuestMap locations={allLocations} />
      
      <button 
        onClick={handleCheckLocation}
        disabled={checking || isPaused}
        style={{
          marginTop: '20px',
          padding: '12px 24px',
          fontSize: '18px',
          cursor: (checking || isPaused) ? 'not-allowed' : 'pointer',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          width: '100%'
        }}
      >
        {checking ? 'Проверка...' : 'Отметиться на локации'}
      </button>
      
      {nextLocation && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#e8f5e9', borderRadius: '8px' }}>
          <h4>Следующая локация: {nextLocation.name}</h4>
          <p>{nextLocation.description}</p>
        </div>
      )}
    </div>
  );
};

export default ProgressPage;