const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

class LoginService {
  static async execute({ identifier, password, rememberMe = false }) {
    if (!identifier || !password) {
      throw new Error('Username/Email dan password wajib diisi.');
    }

    const user = identifier.includes('@')
      ? await UserModel.findByEmail(identifier)
      : await UserModel.findByUsername(identifier);

    if (!user) {
      throw new Error('Username/Email atau password salah.');
    }

    if (!user.password) {
      throw new Error('Akun ini terdaftar via Google. Silakan klik "Lanjutkan dengan Google".');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Username/Email atau password salah.');
    }

    const userDetail = await UserModel.getUserWithDetail(user.id);
    const hasCompletedProfile = !!(userDetail && userDetail.gender);

    const expiresIn = rememberMe ? '30d' : '1d';
    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'secret_key_gamukis',
      { expiresIn }
    );

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      hasCompletedProfile,
      token
    };
  }
}

module.exports = LoginService;