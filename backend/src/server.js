const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();



const dbTest = require('./db');
console.log('db/index.js загружен, pool =', dbTest);

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Server is running' });
  });

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});