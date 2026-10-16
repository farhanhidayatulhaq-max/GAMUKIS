const express = require('express');
const MembershipModel = require('../models/membershipModel');
const RoleModel = require('../models/roleModel');
const { authenticateAny } = require('../middlewares/anyAuthMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');
const { ROLES } = require('../config/permissions');
const { createMidtransTransaction } = require('../services/midtransService');

const router = express.Router();
router.use(authenticateAny);

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isNonNegInt = (v) => Number.isInteger(v) && v >= 0;

// ---------- Pengguna (siswa & guru) ----------

// Paket yang tersedia untuk role saya (admin melihat semua)
router.get('/plans', requirePermission('membership:own'), async (req, res) => {
  try {
    const audience = req.account.role === ROLES.ADMIN ? undefined : req.account.role;
    res.json({ plans: await MembershipModel.listPlans({ audience }) });
  } catch (error) {
    console.error('List plans error:', error);
    res.status(500).json({ message: 'Daftar paket gagal dimuat.' });
  }
});

// Status membership saya + fitur efektif
router.get('/me', requirePermission('membership:own'), async (req, res) => {
  try {
    const [effective, pending] = await Promise.all([
      MembershipModel.getEffective(req.account),
      MembershipModel.getPending(req.account.ownerKey)
    ]);
    res.json({ membership: effective, pending });
  } catch (error) {
    console.error('Get membership error:', error);
    res.status(500).json({ message: 'Status membership gagal dimuat.' });
  }
});

router.get('/history', requirePermission('membership:own'), async (req, res) => {
  try {
    res.json({ history: await MembershipModel.history(req.account.ownerKey) });
  } catch (error) {
    console.error('Membership history error:', error);
    res.status(500).json({ message: 'Riwayat membership gagal dimuat.' });
  }
});

// Berlangganan. Body: { planCode }
router.post('/subscribe', requirePermission('membership:own'), async (req, res) => {
  if (req.account.role === ROLES.ADMIN) {
    return res.status(400).json({ message: 'Administrator tidak memerlukan membership.' });
  }
  try {
    const plan = await MembershipModel.findPlanByCode(String(req.body?.planCode || ''));
    if (!plan || !plan.isActive) return res.status(404).json({ message: 'Paket tidak ditemukan.' });
    if (plan.audience !== req.account.role) {
      return res.status(403).json({ message: `Paket ini khusus untuk ${plan.audience}.` });
    }

    const result = await MembershipModel.subscribe(req.account, plan);
    if (result.status === 'active') {
      return res.status(201).json({ message: 'Paket aktif.', ...result });
    }
    if (result.status === 'pending') {
      try {
        const payment = await createMidtransTransaction({
          membershipId: result.membershipId,
          amount: Number(plan.price),
          email: req.account.email
        });
        const linked = await MembershipModel.setPendingPaymentRef(result.membershipId, payment.orderId);
        if (!linked) throw new Error('Pesanan tidak lagi menunggu pembayaran.');
        return res.status(202).json({
          message: 'Silakan selesaikan pembayaran melalui Midtrans.',
          ...result,
          paymentUrl: payment.paymentUrl,
          paymentToken: payment.token
        });
      } catch (paymentError) {
        await MembershipModel.cancelPending(result.membershipId).catch(() => {});
        console.error('Midtrans transaction creation error:', paymentError.message);
        return res.status(503).json({ message: 'Pembayaran belum dapat dibuat. Silakan coba lagi.' });
      }
    }
    return res.status(202).json({
      message: 'Menunggu pembayaran.',
      ...result,
      paymentUrl: null
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ message: 'Berlangganan gagal.' });
  }
});

router.post('/pending/retry', requirePermission('membership:own'), async (req, res) => {
  try {
    const pending = await MembershipModel.getPending(req.account.ownerKey);
    if (!pending) {
      return res.status(404).json({ message: 'Tidak ada pesanan menunggu pembayaran.' });
    }
    const plan = pending.plan;
    if (!plan.isActive) {
      await MembershipModel.cancelPending(pending.membershipId);
      return res.status(400).json({ message: 'Paket ini tidak lagi tersedia.' });
    }

    const payment = await createMidtransTransaction({
      membershipId: pending.membershipId,
      amount: Number(plan.price),
      email: req.account.email
    });

    const linked = await MembershipModel.setPendingPaymentRef(pending.membershipId, payment.orderId);
    if (!linked) {
      return res.status(409).json({ message: 'Pesanan tidak lagi menunggu pembayaran.' });
    }

    return res.status(202).json({
      status: 'pending',
      paymentUrl: payment.paymentUrl,
      paymentToken: payment.token
    });
  } catch (error) {
    console.error('Retry pending payment error:', error);
    return res.status(503).json({ message: 'Gagal membuat ulang pembayaran. Silakan coba lagi.' });
  }
});

// Batalkan langganan (kembali ke paket gratis)
router.post('/cancel', requirePermission('membership:own'), async (req, res) => {
  try {
    const changed = await MembershipModel.cancel(req.account.ownerKey);
    res.json({ success: true, cancelled: changed });
  } catch (error) {
    console.error('Cancel membership error:', error);
    res.status(500).json({ message: 'Pembatalan gagal.' });
  }
});

// ---------- Administrator ----------
const admin = requirePermission('membership:manage');

router.get('/admin/plans', admin, async (req, res) => {
  try {
    res.json({ plans: await MembershipModel.listPlans({ includeInactive: true }) });
  } catch (error) {
    console.error('Admin list plans error:', error);
    res.status(500).json({ message: 'Daftar paket gagal dimuat.' });
  }
});

