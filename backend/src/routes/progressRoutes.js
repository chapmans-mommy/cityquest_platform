const express = require('express');
const { startQuest, checkLocation, abortQuest } = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

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



module.exports = router;