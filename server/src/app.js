const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'TransitOps API is running' });
});

const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

// ... existing routes above ...

app.use(notFound);
app.use(errorHandler);

module.exports = app;