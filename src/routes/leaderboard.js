const express = require('express');
const LeaderboardController = require('../controllers/leaderboardController');
const { generalLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Public routes with rate limiting
router.use(generalLimiter);

router.get('/', LeaderboardController.getLeaderboards);
router.get('/stats', LeaderboardController.getGlobalStats);

module.exports = router;