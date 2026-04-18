const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const pool = require('../db');
const AuditLog = require('../models/AuditLog');

const router = express.Router();

/**
 * GET /api/admin/users
 * @summary Получить список всех пользователей (только админ)
 * @tags Admin
 * @security BearerAuth
 * @return {array<object>} 200 - массив пользователей
 */
router.get('/users', protect, restrictTo('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, nickname, role, total_points, created_at FROM users ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

/**
 * PUT /api/admin/users/{id}/role
 * @summary Сменить роль пользователя (только админ)
 * @tags Admin
 * @security BearerAuth
 * @param {string} id.path.required - ID пользователя
 * @param {object} request.body.required
 * @param {string} request.body.role.required - новая роль (player/organizer/admin)
 * @return {object} 200 - обновлённый пользователь
 */
router.put('/users/:id/role', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['player', 'organizer', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Неверная роль' });
    }
    
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, nickname, role',
      [role, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

/**
 * GET /api/admin/logs
 * @summary Получить список логов аудита (только админ)
 * @tags Admin
 * @security BearerAuth
 * @param {number} limit.query - количество записей (по умолчанию 100)
 * @param {number} offset.query - смещение для пагинации
 * @return {array<object>} 200 - массив логов
 */
router.get('/logs', protect, restrictTo('admin'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const logs = await AuditLog.findAll({ limit, offset });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.get('/quests/pending', protect, restrictTo('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT q.*, u.nickname as author_name FROM quests q LEFT JOIN users u ON q.author_id = u.id WHERE q.status = 'pending'"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/quests/:id/moderate', protect, restrictTo('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('Модерация квеста:', { id, status });
    
    // Проверка допустимого статуса
    if (!['published', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус. Допустимые значения: published, rejected' });
    }
    
    // Проверяем, существует ли квест
    const checkQuest = await pool.query(
      'SELECT id, title, status FROM quests WHERE id = $1',
      [id]
    );
    
    if (checkQuest.rows.length === 0) {
      return res.status(404).json({ error: 'Квест не найден' });
    }
    
    // Обновляем статус квеста
    const result = await pool.query(
      'UPDATE quests SET status = $1 WHERE id = $2 RETURNING id, title, status',
      [status, id]
    );
    
    const statusText = status === 'published' ? 'опубликован' : 'отклонён';
    
    res.json({ 
      message: `Квест "${checkQuest.rows[0].title}" ${statusText}`, 
      quest: result.rows[0] 
    });
  } catch (err) {
    console.error('Ошибка модерации:', err);
    res.status(500).json({ error: 'Ошибка сервера при модерации' });
  }
});

module.exports = router;