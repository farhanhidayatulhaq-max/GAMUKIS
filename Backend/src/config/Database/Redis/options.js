module.exports = {
  host: process.env.REDIS_HOST || 'db_redis',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    // Strategi eksponensial backoff saat koneksi terputus
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  reconnectOnError(err) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Reconnect otomatis jika node mengalami failover ke ReadOnly
      return true;
    }
    return false;
  }
};