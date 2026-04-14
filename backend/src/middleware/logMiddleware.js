const AuditLog = require('../models/AuditLog');

const logAction = async (req, res, next) => {
  const startTime = Date.now();
  
  const originalJson = res.json;
  
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    const action = `${req.method} ${req.route?.path || req.path}`;
    const ip_address = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const user_id = req.user?.id || null;
    
    AuditLog.create({
      user_id,
      action,
      ip_address,
      details: JSON.stringify({
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        method: req.method,
        url: req.originalUrl
      })
    }).catch(err => console.error('Ошибка логирования:', err.message));
    
    originalJson.call(this, data);
  };
  
  next();
};

module.exports = logAction;