const { pool } = require('../config/Database/MySQL/connection');
const { ROLES, SELF_SERVICE_ROLES, normalizeRole } = require('../config/permissions');

const adminEmails = () => String(process.env.ADMIN_EMAILS || '')
  .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

const isBootstrapAdmin = (email) => Boolean(email) && adminEmails().includes(String(email).toLowerCase());

class RoleModel {
  // undefined means the account does not exist; null means its role is not selected yet.
  static async getStoredRole(authType, userId) {
    if (authType === 'manual') {
      const [rows] = await pool.query('SELECT role FROM users WHERE id = ? LIMIT 1', [userId]);
      return rows[0] ? normalizeRole(rows[0].role) : undefined;
    }
    const [rows] = await pool.query('SELECT role FROM google_user_roles WHERE firebase_uid = ? LIMIT 1', [userId]);
    return rows[0] ? normalizeRole(rows[0].role) : undefined;
  }

  /**
   * Role efektif yang dipakai pada setiap request (selalu dibaca dari DB, bukan dari JWT).
   * ADMIN_EMAILS di .env menjadi bootstrap administrator pertama (email harus terverifikasi).
   */
  static async resolve({ authType, userId, email, emailVerified }) {
    let role = await this.getStoredRole(authType, userId);
    if (authType === 'google' && role === undefined) role = null;
    if (role !== ROLES.ADMIN && emailVerified && isBootstrapAdmin(email)) {
      const wasSaved = await this.setRole(authType, userId, ROLES.ADMIN, email);
      if (wasSaved) role = ROLES.ADMIN;
    }
    return role;
  }

