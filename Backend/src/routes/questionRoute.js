const express = require('express');
const router = express.Router();
const questionService = require('../services/questionService');

router.get('/random', async (req, res) => {
  try {
    const subject = req.query.subject || 'indonesia';
    const count = parseInt(req.query.count, 10) || 10;
    const result = await questionService.getRandomQuestions({ subject, count });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in GET /api/questions/random:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil soal acak.',
      error: error.message
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const subject = req.query.subject || 'indonesia';
    const result = await questionService.getQuestions({ subject });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in GET /api/questions:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil daftar soal.',
      error: error.message
    });
  }
});

module.exports = router;

