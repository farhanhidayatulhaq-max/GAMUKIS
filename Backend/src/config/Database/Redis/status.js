const { redisClient } = require('./connections');

const getRedisStatus = async () => {
  const startTime = Date.now();
  try {
    const result = await redisClient.ping();
    const responseTime = Date.now() - startTime;

    const isHealthy = result === 'PONG';

    return {
      database: 'Redis',
      status: isHealthy ? 'UP' : 'DOWN',
      connected: isHealthy,
      responseTime: `${responseTime}ms`
    };
  } catch (error) {
    return {
      database: 'Redis',
      status: 'DOWN',
      connected: false,
      error: error.message
    };
  }
};

module.exports = getRedisStatus;