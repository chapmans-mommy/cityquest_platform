const express = require('express');
const { startQuest, checkLocation, abortQuest, pauseQuest, resumeQuest } = require('../controllers/progressController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const Achievement = require('../models/Achievement');
const PlayerProgress = require('../models/PlayerProgress');
const Location = require('../models/Location');
const LocationCheck = require('../models/LocationCheck');
const User = require('../models/User');
const ManualCheckRequest = require('../models/ManualCheckRequest');
const pool = require('../db');

const router = express.Router();

/**
 * POST /api/quests/{questId}/start
 * @summary Начать прохождение квеста
 * @tags Progress
 * @security BearerAuth
 * @param {string} questId.path.required - ID квеста
 * @param {object} request.body.required
 * @param {string} request.body.difficulty.required - easy, medium или hard
 * @return {object} 201 - прогресс и первая локация
 * @return {object} 400 - квест уже начат или нет локаций
 * @return {object} 409 - квест переполнен
 */
router.post('/quests/:questId/start', protect, startQuest);

/**
 * POST /api/progress/{progressId}/check-location
 * @summary Отметиться на локации (GPS верификация)
 * @tags Progress
 * @security BearerAuth
 * @param {string} progressId.path.required - ID прогресса
 * @param {object} request.body.required
 * @param {number} request.body.locationId.required - ID локации
 * @param {number} request.body.latitude.required - текущая широта пользователя
 * @param {number} request.body.longitude.required - текущая долгота пользователя
 * @return {object} 200 - результат отметки
 * @return {object} 400 - слишком далеко или уже отмечено
 */
router.post('/progress/:progressId/check-location', protect, checkLocation);

/**
 * POST /api/progress/{progressId}/abort
 * @summary Прервать прохождение квеста
 * @tags Progress
 * @security BearerAuth
 * @param {string} progressId.path.required - ID прогресса
 * @return {object} 200 - сообщение о прерывании
 */
router.post('/progress/:progressId/abort', protect, abortQuest);

/**
 * POST /api/progress/{progressId}/pause
 * @summary Поставить квест на паузу (максимум 2 раза)
 * @tags Progress
 * @security BearerAuth
 * @param {string} progressId.path.required - ID прогресса
 * @return {object} 200 - сообщение о паузе
 */
router.post('/progress/:progressId/pause', protect, pauseQuest);

/**
 * POST /api/progress/{progressId}/resume
 * @summary Возобновить квест после паузы
 * @tags Progress
 * @security BearerAuth
 * @param {string} progressId.path.required - ID прогресса
 * @return {object} 200 - сообщение о возобновлении
 */
router.post('/progress/:progressId/resume', protect, resumeQuest);

/**
 * GET /api/user/achievements
 * @summary Получить достижения текущего пользователя
 * @tags User
 * @security BearerAuth
 * @return {array<object>} 200 - массив достижений
 */
router.get('/user/achievements', protect, async (req, res) => {
    try {
      const userId = req.user.id;
      const achievements = await Achievement.findByUserId(userId);
      res.json(achievements);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });
  
  /**
   * GET /api/user/completed-quests
   * @summary Получить пройденные квесты текущего пользователя
   * @tags User
   * @security BearerAuth
   * @return {array<object>} 200 - массив пройденных квестов
   */
  router.get('/user/completed-quests', protect, async (req, res) => {
    try {
      const userId = req.user.id;
      const query = `
        SELECT q.id, q.title, q.cover_image_url, p.total_points, p.completed_at
        FROM player_progress p
        JOIN quests q ON p.quest_id = q.id
        WHERE p.user_id = $1 AND p.status = 'completed'
        ORDER BY p.completed_at DESC
      `;
      const result = await pool.query(query, [userId]);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

/**
 * PUT /api/user/avatar
 * @summary Обновить аватар пользователя
 * @tags User
 * @security BearerAuth
 * @param {object} request.body.required
 * @param {string} request.body.avatar_url.required - ссылка на аватар
 * @return {object} 200 - обновлённый пользователь
 */
router.put('/user/avatar', protect, async (req, res) => {
    try {
      const userId = req.user.id;
      const { avatar_url } = req.body;
      
      const result = await pool.query(
        'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, email, nickname, role, avatar_url, total_points',
        [avatar_url, userId]
      );
      
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

  /**
 * POST /api/user/request-role-upgrade
 * @summary Отправить запрос на повышение роли до организатора
 * @tags User
 * @security BearerAuth
 * @return {object} 200 - сообщение об отправке
 */
router.post('/user/request-role-upgrade', protect, async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Проверяем, нет ли уже pending запроса
      const checkQuery = `
        SELECT * FROM role_requests 
        WHERE user_id = $1 AND status = 'pending'
      `;
      const checkResult = await pool.query(checkQuery, [userId]);
      
      if (checkResult.rows.length > 0) {
        return res.status(400).json({ error: 'Запрос уже отправлен' });
      }
      
      // Создаём таблицу для запросов, если её нет
      await pool.query(`
        CREATE TABLE IF NOT EXISTS role_requests (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          resolved_at TIMESTAMP
        )
      `);
      
      await pool.query(
        'INSERT INTO role_requests (user_id) VALUES ($1)',
        [userId]
      );
      
      res.json({ message: 'Запрос отправлен администратору' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });
  
  /**
   * GET /api/admin/role-requests
   * @summary Получить все запросы на смену роли
   * @tags Admin
   * @security BearerAuth
   */
  router.get('/admin/role-requests', protect, restrictTo('admin'), async (req, res) => {
    try {
      const query = `
        SELECT rr.*, u.nickname, u.email
        FROM role_requests rr
        JOIN users u ON rr.user_id = u.id
        WHERE rr.status = 'pending'
        ORDER BY rr.created_at ASC
      `;
      const result = await pool.query(query);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });
  
  /**
   * POST /api/admin/role-requests/:id/approve
   * @summary Одобрить запрос на смену роли
   * @tags Admin
   * @security BearerAuth
   */
  router.post('/admin/role-requests/:id/approve', protect, restrictTo('admin'), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Получаем запрос
      const requestResult = await pool.query(
        'SELECT user_id FROM role_requests WHERE id = $1',
        [id]
      );
      
      if (requestResult.rows.length === 0) {
        return res.status(404).json({ error: 'Запрос не найден' });
      }
      
      const userId = requestResult.rows[0].user_id;
      
      // Меняем роль пользователя
      await pool.query(
        'UPDATE users SET role = $1 WHERE id = $2',
        ['organizer', userId]
      );
      
      // Обновляем статус запроса
      await pool.query(
        'UPDATE role_requests SET status = $1, resolved_at = NOW() WHERE id = $2',
        ['approved', id]
      );
      
      res.json({ message: 'Роль пользователя изменена на организатора' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });
  
  /**
   * POST /api/admin/role-requests/:id/reject
   * @summary Отклонить запрос на смену роли
   * @tags Admin
   * @security BearerAuth
   */
  router.post('/admin/role-requests/:id/reject', protect, restrictTo('admin'), async (req, res) => {
    try {
      await pool.query(
        'UPDATE role_requests SET status = $1, resolved_at = NOW() WHERE id = $2',
        ['rejected', req.params.id]
      );
      res.json({ message: 'Запрос отклонён' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });

// Пользователь отправляет запрос на ручную отметку
router.post('/progress/:progressId/request-manual-check', protect, async (req, res) => {
    try {
      const { progressId } = req.params;
      const { locationId } = req.body;
      const userId = req.user.id;
  
      // Проверяем прогресс
      const progress = await PlayerProgress.findById(parseInt(progressId));
      if (!progress || progress.user_id !== userId) {
        return res.status(404).json({ error: 'Прогресс не найден' });
      }
      if (progress.status !== 'in_progress') {
        return res.status(400).json({ error: 'Квест уже завершён' });
      }
  
      // Проверяем, не отправлен ли уже запрос
      const existingRequest = await ManualCheckRequest.findByProgressAndLocation(progressId, locationId);
      if (existingRequest) {
        return res.status(400).json({ error: 'Запрос уже отправлен' });
      }
  
      // Получаем локацию
      const location = await Location.findById(parseInt(locationId));
      if (!location) {
        return res.status(404).json({ error: 'Локация не найдена' });
      }
  
      // Создаём запрос
      const request = await ManualCheckRequest.create({
        user_id: userId,
        progress_id: progressId,
        location_id: locationId,
        quest_id: location.quest_id
      });
  
      res.status(201).json({ 
        message: 'Запрос отправлен администратору', 
        requestId: request.id 
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });
  
  // Админ получает все запросы
  router.get('/admin/manual-requests', protect, restrictTo('admin'), async (req, res) => {
    try {
      const requests = await ManualCheckRequest.findAllPending();
      res.json(requests);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });
  
  // Админ одобряет запрос
  router.post('/admin/manual-requests/:id/approve', protect, restrictTo('admin'), async (req, res) => {
    try {
      const { id } = req.params;
      
      // Получаем запрос
      const requestQuery = 'SELECT * FROM manual_check_requests WHERE id = $1';
      const requestResult = await pool.query(requestQuery, [id]);
      
      if (requestResult.rows.length === 0) {
        return res.status(404).json({ error: 'Запрос не найден' });
      }
      
      const request = requestResult.rows[0];
      
      // Получаем локацию
      const location = await Location.findById(request.location_id);
      
      // Расчёт очков с учётом сложности
      const progress = await PlayerProgress.findById(request.progress_id);
      const multiplier = progress.chosen_difficulty === 'easy' ? 1 :
                         progress.chosen_difficulty === 'medium' ? 2 : 5;
      const pointsEarned = location.points_award * multiplier;
      
      // Создаём отметку
      await LocationCheck.create({
        progress_id: request.progress_id,
        location_id: request.location_id,
        verification_method: 'manual',
        hints_used_count: 0,
        time_spent_seconds: 0,
        points_earned: pointsEarned
      });
      
      // Обновляем очки в прогрессе
      await PlayerProgress.updatePoints(request.progress_id, pointsEarned);
      
      // Обновляем общий счёт пользователя
      await User.updateTotalPoints(request.user_id, pointsEarned);
      
      // Обновляем статус запроса
      await ManualCheckRequest.approve(parseInt(id), pointsEarned);
      
      // Проверяем, завершён ли квест
      const allLocations = await Location.findByQuestId(location.quest_id);
      const checkedLocations = await LocationCheck.findByProgressId(request.progress_id);
      
      if (checkedLocations.length === allLocations.length) {
        await PlayerProgress.complete(request.progress_id, progress.total_points + pointsEarned);
        const newAchievements = await Achievement.checkAndGrantAll(request.user_id);
        
        return res.json({
          message: 'Квест завершён!',
          pointsEarned,
          completed: true,
          earnedAchievements: newAchievements
        });
      }
      
      res.json({
        message: 'Отметка подтверждена',
        pointsEarned,
        completed: false
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });
  
  // Админ отклоняет запрос
  router.post('/admin/manual-requests/:id/reject', protect, restrictTo('admin'), async (req, res) => {
    try {
      const { id } = req.params;
      await ManualCheckRequest.reject(parseInt(id));
      res.json({ message: 'Запрос отклонён' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  });  

module.exports = router;