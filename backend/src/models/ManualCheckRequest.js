const pool = require('../db');

class ManualCheckRequest {
  static async create({ user_id, progress_id, location_id, quest_id }) {
    const query = `
      INSERT INTO manual_check_requests (user_id, progress_id, location_id, quest_id, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `;
    const result = await pool.query(query, [user_id, progress_id, location_id, quest_id]);
    return result.rows[0];
  }

  static async findAllPending() {
    const query = `
      SELECT mcr.*, 
             u.nickname as user_nickname,
             q.title as quest_title,
             l.name as location_name,
             l.points_award
      FROM manual_check_requests mcr
      JOIN users u ON mcr.user_id = u.id
      JOIN quests q ON mcr.quest_id = q.id
      JOIN locations l ON mcr.location_id = l.id
      WHERE mcr.status = 'pending'
      ORDER BY mcr.created_at ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async approve(id, pointsEarned) {
    const query = `
      UPDATE manual_check_requests 
      SET status = 'approved', resolved_at = NOW()
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async reject(id) {
    const query = `
      UPDATE manual_check_requests 
      SET status = 'rejected', resolved_at = NOW()
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async findByProgressAndLocation(progressId, locationId) {
    const query = `
      SELECT * FROM manual_check_requests 
      WHERE progress_id = $1 AND location_id = $2 AND status = 'pending'
    `;
    const result = await pool.query(query, [progressId, locationId]);
    return result.rows[0];
  }
}

module.exports = ManualCheckRequest;