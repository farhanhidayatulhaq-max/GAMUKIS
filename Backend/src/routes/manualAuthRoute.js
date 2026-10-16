const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { redisClient } = require('../config/Database/Redis/connections');
const UserModel = require('../models/userModel');
const { isSmtpConfigured, sendOtpEmail } = require('../config/mailer');
const RoleModel = require('../models/roleModel');

const router = express.Router();
const { jwtSecret } = require('../config/jwtConfig');
const otpPrefix = 'manual-register:otp:';
const verifiedPrefix = 'manual-register:verified:';
const ensureRedis = async () => {
  if (redisClient.status === 'wait') await redisClient.connect();
};

const validateAccount = async ({ username, email, password }) => {
  const normalizedUsername = String(username || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedUsername || !normalizedEmail || !password) {
    return { error: 'Username, email, dan password wajib diisi.' };
  }
  if (normalizedUsername.length < 3 || password.length < 6) {
    return { error: 'Username minimal 3 karakter dan password minimal 6 karakter.' };
  }

  return { normalizedUsername, normalizedEmail };
};

const createToken = (user) => jwt.sign(
  { userId: user.id, username: user.username, email: user.email, role: user.role || null, authType: 'manual' },
  jwtSecret,
  { expiresIn: '1d' }
);

const normalizeBirthDate = (value) => {
  const rawValue = String(value || '').trim();
  let isoDate = rawValue;

  if (/^\d{8}$/.test(rawValue)) {
    const day = rawValue.slice(0, 2);
    const month = rawValue.slice(2, 4);
    const year = rawValue.slice(4, 8);
    isoDate = `${year}-${month}-${day}`;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;

  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== isoDate) {
    return null;
  }

  return isoDate;
};

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

const resolveManualRole = (user) => RoleModel.resolve({
  authType: 'manual',
  userId: String(user.userId),
  email: user.email || null,
  emailVerified: true
});

router.post('/register', async (req, res) => {
  try {
    const validation = await validateAccount(req.body);
    if (validation.error) return res.status(400).json({ message: validation.error });
    const { normalizedUsername, normalizedEmail } = validation;
    await ensureRedis();
    const pendingUser = await redisClient.get(`${verifiedPrefix}${normalizedEmail}`);
    if (!pendingUser) {
      return res.status(409).json({ message: 'Email belum diverifikasi dengan OTP.' });
    }

    const { passwordHash, profile } = JSON.parse(pendingUser);
    const user = await UserModel.createWithDetail({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      profile
    });
    const role = await RoleModel.resolve({
      authType: 'manual', userId: String(user.id), email: user.email, emailVerified: true
    });
    const authenticatedUser = { ...user, role };

    await redisClient.del(`${verifiedPrefix}${normalizedEmail}`);
    return res.status(201).json({
      message: 'Registrasi berhasil.',
      user: { id: user.id, username: user.username, email: user.email, role },
      token: createToken(authenticatedUser)
    });
  } catch (error) {
    console.error('Manual registration error:', error);
    return res.status(500).json({ message: 'Registrasi gagal.' });
  }
});

router.post('/register/request-otp', async (req, res) => {
  try {
    const { profile = {} } = req.body;
    const validation = await validateAccount(req.body);
    if (validation.error) return res.status(400).json({ message: validation.error });

    const { normalizedUsername, normalizedEmail } = validation;
    const normalizedBirthDate = normalizeBirthDate(profile.birthDate);
    if (!normalizedBirthDate) {
      return res.status(400).json({ message: 'Tanggal lahir tidak valid. Gunakan DDMMYYYY.' });
    }
    if (!isSmtpConfigured) {
      return res.status(503).json({ message: 'SMTP belum dikonfigurasi di backend.' });
    }
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await ensureRedis();
    await redisClient.set(`${otpPrefix}${normalizedEmail}`, JSON.stringify({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      otp,
      profile: {
        gender: profile.gender || '',
        birthDate: normalizedBirthDate,
        schoolName: profile.school || '',
        address: profile.address || ''
      }
    }), 'EX', 300);

    await sendOtpEmail(normalizedEmail, otp);

    return res.json({ message: 'Kode OTP telah dikirim ke email.' });
  } catch (error) {
    console.error('Request registration OTP error:', error);
    return res.status(500).json({ message: 'Kode OTP gagal dikirim.' });
  }
});

