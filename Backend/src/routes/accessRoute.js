const express = require('express');
const RoleModel = require('../models/roleModel');
const { authenticateAny } = require('../middlewares/anyAuthMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');
const { ALL_ROLES, normalizeRole } = require('../config/permissions');

const router = express.Router();
router.use(authenticateAny);

// Info akun & role sendiri (semua role)
router.get('/me', async (req, res) => {
  const { authType, userId, email, username, role } = req.account;
  try {
    const teacherApplication = await RoleModel.getTeacherApplication(authType, userId);
    res.json({ user: { authType, id: userId, email, username, role, teacherApplication } });
  } catch (error) {
    console.error('Get account role status error:', error.message);
    res.status(500).json({ message: 'Status akun gagal dimuat.' });
  }
});

// Guru & administrator: daftar siswa (tanpa data sensitif)
router.get('/students', requirePermission('students:read'), async (req, res) => {
  try {
    res.json({ students: await RoleModel.listStudents() });
  } catch (error) {
    console.error('List students error:', error);
    res.status(500).json({ message: 'Daftar siswa gagal dimuat.' });
  }
});

// Administrator: kelola akun & role
router.get('/users', requirePermission('users:manage'), async (req, res) => {
  const role = req.query.role ? normalizeRole(req.query.role) : undefined;
  if (req.query.role && !role) return res.status(400).json({ message: 'Role tidak valid.' });
  try {
    res.json({ users: await RoleModel.listAccounts({ role }) });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ message: 'Daftar pengguna gagal dimuat.' });
  }
});

router.patch('/users/:authType/:id/role', requirePermission('users:manage'), async (req, res) => {
  const { authType, id } = req.params;
  const role = normalizeRole(req.body?.role);
  if (!['manual', 'google'].includes(authType)) {
    return res.status(400).json({ message: 'authType harus manual atau google.' });
  }
  if (!role) return res.status(400).json({ message: `Role harus salah satu dari: ${ALL_ROLES.join(', ')}.` });
  if (role === 'guru') {
    return res.status(400).json({ message: 'Akun Guru harus melalui daftar pengajuan dan persetujuan Guru.' });
  }
  if (authType === req.account.authType && String(id) === String(req.account.userId)) {
    return res.status(400).json({ message: 'Tidak dapat mengubah role akun sendiri.' });
  }

  try {
    const current = await RoleModel.getStoredRole(authType, id);
    if (current === undefined) return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    if (current === 'administrator' && role !== 'administrator' && (await RoleModel.countAdmins()) <= 1) {
      return res.status(409).json({ message: 'Administrator terakhir tidak boleh diturunkan.' });
    }
    await RoleModel.setRole(authType, id, role);
    res.json({ success: true, user: { authType, id, role } });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Role gagal diperbarui.' });
  }
});

module.exports = router;
