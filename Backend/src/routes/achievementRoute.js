const express = require('express');
const router = express.Router();
const AchievementService = require('../services/achievementService');
const { authenticateAny } = require('../middlewares/anyAuthMiddleware');

// Middleware untuk optional auth
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return next();
  }
  return authenticateAny(req, res, next);
};

// GET /api/achievements/list
router.get('/list', (req, res) => {
  try {
    const list = AchievementService.getAllAchievements();
    return res.status(200).json({
      status: 'success',
      achievements: list
    });
  } catch (error) {
    console.error('Error in GET /api/achievements/list:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil daftar prestasi.',
      error: error.message
    });
  }
});

// GET /api/achievements/my
router.get('/my', optionalAuth, async (req, res) => {
  try {
    const userId = req.account?.userId || req.query.userId;
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Pengguna harus masuk untuk melihat daftar prestasi.'
      });
    }

    const achievements = await AchievementService.getUserAchievements(userId);
    return res.status(200).json({
      status: 'success',
      userId,
      achievements
    });
  } catch (error) {
    console.error('Error in GET /api/achievements/my:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data prestasi pemain.',
      error: error.message
    });
  }
});

module.exports = router;
