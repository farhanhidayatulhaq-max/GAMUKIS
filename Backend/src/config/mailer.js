const nodemailer = require('nodemailer');

const smtpPort = Number(process.env.SMTP_PORT || 587);
const isSmtpConfigured = Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const verifyMailer = async () => {
  try {
    await transporter.verify();
    console.log('✅ [Mailer] SMTP Transporter is ready to send emails.');
  } catch (error) {
    console.warn('⚠️ [Mailer] SMTP Connection Warning:', error.message);
  }
};

const sendOtpEmail = async (recipient, otp) => {
  if (!isSmtpConfigured) {
    throw new Error('SMTP belum dikonfigurasi di backend.');
  }

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: recipient,
    subject: 'Kode OTP Registrasi GAMUKIS',
    text: `Kode OTP registrasi Anda adalah ${otp}. Kode berlaku selama 5 menit.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #303030;">
        <h2>Kode OTP Registrasi GAMUKIS</h2>
        <p>Gunakan kode berikut untuk menyelesaikan registrasi:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 8px;">${otp}</p>
        <p>Kode ini berlaku selama 5 menit.</p>
      </div>
    `
  });
};

module.exports = {
  transporter,
  verifyMailer,
  sendOtpEmail,
  defaultFrom: process.env.EMAIL_FROM || process.env.SMTP_USER,
  isSmtpConfigured
};