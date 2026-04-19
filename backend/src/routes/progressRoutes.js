const express = require('express');
const { startQuest, checkLocation, abortQuest, pauseQuest, resumeQuest } = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');
const Achievement = require('../models/Achievement');
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

module.exports = router;