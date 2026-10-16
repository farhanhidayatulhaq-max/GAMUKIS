const ROLES = Object.freeze({
  SISWA: 'siswa',
  GURU: 'guru',
  ADMIN: 'administrator'
});

const ALL_ROLES = Object.values(ROLES);
const SELF_SERVICE_ROLES = [ROLES.SISWA, ROLES.GURU]; // role yang boleh dipilih sendiri saat onboarding

/**
 * Matriks akses API. Tambah permission baru di sini, lalu pasang di route
 * dengan requirePermission('nama:permission').
 */
const PERMISSIONS = Object.freeze({
  'profile:own': ALL_ROLES,
  'characters:own': ALL_ROLES,
  'history:create': ALL_ROLES,
  'answers:create_own': ALL_ROLES,
  'coins:read': ALL_ROLES,
  'membership:own': ALL_ROLES,
  'leaderboard:read': ALL_ROLES,
  'leaderboard:record': ALL_ROLES,
  'achievements:read': ALL_ROLES,

  'players:read_all': [ROLES.GURU, ROLES.ADMIN],
  'answers:read_any': [ROLES.GURU, ROLES.ADMIN],
  'students:read': [ROLES.GURU, ROLES.ADMIN],

  'players:write_any': [ROLES.ADMIN],
  'coins:manage': [ROLES.ADMIN],
  'history:read_all': [ROLES.ADMIN],
  'rooms:manage': [ROLES.ADMIN],
  'users:manage': [ROLES.ADMIN],
  'teachers:manage': [ROLES.ADMIN],
  'membership:manage': [ROLES.ADMIN]
});

const normalizeRole = (value) => {
  const role = String(value || '').trim().toLowerCase();
  if (role === 'admin' || role === 'administrator') return ROLES.ADMIN;
  return ALL_ROLES.includes(role) ? role : null;
};

const hasPermission = (role, permission) =>
  Boolean(PERMISSIONS[permission]?.includes(normalizeRole(role)));

module.exports = { ROLES, ALL_ROLES, SELF_SERVICE_ROLES, PERMISSIONS, normalizeRole, hasPermission };
