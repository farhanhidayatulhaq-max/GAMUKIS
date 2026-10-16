const Redis = require('ioredis');
const fs = require('fs');

const isDocker = Boolean(
  process.env.DOCKER_CONTAINER ||
  process.cwd() === '/app' ||
  fs.existsSync('/.dockerenv')
);

const redisOptions = {
  host: process.env.REDIS_HOST || (isDocker ? 'redis' : 'localhost'),
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  lazyConnect: true, // Mencegah auto-connect sebelum dipanggil eksplisit
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  reconnectOnError: (error) => error.message.includes('READONLY')
};

const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, redisOptions)
  : new Redis(redisOptions);

redisClient.on('error', (error) => {
  console.warn('⚠️ [Redis] Client warning/error:', error.message);
});

const connectRedis = async () => {
  if (redisClient.status === 'ready' || redisClient.status === 'connecting') return;
  try {
    await redisClient.connect();
    console.log('✅ [Redis] Client connected successfully.');
  } catch (error) {
    console.error('❌ [Redis] Connection error:', error.message);
  }
};

module.exports = { redisClient, connectRedis };