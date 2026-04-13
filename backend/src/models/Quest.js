const pool = require('../db');

class Quest {
  static async create({ title, description, cover_image_url, author_id }) {
    const query = `
      INSERT INTO quests (title, description, cover_image_url, author_id, status)
      VALUES ($1, $2, $3, $4, 'draft')
      RETURNING *
    `;
    const values = [title, description, cover_image_url, author_id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findAll({ status = 'published', search = '' } = {}) {
    let query = `
      SELECT q.*, u.nickname as author_name
      FROM quests q
      LEFT JOIN users u ON q.author_id = u.id
      WHERE q.status = $1
    `;
    const values = [status];
    
    if (search) {
      query += ` AND (q.title ILIKE $2 OR q.description ILIKE $2)`;
      values.push(`%${search}%`);
    }
    
    query += ` ORDER BY q.created_at DESC`;
    
    const result = await pool.query(query, values);
    return result.rows;
  }

  static async findById(id) {
    const questQuery = `
      SELECT q.*, u.nickname as author_name
      FROM quests q
      LEFT JOIN users u ON q.author_id = u.id
      WHERE q.id = $1
    `;
    const questResult = await pool.query(questQuery, [id]);
    
    if (questResult.rows.length === 0) {
      return null;
    }
    
    const quest = questResult.rows[0];
    
    const locationsQuery = `
      SELECT * FROM locations
      WHERE quest_id = $1
      ORDER BY order_number ASC
    `;
    const locationsResult = await pool.query(locationsQuery, [id]);
    quest.locations = locationsResult.rows;
    
    return quest;
  }

  static async update(id, data) {
    const allowedFields = ['title', 'description', 'cover_image_url', 'max_concurrent_players'];
    const setClauses = [];
    const values = [];
    let valueIndex = 1;
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        setClauses.push(`${field} = $${valueIndex}`);
        values.push(data[field]);
        valueIndex++;
      }
    }
    
    if (setClauses.length === 0) {
      return null;
    }
    
    values.push(id);
    const query = `
      UPDATE quests
      SET ${setClauses.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE quests
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM quests WHERE id = $1 RETURNING id';
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
}

module.exports = Quest;