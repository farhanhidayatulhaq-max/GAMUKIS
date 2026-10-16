const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const UserModel = require('../models/user.model');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

class GoogleAuthService {
  static async execute({ idToken }) {
    if (!idToken) {
      throw new Error('Google ID Token wajib disertakan.');
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email } = payload;

    let user = await UserModel.findByEmail(email);

    if (!user) {
      let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      let generatedUsername = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;

      const isUsernameTaken = await UserModel.findByUsername(generatedUsername);
      if (isUsernameTaken) {
        generatedUsername = `${baseUsername}_${Date.now().toString().slice(-4)}`;
      }

      user = await UserModel.create({
        username: generatedUsername,
        email,
        passwordHash: null
      });
    }

    const userDetail = await UserModel.getUserWithDetail(user.id);
    const hasCompletedProfile = !!(userDetail && userDetail.gender);

    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || 'secret_key_gamukis',
      { expiresIn: '7d' }
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

module.exports = GoogleAuthService;