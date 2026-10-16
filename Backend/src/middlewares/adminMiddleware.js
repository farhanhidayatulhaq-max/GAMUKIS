const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'gamukis-development-secret';

const authenticateManualToken = (req, res, next) => {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token login diperlukan.' });
  }

  try {
    req.user = jwt.verify(authorization.slice('Bearer '.length), jwtSecret);
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token login tidak valid atau sudah kedaluwarsa.' });
  }
};

const requireAdmin = (req, res, next) => {
  const role = String(req.user?.role || '').toLowerCase();
  if (!['admin', 'administrator'].includes(role)) {
    return res.status(403).json({ message: 'Akses admin diperlukan.' });
  }
  return next();
};

module.exports = { authenticateManualToken, requireAdmin };
