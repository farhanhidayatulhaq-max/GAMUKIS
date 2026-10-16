const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { redisClient } = require('../config/database/redis/connection');
const UserModel = require('../models/user.model');
const EmailService = require('./email.service');

class RegisterService {
  // STEP 1: Simpan OTP & Data Sementara ke Redis, Kirim Email
  static async registerStepManual({ username, email, password }) {
    const existingEmail = await UserModel.findByEmail(email);
    if (existingEmail) throw new Error('Email sudah terdaftar.');

    const existingUsername = await UserModel.findByUsername(username);
    if (existingUsername) throw new Error('Username sudah digunakan.');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const passwordHash = await bcrypt.hash(password, 10);

    const redisOtpKey = `otp:${email}`;
    const redisUserKey = `temp_user:${email}`;

    await redisClient.setEx(redisOtpKey, 300, otp);
    await redisClient.setEx(
      redisUserKey,
      300,
      JSON.stringify({ username, email, passwordHash })
    );

    await EmailService.sendOtpEmail(email, otp);

    return { message: `Kode OTP telah dikirim ke email ${email}.` };
  }

  // STEP 2: Verifikasi OTP Redis -> Simpan ke MySQL
  static async verifyRegisterOtp({ email, otpInput }) {
    const redisOtpKey = `otp:${email}`;
    const redisUserKey = `temp_user:${email}`;

    const savedOtp = await redisClient.get(redisOtpKey);
    if (!savedOtp) {
      throw new Error('Kode OTP sudah kedaluwarsa atau tidak valid.');
    }

    if (savedOtp !== otpInput) {
      throw new Error('Kode OTP yang Anda masukkan salah.');
    }

    const tempUserDataRaw = await redisClient.get(redisUserKey);
    if (!tempUserDataRaw) {
      throw new Error('Data pendaftaran tidak ditemukan.');
    }

    const { username, passwordHash } = JSON.parse(tempUserDataRaw);

    const doubleCheckUser = await UserModel.findByEmail(email);
    if (doubleCheckUser) {
      await redisClient.del([redisOtpKey, redisUserKey]);
      throw new Error('Email ini baru saja terdaftar. Silakan login.');
    }

    const newUser = await UserModel.create({
      username,
      email,
      passwordHash
    });

    await redisClient.del([redisOtpKey, redisUserKey]);

    // Issue JWT Token agar user langsung berstatus login setelah OTP sukses
    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username, email: newUser.email },
      process.env.JWT_SECRET || 'secret_key_gamukis',
      { expiresIn: '1d' }
    );

    return {
      userId: newUser.id,
      username: newUser.username,
      email: newUser.email,
      hasCompletedProfile: false,
      token
    };
  }
}

module.exports = RegisterService;