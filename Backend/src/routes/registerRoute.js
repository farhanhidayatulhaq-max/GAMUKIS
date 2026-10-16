const express = require('express');
const router = express.Router();
const RegisterController = require('../controllers/register.controller');

// Step 1: Input Form Manual -> Kirim OTP ke Email & Simpan Redis
router.post('/manual', RegisterController.registerManual);

// Step 2: Input OTP dari UI -> Pindahkan Redis ke MySQL
router.post('/verify-otp', RegisterController.verifyOtp);

module.exports = router;