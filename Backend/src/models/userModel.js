const { pool } = require('../config/Database/MySQL/connection');

class UserModel {
  // 1. Cari user berdasarkan Email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ? LIMIT 1';
    const [rows] = await pool.query(query, [email]);
    return rows[0] || null;
  }

  // 2. Cari user berdasarkan Username (mencegah bentrok username)
  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = ? LIMIT 1';
    const [rows] = await pool.query(query, [username]);
    return rows[0] || null;
  }

  // 3. Cari user berdasarkan ID
  static async findById(id) {
    const query = 'SELECT id, username, email, created_at FROM users WHERE id = ?';
    const [rows] = await pool.query(query, [id]);
    return rows[0] || null;
  }

  // 4. Buat user baru (Register)
  static async create({ username, email, passwordHash }) {
    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    const [result] = await pool.query(query, [username, email, passwordHash]);
    
    return {
      id: result.insertId,
      username,
      email
    };
  }

  static async createWithDetail({ username, email, passwordHash, profile }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [userResult] = await connection.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, passwordHash]
      );
      await connection.query(
        `INSERT INTO users_detail (user_id, gender, birth_date, school_name, address)
         VALUES (?, ?, ?, ?, ?)`,
        [userResult.insertId, profile.gender, profile.birthDate, profile.schoolName, profile.address]
      );
      await connection.commit();
      return { id: userResult.insertId, username, email };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // 5. Simpan / Perbarui Detail Profil User (Upsert)
  static async upsertDetail(userId, { gender, birthDate, schoolName, address, role, fullName, subject }) {
    const query = `
      INSERT INTO users_detail (user_id, gender, birth_date, school_name, address, role, full_name, subject)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        gender = COALESCE(VALUES(gender), gender),
        birth_date = COALESCE(VALUES(birth_date), birth_date),
        school_name = COALESCE(VALUES(school_name), school_name),
        address = COALESCE(VALUES(address), address),
        role = COALESCE(VALUES(role), role),
        full_name = COALESCE(VALUES(full_name), full_name),
        subject = COALESCE(VALUES(subject), subject);
    `;
    const [result] = await pool.query(query, [userId, gender, birthDate, schoolName, address, role || null, fullName || null, subject || null]);
    return result;
  }

  // 6. Ambil data user beserta detail profilnya (JOIN Table)
  static async getUserWithDetail(userId) {
    const query = `
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.role AS user_role,
        ud.gender, 
        ud.birth_date, 
        ud.school_name, 
        ud.address,
        ud.role,
        ud.full_name,
        ud.subject,
        u.created_at,
        ud.updated_at
      FROM users u
      LEFT JOIN users_detail ud ON u.id = ud.user_id
      WHERE u.id = ?;
    `;
    const [rows] = await pool.query(query, [userId]);
    return rows[0] || null;
  }

  // 7. Simpan / Perbarui Detail Profil Akun Google di MySQL
  static async upsertGoogleProfile(firebaseUid, { gender, birthDate, schoolName, address }) {
    const query = `
      INSERT INTO google_user_profiles (firebase_uid, gender, birth_date, school_name, address)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        gender = COALESCE(VALUES(gender), gender),
        birth_date = COALESCE(VALUES(birth_date), birth_date),
        school_name = COALESCE(VALUES(school_name), school_name),
        address = COALESCE(VALUES(address), address);
    `;
    const [result] = await pool.query(query, [
      firebaseUid,
      gender || null,
      birthDate || null,
      schoolName || null,
      address || null
    ]);
    return result;
  }

  // 8. Ambil data profil Google dari MySQL
  static async getGoogleProfile(firebaseUid) {
    const query = `
      SELECT p.firebase_uid, p.gender, p.birth_date, p.school_name, p.address,
             r.email, r.role
        FROM google_user_profiles p
        LEFT JOIN google_user_roles r ON p.firebase_uid = r.firebase_uid
       WHERE p.firebase_uid = ?;
    `;
    const [rows] = await pool.query(query, [firebaseUid]);
    return rows[0] || null;
  }
}

module.exports = UserModel;
