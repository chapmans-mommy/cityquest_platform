const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const expressJSDocSwagger = require('express-jsdoc-swagger');

dotenv.config();

const dbTest = require('./db');
console.log('db/index.js загружен, pool =', dbTest);

const authRoutes = require('./routes/authRoutes');
const logAction = require('./middleware/logMiddleware');
const questRoutes = require('./routes/questRoutes');
const progressRoutes = require('./routes/progressRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(logAction);

// Swagger документация
const swaggerOptions = {
    info: {
      version: '1.0.0',
      title: 'CityQuest API',
      description: 'API для платформы городских квестов "Исследователь"',
      license: {
        name: 'MIT',
      },
    },
    baseDir: __dirname,
    filesPattern: './**/*.js',
    swaggerUIPath: '/api-docs',
    exposeSwaggerUI: true,
    exposeApiDocs: false,
    apiDocsPath: '/v3/api-docs',
    security: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
  };
  
  expressJSDocSwagger(app)(swaggerOptions);
  
app.use('/api', progressRoutes);
app.use('/api', ratingRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/quests', questRoutes);
app.use('/api', reviewRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
  });

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger UI доступен по адресу: http://localhost:${PORT}/api-docs`);
});