const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;





/**
 * POST /api/auth/register
 * @summary Регистрация нового пользователя
 * @tags Auth
 * @param {object} request.body.required - данные пользователя
 * @param {string} request.body.email.required - email пользователя
 * @param {string} request.body.password.required - пароль (минимум 6 символов)
 * @param {string} request.body.nickname.required - никнейм
 * @return {object} 201 - токен и данные пользователя
 * @return {object} 400 - ошибка валидации
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * @summary Вход пользователя
 * @tags Auth
 * @param {object} request.body.required - учётные данные
 * @param {string} request.body.email.required - email
 * @param {string} request.body.password.required - пароль
 * @return {object} 200 - токен и данные пользователя
 * @return {object} 401 - неверный email или пароль
 */
router.post('/login', login);

/**
 * GET /api/auth/me
 * @summary Получить данные текущего пользователя
 * @tags Auth
 * @security BearerAuth
 * @return {object} 200 - данные пользователя
 * @return {object} 401 - не авторизован
 */
router.get('/me', protect, getMe);

module.exports = router;