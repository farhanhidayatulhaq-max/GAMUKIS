const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const app = express();
app.use(express.json());
app.use(cors());

// Konfigurasi Kunci & Client ID
const GOOGLE_CLIENT_ID = 'PASTE_GOOGLE_CLIENT_ID_ANDA_DI_SINI.apps.googleusercontent.com';
const JWT_SECRET = 'super_secret_key_aplikasi_anda_12345'; // Gunakan environment variable di produksi

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// -------------------------------------------------------------
// Endpoint 1: Verifikasi Google Token & Generate Custom JWT
// -------------------------------------------------------------
app.post('/api/auth/google', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'Token Google tidak ditemukan.' });
  }

  try {
    // 1. Verifikasi ID Token ke Google Server
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // 2. Logika Database Aplikasi Anda (Opsional)
    // Di sini Anda bisa mencari atau merekam user ke Database lokal:
    // let user = await User.findOne({ email });
    // if (!user) { user = await User.create({ googleId, email, name, picture }); }

    // 3. Buat Custom JWT milik aplikasi Anda
    const appToken = jwt.sign(
      {
        userId: googleId, // atau ID dari database Anda
        email: email,
        name: name,
        picture: picture,
        role: 'user' // Bebas menambahkan custom claim
      },
      JWT_SECRET,
      { expiresIn: '1d' } // Masa berlaku token 1 hari
    );

    // 4. Kirim token kembali ke frontend
    return res.json({
      message: 'Login berhasil',
      token: appToken,
      user: { name, email, picture }
    });

  } catch (error) {
    console.error('Verifikasi Google Token Gagal:', error);
    return res.status(401).json({ message: 'Token Google tidak valid.' });
  }
});

// -------------------------------------------------------------
// Middleware: Autentikasi JWT untuk Protected Routes
// -------------------------------------------------------------
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
      if (err) {
        return res.status(403).json({ message: 'Token tidak valid atau kedaluwarsa.' });
      }
      req.user = decodedUser;
      next();
    });
  } else {
    res.status(401).json({ message: 'Header otorisasi tidak ditemukan.' });
  }
};

// -------------------------------------------------------------
// Endpoint 2: Protected Route (Hanya bisa diakses jika ada JWT)
// -------------------------------------------------------------
app.get('/api/profile', authenticateJWT, (req, res) => {
  res.json({
    message: 'Berhasil mengakses data rahasia!',
    userData: req.user
  });
});

app.listen(3000, () => {
  console.log('Server berjalan di http://localhost:3000');
});