const { uploadMemory } = require('../config/storage');

// Menangani error spesifik dari Multer (misal file melebihi batas 5MB)
const handleAvatarUpload = (req, res, next) => {
  const upload = uploadMemory.single('avatar'); // Nama field form: 'avatar'

  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        status: 'error',
        message: 'Gagal memproses file upload.',
        error: err.message
      });
    }
    next();
  });
};

module.exports = { handleAvatarUpload };