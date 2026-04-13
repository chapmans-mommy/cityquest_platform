const pool = require('../db');

class User {
  static async create({ email, password_hash, nickname, role = 'player' }) {
    const query = `
      INSERT INTO users (email, password_hash, nickname, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, nickname, role, total_points, created_at
    `;
    const values = [email, password_hash, nickname, role];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, email, nickname, role, avatar_url, total_points, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async updateTotalPoints(userId, pointsToAdd) {
    const query = `
      UPDATE users 
      SET total_points = total_points + $1 
      WHERE id = $2 
      RETURNING total_points
    `;
    const result = await pool.query(query, [pointsToAdd, userId]);
    return result.rows[0].total_points;
  }

  static async updateRole(userId, newRole) {
    const query = 'UPDATE users SET role = $1 WHERE id = $2 RETURNING role';
    const result = await pool.query(query, [newRole, userId]);
    return result.rows[0].role;
  }
}

module.exports = User;