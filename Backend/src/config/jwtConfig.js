const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV !== 'production') {
    return 'gamukis-development-secret';
  }
  throw new Error("CRITICAL: JWT_SECRET environment variable is required in production environment.");
};

module.exports = { jwtSecret: getJwtSecret() };