router.post('/register/verify-otp', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();
    await ensureRedis();
    const pendingKey = `${otpPrefix}${email}`;
    const pendingUser = await redisClient.get(pendingKey);

    if (!pendingUser || JSON.parse(pendingUser).otp !== otp) {
      return res.status(400).json({ message: 'Kode OTP salah atau sudah kedaluwarsa.' });
    }

    const { username, passwordHash, profile } = JSON.parse(pendingUser);
      if (await UserModel.findByEmail(email)) {
        return res.status(409).json({ message: 'Email sudah terdaftar.' });
      }
      if (await UserModel.findByUsername(username)) {
        return res.status(409).json({ message: 'Username sudah digunakan.' });
      }
    const user = await UserModel.createWithDetail({
      username,
      email,
      passwordHash,
      profile
    });
    const role = await RoleModel.resolve({
      authType: 'manual', userId: String(user.id), email, emailVerified: true
    });
    const authenticatedUser = { ...user, role };
    await redisClient.del(pendingKey);
    return res.status(201).json({
      message: 'Registrasi dan verifikasi berhasil.',
      user: { id: user.id, username: user.username, email: user.email, role },
      token: createToken(authenticatedUser)
    });
  } catch (error) {
    console.error('Verify registration OTP error:', error);
    return res.status(500).json({ message: 'Verifikasi OTP gagal.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const identifier = String(req.body.identifier || '').trim();
    const password = String(req.body.password || '');
    const user = identifier.includes('@')
      ? await UserModel.findByEmail(identifier.toLowerCase())
      : await UserModel.findByUsername(identifier);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Username/email atau password salah.' });
    }

    const role = await RoleModel.resolve({
      authType: 'manual', userId: String(user.id), email: user.email, emailVerified: true
    });
    const authenticatedUser = { ...user, role };

    return res.json({
      message: 'Login berhasil.',
      user: { id: user.id, username: user.username, email: user.email, role },
      token: createToken(authenticatedUser)
    });
  } catch (error) {
    console.error('Manual login error:', error);
    return res.status(500).json({ message: 'Login gagal.' });
  }
});

router.get('/profile', authenticateManualToken, async (req, res) => {
  try {
    const user = await UserModel.getUserWithDetail(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });

    const birthDate = user.birth_date instanceof Date
      ? `${String(user.birth_date.getDate()).padStart(2, '0')}${String(user.birth_date.getMonth() + 1).padStart(2, '0')}${user.birth_date.getFullYear()}`
      : (() => {
        const storedBirthDate = String(user.birth_date || '').slice(0, 10);
        return /^\d{4}-\d{2}-\d{2}$/.test(storedBirthDate)
          ? `${storedBirthDate.slice(8, 10)}${storedBirthDate.slice(5, 7)}${storedBirthDate.slice(0, 4)}`
          : '';
      })();

    return res.json({
      profile: {
        gender: user.gender || '',
        birthDate,
        school: user.school_name || '',
        address: user.address || ''
      }
    });
  } catch (error) {
    console.error('Manual profile lookup error:', error);
    return res.status(500).json({ message: 'Profil gagal dimuat.' });
  }
});

router.post('/profile', authenticateManualToken, async (req, res) => {
  try {
    const { gender, birthDate, school, address } = req.body;
    const normalizedBirthDate = normalizeBirthDate(birthDate);
    if (!normalizedBirthDate) {
      return res.status(400).json({ message: 'Tanggal lahir tidak valid. Gunakan DDMMYYYY.' });
    }

    await UserModel.upsertDetail(req.user.userId, {
      gender,
      birthDate: normalizedBirthDate,
      schoolName: school,
      address
    });
    return res.json({ success: true, message: 'Profil berhasil disimpan.' });
  } catch (error) {
    console.error('Manual profile error:', error);
    return res.status(500).json({ message: 'Profil gagal disimpan.' });
  }
});

