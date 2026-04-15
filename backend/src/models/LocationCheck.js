const pool = require('../db');

class LocationCheck {
  static async create({ progress_id, location_id, verification_method, hints_used_count = 0, time_spent_seconds = 0 }) {
    const query = `
      INSERT INTO location_checks (progress_id, location_id, verification_method, hints_used_count, time_spent_seconds)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [progress_id, location_id, verification_method, hints_used_count, time_spent_seconds];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async isLocationChecked(progressId, locationId) {
    const query = `
      SELECT * FROM location_checks
      WHERE progress_id = $1 AND location_id = $2
    `;
    const result = await pool.query(query, [progressId, locationId]);
    return result.rows.length > 0;
  }

  static async findByProgressId(progressId) {
    const query = `
      SELECT lc.*, l.name, l.order_number, l.points_award
      FROM location_checks lc
      JOIN locations l ON lc.location_id = l.id
      WHERE lc.progress_id = $1
      ORDER BY lc.checked_at ASC
    `;
    const result = await pool.query(query, [progressId]);
    return result.rows;
  }

  static async createWithTimer({ progress_id, location_id, verification_method, hints_used_count, time_spent_seconds, time_limit_seconds }) {
    const time_overtaken = time_spent_seconds > time_limit_seconds && time_limit_seconds > 0;
    
    const query = `
      INSERT INTO location_checks (progress_id, location_id, verification_method, hints_used_count, time_spent_seconds, time_limit_seconds, time_overtaken)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [progress_id, location_id, verification_method, hints_used_count, time_spent_seconds, time_limit_seconds, time_overtaken];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = LocationCheck;