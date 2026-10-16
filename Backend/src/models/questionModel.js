const { pool } = require('../config/Database/MySQL/connection');
const { SEED_QUESTIONS } = require('./questionSeeds');

const normalizeSubject = (subject) => {
  if (!subject || typeof subject !== 'string') return 'indonesia';
  const clean = subject.trim().toLowerCase();
  if (clean.includes('indo')) return 'indonesia';
  if (clean.includes('bio')) return 'biologi';
  if (clean.includes('kim')) return 'kimia';
  if (clean.includes('fis')) return 'fisika';
  if (clean.includes('sos')) return 'sosiologi';
  if (clean.includes('mat')) return 'matematika';
  return clean;
};

const parseQuestionRow = (row) => {
  if (!row) return null;
  let options = row.options ?? row.pilihan ?? row.opsi ?? row.choices ?? null;
  if (typeof options === 'string') {
    try {
      options = JSON.parse(options);
    } catch {
      if (options.includes('|')) {
        options = options.split('|').map((s) => s.trim());
      } else {
        options = [options];
      }
    }
  }
  if (options && typeof options === 'object' && !Array.isArray(options)) {
    if (Array.isArray(options.options)) {
      options = options.options;
    } else if (Array.isArray(options.choices)) {
      options = options.choices;
    } else {
      options = Object.values(options);
    }
  }
  if (!Array.isArray(options) || options.length === 0) {
    const fallbackList = [
      row.pilihan_a ?? row.opsi_a ?? row.option_a ?? row.a,
      row.pilihan_b ?? row.opsi_b ?? row.option_b ?? row.b,
      row.pilihan_c ?? row.opsi_c ?? row.option_c ?? row.c,
      row.pilihan_d ?? row.opsi_d ?? row.option_d ?? row.d,
      row.pilihan_e ?? row.opsi_e ?? row.option_e ?? row.e
    ].filter((val) => val !== undefined && val !== null && val !== '');
    if (fallbackList.length > 0) {
      options = fallbackList;
    }
  }
  const questionText = row.question ?? row.soal ?? row.pertanyaan ?? '';
  const correctText = row.correct ?? row.jawaban_benar ?? row.kunci ?? row.jawaban ?? row.kunci_jawaban ?? '';
  const explanationText = row.explanation ?? row.pembahasan ?? row.penjelasan ?? null;
  const difficultyText = row.difficulty ?? row.tingkat_kesulitan ?? row.level ?? 'medium';
  const subjectText = row.subject || row.mapel || row.kategori || 'indonesia';

  return {
    id: row.id || row.id_soal || row.question_id,
    subject: subjectText,
    question: questionText,
    options: Array.isArray(options) ? options : [],
    correct: correctText,
    explanation: explanationText,
    difficulty: difficultyText
  };
};

const QuestionModel = {
  normalizeSubject,

  async ensureTable() {
    if (!pool || typeof pool.query !== 'function') return;
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions_bank (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject VARCHAR(50) NOT NULL,
        question TEXT NOT NULL,
        options JSON NOT NULL,
        correct TEXT NOT NULL,
        explanation TEXT NULL,
        difficulty VARCHAR(20) DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_questions_bank_subject (subject)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  },

  async seedQuestionsIfEmpty() {
    if (!pool || typeof pool.query !== 'function') return;
    try {
      await this.ensureTable();
      const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM questions_bank');
      const count = rows && rows[0] ? Number(rows[0].cnt) : 0;
      if (count === 0) {
        for (const item of SEED_QUESTIONS) {
          await pool.query(
            `INSERT INTO questions_bank (subject, question, options, correct, explanation, difficulty)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              item.subject,
              item.question,
              JSON.stringify(item.options),
              item.correct,
              item.explanation || null,
              item.difficulty || 'medium'
            ]
          );
        }
      } else {
        // Ensure all subjects from seed questions are present in DB
        const [existingSubjectsRows] = await pool.query('SELECT DISTINCT LOWER(subject) as sub FROM questions_bank');
        const existingSet = new Set((existingSubjectsRows || []).map((r) => r.sub));
        const missing = SEED_QUESTIONS.filter((q) => !existingSet.has(q.subject.toLowerCase()));
        for (const item of missing) {
          await pool.query(
            `INSERT INTO questions_bank (subject, question, options, correct, explanation, difficulty)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              item.subject,
              item.question,
              JSON.stringify(item.options),
              item.correct,
              item.explanation || null,
              item.difficulty || 'medium'
            ]
          );
        }
      }
    } catch (err) {
      console.warn('⚠️ [questionModel] Failed to seed questions into MySQL:', err.message);
    }
  },

  async getQuestionsBySubject(subject) {
    const norm = normalizeSubject(subject);
    try {
      if (pool && typeof pool.query === 'function') {
        const [rows] = await pool.query(
          'SELECT * FROM questions_bank WHERE LOWER(subject) = ?',
          [norm]
        );
        if (rows && rows.length > 0) {
          return rows.map(parseQuestionRow);
        }
      }
    } catch (err) {
      console.warn(`⚠️ [questionModel] MySQL query failed for subject ${norm}:`, err.message);
    }

    // Fallback to in-memory seed questions
    return SEED_QUESTIONS.filter((q) => q.subject.toLowerCase() === norm);
  },

  async getRandomQuestions({ subject, count = 10 }) {
    const norm = normalizeSubject(subject);
    const limit = Math.max(1, Math.min(Number(count) || 10, 50));
    try {
      if (pool && typeof pool.query === 'function') {
        const [rows] = await pool.query(
          'SELECT * FROM questions_bank WHERE LOWER(subject) = ? ORDER BY RAND() LIMIT ?',
          [norm, limit]
        );
        if (rows && rows.length > 0) {
          return rows.map(parseQuestionRow);
        }
      }
    } catch (err) {
      console.warn(`⚠️ [questionModel] MySQL random query failed for ${norm}:`, err.message);
    }

    // In-memory fallback
    const filtered = SEED_QUESTIONS.filter((q) => q.subject.toLowerCase() === norm);
    const poolItems = filtered.length > 0 ? filtered : SEED_QUESTIONS.filter((q) => q.subject === 'indonesia');
    const shuffled = [...poolItems].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, limit);
  },

  async getAllQuestions() {
    try {
      if (pool && typeof pool.query === 'function') {
        const [rows] = await pool.query('SELECT * FROM questions_bank ORDER BY id ASC');
        if (rows && rows.length > 0) {
          return rows.map(parseQuestionRow);
        }
      }
    } catch (err) {
      console.warn('⚠️ [questionModel] MySQL getAllQuestions failed:', err.message);
    }
    return SEED_QUESTIONS;
  }
};

module.exports = QuestionModel;

