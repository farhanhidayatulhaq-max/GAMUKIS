const { hasPermission, normalizeRole } = require('../config/permissions');

const deny = (res, message) => res.status(403).json({ message });
const denyRoleSelection = (res) => res.status(403).json({
  code: 'ROLE_REQUIRED',
  message: 'Pilih peran Siswa atau tunggu persetujuan pengajuan Guru.'
});

const requireRole = (...roles) => {
  const allowed = roles.map(normalizeRole);
  return (req, res, next) => {
    if (!req.account) return res.status(401).json({ message: 'Token login diperlukan.' });
    if (req.account.role == null) return denyRoleSelection(res);
    if (!allowed.includes(req.account.role)) {
      return deny(res, 'Role Anda tidak memiliki akses ke endpoint ini.');
    }
    return next();
  };
};

const requirePermission = (permission) => (req, res, next) => {
  if (!req.account) return res.status(401).json({ message: 'Token login diperlukan.' });
  if (req.account.role == null) return denyRoleSelection(res);
  if (!hasPermission(req.account.role, permission)) {
    return deny(res, 'Role Anda tidak memiliki akses ke endpoint ini.');
  }
  return next();
};

// Pemilik data (req.params[param] === id akun sendiri) atau punya permission khusus.
const requireSelfOr = (permission, param = 'playerId') => (req, res, next) => {
  if (!req.account) return res.status(401).json({ message: 'Token login diperlukan.' });
  const paramVal = String(req.params[param] || '');
  const ownerId = paramVal.split(':')[0];
  if (paramVal === String(req.account.userId) || ownerId === String(req.account.userId)) return next();
  if (req.account.role == null) return denyRoleSelection(res);
  if (permission && hasPermission(req.account.role, permission)) return next();
  return deny(res, 'Anda hanya boleh mengakses data milik sendiri.');
};

module.exports = { requireRole, requirePermission, requireSelfOr };
