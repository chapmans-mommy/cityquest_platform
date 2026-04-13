const pool = require('../db');

class PlayerProgress {
  static async create({ user_id, quest_id, chosen_difficulty }) {
    const query = `
      INSERT INTO player_progress (user_id, quest_id, chosen_difficulty, status)
      VALUES ($1, $2, $3, 'in_progress')
      RETURNING *
    `;
    const values = [user_id, quest_id, chosen_difficulty];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findActiveByUserAndQuest(userId, questId) {
    const query = `
      SELECT * FROM player_progress
      WHERE user_id = $1 AND quest_id = $2 AND status = 'in_progress'
    `;
    const result = await pool.query(query, [userId, questId]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = `
      SELECT * FROM player_progress
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updatePoints(id, pointsToAdd) {
    const query = `
      UPDATE player_progress
      SET total_points = total_points + $1
      WHERE id = $2
      RETURNING total_points
    `;
    const result = await pool.query(query, [pointsToAdd, id]);
    return result.rows[0].total_points;
  }

  static async complete(id, finalPoints) {
    const query = `
      UPDATE player_progress
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP, total_points = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [finalPoints, id]);
    return result.rows[0];
  }

  static async abort(id) {
    const query = `
      UPDATE player_progress
      SET status = 'aborted'
      WHERE id = $1
      RETURNING id
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getActivePlayersCount(questId) {
    const query = `
      SELECT COUNT(*) as count
      FROM player_progress
      WHERE quest_id = $1 AND status = 'in_progress'
    `;
    const result = await pool.query(query, [questId]);
    return parseInt(result.rows[0].count);
  }

  static async addPause(id) {
    const query = `
      UPDATE player_progress
      SET pause_count_used = pause_count_used + 1
      WHERE id = $1
      RETURNING pause_count_used
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0].pause_count_used;
  }
}

module.exports = PlayerProgress;