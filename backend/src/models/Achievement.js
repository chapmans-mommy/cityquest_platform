const pool = require('../db');

class Achievement {
  static async findAll() {
    const query = 'SELECT * FROM achievements ORDER BY id';
    const result = await pool.query(query);
    return result.rows;
  }

  static async findByUserId(userId) {
    const query = `
      SELECT a.*, ua.earned_at
      FROM achievements a
      JOIN user_achievements ua ON a.id = ua.achievement_id
      WHERE ua.user_id = $1
      ORDER BY ua.earned_at ASC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async grant(userId, achievementId) {
    const checkQuery = `
      SELECT * FROM user_achievements
      WHERE user_id = $1 AND achievement_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [userId, achievementId]);
    
    if (checkResult.rows.length > 0) {
      return null;
    }
    
    const insertQuery = `
      INSERT INTO user_achievements (user_id, achievement_id)
      VALUES ($1, $2)
      RETURNING *
    `;
    const insertResult = await pool.query(insertQuery, [userId, achievementId]);
    
    const achievementQuery = 'SELECT bonus_points FROM achievements WHERE id = $1';
    const achievementResult = await pool.query(achievementQuery, [achievementId]);
    const bonusPoints = achievementResult.rows[0].bonus_points;
    
    if (bonusPoints > 0) {
      const updatePointsQuery = `
        UPDATE users
        SET total_points = total_points + $1
        WHERE id = $2
      `;
      await pool.query(updatePointsQuery, [bonusPoints, userId]);
    }
    
    return insertResult.rows[0];
  }
}

module.exports = Achievement;