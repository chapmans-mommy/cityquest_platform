const pool = require('../db');
const Review = require('../models/Review');
const PlayerProgress = require('../models/PlayerProgress');

const getReviewsByQuest = async (req, res) => {
  try {
    const { questId } = req.params;
    const reviews = await Review.findByQuestId(parseInt(questId));
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const createReview = async (req, res) => {
  try {
    const { questId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Оценка должна быть от 1 до 5' });
    }
    
    // Проверка, что пользователь прошёл квест
    const progressQuery = `
      SELECT * FROM player_progress
      WHERE user_id = $1 AND quest_id = $2 AND status = 'completed'
    `;
    const progressResult = await pool.query(progressQuery, [userId, questId]);
    if (progressResult.rows.length === 0) {
      return res.status(400).json({ error: 'Отзыв можно оставить только после прохождения квеста' });
    }
    
    const review = await Review.create({
      quest_id: parseInt(questId),
      user_id: userId,
      rating,
      comment
    });
    
    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Review.delete(parseInt(id), req.user.id, req.user.role);
    
    if (!result) {
      return res.status(404).json({ error: 'Отзыв не найден' });
    }
    if (result.error) {
      return res.status(403).json({ error: result.error });
    }
    
    res.json({ message: 'Отзыв удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

module.exports = { getReviewsByQuest, createReview, deleteReview };