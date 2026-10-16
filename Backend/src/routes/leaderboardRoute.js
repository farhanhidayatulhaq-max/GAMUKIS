const express = require('express');
const router = express.Router();
const LeaderboardService = require('../services/leaderboardService');
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

// GET /api/leaderboard?period=alltime|daily|weekly&limit=10
router.get('/', optionalAuth, async (req, res) => {
  try {
    const period = String(req.query.period || 'alltime').toLowerCase();
    const limit = parseInt(req.query.limit, 10) || 10;
    const userId = req.account?.userId || req.query.userId || null;

    const data = await LeaderboardService.getLeaderboard({ period, limit, userId });
    return res.status(200).json({
      status: 'success',
      ...data
    });
  } catch (error) {
    console.error('Error in GET /api/leaderboard:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data leaderboard.',
      error: error.message
    });
  }
});

// GET /api/leaderboard/user-stats?userId=...
router.get('/user-stats', optionalAuth, async (req, res) => {
  try {
    const userId = req.account?.userId || req.query.userId || null;
    if (!userId) {
      return res.status(200).json({
        status: 'success',
        stats: {
          gamesPlayed: 0,
          totalScore: 0,
          maxScore: 0,
          totalCoins: 0,
          avgAccuracy: 0,
          rank: null,
          topScore: 0,
          totalExp: 0,
          exp: 0,
          tierProgress: LeaderboardService.calculateTierProgress(0),
          expTierProgress: LeaderboardService.calculateExpTierProgress(0)
        }
      });
    }

    const stats = await LeaderboardService.getUserStats(userId);
    return res.status(200).json({
      status: 'success',
      stats
    });
  } catch (error) {
    console.error('Error in GET /api/leaderboard/user-stats:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil statistik pengguna.',
      error: error.message
    });
  }
});

// GET /api/leaderboard/user/:userId/stats
router.get('/user/:userId/stats', optionalAuth, async (req, res) => {
  try {
    const userId = req.params.userId || req.account?.userId || null;
    if (!userId) {
      return res.status(200).json({
        status: 'success',
        stats: {
          gamesPlayed: 0,
          totalScore: 0,
          maxScore: 0,
          totalCoins: 0,
          avgAccuracy: 0,
          rank: null,
          topScore: 0,
          totalExp: 0,
          exp: 0,
          tierProgress: LeaderboardService.calculateTierProgress(0),
          expTierProgress: LeaderboardService.calculateExpTierProgress(0)
        }
      });
    }

    const stats = await LeaderboardService.getUserStats(userId);
    return res.status(200).json({
      status: 'success',
      stats
    });
  } catch (error) {
    console.error('Error in GET /api/leaderboard/user/:userId/stats:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil statistik pengguna.',
      error: error.message
    });
  }
});

// POST /api/leaderboard/record
router.post('/record', optionalAuth, async (req, res) => {
  try {
    const userId = req.account?.userId || req.body?.userId || 'guest_' + Date.now();
    const username = req.account?.username || req.body?.username || 'Pemain';
    const score = Number(req.body?.score) || 0;
    const coins = Number(req.body?.coins) || 0;
    const accuracy = Number(req.body?.accuracy) || 0;
    const timeRemaining = Number(req.body?.timeRemaining) || 0;
    const exp = req.body?.exp !== undefined ? Number(req.body.exp) : undefined;
    const botKills = Number(req.body?.botKills) || 0;
    const playerKills = Number(req.body?.playerKills) || 0;
    const correctAnswers = Number(req.body?.correctAnswers) || 0;

    const record = await LeaderboardService.recordScore({
      userId,
      username,
      score,
      coins,
      accuracy,
      timeRemaining,
      exp,
      botKills,
      playerKills,
      correctAnswers
    });

    // Evaluasi achievement jika ada
    let newAchievements = [];
    try {
      const achResult = await AchievementService.evaluateAchievements({
        userId,
        score,
        coins,
        accuracy,
        timeRemaining
      });
      newAchievements = achResult.newlyUnlocked;
    } catch (achErr) {
      console.warn('⚠️ [LeaderboardRoute] Achievement evaluation failed:', achErr.message);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Skor berhasil dicatat.',
      record,
      newAchievements
    });
  } catch (error) {
    console.error('Error in POST /api/leaderboard/record:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mencatat skor permainan.',
      error: error.message
    });
  }
});

module.exports = router;