router.put('/complete-profile', authenticateManualToken, async (req, res) => {
  const role = String(req.body.role || '').trim().toLowerCase();
  const fullName = String(req.body.fullName || '').trim();
  const subject = String(req.body.subject || '').trim();
  if (!['guru', 'siswa'].includes(role)) {
    return res.status(400).json({ message: 'Pilih peran Guru atau Siswa.' });
  }
  if (fullName.length < 2 || fullName.length > 255) {
    return res.status(400).json({ message: 'Nama lengkap wajib diisi (2–255 karakter).' });
  }
  if (role === 'guru' && (!subject || subject.length > 100)) {
    return res.status(400).json({ message: 'Pilih mata pelajaran yang valid.' });
  }

  try {
    await resolveManualRole(req.user);
    let teacherApplication = null;
    if (role === 'guru') {
      teacherApplication = await RoleModel.submitTeacherApplication({
        authType: 'manual', userId: req.user.userId, email: req.user.email, fullName, subject
      });
    } else {
      if (!(await RoleModel.setSelfRole('manual', req.user.userId, role))) {
        return res.status(403).json({ message: 'Role tidak dapat diubah sendiri.' });
      }
      await RoleModel.withdrawTeacherApplication('manual', req.user.userId);
      teacherApplication = await RoleModel.getTeacherApplication('manual', req.user.userId);
      await UserModel.upsertDetail(req.user.userId, {
        role, fullName, subject: '', gender: null, birthDate: null, schoolName: null, address: null
      });
    }
    const updatedUser = await UserModel.getUserWithDetail(req.user.userId);
    return res.json({
      success: true,
      message: role === 'guru' && teacherApplication.status === 'pending'
        ? 'Pengajuan Guru dikirim dan menunggu persetujuan administrator.'
        : 'Data diri berhasil disimpan.',
      ...(teacherApplication ? { teacherApplication } : {}),
      user: {
        id: req.user.userId,
        username: req.user.username,
        email: req.user.email,
        role: updatedUser?.user_role ?? (role === 'guru' ? null : role),
        subject: updatedUser?.subject || subject,
        fullName: updatedUser?.full_name || fullName,
        ...(teacherApplication ? { teacherApplication } : {})
      }
    });
  } catch (error) {
    if (error.code === 'ROLE_CHANGE_FORBIDDEN') return res.status(403).json({ message: error.message });
    console.error('Complete profile error:', error);
    return res.status(500).json({ message: 'Data diri gagal disimpan.' });
  }
});

router.patch('/role', authenticateManualToken, async (req, res) => {
  const role = String(req.body.role || '').trim().toLowerCase();
  const subject = String(req.body.subject || '').trim();

  if (!['guru', 'siswa'].includes(role)) {
    return res.status(400).json({ message: 'Pilih peran Guru atau Siswa.' });
  }
  if (role === 'guru' && (!subject || subject.length > 100)) {
    return res.status(400).json({ message: 'Pilih mata pelajaran yang valid.' });
  }

  try {
    await resolveManualRole(req.user);
    const updatedUser = await UserModel.getUserWithDetail(req.user.userId);
    let teacherApplication = null;
    if (role === 'guru') {
      teacherApplication = await RoleModel.submitTeacherApplication({
        authType: 'manual', userId: req.user.userId, email: req.user.email,
        fullName: updatedUser?.full_name || req.user.username, subject
      });
    } else {
      if (!(await RoleModel.setSelfRole('manual', req.user.userId, role))) {
        return res.status(403).json({ message: 'Role tidak dapat diubah sendiri.' });
      }
      await RoleModel.withdrawTeacherApplication('manual', req.user.userId);
      teacherApplication = await RoleModel.getTeacherApplication('manual', req.user.userId);
      await UserModel.upsertDetail(req.user.userId, {
        role, subject: '', gender: null, birthDate: null, schoolName: null, address: null
      });
    }
    return res.json({
      success: true,
      message: role === 'guru' && teacherApplication.status === 'pending'
        ? 'Pengajuan Guru dikirim dan menunggu persetujuan administrator.'
        : 'Peran berhasil diperbarui.',
      ...(teacherApplication ? { teacherApplication } : {}),
      user: {
        id: req.user.userId,
        username: req.user.username,
        email: req.user.email,
        role: role === 'guru' ? (teacherApplication.status === 'approved' ? 'guru' : null) : role,
        subject: role === 'guru' ? subject : '',
        fullName: updatedUser?.full_name || req.user.username,
        ...(teacherApplication ? { teacherApplication } : {})
      }
    });
  } catch (error) {
    if (error.code === 'ROLE_CHANGE_FORBIDDEN') return res.status(403).json({ message: error.message });
    console.error('Update role error:', error);
    return res.status(500).json({ message: 'Peran gagal disimpan.' });
  }
});

module.exports = router;
