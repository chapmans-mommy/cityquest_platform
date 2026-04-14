const express = require('express');
const { getLeaderboard, getWeeklyLeaderboard } = require('../controllers/RatingController');

const router = express.Router();

/**
 * GET /api/leaderboard
 * @summary Получить глобальный рейтинг (топ-50 по очкам)
 * @tags Rating
 * @return {array<object>} 200 - массив пользователей с очками
 */
router.get('/leaderboard', getLeaderboard);

/**
 * GET /api/leaderboard/weekly
 * @summary Получить рейтинг за неделю (топ-10)
 * @tags Rating
 * @return {array<object>} 200 - массив пользователей с очками за неделю
 */
router.get('/leaderboard/weekly', getWeeklyLeaderboard);

module.exports = router;