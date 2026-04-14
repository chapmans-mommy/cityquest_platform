const pool = require('../db');

class Location {
  static async create({ quest_id, order_number, name, description, latitude, longitude, points_award, hint_text }) {
    const query = `
      INSERT INTO locations (quest_id, order_number, name, description, latitude, longitude, points_award, hint_text)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [quest_id, order_number, name, description, latitude, longitude, points_award, hint_text];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByQuestId(questId) {
    const query = `
      SELECT * FROM locations
      WHERE quest_id = $1
      ORDER BY order_number ASC
    `;
    const result = await pool.query(query, [questId]);
    return result.rows;
  }

  static async update(id, data) {
    const allowedFields = ['name', 'description', 'latitude', 'longitude', 'points_award', 'hint_text'];
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
      UPDATE locations
      SET ${setClauses.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async updateOrder(id, newOrderNumber) {
    const query = `
      UPDATE locations
      SET order_number = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [newOrderNumber, id]);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM locations WHERE id = $1 RETURNING id';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async getNextOrderNumber(questId) {
    const query = `
      SELECT COALESCE(MAX(order_number), 0) + 1 as next_order
      FROM locations
      WHERE quest_id = $1
    `;
    const result = await pool.query(query, [questId]);
    return result.rows[0].next_order;
  }
  static async findById(id) {
    const query = 'SELECT * FROM locations WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Location;