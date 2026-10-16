require('dotenv').config();

const requiredEnvVars = [
  'PORT',
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
  'JWT_SECRET'
];

// Validasi keberadaan variabel wajib
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ [ENV ERROR] Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  mysql: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME
  },
  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://db_mongo:27017/db_app'
  },
  redis: {
    host: process.env.REDIS_HOST || 'db_redis',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'noreply@app.com'
  }
};