const pool = require('../db');

class Review {
  static async create({ quest_id, user_id, rating, comment }) {
    const query = `
      INSERT INTO reviews (quest_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [quest_id, user_id, rating, comment];
    const result = await pool.query(query, values);
    
    // Обновляем средний рейтинг квеста
    await this.updateQuestAvgRating(quest_id);
    
    return result.rows[0];
  }
  
  static async findByQuestId(questId) {
    const query = `
      SELECT r.*, u.nickname
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.quest_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await pool.query(query, [questId]);
    return result.rows;
  }
  
  static async updateQuestAvgRating(questId) {
    const query = `
      UPDATE quests
      SET avg_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM reviews
        WHERE quest_id = $1
      )
      WHERE id = $1
    `;
    await pool.query(query, [questId]);
  }
  
  static async delete(id, userId, userRole) {
    // Проверка прав
    const checkQuery = 'SELECT user_id, quest_id FROM reviews WHERE id = $1';
    const checkResult = await pool.query(checkQuery, [id]);
    if (checkResult.rows.length === 0) return null;
    
    const review = checkResult.rows[0];
    if (review.user_id !== userId && userRole !== 'admin') {
      return { error: 'Недостаточно прав' };
    }
    
    const deleteQuery = 'DELETE FROM reviews WHERE id = $1 RETURNING quest_id';
    const deleteResult = await pool.query(deleteQuery, [id]);
    
    // Обновляем средний рейтинг
    await this.updateQuestAvgRating(deleteResult.rows[0].quest_id);
    
    return { success: true };
  }
}

module.exports = Review;