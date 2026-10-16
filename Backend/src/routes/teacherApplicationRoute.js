const express = require('express');
const RoleModel = require('../models/roleModel');
const { authenticateAny } = require('../middlewares/anyAuthMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');

const router = express.Router();
router.use(authenticateAny);

router.get('/', requirePermission('teachers:manage'), async (_req, res) => {
  try {
    res.json({ teachers: await RoleModel.listPendingTeacherApplications() });
  } catch (error) {
    console.error('List pending teacher applications error:', error.message);
    res.status(500).json({ message: 'Daftar pengajuan Guru gagal dimuat.' });
  }
});

router.patch('/:id/approval', requirePermission('teachers:manage'), async (req, res) => {
  const applicationId = Number(req.params.id);
  const { status } = req.body || {};
  if (!Number.isSafeInteger(applicationId) || applicationId < 1) {
    return res.status(400).json({ message: 'ID pengajuan tidak valid.' });
  }
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status harus approved atau rejected.' });
  }

  try {
    const updated = await RoleModel.reviewTeacherApplication(
      applicationId, status, req.account.ownerKey
    );
    if (!updated) return res.status(404).json({ message: 'Pengajuan tidak ditemukan atau sudah ditinjau.' });
    res.json({ success: true, status });
  } catch (error) {
    console.error('Review teacher application error:', error.message);
    res.status(500).json({ message: 'Pengajuan Guru gagal diperbarui.' });
  }
});

module.exports = router;