  static async setRole(authType, userId, role, email = null) {
    const normalized = normalizeRole(role);
    if (!normalized) throw new Error('Role tidak valid.');
    if (authType === 'manual') {
      const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [normalized, userId]);
      return result.affectedRows > 0;
    }
    await pool.query(
      `INSERT INTO google_user_roles (firebase_uid, email, role) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE role = VALUES(role), email = COALESCE(VALUES(email), email)`,
      [userId, email, normalized]
    );
    return true;
  }

  // Pilihan role saat onboarding: hanya siswa/guru, dan tidak pernah mengubah administrator.
  static async setSelfRole(authType, userId, role, email = null) {
    if (!SELF_SERVICE_ROLES.includes(role)) return false;
    // Guru access requires admin approval; onboarding must use submitTeacherApplication.
    if (role === ROLES.GURU) return false;
    const current = await this.getStoredRole(authType, userId);
    if (current === ROLES.ADMIN) return false;
    return this.setRole(authType, userId, role, email);
  }

  static async getTeacherApplication(authType, userId) {
    const [rows] = await pool.query(
      `SELECT id, status, full_name AS fullName, subject, created_at AS createdAt
         FROM teacher_applications WHERE auth_type = ? AND user_id = ? LIMIT 1`,
      [authType, String(userId)]
    );
    return rows[0] || null;
  }

  static async submitTeacherApplication({ authType, userId, email = null, fullName, subject }) {
    if (!['manual', 'google'].includes(authType)) throw new Error('Jenis akun tidak valid.');
    fullName = String(fullName || '').trim();
    subject = String(subject || '').trim();
    if (fullName.length < 2 || fullName.length > 255 || !subject || subject.length > 100) {
      throw new Error('Nama lengkap dan mata pelajaran wajib diisi dengan benar.');
    }
    const id = String(userId);
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      let rows;
      if (authType === 'manual') {
        [rows] = await connection.query('SELECT role FROM users WHERE id = ? FOR UPDATE', [id]);
      } else {
        [rows] = await connection.query('SELECT role FROM google_user_roles WHERE firebase_uid = ? FOR UPDATE', [id]);
        if (!rows[0]) {
          await connection.query(
            `INSERT INTO google_user_roles (firebase_uid, email, role) VALUES (?, ?, NULL)
             ON DUPLICATE KEY UPDATE email = COALESCE(VALUES(email), email)`,
            [id, email]
          );
          [rows] = await connection.query('SELECT role FROM google_user_roles WHERE firebase_uid = ? FOR UPDATE', [id]);
        }
      }
      if (!rows[0]) throw new Error('Akun tidak ditemukan.');
      const currentRole = normalizeRole(rows[0].role);
      if (currentRole === ROLES.ADMIN) {
        const error = new Error('Administrator tidak dapat mengajukan role Guru.');
        error.code = 'ROLE_CHANGE_FORBIDDEN';
        throw error;
      }
      if (currentRole === ROLES.GURU) {
        const [applications] = await connection.query(
          `SELECT id, status, full_name AS fullName, subject, created_at AS createdAt
             FROM teacher_applications WHERE auth_type = ? AND user_id = ? LIMIT 1`, [authType, id]
        );
        await connection.commit();
        return applications[0] || { status: 'approved', fullName, subject };
      }

      await connection.query(
        `INSERT INTO teacher_applications (auth_type, user_id, email, full_name, subject, status)
         VALUES (?, ?, ?, ?, ?, 'pending')
         ON DUPLICATE KEY UPDATE email = VALUES(email), full_name = VALUES(full_name), subject = VALUES(subject),
           status = IF(status = 'approved', 'approved', 'pending'), reviewed_by = NULL, reviewed_at = NULL`,
        [authType, id, email, fullName, subject]
      );
      if (authType === 'manual') {
        await connection.query(
          `INSERT INTO users_detail (user_id, role, full_name, subject) VALUES (?, NULL, ?, ?)
           ON DUPLICATE KEY UPDATE role = NULL, full_name = VALUES(full_name), subject = VALUES(subject)`,
          [id, fullName, subject]
        );
      }
      const [applicationRows] = await connection.query(
        `SELECT id, status, full_name AS fullName, subject, created_at AS createdAt
           FROM teacher_applications WHERE auth_type = ? AND user_id = ? LIMIT 1`, [authType, id]
      );
      await connection.commit();
      return applicationRows[0];
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async withdrawTeacherApplication(authType, userId) {
    await pool.query(
      "UPDATE teacher_applications SET status = 'withdrawn' WHERE auth_type = ? AND user_id = ? AND status = 'pending'",
      [authType, String(userId)]
    );
  }

  static async listPendingTeacherApplications() {
    const [rows] = await pool.query(
      `SELECT a.id, a.auth_type AS authType, a.user_id AS userId, a.email,
              u.username, a.full_name AS fullName, a.subject,
              a.status, a.created_at AS createdAt
         FROM teacher_applications a
         LEFT JOIN users u ON a.auth_type = 'manual' AND CAST(u.id AS CHAR) = a.user_id
        WHERE a.status = 'pending' ORDER BY a.created_at ASC, a.id ASC`
    );
    return rows;
  }

  static async reviewTeacherApplication(applicationId, status, reviewedBy) {
    if (!['approved', 'rejected'].includes(status)) throw new Error('Status persetujuan tidak valid.');
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query(
        `SELECT auth_type, user_id, email, full_name, subject FROM teacher_applications
          WHERE id = ? AND status = 'pending' FOR UPDATE`, [applicationId]
      );
      if (!rows[0]) { await connection.rollback(); return false; }
      const application = rows[0];

      if (application.auth_type === 'manual') {
        const resultingRole = status === 'approved' ? 'guru' : null;
        const [updated] = await connection.query('UPDATE users SET role = ? WHERE id = ?', [resultingRole, application.user_id]);
        if (!updated.affectedRows) throw new Error('Akun manual tidak ditemukan.');
        await connection.query(
          `INSERT INTO users_detail (user_id, role, full_name, subject) VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE role = VALUES(role), full_name = VALUES(full_name), subject = VALUES(subject)`,
          [application.user_id, resultingRole, application.full_name, application.subject]
        );
      } else {
        const resultingRole = status === 'approved' ? 'guru' : null;
        await connection.query(
          `INSERT INTO google_user_roles (firebase_uid, email, role) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE email = COALESCE(VALUES(email), email), role = VALUES(role)`,
          [application.user_id, application.email, resultingRole]
        );
      }

      await connection.query(
        `UPDATE teacher_applications SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [status, reviewedBy, applicationId]
      );
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async countAdmins() {
    const [[a]] = await pool.query("SELECT COUNT(*) AS n FROM users WHERE role = 'administrator'");
    const [[b]] = await pool.query("SELECT COUNT(*) AS n FROM google_user_roles WHERE role = 'administrator'");
    return a.n + b.n;
  }

  static async listAccounts({ role } = {}) {
    const filter = role ? 'WHERE role = ?' : '';
    const params = role ? [role] : [];
    const [manual] = await pool.query(
      `SELECT id, username, email, role, created_at FROM users ${filter} ORDER BY id`, params);
    const [google] = await pool.query(
      `SELECT firebase_uid, email, role, updated_at FROM google_user_roles ${filter} ORDER BY updated_at`, params);
    return [
      ...manual.map((u) => ({ authType: 'manual', id: String(u.id), username: u.username, email: u.email, role: u.role, createdAt: u.created_at })),
      ...google.map((u) => ({ authType: 'google', id: u.firebase_uid, username: null, email: u.email, role: u.role, createdAt: u.updated_at }))
    ];
  }

  // Siswa saja, tanpa data sensitif (untuk guru).
  static async listStudents() {
    const [manual] = await pool.query(
      `SELECT u.id, u.username, ud.full_name, ud.school_name
         FROM users u LEFT JOIN users_detail ud ON ud.user_id = u.id
        WHERE u.role = 'siswa' ORDER BY u.id`);
    const [google] = await pool.query(
      "SELECT firebase_uid, email FROM google_user_roles WHERE role = 'siswa' ORDER BY updated_at");
    return [
      ...manual.map((u) => ({ authType: 'manual', id: String(u.id), username: u.username, fullName: u.full_name, school: u.school_name })),
      ...google.map((u) => ({ authType: 'google', id: u.firebase_uid, email: u.email }))
    ];
  }
}

module.exports = RoleModel;
