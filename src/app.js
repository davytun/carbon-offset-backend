require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');


const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Enable buffering for serverless
mongoose.set('bufferCommands', true);

// Import routes
const authRoutes = require('./routes/auth');
const emissionRoutes = require('./routes/emissions');
const offsetRoutes = require('./routes/offsets');
const transactionRoutes = require('./routes/transactions');
const leaderboardRoutes = require('./routes/leaderboard');

const app = express();

// Connect to database
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://localhost:8080', 'https://preview--soul-carbon.lovable.app'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));



// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Carbon Offset Tracker API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      docs: '/api-docs',
      auth: '/api/auth',
      emissions: '/api/emissions',
      offsets: '/api/offsets',
      transactions: '/api/transactions',
      leaderboards: '/api/leaderboards'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongoUri: process.env.MONGO_URI ? 'Set' : 'Not Set',
    nodeEnv: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/emissions', emissionRoutes);
app.use('/api/offsets', offsetRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/leaderboards', leaderboardRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  server.close(() => {
    logger.info('Process terminated');
  });
});

module.exports = app;