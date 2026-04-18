const express = require('express');
const {
  getAllQuests,
  getQuestById,
  createQuest,
  updateQuest,
  deleteQuest,
  publishQuest,
  moderateQuest,
  addLocation,
  updateLocation,
  deleteLocation,
  reorderLocations,
  getMyQuests
} = require('../controllers/questController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// ========== ПУБЛИЧНЫЕ МАРШРУТЫ (НЕ ТРЕБУЮТ АВТОРИЗАЦИИ) ==========
/**
 * GET /api/quests
 * @summary Получить список всех опубликованных квестов
 * @tags Quests
 * @param {string} search.query - поиск по названию или описанию
 * @return {array<object>} 200 - массив квестов
 */
router.get('/', getAllQuests);

router.get('/my', protect, getMyQuests);

// ========== МАРШРУТЫ ДЛЯ ЛОКАЦИЙ (ДОЛЖНЫ БЫТЬ ПЕРЕД /:id) ==========
/**
 * POST /api/quests/{questId}/locations
 * @summary Добавить локацию к квесту (только автор или админ)
 * @tags Locations
 * @security BearerAuth
 * @param {string} questId.path.required - ID квеста
 * @param {object} request.body.required - данные локации
 * @param {string} request.body.name.required - название локации
 * @param {string} request.body.description - описание
 * @param {number} request.body.latitude.required - широта
 * @param {number} request.body.longitude.required - долгота
 * @param {number} request.body.points_award - очки за отметку (по умолчанию 10)
 * @param {string} request.body.hint_text - подсказка
 * @return {object} 201 - созданная локация
 */
router.post('/:questId/locations', protect, addLocation);

/**
 * PUT /api/quests/{questId}/locations/reorder
 * @summary Изменить порядок локаций (только автор или админ)
 * @tags Locations
 * @security BearerAuth
 * @param {string} questId.path.required - ID квеста
 * @param {object} request.body.required - массив локаций с новыми order_number
 * @param {array} request.body.locations.required - [{id, order_number}]
 * @return {object} 200 - сообщение об обновлении
 */
router.put('/:questId/locations/reorder', protect, reorderLocations);

/**
 * PUT /api/locations/{id}
 * @summary Обновить локацию (только автор квеста или админ)
 * @tags Locations
 * @security BearerAuth
 * @param {string} id.path.required - ID локации
 * @param {object} request.body - обновляемые поля
 * @return {object} 200 - обновлённая локация
 */
router.put('/locations/:id', protect, updateLocation);

/**
 * DELETE /api/locations/{id}
 * @summary Удалить локацию (только автор квеста или админ)
 * @tags Locations
 * @security BearerAuth
 * @param {string} id.path.required - ID локации
 * @return {object} 200 - сообщение об удалении
 */
router.delete('/locations/:id', protect, deleteLocation);

// ========== МАРШРУТЫ ДЛЯ КВЕСТОВ (С ПАРАМЕТРОМ :id) ==========
/**
 * GET /api/quests/{id}
 * @summary Получить квест по ID с его локациями
 * @tags Quests
 * @param {string} id.path.required - ID квеста
 * @return {object} 200 - данные квеста
 * @return {object} 404 - квест не найден
 */
router.get('/:id', getQuestById);

/**
 * POST /api/quests
 * @summary Создать новый квест (только организатор или админ)
 * @tags Quests
 * @security BearerAuth
 * @param {object} request.body.required - данные квеста
 * @param {string} request.body.title.required - название
 * @param {string} request.body.description - описание
 * @param {string} request.body.cover_image_url - ссылка на обложку
 * @return {object} 201 - созданный квест
 * @return {object} 403 - недостаточно прав
 */
router.post('/', protect, restrictTo('organizer', 'admin'), createQuest);

/**
 * PUT /api/quests/{id}
 * @summary Обновить квест (только автор или админ)
 * @tags Quests
 * @security BearerAuth
 * @param {string} id.path.required - ID квеста
 * @param {object} request.body - обновляемые поля
 * @return {object} 200 - обновлённый квест
 * @return {object} 403 - недостаточно прав
 * @return {object} 404 - квест не найден
 */
router.put('/:id', protect, updateQuest);

/**
 * DELETE /api/quests/{id}
 * @summary Удалить квест (только автор или админ)
 * @tags Quests
 * @security BearerAuth
 * @param {string} id.path.required - ID квеста
 * @return {object} 200 - сообщение об удалении
 * @return {object} 403 - недостаточно прав
 * @return {object} 404 - квест не найден
 */
router.delete('/:id', protect, deleteQuest);

/**
 * POST /api/quests/{id}/publish
 * @summary Отправить квест на модерацию (только автор)
 * @tags Quests
 * @security BearerAuth
 * @param {string} id.path.required - ID квеста
 * @return {object} 200 - квест отправлен на модерацию
 * @return {object} 400 - квест без локаций нельзя опубликовать
 * @return {object} 403 - недостаточно прав
 */
router.post('/:id/publish', protect, publishQuest);

/**
 * POST /api/quests/{id}/moderate
 * @summary Одобрить или отклонить квест (только админ)
 * @tags Quests
 * @security BearerAuth
 * @param {string} id.path.required - ID квеста
 * @param {object} request.body.required - статус
 * @param {string} request.body.status.required - 'published' или 'rejected'
 * @return {object} 200 - статус обновлён
 * @return {object} 403 - недостаточно прав
 */
router.post('/:id/moderate', protect, restrictTo('admin'), moderateQuest);

module.exports = router;