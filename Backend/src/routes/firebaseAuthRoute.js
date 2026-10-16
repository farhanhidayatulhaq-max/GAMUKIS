const express = require('express');
const router = express.Router();
const { firebaseAuth } = require('../config/Database/Firebase/admin');
const RoleModel = require('../models/roleModel');
const UserModel = require('../models/userModel');

const verifyBearerToken = async (req, res) => {
  const authorization = req.headers.authorization || '';
  if (!authorization.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Firebase ID token diperlukan.' });
    return null;
  }

  try {
    return await firebaseAuth.verifyIdToken(authorization.slice('Bearer '.length));
  } catch (error) {
    res.status(401).json({ message: 'Firebase ID token tidak valid.' });
    return null;
  }
};

router.post('/session', async (req, res) => {
  const decodedToken = await verifyBearerToken(req, res);
  if (!decodedToken) return;

  try {
    const role = await RoleModel.resolve({
      authType: 'google',
      userId: decodedToken.uid,
      email: decodedToken.email || null,
      emailVerified: decodedToken.email_verified === true
    });
    return res.json({
      user: {
        id: decodedToken.uid,
        email: decodedToken.email || null,
        username: decodedToken.name || decodedToken.email?.split('@')[0] || decodedToken.uid,
        picture: decodedToken.picture || null,
        role: role ?? null
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Sesi pengguna gagal dibuat.' });
  }
});

router.get('/profile', async (req, res) => {
  const decodedToken = await verifyBearerToken(req, res);
  if (!decodedToken) return;

  try {
    const sqlProfile = await UserModel.getGoogleProfile(decodedToken.uid);
    if (sqlProfile && (sqlProfile.gender || sqlProfile.birth_date || sqlProfile.school_name || sqlProfile.address)) {
      let birthDate = String(sqlProfile.birth_date || '').trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(birthDate)) {
        const [y, m, d] = birthDate.slice(0, 10).split('-');
        birthDate = `${d}${m}${y}`;
      }
      return res.json({
        profile: {
          gender: sqlProfile.gender || '',
          birthDate,
          school: sqlProfile.school_name || '',
          address: sqlProfile.address || ''
        }
      });
    }

    const { firebaseDatabase } = require('../config/Database/Firebase/admin');
    const snapshot = await firebaseDatabase.ref(`profiles/${decodedToken.uid}`).once('value');
    const storedProfile = snapshot.val() || {};

    if (storedProfile.gender || storedProfile.birthDate || storedProfile.school || storedProfile.address) {
      await UserModel.upsertGoogleProfile(decodedToken.uid, {
        gender: storedProfile.gender || '',
        birthDate: storedProfile.birthDate || '',
        schoolName: storedProfile.school || '',
        address: storedProfile.address || ''
      }).catch((err) => console.warn('Backfill profile to MySQL failed:', err.message));
    }

    return res.json({
      profile: {
        gender: storedProfile.gender || '',
        birthDate: storedProfile.birthDate || '',
        school: storedProfile.school || '',
        address: storedProfile.address || ''
      }
    });
  } catch (error) {
    console.error('Firebase profile GET error:', error);
    return res.status(500).json({ message: 'Profil gagal dimuat.' });
  }
});

router.post('/profile', async (req, res) => {
  const decodedToken = await verifyBearerToken(req, res);
  if (!decodedToken) return;

  const { gender, birthDate, school, address } = req.body;
  if (!birthDate) {
    return res.status(400).json({ message: 'Tanggal lahir wajib diisi.' });
  }

  try {
    await UserModel.upsertGoogleProfile(decodedToken.uid, {
      gender: gender || '',
      birthDate: String(birthDate).trim(),
      schoolName: school || '',
      address: address || ''
    });

    const { firebaseDatabase } = require('../config/Database/Firebase/admin');
    await firebaseDatabase.ref(`profiles/${decodedToken.uid}`).update({
      gender: gender || '',
      birthDate,
      school: school || '',
      address: address || ''
    });
    return res.json({ success: true, message: 'Profil berhasil disimpan.' });
  } catch (error) {
    return res.status(500).json({ message: 'Profil gagal disimpan.' });
  }
});

router.put('/complete-profile', async (req, res) => {
  const decodedToken = await verifyBearerToken(req, res);
  if (!decodedToken) return;

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
    await RoleModel.resolve({
      authType: 'google',
      userId: decodedToken.uid,
      email: decodedToken.email || null,
      emailVerified: decodedToken.email_verified === true
    });
    let teacherApplication = null;
    if (role === 'guru') {
      teacherApplication = await RoleModel.submitTeacherApplication({
        authType: 'google', userId: decodedToken.uid, email: decodedToken.email || null,
        fullName, subject
      });
    } else {
      if (!(await RoleModel.setSelfRole('google', decodedToken.uid, role, decodedToken.email || null))) {
        return res.status(403).json({ message: 'Role tidak dapat diubah sendiri.' });
      }
      await RoleModel.withdrawTeacherApplication('google', decodedToken.uid);
      teacherApplication = await RoleModel.getTeacherApplication('google', decodedToken.uid);
    }
    const { gender, birthDate, school, address } = req.body;
    if (gender || birthDate || school || address) {
      await UserModel.upsertGoogleProfile(decodedToken.uid, {
        gender: gender || '',
        birthDate: birthDate ? String(birthDate).trim() : '',
        schoolName: school || '',
        address: address || ''
      }).catch((e) => console.warn('Complete-profile MySQL profile upsert warn:', e.message));
    }
    const { firebaseDatabase } = require('../config/Database/Firebase/admin');
    await firebaseDatabase.ref(`profiles/${decodedToken.uid}/onboarding`).set({
      role, fullName, subject, ...(teacherApplication ? { teacherApplicationStatus: teacherApplication.status } : {}),
      completedAt: new Date().toISOString()
    });
    return res.json({
      success: true,
      message: role === 'guru' && teacherApplication.status === 'pending'
        ? 'Pengajuan Guru dikirim dan menunggu persetujuan administrator.'
        : 'Data diri berhasil disimpan.',
      ...(teacherApplication ? { teacherApplication } : {}),
      user: {
        id: decodedToken.uid,
        email: decodedToken.email || null,
        username: decodedToken.name || decodedToken.email?.split('@')[0] || decodedToken.uid,
        role: role === 'guru' && teacherApplication.status !== 'approved' ? null : role,
        subject: role === 'guru' ? subject : '',
        fullName,
        ...(teacherApplication ? { teacherApplication } : {})
      }
    });
  } catch (error) {
    if (error.code === 'ROLE_CHANGE_FORBIDDEN') return res.status(403).json({ message: error.message });
    return res.status(500).json({ message: 'Data diri gagal disimpan.' });
  }
});

router.patch('/role', async (req, res) => {
  const decodedToken = await verifyBearerToken(req, res);
  if (!decodedToken) return;

  const role = String(req.body.role || '').trim().toLowerCase();
  const subject = String(req.body.subject || '').trim();

  if (!['guru', 'siswa'].includes(role)) {
    return res.status(400).json({ message: 'Pilih peran Guru atau Siswa.' });
  }
  if (role === 'guru' && (!subject || subject.length > 100)) {
    return res.status(400).json({ message: 'Pilih mata pelajaran yang valid.' });
  }

  try {
    await RoleModel.resolve({
      authType: 'google',
      userId: decodedToken.uid,
      email: decodedToken.email || null,
      emailVerified: decodedToken.email_verified === true
    });
    let teacherApplication = null;
    if (role === 'guru') {
      teacherApplication = await RoleModel.submitTeacherApplication({
        authType: 'google', userId: decodedToken.uid, email: decodedToken.email || null,
        fullName: decodedToken.name || decodedToken.email?.split('@')[0] || decodedToken.uid,
        subject
      });
    } else {
      if (!(await RoleModel.setSelfRole('google', decodedToken.uid, role, decodedToken.email || null))) {
        return res.status(403).json({ message: 'Role tidak dapat diubah sendiri.' });
      }
      await RoleModel.withdrawTeacherApplication('google', decodedToken.uid);
      teacherApplication = await RoleModel.getTeacherApplication('google', decodedToken.uid);
    }
    const { firebaseDatabase } = require('../config/Database/Firebase/admin');
    await firebaseDatabase.ref(`profiles/${decodedToken.uid}/onboarding`).update({
      role,
      subject: role === 'guru' ? subject : '',
      ...(teacherApplication ? { teacherApplicationStatus: teacherApplication.status } : {}),
      updatedAt: new Date().toISOString()
    });
    return res.json({
      success: true,
      message: role === 'guru' && teacherApplication.status === 'pending'
        ? 'Pengajuan Guru dikirim dan menunggu persetujuan administrator.'
        : 'Peran berhasil diperbarui.',
      ...(teacherApplication ? { teacherApplication } : {}),
      user: {
        id: decodedToken.uid,
        email: decodedToken.email || null,
        username: decodedToken.name || decodedToken.email?.split('@')[0] || decodedToken.uid,
        role: role === 'guru' && teacherApplication.status !== 'approved' ? null : role,
        subject: role === 'guru' ? subject : '',
        ...(teacherApplication ? { teacherApplication } : {})
      }
    });
  } catch (error) {
    if (error.code === 'ROLE_CHANGE_FORBIDDEN') return res.status(403).json({ message: error.message });
    return res.status(500).json({ message: 'Peran gagal disimpan.' });
  }
});

module.exports = router;
