const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const jwtConfig = require('../config/jwt');
const UserModel = require('../models/userModel');

exports.register = async (req, res) => {
  try {
    const { username, email, password, profile = {} } = req.body;
    const normalizedUsername = String(username || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedUsername || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Username, email, dan password wajib diisi.' });
    }
    if (await UserModel.findByEmail(normalizedEmail)) {
      return res.status(409).json({ message: 'Email sudah terdaftar.' });
    }
    if (await UserModel.findByUsername(normalizedUsername)) {
      return res.status(409).json({ message: 'Username sudah digunakan.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await UserModel.createWithDetail({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      profile: {
        gender: profile.gender || '',
        birthDate: profile.birthDate || null,
        schoolName: profile.school || '',
        address: profile.address || ''
      }
    });

    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email, authType: 'manual' },
      jwtConfig.secret,
      jwtConfig.options
    );

    return res.status(201).json({ message: 'Registrasi berhasil.', user, token });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Registrasi gagal.' });
  }
};

exports.login = async (req, res) => {
  try {
    const identifier = String(req.body.identifier || req.body.email || '').trim();
    const password = String(req.body.password || '');
    const user = identifier.includes('@')
      ? await UserModel.findByEmail(identifier.toLowerCase())
      : await UserModel.findByUsername(identifier);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Username/email atau password salah.' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email, authType: 'manual' },
      jwtConfig.secret,
      jwtConfig.options
    );

    return res.status(200).json({
      message: 'Login berhasil.',
      user: { id: user.id, username: user.username, email: user.email },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login gagal.' });
  }
};