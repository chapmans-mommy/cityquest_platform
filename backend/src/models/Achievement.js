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

  static async checkAndGrantAll(userId) {
    // Получаем статистику пользователя
    const userQuery = 'SELECT total_points FROM users WHERE id = $1';
    const userResult = await pool.query(userQuery, [userId]);
    const totalPoints = userResult.rows[0].total_points;
    
    // Считаем количество пройденных квестов
    const questsQuery = `
      SELECT COUNT(*) as count 
      FROM player_progress 
      WHERE user_id = $1 AND status = 'completed'
    `;
    const questsResult = await pool.query(questsQuery, [userId]);
    const completedQuests = parseInt(questsResult.rows[0].count);
    
    // Получаем все достижения
    const achievements = await Achievement.findAll();
    
    // Получаем уже выданные достижения
    const userAchievements = await Achievement.findByUserId(userId);
    const earnedIds = userAchievements.map(a => a.id);
    
    const newlyGranted = [];
    
    for (const ach of achievements) {
      if (earnedIds.includes(ach.id)) continue;
      
      let conditionMet = false;
      if (ach.condition_type === 'total_points') {
        conditionMet = totalPoints >= parseInt(ach.condition_value);
      } else if (ach.condition_type === 'quests_completed') {
        conditionMet = completedQuests >= parseInt(ach.condition_value);
      }
      
      if (conditionMet) {
        await Achievement.grant(userId, ach.id);
        newlyGranted.push(ach.name);
      }
    }
    return newlyGranted;
  }
}

module.exports = Achievement;