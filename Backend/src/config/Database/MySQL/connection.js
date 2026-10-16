const mysql = require('mysql2/promise');
const fs = require('fs');

const isDocker = Boolean(
  process.env.DOCKER_CONTAINER ||
  process.cwd() === '/app' ||
  fs.existsSync('/.dockerenv')
);

const getCandidateHosts = () => {
  const explicitHost = process.env.DB_HOST || process.env.MYSQL_HOST;
  let candidates = [];

  if (isDocker) {
    if (process.env.MYSQL_HOST) candidates.push(process.env.MYSQL_HOST);
    if (explicitHost && explicitHost !== 'localhost' && explicitHost !== '127.0.0.1') {
      candidates.push(explicitHost);
    }
    candidates.push('mysql', 'host.docker.internal', '127.0.0.1', 'localhost');
  } else {
    if (process.env.DB_HOST) candidates.push(process.env.DB_HOST);
    if (process.env.MYSQL_HOST && process.env.MYSQL_HOST !== 'mysql') candidates.push(process.env.MYSQL_HOST);
    candidates.push('127.0.0.1', 'localhost', 'mysql', 'host.docker.internal');
  }
  return [...new Set(candidates.filter(Boolean))];
};

const getCandidatePasswords = () => {
  const explicitPassword = process.env.DB_PASSWORD !== undefined
    ? process.env.DB_PASSWORD
    : process.env.MYSQL_PASSWORD;
  const list = [];
  if (explicitPassword !== undefined) list.push(explicitPassword);
  list.push('rootpassword', '');
  return [...new Set(list)];
};

const getCandidateDatabases = () => {
  const explicitDb = process.env.DB_NAME || process.env.MYSQL_DATABASE;
  const list = [];
  if (explicitDb) list.push(explicitDb);
  list.push('gamukis', 'gamukis_db');
  return [...new Set(list.filter(Boolean))];
};

const setupPoolListeners = (p) => {
  if (!p) return;
  p.on('error', (err) => {
    console.error('⚠️ [MySQL Pool] Idle client error:', err.message);
  });
  if (p.pool) {
    p.pool.on('connection', (conn) => {
      conn.on('error', (err) => {
        console.error('⚠️ [MySQL Connection] Error:', err.message);
      });
    });
    p.pool.on('acquire', (conn) => {
      if (conn.stream && typeof conn.stream.ref === 'function') conn.stream.ref();
    });
    p.pool.on('release', (conn) => {
      if (conn.stream && typeof conn.stream.unref === 'function') conn.stream.unref();
    });
  }
};

const buildPoolConfig = (host, password, database) => {
  const cfg = {
    host,
    port: Number(process.env.DB_PORT || process.env.MYSQL_PORT) || 3306,
    user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    password,
    database: database || getCandidateDatabases()[0] || 'gamukis',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 4000,
    charset: 'utf8mb4',
    dateStrings: true
  };
  const socket = process.env.DB_SOCKET_PATH || process.env.MYSQL_SOCKET_PATH;
  if (socket) {
    cfg.socketPath = socket;
  }
  return cfg;
};

const createConfiguredPool = (cfg) => {
  const p = mysql.createPool(cfg);
  setupPoolListeners(p);
  return p;
};

let currentConfig = buildPoolConfig(
  getCandidateHosts()[0] || '127.0.0.1',
  getCandidatePasswords()[0] || 'rootpassword',
  getCandidateDatabases()[0] || 'gamukis'
);
let currentPool = createConfiguredPool(currentConfig);
const localOverrides = new Map();

const pool = new Proxy({}, {
  get(target, prop) {
    if (localOverrides.has(prop)) {
      return localOverrides.get(prop);
    }
    const val = Reflect.get(currentPool, prop);
    if (typeof val === 'function') {
      return val.bind(currentPool);
    }
    return val;
  },
  set(target, prop, value) {
    localOverrides.set(prop, value);
    return true;
  },
  has(target, prop) {
    return localOverrides.has(prop) || (prop in currentPool);
  },
  deleteProperty(target, prop) {
    localOverrides.delete(prop);
    return true;
  }
});

