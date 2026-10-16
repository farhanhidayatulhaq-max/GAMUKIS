const express = require('express');
const router = express.Router();

const profileController = require('../controllers/profileController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { handleAvatarUpload } = require('../middlewares/uploadMiddleware');

// Semua rute di bawah ini wajib melampirkan Header Header "Authorization: Bearer <TOKEN>"
router.use(authenticateToken);

// GET /api/profile
router.get('/', profileController.getProfile);

// PUT /api/profile
router.put('/', profileController.updateProfile);

// POST /api/profile/avatar (Upload foto ke Google Drive via Multer)
router.post('/avatar', handleAvatarUpload, profileController.uploadAvatar);

module.exports = router;