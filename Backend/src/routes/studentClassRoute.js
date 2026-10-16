// C:\Users\LOQ\.gemini\antigravity\scratch\gamukis_student_classes\Backend\routes\studentClassRoute.js
const express = require('express');
const router = express.Router();
const StudentClassService = require('../services/studentClassService');

/**
 * GET /api/classes/categories
 * Mengembalikan daftar ringkasan kategori (SAINTEK, SOSHUM, BAHASA)
 */
router.get('/categories', async (req, res) => {
  try {
    const result = await StudentClassService.getCategories();
    return res.status(200).json({
      success: true,
      categories: result.data,
      fromCache: result.fromCache
    });
  } catch (error) {
    console.error('Error in GET /api/classes/categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data kategori kelas',
      error: error.message
    });
  }
});

/**
 * GET /api/classes/recommendations
 * Mengembalikan rekomendasi harian materi belajar
 */
router.get('/recommendations', async (req, res) => {
  try {
    const result = await StudentClassService.getDailyRecommendations();
    return res.status(200).json({
      success: true,
      recommendations: result.data,
      fromCache: result.fromCache
    });
  } catch (error) {
    console.error('Error in GET /api/classes/recommendations:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat rekomendasi harian',
      error: error.message
    });
  }
});

/**
 * GET /api/classes/subject/:slug
 * Mengembalikan rincian lengkap kelas siswa (silabus, bab, capaian belajar, mini-quiz)
 */
router.get('/subject/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await StudentClassService.getClassDetail(slug);
    if (!result.data) {
      return res.status(404).json({
        success: false,
        message: `Kelas dengan pengenal '${slug}' tidak ditemukan.`
      });
    }

    return res.status(200).json({
      success: true,
      classDetail: result.data,
      fromCache: result.fromCache
    });
  } catch (error) {
    console.error('Error in GET /api/classes/subject/:slug:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat rincian kelas',
      error: error.message
    });
  }
});

/**
 * GET /api/classes/progress and GET /api/classes/progress/:slug
 * Mengambil progress belajar siswa
 */
const handleGetProgress = async (req, res) => {
  try {
    const studentId = req.query.studentId || req.headers['x-student-id'] || 'default_student';
    const classSlug = req.params.slug || req.query.classSlug || null;
    const progress = await StudentClassService.getProgress(studentId, classSlug);

    return res.status(200).json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Error in GET /api/classes/progress:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil progress siswa',
      error: error.message
    });
  }
};

router.get('/progress', handleGetProgress);
router.get('/progress/:slug', handleGetProgress);

/**
 * POST /api/classes/progress
 * Menyimpan / memperbarui progress belajar siswa
 */
router.post('/progress', async (req, res) => {
  try {
    const { studentId = 'default_student', classSlug, completedLessons, completedChapters, overallPercent } = req.body;
    if (!classSlug) {
      return res.status(400).json({
        success: false,
        message: 'classSlug wajib disertakan dalam body request.'
      });
    }

    const updated = await StudentClassService.saveProgress(studentId, classSlug, {
      completedLessons,
      completedChapters,
      overallPercent
    });

    return res.status(200).json({
      success: true,
      message: 'Progress belajar berhasil diperbarui.',
      progress: updated
    });
  } catch (error) {
    console.error('Error in POST /api/classes/progress:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan progress siswa',
      error: error.message
    });
  }
});

/**
 * GET /api/classes
 * Mengambil seluruh kelas atau difilter dengan query ?category=SAINTEK|SOSHUM|BAHASA
 */
router.get('/', async (req, res) => {
  try {
    const category = req.query.category || null;
    const result = await StudentClassService.getClasses(category);

    return res.status(200).json({
      success: true,
      count: result.data.length,
      category: result.category,
      classes: result.data,
      fromCache: result.fromCache
    });
  } catch (error) {
    console.error('Error in GET /api/classes:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat daftar kelas siswa',
      error: error.message
    });
  }
});

module.exports = router;

