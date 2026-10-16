// C:\Users\LOQ\.gemini\antigravity\scratch\gamukis_student_classes\Backend\services\studentClassService.js
let redisClient = null;
try {
  ({ redisClient } = require('../config/Database/Redis/connections'));
} catch (e) {
  // Offline or mock
}

const StudentClassModel = require('../models/studentClassModel');

const CACHE_TTL_SECONDS = 300; // 5 menit

const isRedisReady = () => {
  return redisClient && (redisClient.status === 'ready' || redisClient.status === 'connect');
};

const StudentClassService = {
  /**
   * Mengambil daftar kategori materi dengan Redis caching
   */
  async getCategories() {
    const cacheKey = 'classes:categories:all';

    if (isRedisReady()) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return { data: parsed, fromCache: true };
          }
        }
      } catch (err) {
        console.warn('⚠️ [studentClassService] Redis cache read error for categories:', err.message);
      }
    }

    const categories = await StudentClassModel.getCategories();

    if (isRedisReady() && categories && categories.length > 0) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(categories), 'EX', CACHE_TTL_SECONDS);
      } catch (err) {
        console.warn('⚠️ [studentClassService] Redis cache write error for categories:', err.message);
      }
    }

    return { data: categories, fromCache: false };
  },

  /**
   * Mengambil daftar seluruh kelas siswa atau difilter berdasarkan kategori
   */
  async getClasses(categoryFilter = null) {
    const norm = categoryFilter ? categoryFilter.trim().toUpperCase() : 'ALL';
    const cacheKey = `classes:list:${norm}`;

    if (isRedisReady()) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return { data: parsed, fromCache: true, category: norm };
          }
        }
      } catch (err) {
        console.warn(`⚠️ [studentClassService] Redis cache read error for list ${norm}:`, err.message);
      }
    }

    const items = await StudentClassModel.getAllClasses(categoryFilter);

    if (isRedisReady() && items && items.length > 0) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(items), 'EX', CACHE_TTL_SECONDS);
      } catch (err) {
        console.warn(`⚠️ [studentClassService] Redis cache write error for list ${norm}:`, err.message);
      }
    }

    return { data: items, fromCache: false, category: norm };
  },

  /**
   * Mengambil detail lengkap kelas siswa (silabus, bab, capaian belajar, mini-quiz)
   */
  async getClassDetail(slugOrId) {
    if (!slugOrId) return { data: null, error: 'Slug/ID kelas diperlukan' };
    const norm = String(slugOrId).trim().toLowerCase();
    const cacheKey = `classes:detail:${norm}`;

    if (isRedisReady()) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.slug) {
            return { data: parsed, fromCache: true };
          }
        }
      } catch (err) {
        console.warn(`⚠️ [studentClassService] Redis cache read error for detail ${norm}:`, err.message);
      }
    }

    const detail = await StudentClassModel.getClassBySlug(norm);

    if (!detail) {
      return { data: null, error: 'Kelas tidak ditemukan' };
    }

    if (isRedisReady() && detail) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(detail), 'EX', CACHE_TTL_SECONDS);
      } catch (err) {
        console.warn(`⚠️ [studentClassService] Redis cache write error for detail ${norm}:`, err.message);
      }
    }

    return { data: detail, fromCache: false };
  },

  /**
   * Mengambil rekomendasi harian belajar
   */
  async getDailyRecommendations() {
    const cacheKey = 'classes:recommendations:daily';

    if (isRedisReady()) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          return { data: JSON.parse(cached), fromCache: true };
        }
      } catch (err) {
        console.warn('⚠️ [studentClassService] Redis read error for recommendations:', err.message);
      }
    }

    const recs = await StudentClassModel.getDailyRecommendations();

    if (isRedisReady() && recs) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(recs), 'EX', CACHE_TTL_SECONDS);
      } catch (err) {
        console.warn('⚠️ [studentClassService] Redis write error for recommendations:', err.message);
      }
    }

    return { data: recs, fromCache: false };
  },

  /**
   * Tracking progress siswa
   */
  async getProgress(studentId, classSlug) {
    return StudentClassModel.getStudentProgress(studentId, classSlug);
  },

  async saveProgress(studentId, classSlug, payload) {
    return StudentClassModel.saveStudentProgress(studentId, classSlug, payload);
  }
};

module.exports = StudentClassService;

