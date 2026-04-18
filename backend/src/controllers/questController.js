const Quest = require('../models/Quest');
const Location = require('../models/Location');
const pool = require('../db');

const getAllQuests = async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = `
      SELECT 
        q.*, 
        u.nickname as author_name,
        COUNT(l.id) as locations_count
      FROM quests q
      LEFT JOIN users u ON q.author_id = u.id
      LEFT JOIN locations l ON q.id = l.quest_id
      WHERE q.status = 'published'
    `;
    const values = [];
    
    if (search) {
      query += ` AND (q.title ILIKE $1 OR q.description ILIKE $1)`;
      values.push(`%${search}%`);
    }
    
    query += ` GROUP BY q.id, u.nickname ORDER BY q.created_at DESC`;
    
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};


const getQuestById = async (req, res) => {
  try {
    const { id } = req.params;
    const quest = await Quest.findById(parseInt(id));
    if (!quest) {
      return res.status(404).json({ error: 'Квест не найден' });
    }
    res.json(quest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const createQuest = async (req, res) => {
  try {
    const { title, description, cover_image_url } = req.body;
    const author_id = req.user.id;
    if (!title) {
      return res.status(400).json({ error: 'Название квеста обязательно' });
    }
    const quest = await Quest.create({ title, description, cover_image_url, author_id });
    res.status(201).json(quest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const updateQuest = async (req, res) => {
  try {
    const { id } = req.params;
    const existingQuest = await Quest.findById(parseInt(id));
    if (!existingQuest) {
      return res.status(404).json({ error: 'Квест не найден' });
    }
    if (existingQuest.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет прав на редактирование' });
    }
    const updatedQuest = await Quest.update(parseInt(id), req.body);
    res.json(updatedQuest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const deleteQuest = async (req, res) => {
  try {
    const { id } = req.params;
    const existingQuest = await Quest.findById(parseInt(id));
    if (!existingQuest) {
      return res.status(404).json({ error: 'Квест не найден' });
    }
    if (existingQuest.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет прав на удаление' });
    }
    await Quest.delete(parseInt(id));
    res.json({ message: 'Квест удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const publishQuest = async (req, res) => {
  try {
    const { id } = req.params;
    const existingQuest = await Quest.findById(parseInt(id));
    if (!existingQuest) {
      return res.status(404).json({ error: 'Квест не найден' });
    }
    if (existingQuest.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Нет прав на публикацию' });
    }
    if (!existingQuest.locations || existingQuest.locations.length === 0) {
      return res.status(400).json({ error: 'Нельзя опубликовать квест без локаций' });
    }
    const updatedQuest = await Quest.updateStatus(parseInt(id), 'pending');
    res.json({ message: 'Квест отправлен на модерацию', quest: updatedQuest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

const moderateQuest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (status !== 'published' && status !== 'rejected') {
      return res.status(400).json({ error: 'Неверный статус' });
    }
    const existingQuest = await Quest.findById(parseInt(id));
    if (!existingQuest) {
      return res.status(404).json({ error: 'Квест не найден' });
    }
    const updatedQuest = await Quest.updateStatus(parseInt(id), status);
    res.json({ message: `Квест ${status === 'published' ? 'опубликован' : 'отклонён'}`, quest: updatedQuest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};


// ========== ЛОКАЦИИ ==========

const addLocation = async (req, res) => {
    try {
      const { questId } = req.params;
      const { name, description, latitude, longitude, points_award, hint_text } = req.body;
      
      // Проверяем существование квеста и права
      const quest = await Quest.findById(parseInt(questId));
      if (!quest) {
        return res.status(404).json({ error: 'Квест не найден' });
      }
      if (quest.author_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Нет прав на добавление локаций' });
      }
      
      // Получаем следующий порядковый номер
      const nextOrder = await Location.getNextOrderNumber(parseInt(questId));
      
      const location = await Location.create({
        quest_id: parseInt(questId),
        order_number: nextOrder,
        name,
        description,
        latitude,
        longitude,
        points_award: points_award || 10,
        hint_text
      });
      
      res.status(201).json(location);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  };
  
  const updateLocation = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, latitude, longitude, points_award, hint_text } = req.body;
      
      const location = await Location.update(parseInt(id), {
        name, description, latitude, longitude, points_award, hint_text
      });
      
      if (!location) {
        return res.status(404).json({ error: 'Локация не найдена' });
      }
      
      res.json(location);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  };
  
  const deleteLocation = async (req, res) => {
    try {
      const { id } = req.params;
      await Location.delete(parseInt(id));
      res.json({ message: 'Локация удалена' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  };
  
  const reorderLocations = async (req, res) => {
    try {
      const { questId } = req.params;
      const { locations } = req.body; // массив { id, order_number }
      
      for (const loc of locations) {
        await Location.updateOrder(loc.id, loc.order_number);
      }
      
      res.json({ message: 'Порядок локаций обновлён' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  };

  const getMyQuests = async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      let query;
      let values;
      
      if (userRole === 'admin') {
        // Админ видит все квесты
        query = `
          SELECT q.*, u.nickname as author_name
          FROM quests q
          LEFT JOIN users u ON q.author_id = u.id
          ORDER BY q.created_at DESC
        `;
        values = [];
      } else {
        // Организатор видит только свои квесты
        query = `
          SELECT q.*, u.nickname as author_name
          FROM quests q
          LEFT JOIN users u ON q.author_id = u.id
          WHERE q.author_id = $1
          ORDER BY q.created_at DESC
        `;
        values = [userId];
      }
      
      const result = await pool.query(query, values);
      res.json(result.rows);
    } catch (err) {
      console.error('Ошибка получения моих квестов:', err);
      res.status(500).json({ error: 'Ошибка сервера' });
    }
  };

  module.exports = {
    getAllQuests,
    getQuestById,
    createQuest,
    updateQuest,
    deleteQuest,
    publishQuest,
    moderateQuest,
    addLocation,
    updateLocation,
    deleteLocation,
    reorderLocations,
    getMyQuests
  };