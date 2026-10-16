// C:\Users\LOQ\.gemini\antigravity\scratch\gamukis_student_classes\Backend\models\studentClassModel.js
let pool = null;
try {
  ({ pool } = require('../config/Database/MySQL/connection'));
} catch (e) {
  // Offline or mock
}

const { STUDENT_CLASS_SEEDS, DAILY_RECOMMENDATIONS_SEEDS } = require('./studentClassSeeds');

// In-memory progress store for student progress tracking fallback
const progressStore = new Map();

const StudentClassModel = {
  /**
   * Mengambil ringkasan seluruh kategori materi (SAINTEK, SOSHUM, BAHASA)
   * beserta metadata jumlah mata pelajaran dan total estimasi durasi.
   */
  async getCategories() {
    const categoriesMap = {
      SAINTEK: {
        category: 'SAINTEK',
        label: 'Sains & Teknologi',
        description: 'Matematika, Fisika, Kimia, Biologi, Informatika dengan pendekatan analitis dan logika teruji.',
        icon: 'logo_saintek',
        subjects: [],
        totalDurationMinutes: 0
      },
      SOSHUM: {
        category: 'SOSHUM',
        label: 'Sosial & Humaniora',
        description: 'Sejarah, Geografi, Ekonomi, Sosiologi untuk memperluas pemahaman dinamika manusia dan dunia.',
        icon: 'logo_soshum',
        subjects: [],
        totalDurationMinutes: 0
      },
      BAHASA: {
        category: 'BAHASA',
        label: 'Bahasa & Literasi',
        description: 'Koleksi 8 bahasa lengkap: Indonesia, Inggris, Jawa, Prancis, Jerman, Mandarin, Spanyol, dan Melayu.',
        icon: 'logo_bahasa',
        subjects: [],
        totalDurationMinutes: 0
      }
    };

    STUDENT_CLASS_SEEDS.forEach((cls) => {
      const cat = cls.category.toUpperCase();
      if (categoriesMap[cat]) {
        categoriesMap[cat].subjects.push({
          id: cls.id,
          slug: cls.slug,
          title: cls.title,
          rating: cls.rating,
          level: cls.level,
          totalDuration: cls.totalDuration,
          enrolledCount: cls.enrolledCount,
          badge: cls.badge
        });
      }
    });

    return Object.values(categoriesMap).map((c) => ({
      ...c,
      subjectCount: c.subjects.length
    }));
  },

  /**
   * Mengambil daftar kelas dengan opsi filter kategori
   */
  async getAllClasses(categoryFilter = null) {
    if (!categoryFilter) {
      return STUDENT_CLASS_SEEDS;
    }
    const norm = categoryFilter.trim().toUpperCase();
    return STUDENT_CLASS_SEEDS.filter((cls) => cls.category.toUpperCase() === norm);
  },

  /**
   * Mengambil rincian kelas siswa berdasarkan slug atau ID
   */
  async getClassBySlug(slugOrId) {
    if (!slugOrId) return null;
    const norm = String(slugOrId).trim().toLowerCase();
    const found = STUDENT_CLASS_SEEDS.find(
      (cls) => cls.slug.toLowerCase() === norm || cls.id.toLowerCase() === norm
    );
    return found || null;
  },

  /**
   * Mengambil rekomendasi harian materi belajar
   */
  async getDailyRecommendations() {
    return DAILY_RECOMMENDATIONS_SEEDS;
  },

  async ensureTable() {
    if (!pool || typeof pool.query !== 'function') return;
    try {
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
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
    } catch (err) {
      console.warn('⚠️ [studentClassModel] Failed to ensure student_class_progress table:', err.message);
    }
  },

  /**
   * Mengambil progress belajar siswa untuk kelas tertentu
   */
  async getStudentProgress(studentId = 'default_student', classSlug = null) {
    const key = `${studentId}:${classSlug || 'all'}`;
    const sId = String(studentId || 'default_student');
    const cSlug = classSlug ? String(classSlug) : 'all';

    try {
      if (pool && typeof pool.query === 'function') {
        await this.ensureTable();
        const [rows] = await pool.query(
          'SELECT student_id, class_slug, completed_lessons, completed_chapters, overall_percent, streak_days, last_accessed FROM student_class_progress WHERE student_id = ? AND class_slug = ? LIMIT 1',
          [sId, cSlug]
        );
        if (rows && rows.length > 0) {
          const row = rows[0];
          let completedLessons = row.completed_lessons;
          let completedChapters = row.completed_chapters;
          if (typeof completedLessons === 'string') {
            try { completedLessons = JSON.parse(completedLessons); } catch { completedLessons = []; }
          }
          if (typeof completedChapters === 'string') {
            try { completedChapters = JSON.parse(completedChapters); } catch { completedChapters = []; }
          }
          const progressData = {
            studentId: row.student_id,
            classSlug: row.class_slug === 'all' ? null : row.class_slug,
            completedLessons: Array.isArray(completedLessons) ? completedLessons : [],
            completedChapters: Array.isArray(completedChapters) ? completedChapters : [],
            overallPercent: Number(row.overall_percent) || 0,
            streakDays: Number(row.streak_days) || 1,
            lastAccessed: row.last_accessed ? new Date(row.last_accessed).toISOString() : new Date().toISOString()
          };
          progressStore.set(key, progressData);
          return progressData;
        }
      }
    } catch (err) {
      console.warn('⚠️ [studentClassModel] MySQL getStudentProgress error, fallback to memory:', err.message);
    }

    if (progressStore.has(key)) {
      return progressStore.get(key);
    }

    // Default mock progress structure
    const defaultProgress = {
      studentId: sId,
      classSlug: cSlug === 'all' ? null : cSlug,
      completedLessons: ['bind-1-1'],
      completedChapters: [],
      overallPercent: 15,
      streakDays: 3,
      lastAccessed: new Date().toISOString()
    };
    progressStore.set(key, defaultProgress);
    return defaultProgress;
  },

  /**
   * Menyimpan / memperbarui progress belajar siswa
   */
  async saveStudentProgress(studentId = 'default_student', classSlug, updateData = {}) {
    const key = `${studentId}:${classSlug || 'all'}`;
    const existing = await this.getStudentProgress(studentId, classSlug);

    const merged = {
      ...existing,
      ...updateData,
      completedLessons: Array.from(
        new Set([...(existing.completedLessons || []), ...(updateData.completedLessons || [])])
      ),
      completedChapters: Array.from(
        new Set([...(existing.completedChapters || []), ...(updateData.completedChapters || [])])
      ),
      lastAccessed: new Date().toISOString()
    };

    progressStore.set(key, merged);

    const sId = String(studentId || 'default_student');
    const cSlug = classSlug ? String(classSlug) : 'all';

    try {
      if (pool && typeof pool.query === 'function') {
        await this.ensureTable();
        await pool.query(
          `INSERT INTO student_class_progress 
             (student_id, class_slug, completed_lessons, completed_chapters, overall_percent, streak_days, last_accessed)
           VALUES (?, ?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
             completed_lessons = VALUES(completed_lessons),
             completed_chapters = VALUES(completed_chapters),
             overall_percent = VALUES(overall_percent),
             streak_days = VALUES(streak_days),
             last_accessed = NOW()`,
          [
            sId,
            cSlug,
            JSON.stringify(merged.completedLessons),
            JSON.stringify(merged.completedChapters),
            Math.max(0, Math.min(100, Number(merged.overallPercent) || 0)),
            Math.max(1, Number(merged.streakDays) || 1)
          ]
        );
      }
    } catch (err) {
      console.warn('⚠️ [studentClassModel] MySQL saveStudentProgress error:', err.message);
    }

    return merged;
  }
};

module.exports = StudentClassModel;

