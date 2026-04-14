const pool = require('../db');

const getLeaderboard = async (req, res) => {
  try {
    const query = `
      SELECT id, nickname, total_points, avatar_url
      FROM users
      ORDER BY total_points DESC
      LIMIT 50
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const getWeeklyLeaderboard = async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.nickname, u.avatar_url, SUM(lc.points_award * 
        CASE 
          WHEN p.chosen_difficulty = 'easy' THEN 1
          WHEN p.chosen_difficulty = 'medium' THEN 2
          WHEN p.chosen_difficulty = 'hard' THEN 5
        END) as weekly_points
      FROM location_checks lc
      JOIN player_progress p ON lc.progress_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE lc.checked_at > NOW() - INTERVAL '7 days'
      GROUP BY u.id
      ORDER BY weekly_points DESC
      LIMIT 10
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

module.exports = { getLeaderboard, getWeeklyLeaderboard };