const probeConnection = async (host, password, database) => {
  const baseOptions = {
    host,
    port: Number(process.env.DB_PORT || process.env.MYSQL_PORT) || 3306,
    user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    password,
    connectTimeout: 2000
  };
  const socket = process.env.DB_SOCKET_PATH || process.env.MYSQL_SOCKET_PATH;
  if (socket) {
    baseOptions.socketPath = socket;
  }

  let testConn = null;
  try {
    testConn = await mysql.createConnection({
      ...baseOptions,
      database
    });
    await testConn.query('SELECT 1');
    await testConn.end();
    return true;
  } catch (err) {
    if (testConn) {
      try { await testConn.end(); } catch (_) {}
    }
    // Jika database belum ada, coba buat database jika koneksi dasar berhasil
    if (err && (err.code === 'ER_BAD_DB_ERROR' || err.errno === 1049)) {
      try {
        const rootConn = await mysql.createConnection(baseOptions);
        await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
        await rootConn.end();
        return true;
      } catch (_) {}
    }
    throw err;
  }
};

const establishConnection = async (maxRetries = 5, retryDelayMs = 2000) => {
  const candidateHosts = getCandidateHosts();
  const candidatePasswords = getCandidatePasswords();
  const candidateDatabases = getCandidateDatabases();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await currentPool.query('SELECT 1');
      return;
    } catch (_) {}

    for (const host of candidateHosts) {
      for (const pwd of candidatePasswords) {
        for (const dbName of candidateDatabases) {
          try {
            await probeConnection(host, pwd, dbName);
            if (
              currentConfig.host !== host ||
              currentConfig.password !== pwd ||
              currentConfig.database !== dbName
            ) {
              try { await currentPool.end(); } catch (_) {}
              currentConfig = buildPoolConfig(host, pwd, dbName);
              currentPool = createConfiguredPool(currentConfig);
            }
            console.log(`🔍 [MySQL] Berhasil terhubung ke MySQL pada ${host}:${currentConfig.port} (database: ${dbName})`);
            return;
          } catch (_) {}
        }
      }
    }

    if (attempt < maxRetries) {
      console.warn(`⏳ [MySQL] Menunggu koneksi MySQL (percobaan ${attempt}/${maxRetries}, host dicoba: ${candidateHosts.join(', ')})...`);
      await new Promise(res => setTimeout(res, retryDelayMs));
    }
  }

  throw new Error(`Gagal terhubung ke MySQL setelah ${maxRetries} percobaan. Host: ${candidateHosts.join(', ')}`);
};

