const { redisClient } = require('../config/Database/Redis/connections');
const QuestionModel = require('../models/questionModel');

const CACHE_TTL_SECONDS = 300; // 5 menit

const isRedisReady = () => {
  return redisClient && (redisClient.status === 'ready' || redisClient.status === 'connect');
};

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const QuestionService = {
  async getQuestionPool(subject) {
    const norm = QuestionModel.normalizeSubject(subject);
    const cacheKey = `questions:pool:${norm}`;

    // 1. Coba ambil dari Redis Caching
    if (isRedisReady()) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return { items: parsed, fromCache: true, subject: norm };
          }
        }
      } catch (err) {
        console.warn(`⚠️ [questionService] Redis cache read error for ${norm}:`, err.message);
      }
    }

    // 2. Ambil dari database / model
    let items = await QuestionModel.getQuestionsBySubject(norm);
    if (!items || items.length === 0) {
      items = await QuestionModel.getQuestionsBySubject('indonesia');
    }

    // 3. Simpan ke Redis Caching jika berhasil
    if (isRedisReady() && items && items.length > 0) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(items), 'EX', CACHE_TTL_SECONDS);
      } catch (err) {
        console.warn(`⚠️ [questionService] Redis cache write error for ${norm}:`, err.message);
      }
    }

    return { items: items || [], fromCache: false, subject: norm };
  },

  async getRandomQuestions({ subject = 'indonesia', count = 10 }) {
    const norm = QuestionModel.normalizeSubject(subject);
    const limit = Math.max(1, Math.min(Number(count) || 10, 50));

    const { items, fromCache } = await this.getQuestionPool(norm);
    const shuffled = shuffleArray(items);
    const selected = shuffled.slice(0, limit);

    return {
      success: true,
      subject: norm,
      count: selected.length,
      fromCache,
      questions: selected
    };
  },

  async getQuestions({ subject }) {
    const norm = QuestionModel.normalizeSubject(subject);
    const { items, fromCache } = await this.getQuestionPool(norm);
    return {
      success: true,
      subject: norm,
      count: items.length,
      fromCache,
      questions: items
    };
  },

  async clearQuestionCache(subject) {
    if (!isRedisReady()) return false;
    try {
      const norm = QuestionModel.normalizeSubject(subject);
      const cacheKey = `questions:pool:${norm}`;
      await redisClient.del(cacheKey);
      return true;
    } catch {
      return false;
    }
  }
};

module.exports = QuestionService;

