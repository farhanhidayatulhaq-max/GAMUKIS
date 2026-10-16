const { redisClient } = require('../config/database/redis/connection');

const loginRateLimiter = async (req, res, next) => {
  const ip = req.ip;
  const key = `rate_limit:login:${ip}`;
  const limit = 5;       // Maksimal 5 kali percobaan
  const windowSec = 60;  // Dalam kurun waktu 1 menit (60 detik)

  try {
    const currentRequests = await redisClient.incr(key);

    if (currentRequests === 1) {
      await redisClient.expire(key, windowSec);
    }

    if (currentRequests > limit) {
      return res.status(429).json({
        status: 'error',
        message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 1 menit.'
      });
    }

    next();
  } catch (error) {
    // Jika Redis error/offline, biarkan request tetap lewat agar aplikasi tidak mati
    next();
  }
};

module.exports = { loginRateLimiter };