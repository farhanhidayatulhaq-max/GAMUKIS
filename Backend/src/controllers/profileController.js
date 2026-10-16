const UserModel = require('../models/userModel');

const normalizeBirthDate = (value) => {
  const rawValue = String(value || '').trim();
  const isoDate = /^\d{8}$/.test(rawValue)
    ? `${rawValue.slice(4, 8)}-${rawValue.slice(2, 4)}-${rawValue.slice(0, 2)}`
    : rawValue;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const date = new Date(`${isoDate}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === isoDate
    ? isoDate
    : null;
};

/**
 * 1. Mengambil data profil user yang sedang login
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await UserModel.getUserWithDetail(userId);

    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }

    return res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data profil.',
      error: error.message
    });
  }
};

/**
 * 2. Mengunggah / Memperbarui foto profil ke Google Drive
 */
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ message: 'Harap sertakan file gambar yang ingin diunggah.' });
    }

    return res.status(501).json({
      status: 'error',
      message: 'Penyimpanan avatar belum tersedia pada skema MySQL saat ini.'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengunggah foto profil ke Google Drive.',
      error: error.message
    });
  }
};

/**
 * 3. Memperbarui informasi profil (Nama, Bio, dll.)
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { gender, birthDate, school, address } = req.body;
    const normalizedBirthDate = normalizeBirthDate(birthDate);

    if (!normalizedBirthDate) {
      return res.status(400).json({ message: 'Tanggal lahir tidak valid. Gunakan DDMMYYYY.' });
    }

    await UserModel.upsertDetail(userId, {
      gender: gender || '',
      birthDate: normalizedBirthDate,
      schoolName: school || '',
      address: address || ''
    });

    return res.status(200).json({
      status: 'success',
      message: 'Profil berhasil diperbarui.'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui profil.',
      error: error.message
    });
  }
};