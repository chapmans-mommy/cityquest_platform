const PlayerProgress = require('../models/PlayerProgress');
const LocationCheck = require('../models/LocationCheck');
const Quest = require('../models/Quest');
const Location = require('../models/Location');
const User = require('../models/User');
const Achievement = require('../models/Achievement');

// Функция расчёта расстояния между координатами (в метрах)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Настройки сложности
const difficultySettings = {
  easy: { timeLimit: null, pointsMultiplier: 1, requiresQr: false },
  medium: { timeLimit: 600, pointsMultiplier: 2, requiresQr: false },
  hard: { timeLimit: 300, pointsMultiplier: 5, requiresQr: false }
};

const startQuest = async (req, res) => {
  try {
    const { questId } = req.params;
    const { difficulty } = req.body;
    const userId = req.user.id;
    
    if (!difficulty || !difficultySettings[difficulty]) {
      return res.status(400).json({ error: 'Выберите сложность: easy, medium или hard' });
    }
    
    // Проверка, не начат ли уже квест
    const activeProgress = await PlayerProgress.findActiveByUserAndQuest(userId, parseInt(questId));
    if (activeProgress) {
      return res.status(400).json({ error: 'Вы уже начали этот квест' });
    }
    
    // Проверка лимита игроков
    const activeCount = await PlayerProgress.getActivePlayersCount(parseInt(questId));
    const quest = await Quest.findById(parseInt(questId));
    if (activeCount >= (quest.max_concurrent_players || 5)) {
      return res.status(409).json({ error: 'Квест переполнен, попробуйте позже' });
    }
    
    // Создание прогресса
    const progress = await PlayerProgress.create({
      user_id: userId,
      quest_id: parseInt(questId),
      chosen_difficulty: difficulty
    });
    
    // Получение первой локации
    const locations = await Location.findByQuestId(parseInt(questId));
    if (locations.length === 0) {
      return res.status(400).json({ error: 'У квеста нет локаций' });
    }
    
    res.status(201).json({
      progressId: progress.id,
      difficulty: progress.chosen_difficulty,
      timeLimit: difficultySettings[difficulty].timeLimit,
      currentLocation: locations[0],
      totalLocations: locations.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const checkLocation = async (req, res) => {
  try {
    const { progressId } = req.params;
    const { locationId, latitude, longitude } = req.body;
    
    // Получаем прогресс
    const progress = await PlayerProgress.findById(parseInt(progressId));
    if (!progress) {
      return res.status(404).json({ error: 'Прогресс не найден' });
    }
    if (progress.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Это не ваш прогресс' });
    }
    if (progress.status !== 'in_progress') {
      return res.status(400).json({ error: 'Квест уже завершён или прерван' });
    }
    
    // Проверка, не отмечена ли уже эта локация
    const alreadyChecked = await LocationCheck.isLocationChecked(parseInt(progressId), parseInt(locationId));
    if (alreadyChecked) {
      return res.status(400).json({ error: 'Эта локация уже отмечена' });
    }
    
    // Получаем данные локации
    const location = await Location.findById(parseInt(locationId));
    if (!location) {
      return res.status(404).json({ error: 'Локация не найдена' });
    }
    
    // GPS проверка
    const distance = getDistance(latitude, longitude, location.latitude, location.longitude);
    if (distance > 100) {
      return res.status(400).json({ error: `Вы слишком далеко от локации (${Math.round(distance)} м). Нужно быть в радиусе 100 м.` });
    }
    
    // Расчёт очков с учётом сложности
    const multiplier = difficultySettings[progress.chosen_difficulty].pointsMultiplier;
    let pointsEarned = location.points_award * multiplier;
    
    // Создание отметки
    await LocationCheck.create({
      progress_id: parseInt(progressId),
      location_id: parseInt(locationId),
      verification_method: 'gps',
      hints_used_count: 0,
      time_spent_seconds: 0
    });
    
    // Обновление очков в прогрессе
    const newTotalPoints = await PlayerProgress.updatePoints(parseInt(progressId), pointsEarned);
    
    // Получаем все локации квеста
    const allLocations = await Location.findByQuestId(location.quest_id);
    const checkedLocations = await LocationCheck.findByProgressId(parseInt(progressId));
    
    // Проверка, последняя ли локация
    if (checkedLocations.length === allLocations.length) {
      // Завершение квеста
      await PlayerProgress.complete(parseInt(progressId), newTotalPoints);
      
      // Обновление общего счёта пользователя
      await User.updateTotalPoints(progress.user_id, pointsEarned);
      
      // Проверка достижений (упрощённо)
      const achievements = await Achievement.findAll();
      const userAchievements = await Achievement.findByUserId(progress.user_id);
      const earnedAchievements = [];
      
      for (const ach of achievements) {
        const alreadyHas = userAchievements.some(ua => ua.id === ach.id);
        if (!alreadyHas) {
          if (ach.condition_type === 'total_points' && newTotalPoints >= parseInt(ach.condition_value)) {
            await Achievement.grant(progress.user_id, ach.id);
            earnedAchievements.push(ach.name);
          }
        }
      }
      
      return res.json({
        message: 'Квест завершён!',
        totalPoints: newTotalPoints,
        earnedAchievements,
        completed: true
      });
    }
    
    // Получаем следующую локацию
    const nextLocation = allLocations.find(l => l.order_number === checkedLocations.length + 1);
    
    res.json({
      message: 'Локация отмечена!',
      pointsEarned,
      totalPoints: newTotalPoints,
      nextLocation,
      completed: false
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const abortQuest = async (req, res) => {
  try {
    const { progressId } = req.params;
    
    const progress = await PlayerProgress.findById(parseInt(progressId));
    if (!progress) {
      return res.status(404).json({ error: 'Прогресс не найден' });
    }
    if (progress.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет прав' });
    }
    
    await PlayerProgress.abort(parseInt(progressId));
    res.json({ message: 'Квест прерван' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const pauseQuest = async (req, res) => {
    try {
      const { progressId } = req.params;
      
      const progress = await PlayerProgress.findById(parseInt(progressId));
      if (!progress) {
        return res.status(404).json({ error: 'Прогресс не найден' });
      }
      if (progress.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Это не ваш прогресс' });
      }
      if (progress.status !== 'in_progress') {
        return res.status(400).json({ error: 'Квест нельзя поставить на паузу' });
      }
      
      // Проверка лимита пауз (максимум 2)
      if (progress.pause_count_used >= 2) {
        return res.status(400).json({ error: 'Использовано максимальное количество пауз (2)' });
      }
      
      await PlayerProgress.addPause(parseInt(progressId));
      await PlayerProgress.togglePause(parseInt(progressId), true);
      
      res.json({ message: 'Квест поставлен на паузу', pauseCount: progress.pause_count_used + 1 });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  };
  
  const resumeQuest = async (req, res) => {
    try {
      const { progressId } = req.params;
      
      const progress = await PlayerProgress.findById(parseInt(progressId));
      if (!progress) {
        return res.status(404).json({ error: 'Прогресс не найден' });
      }
      if (progress.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Это не ваш прогресс' });
      }
      if (progress.status !== 'paused') {
        return res.status(400).json({ error: 'Квест не на паузе' });
      }
      
      await PlayerProgress.togglePause(parseInt(progressId), false);
      
      res.json({ message: 'Квест возобновлён' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  };

  module.exports = {
    startQuest,
    checkLocation,
    abortQuest,
    pauseQuest,
    resumeQuest
  };