const express = require('express');
const TransactionController = require('../controllers/transactionController');
const { authenticate } = require('../middleware/auth');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All routes require authentication
router.use(authenticate);
router.use(generalLimiter);

// Transaction logs and details
router.get('/logs', TransactionController.getTransactionLogs);
router.get('/dashboard', TransactionController.getDashboardStats);
router.get('/:transactionId', TransactionController.getTransactionDetails);

module.exports = router;