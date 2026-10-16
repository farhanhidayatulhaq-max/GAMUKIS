const path = require('path');
const multer = require('multer');

// Lokasi penyimpanan file lokal
const uploadDir = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Hanya menerima file gambar
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diperbolehkan!'), false);
  }
};

module.exports = {
  uploadLocal: multer({
    storage: storage,
    limits: {
      fileSize: 2 * 1024 * 1024 // Batas maksimal file 2 MB
    },
    fileFilter: fileFilter
  }),
  uploadDir
};