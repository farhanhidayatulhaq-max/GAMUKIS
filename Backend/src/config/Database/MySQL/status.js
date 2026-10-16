const { sequelize } = require('./connection');

const getMySQLStatus = async () => {
  const startTime = Date.now();
  try {
    await sequelize.authenticate();
    const responseTime = Date.now() - startTime;

    return {
      database: 'MySQL',
      status: 'UP',
      connected: true,
      responseTime: `${responseTime}ms`
    };
  } catch (error) {
    return {
      database: 'MySQL',
      status: 'DOWN',
      connected: false,
      error: error.message
    };
  }
};

module.exports = getMySQLStatus;