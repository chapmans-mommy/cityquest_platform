const express = require('express');
const { getReviewsByQuest, createReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/quests/{questId}/reviews
 * @summary Получить все отзывы квеста
 * @tags Reviews
 * @param {string} questId.path.required - ID квеста
 * @return {array<object>} 200 - массив отзывов
 */
router.get('/quests/:questId/reviews', getReviewsByQuest);

/**
 * POST /api/quests/{questId}/reviews
 * @summary Оставить отзыв о квесте (только после прохождения)
 * @tags Reviews
 * @security BearerAuth
 * @param {string} questId.path.required - ID квеста
 * @param {object} request.body.required
 * @param {number} request.body.rating.required - оценка от 1 до 5
 * @param {string} request.body.comment - текст отзыва
 * @return {object} 201 - созданный отзыв
 * @return {object} 400 - квест не пройден или неверная оценка
 */
router.post('/quests/:questId/reviews', protect, createReview);

/**
 * DELETE /api/reviews/{id}
 * @summary Удалить отзыв (только автор или админ)
 * @tags Reviews
 * @security BearerAuth
 * @param {string} id.path.required - ID отзыва
 * @return {object} 200 - сообщение об удалении
 * @return {object} 403 - недостаточно прав
 * @return {object} 404 - отзыв не найден
 */
router.delete('/reviews/:id', protect, deleteReview);

module.exports = router;