const connectMySQL = async () => {
  try {
    await establishConnection();
    try {
      await pool.query("SET NAMES 'utf8mb4'");
    } catch (charsetErr) {
      console.warn('⚠️ [MySQL] SET NAMES utf8mb4 warning:', charsetErr.message);
    }
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users_detail (
        user_id INT PRIMARY KEY,
        gender VARCHAR(30),
        birth_date DATE,
        school_name VARCHAR(255),
        address TEXT,
        role VARCHAR(30),
        full_name VARCHAR(255),
        subject VARCHAR(100),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_users_detail_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS history (
        id_history INT AUTO_INCREMENT PRIMARY KEY,
        time_playing TIME NOT NULL,
        answer_true INT NOT NULL DEFAULT 0,
        answer_false INT NOT NULL DEFAULT 0,
        desc_answer_true TEXT,
        desc_answer_false TEXT,
        all_question INT NOT NULL DEFAULT 0,
        coin INT NOT NULL DEFAULT 0,
        death INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS characters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_key VARCHAR(160) NOT NULL,
        auth_type ENUM('manual', 'google') NOT NULL,
        owner_id VARCHAR(128) NOT NULL,
        email VARCHAR(255),
        name VARCHAR(50) NOT NULL,
        data JSON NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_characters_owner (owner_key)
      )
    `);
    // Keep existing installations compatible as profile fields are added.
    for (const column of [
      ['role', 'VARCHAR(30)'],
      ['full_name', 'VARCHAR(255)'],
      ['subject', 'VARCHAR(100)']
    ]) {
      const [columns] = await pool.query('SHOW COLUMNS FROM users_detail LIKE ?', [column[0]]);
      if (columns.length === 0) {
        await pool.query(`ALTER TABLE users_detail ADD COLUMN ${column[0]} ${column[1]} NULL`);
      }
    }

    // --- Role: users.role adalah sumber kebenaran (siswa | guru | administrator) ---
    const [roleColumn] = await pool.query("SHOW COLUMNS FROM users LIKE 'role'");
    if (roleColumn.length === 0) {
      await pool.query('ALTER TABLE users ADD COLUMN role VARCHAR(20) NULL DEFAULT NULL');
      await pool.query(`
        UPDATE users u JOIN users_detail ud ON ud.user_id = u.id
           SET u.role = ud.role
         WHERE ud.role IN ('guru', 'siswa')
      `);
    }
    await pool.query('ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NULL DEFAULT NULL');
    await pool.query("UPDATE users SET role = LOWER(TRIM(role)) WHERE role IS NOT NULL");
    await pool.query("UPDATE users SET role = 'administrator' WHERE role = 'admin'");
    await pool.query(
      "UPDATE users SET role = NULL WHERE role IS NOT NULL AND role NOT IN ('siswa', 'guru', 'administrator')"
    );
    await pool.query(`
      CREATE TABLE IF NOT EXISTS google_user_roles (
        firebase_uid VARCHAR(128) PRIMARY KEY,
        email VARCHAR(255),
        role VARCHAR(20) NULL DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_google_user_roles_role (role)
      )
    `);
    await pool.query('ALTER TABLE google_user_roles MODIFY COLUMN role VARCHAR(20) NULL DEFAULT NULL');
    await pool.query("UPDATE google_user_roles SET role = LOWER(TRIM(role)) WHERE role IS NOT NULL");
    await pool.query("UPDATE google_user_roles SET role = 'administrator' WHERE role = 'admin'");
    await pool.query(
      "UPDATE google_user_roles SET role = NULL WHERE role IS NOT NULL AND role NOT IN ('siswa', 'guru', 'administrator')"
    );

    await pool.query(`
      CREATE TABLE IF NOT EXISTS google_user_profiles (
        firebase_uid VARCHAR(128) PRIMARY KEY,
        gender VARCHAR(20) NULL,
        birth_date VARCHAR(20) NULL,
        school_name VARCHAR(255) NULL,
        address TEXT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS teacher_applications (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        auth_type ENUM('manual', 'google') NOT NULL,
        user_id VARCHAR(128) NOT NULL,
        email VARCHAR(255),
        full_name VARCHAR(255) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        status ENUM('pending', 'approved', 'rejected', 'withdrawn') NOT NULL DEFAULT 'pending',
        reviewed_by VARCHAR(160),
        reviewed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_teacher_application_user (auth_type, user_id),
        INDEX idx_teacher_applications_status_created (status, created_at)
      )
    `);
    // Migrate Guru roles created before the approval workflow into its pending queue.
    const [legacyManualTeachers] = await pool.query(`
      SELECT u.id, u.email, u.username, u.role AS user_role,
             ud.role AS detail_role, ud.full_name, ud.subject, a.status AS application_status
        FROM users u LEFT JOIN users_detail ud ON ud.user_id = u.id
        LEFT JOIN teacher_applications a ON a.auth_type = 'manual' AND a.user_id = CAST(u.id AS CHAR)
       WHERE (u.role = 'guru' OR ud.role = 'guru')
         AND (a.id IS NULL OR a.status = 'pending')
    `);
    for (const teacher of legacyManualTeachers) {
      if (!teacher.application_status) {
        await pool.query(
          `INSERT IGNORE INTO teacher_applications (auth_type, user_id, email, full_name, subject, status)
           VALUES ('manual', ?, ?, ?, ?, 'pending')`,
          [String(teacher.id), teacher.email, teacher.full_name || teacher.username, teacher.subject || 'Belum diisi']
        );
      }
      if (teacher.user_role === 'guru') {
        await pool.query("UPDATE users SET role = NULL WHERE id = ? AND role = 'guru'", [teacher.id]);
      }
      if (teacher.detail_role === 'guru') {
        await pool.query("UPDATE users_detail SET role = NULL WHERE user_id = ? AND role = 'guru'", [teacher.id]);
      }
    }
    const [legacyGoogleTeachers] = await pool.query(`
      SELECT g.firebase_uid, g.email, a.status AS application_status
        FROM google_user_roles g
        LEFT JOIN teacher_applications a ON a.auth_type = 'google' AND a.user_id = g.firebase_uid
       WHERE g.role = 'guru' AND (a.id IS NULL OR a.status = 'pending')
    `);
    for (const teacher of legacyGoogleTeachers) {
      if (!teacher.application_status) {
        await pool.query(
          `INSERT IGNORE INTO teacher_applications (auth_type, user_id, email, full_name, subject, status)
           VALUES ('google', ?, ?, ?, 'Belum diisi', 'pending')`,
          [teacher.firebase_uid, teacher.email, teacher.email?.split('@')[0] || 'Guru Google']
        );
      }
      await pool.query("UPDATE google_user_roles SET role = NULL WHERE firebase_uid = ? AND role = 'guru'", [teacher.firebase_uid]);
    }

    // --- Membership ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS membership_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        audience VARCHAR(20) NOT NULL,
        price INT NOT NULL DEFAULT 0,
        duration_days INT NULL,
        features JSON NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_membership_plans_audience (audience)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS memberships (
        id INT AUTO_INCREMENT PRIMARY KEY,
        owner_key VARCHAR(160) NOT NULL,
        auth_type VARCHAR(10) NOT NULL,
        owner_id VARCHAR(128) NOT NULL,
        plan_id INT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        started_at DATETIME NULL,
        expires_at DATETIME NULL,
        payment_ref VARCHAR(100) NULL,
        granted_by VARCHAR(160) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_memberships_owner (owner_key, status),
        CONSTRAINT fk_memberships_plan FOREIGN KEY (plan_id) REFERENCES membership_plans(id)
      )
    `);
    const defaultPlans = [
      ['siswa_free', 'Siswa Gratis', 'siswa', 0, null, { maxCharacters: 5 }],
      ['siswa_premium', 'Siswa Premium', 'siswa', 29000, 30, { maxCharacters: 10, extraAvatars: true, progressReport: true }],
      ['guru_free', 'Guru Gratis', 'guru', 0, null, { maxCharacters: 5, maxClasses: 1 }],
      ['guru_pro', 'Guru Pro', 'guru', 99000, 30, { maxCharacters: 10, maxClasses: 20, studentAnalytics: true, exportReport: true }]
    ];
    for (const [code, name, audience, price, days, features] of defaultPlans) {
      await pool.query(
        `INSERT IGNORE INTO membership_plans (code, name, audience, price, duration_days, features)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [code, name, audience, price, days, JSON.stringify(features)]
      );
    }
    // --- Questions Bank ---
    try {
      const QuestionModel = require('../../../models/questionModel');
      await QuestionModel.seedQuestionsIfEmpty();
    } catch (qErr) {
      console.warn('⚠️ [MySQL] Question bank initialization warning:', qErr.message);
    }
    // --- Match History & Leaderboard ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS match_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL,
        username VARCHAR(100) NOT NULL,
        score INT NOT NULL DEFAULT 0,
        coins INT NOT NULL DEFAULT 0,
        accuracy FLOAT NOT NULL DEFAULT 0,
        time_remaining INT NOT NULL DEFAULT 0,
        exp INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_match_history_user (user_id),
        INDEX idx_match_history_score (score DESC),
        INDEX idx_match_history_created (created_at)
      )
    `);

    try {
      await pool.query(`ALTER TABLE match_history ADD COLUMN exp INT NOT NULL DEFAULT 0`);
    } catch (e) {
      // Column might already exist
    }

    // --- User Achievements ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_achievements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(128) NOT NULL,
        badge_id VARCHAR(50) NOT NULL,
        badge_name VARCHAR(100) NOT NULL,
        badge_description VARCHAR(255) NOT NULL,
        badge_icon VARCHAR(100) NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_badge (user_id, badge_id),
        INDEX idx_user_achievements_user (user_id)
      )
    `);

    // --- Student Class Progress ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS student_class_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(128) NOT NULL,
        class_slug VARCHAR(100) NOT NULL,
        completed_lessons JSON NOT NULL,
        completed_chapters JSON NOT NULL,
        overall_percent INT NOT NULL DEFAULT 0,
        streak_days INT NOT NULL DEFAULT 1,
        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_student_class (student_id, class_slug),
        INDEX idx_student_progress_student (student_id)
      )
    `);

    console.log('✅ [MySQL] Database connected successfully.');
  } catch (error) {
    console.error('❌ [MySQL] Connection error:', error.message);
    throw error;
  }
};

module.exports = { pool, connectMySQL };