router.post('/admin/plans', admin, async (req, res) => {
  const { code, name, audience, price, durationDays, features } = req.body || {};
  if (!/^[a-z0-9_]{3,50}$/.test(String(code || ''))) {
    return res.status(400).json({ message: 'code wajib huruf kecil/angka/underscore (3-50 karakter).' });
  }
  if (!name || String(name).length > 100) return res.status(400).json({ message: 'name wajib diisi (maks 100).' });
  if (![ROLES.SISWA, ROLES.GURU].includes(audience)) {
    return res.status(400).json({ message: 'audience harus siswa atau guru.' });
  }
  if (!isNonNegInt(price)) return res.status(400).json({ message: 'price harus bilangan bulat >= 0.' });
  if (durationDays != null && !(Number.isInteger(durationDays) && durationDays > 0)) {
    return res.status(400).json({ message: 'durationDays harus bilangan bulat > 0 atau null.' });
  }
  if (price > 0 && durationDays == null) {
    return res.status(400).json({ message: 'Paket berbayar wajib punya durationDays.' });
  }
  if (features !== undefined && !isObject(features)) {
    return res.status(400).json({ message: 'features harus berupa objek.' });
  }

  try {
    if (await MembershipModel.findPlanByCode(code)) {
      return res.status(409).json({ message: 'Kode paket sudah dipakai.' });
    }
    const plan = await MembershipModel.createPlan({
      code, name: String(name), audience, price, durationDays: durationDays ?? null, features
    });
    res.status(201).json({ plan });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ message: 'Paket gagal dibuat.' });
  }
});

router.patch('/admin/plans/:id', admin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: 'ID paket tidak valid.' });
  const { name, price, durationDays, features, isActive } = req.body || {};
  const allowedFields = ['name', 'price', 'durationDays', 'features', 'isActive'];
  if (!allowedFields.some((field) => Object.hasOwn(req.body || {}, field))) {
    return res.status(400).json({ message: 'Minimal satu field paket harus diperbarui.' });
  }
  if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.trim().length > 100)) {
    return res.status(400).json({ message: 'name wajib berupa teks (1-100 karakter).' });
  }
  if (price !== undefined && !isNonNegInt(price)) return res.status(400).json({ message: 'price tidak valid.' });
  if (durationDays !== undefined && durationDays !== null && !(Number.isInteger(durationDays) && durationDays > 0)) {
    return res.status(400).json({ message: 'durationDays harus bilangan bulat > 0 atau null.' });
  }
  if (features !== undefined && !isObject(features)) return res.status(400).json({ message: 'features harus berupa objek.' });
  if (isActive !== undefined && typeof isActive !== 'boolean') return res.status(400).json({ message: 'isActive harus boolean.' });

  try {
    const existing = await MembershipModel.findPlanById(id);
    if (!existing) return res.status(404).json({ message: 'Paket tidak ditemukan.' });
    const resultingPrice = price === undefined ? Number(existing.price) : price;
    const resultingDuration = durationDays === undefined ? existing.durationDays : durationDays;
    if (resultingPrice > 0 && resultingDuration == null) {
      return res.status(400).json({ message: 'Paket berbayar wajib punya durationDays.' });
    }
    const plan = await MembershipModel.updatePlan(id, { name, price, durationDays, features, isActive });
    if (!plan) return res.status(404).json({ message: 'Paket tidak ditemukan.' });
    res.json({ plan });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ message: 'Paket gagal diperbarui.' });
  }
});

// Konfirmasi pembayaran manual (sementara, sebelum payment gateway terpasang)
router.post('/admin/memberships/:id/confirm', admin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ message: 'ID tidak valid.' });
  try {
    const ok = await MembershipModel.activate(id, { paymentRef: req.body?.paymentRef || `manual:${req.account.ownerKey}` });
    if (!ok) return res.status(404).json({ message: 'Membership pending tidak ditemukan.' });
    res.json({ success: true });
  } catch (error) {
    console.error('Confirm membership error:', error);
    res.status(500).json({ message: 'Konfirmasi gagal.' });
  }
});

// Berikan paket langsung ke pengguna. Body: { authType, userId, planCode }
router.post('/admin/grant', admin, async (req, res) => {
  const { authType, userId, planCode } = req.body || {};
  if (!['manual', 'google'].includes(authType) || !userId) {
    return res.status(400).json({ message: 'authType (manual/google) dan userId wajib diisi.' });
  }
  try {
    const role = await RoleModel.getStoredRole(authType, String(userId));
    if (!role) return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    const plan = await MembershipModel.findPlanByCode(String(planCode || ''));
    if (!plan) return res.status(404).json({ message: 'Paket tidak ditemukan.' });
    if (!plan.isActive) return res.status(400).json({ message: 'Paket tidak aktif dan tidak dapat diberikan.' });
    if (plan.audience !== role) {
      return res.status(400).json({ message: `Paket ini untuk ${plan.audience}, pengguna berperan ${role}.` });
    }
    const target = { ownerKey: `${authType}:${userId}`, authType, userId: String(userId) };
    const { membershipId } = await MembershipModel.subscribe(target, { ...plan, price: 0 }, { grantedBy: req.account.ownerKey });
    res.status(201).json({ success: true, membershipId });
  } catch (error) {
    console.error('Grant membership error:', error);
    res.status(500).json({ message: 'Pemberian paket gagal.' });
  }
});

module.exports = router;
