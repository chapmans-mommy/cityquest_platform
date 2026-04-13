const pool = require('../db');

class AuditLog {
  static async create({ user_id, action, ip_address, details = null }) {
    const query = `
      INSERT INTO audit_logs (user_id, action, ip_address, details)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [user_id || null, action, ip_address, details];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll({ limit = 100, offset = 0, userId = null } = {}) {
    let query = `
      SELECT al.*, u.nickname
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
    `;
    const values = [];
    
    if (userId) {
      query += ` WHERE al.user_id = $1`;
      values.push(userId);
      query += ` ORDER BY al.created_at DESC LIMIT $2 OFFSET $3`;
      values.push(limit, offset);
    } else {
      query += ` ORDER BY al.created_at DESC LIMIT $1 OFFSET $2`;
      values.push(limit, offset);
    }
    
    const result = await pool.query(query, values);
    return result.rows;
  }
}

module.exports = AuditLog;