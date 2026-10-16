const env = require('./env');

module.exports = {
  secret: env.jwt.secret,
  options: {
    algorithm: 'HS256',
    expiresIn: env.jwt.expiresIn,
    issuer: 'express-auth-backend'
  },
  refreshOptions: {
    algorithm: 'HS256',
    expiresIn: env.jwt.refreshExpiresIn,
    issuer: 'express-auth-backend'
  }
};