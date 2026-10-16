const jwt = require('jsonwebtoken');
const RoleModel = require('../models/roleModel');

const { jwtSecret } = require('../config/jwtConfig');

/**
 * Menerima Bearer token dari dua sumber login:
 *  1. JWT manual (register/login via MySQL)  -> authType 'manual'
 *  2. Firebase ID token (login Google/Gmail)  -> authType 'google'
 * Hasil: req.account = { ownerKey, authType, userId, email, username, role }
 * Role SELALU diambil dari MySQL (bukan dari klaim token).
 * req.user disediakan untuk kompatibilitas kode lama.
 */
const authenticateAny = async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token login diperlukan.' });
  }
  const token = authorization.slice('Bearer '.length);

  let account = null;
  let emailVerified = false;

  try {
    const payload = jwt.verify(token, jwtSecret);
    account = {
      ownerKey: `manual:${payload.userId}`,
      authType: 'manual',
      userId: String(payload.userId),
      email: payload.email || null,
      username: payload.username || null
    };
    emailVerified = true; // email manual diverifikasi lewat OTP saat registrasi
  } catch (manualError) {
    // bukan JWT manual yang valid -> coba Firebase
  }

  if (!account) {
    try {
      const { firebaseAuth } = require('../config/Database/Firebase/admin');
      const decoded = await firebaseAuth.verifyIdToken(token);
      account = {
        ownerKey: `google:${decoded.uid}`,
        authType: 'google',
        userId: decoded.uid,
        email: decoded.email || null,
        username: decoded.name || decoded.email?.split('@')[0] || decoded.uid
      };
      emailVerified = decoded.email_verified === true;
    } catch (firebaseError) {
      return res.status(401).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' });
    }
  }

  try {
    const role = await RoleModel.resolve({ ...account, emailVerified });
    if (role === undefined) return res.status(401).json({ message: 'Akun tidak ditemukan.' });
    account.role = role;
  } catch (error) {
    console.error('Resolve role error:', error);
    return res.status(500).json({ message: 'Gagal memverifikasi role.' });
  }

  req.account = account;
  req.user = { userId: account.userId, username: account.username, email: account.email, role: account.role, authType: account.authType };
  return next();
};

module.exports = { authenticateAny };
