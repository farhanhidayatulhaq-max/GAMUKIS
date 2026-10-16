const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Koneksi mysql2/promise

router.post('/profile', async (req, res) => {
  try {
    const { user_id, gender, birth_date, school_name, address } = req.body;

    // 1. Validasi Input Dasar
    if (!user_id || !birth_date) {
      return res.status(400).json({ 
        message: 'User ID dan Tanggal Lahir wajib diisi!' 
      });
    }

    // 2. Validasi Format Tanggal YYYY-MM-DD menggunakan Regex
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birth_date)) {
      return res.status(400).json({ 
        message: 'Format tanggal lahir tidak valid. Gunakan YYYY-MM-DD!' 
      });
    }

    // 3. Validasi Keabsahan Tanggal (Mencegah tanggal seperti 2005-02-31)
    const parsedDate = new Date(birth_date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ 
        message: 'Tanggal lahir tidak valid!' 
      });
    }

    // 4. Query Insert / Update ke Database MySQL
    const query = `
      INSERT INTO user_profiles (user_id, gender, birth_date, school_name, address)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        gender = VALUES(gender),
        birth_date = VALUES(birth_date),
        school_name = VALUES(school_name),
        address = VALUES(address)
    `;

    await db.execute(query, [user_id, gender, birth_date, school_name, address]);

    return res.status(200).json({
      success: true,
      message: 'Data profil berhasil disimpan!'
    });

  } catch (error) {
    console.error('Error saving profile:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan pada server.' 
    });
  }
});

module.exports = router;