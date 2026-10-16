const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { loginRateLimiter } = require('../middlewares/ratelimitMiddleware');
const { authenticateToken } = require('../middlewares/authMiddleware');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login (dilindungi rate limiter)
router.post('/login', loginRateLimiter, authController.login);

// POST /api/auth/refresh-token
router.post('/refresh-token', authController.refreshToken);

// POST /api/auth/logout (membutuhkan token JWT aktif)
router.post('/logout', authenticateToken, authController.logout);

module.exports = router;