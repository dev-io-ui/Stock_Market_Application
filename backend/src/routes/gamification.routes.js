const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  checkAndAwardBadges,
  getUserBadges,
  getLeaderboard
} = require('../controllers/gamification.controller');

// Public routes
router.get('/leaderboard', getLeaderboard);

// Protected routes
router.use(protect);

router.get('/check-badges', checkAndAwardBadges);
router.get('/badges/:userId', getUserBadges);

module.exports = router;
