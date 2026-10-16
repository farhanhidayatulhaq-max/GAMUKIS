const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Format token: "Bearer <TOKEN>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Akses ditolak. Token autentikasi tidak ditemukan.'
    });
  }

  try {
    // Memverifikasi token menggunakan secret key dari config/jwt.js
    const decoded = jwt.verify(token, jwtConfig.secret);
    
    // Menyimpan payload user ke objek req agar bisa dipakai di controller
    req.user = decoded; 
    
    next(); // Lanjut ke controller/middleware berikutnya
  } catch (error) {
    return res.status(403).json({
      status: 'error',
      message: 'Token tidak valid atau sudah kedaluwarsa.',
      error: error.message
    });
  }
};

module.exports = { authenticateToken };