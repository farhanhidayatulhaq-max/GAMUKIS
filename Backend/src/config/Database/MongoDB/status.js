const { mongoose } = require('./connection');

const getMongoDBStatus = async () => {
  const startTime = Date.now();
  try {
    // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const isConnected = mongoose.connection.readyState === 1;

    if (!isConnected) {
      throw new Error('Mongoose connection state is not connected');
    }

    // Ping admin database untuk memastikan responsivitas
    await mongoose.connection.db.admin().ping();
    const responseTime = Date.now() - startTime;

    return {
      database: 'MongoDB',
      status: 'UP',
      connected: true,
      responseTime: `${responseTime}ms`
    };
  } catch (error) {
    return {
      database: 'MongoDB',
      status: 'DOWN',
      connected: false,
      error: error.message
    };
  }
};

module.exports = getMongoDBStatus;