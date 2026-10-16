let redisClient = null;
try {
  ({ redisClient } = require('../config/Database/Redis/connection'));
} catch (e) {
  // Offline or mock
}

class SessionModel {
  // Menyimpan session / refresh token user ke Redis
  static async setSession(userId, token, expiryInSeconds = 604800) { // Default 7 hari
    if (!redisClient) return;
    const key = `session:${userId}`;
    if (typeof redisClient.setEx === 'function') {
      await redisClient.setEx(key, expiryInSeconds, token);
    } else if (typeof redisClient.setex === 'function') {
      await redisClient.setex(key, expiryInSeconds, token);
    } else if (typeof redisClient.set === 'function') {
      await redisClient.set(key, token, 'EX', expiryInSeconds);
    }
  }

  // Mengambil session user dari Redis
  static async getSession(userId) {
    if (!redisClient || typeof redisClient.get !== 'function') return null;
    const key = `session:${userId}`;
    return await redisClient.get(key);
  }

  // Menghapus session saat Logout
  static async deleteSession(userId) {
    if (!redisClient || typeof redisClient.del !== 'function') return;
    const key = `session:${userId}`;
    await redisClient.del(key);
  }

  // Menyimpan data profil user ke cache Redis untuk performa cepat
  static async cacheUserProfile(userId, userData, ttlInSeconds = 3600) {
    if (!redisClient) return;
    const key = `cache:user:${userId}`;
    const serialized = JSON.stringify(userData);
    if (typeof redisClient.setEx === 'function') {
      await redisClient.setEx(key, ttlInSeconds, serialized);
    } else if (typeof redisClient.setex === 'function') {
      await redisClient.setex(key, ttlInSeconds, serialized);
    } else if (typeof redisClient.set === 'function') {
      await redisClient.set(key, serialized, 'EX', ttlInSeconds);
    }
  }

  // Mengambil data profil user dari cache Redis
  static async getCachedUserProfile(userId) {
    if (!redisClient || typeof redisClient.get !== 'function') return null;
    const key = `cache:user:${userId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }
}

module.exports = SessionModel;