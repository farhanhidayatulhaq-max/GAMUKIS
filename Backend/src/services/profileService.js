const UserModel = require('../models/userModel');

class ProfileService {
  // Menyimpan/Memperbarui Data Diri (users_detail)
  static async updateProfile(userId, { gender, birthDate, schoolName, address }) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error('User tidak ditemukan.');

    await UserModel.upsertDetail(userId, {
      gender,
      birthDate,
      schoolName,
      address
    });

    return await UserModel.getUserWithDetail(userId);
  }

  // Mengambil Profil Lengkap User Manual
  static async getProfile(userId) {
    const profile = await UserModel.getUserWithDetail(userId);
    if (!profile) throw new Error('User tidak ditemukan.');

    return profile;
  }

  // Mengambil Profil Akun Google
  static async getGoogleProfile(firebaseUid) {
    return await UserModel.getGoogleProfile(firebaseUid);
  }

  // Menyimpan Profil Akun Google
  static async updateGoogleProfile(firebaseUid, profileData) {
    await UserModel.upsertGoogleProfile(firebaseUid, profileData);
    return await UserModel.getGoogleProfile(firebaseUid);
  }
}

module.exports = ProfileService;