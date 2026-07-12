const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

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

// Routes
app.use('/api/auth', authRoutes);

// Error handling (must stay last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;