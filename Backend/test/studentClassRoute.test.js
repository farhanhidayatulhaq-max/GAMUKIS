// C:\Users\LOQ\.gemini\antigravity\scratch\gamukis_student_classes\Backend\test\studentClassRoute.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const studentClassModelPath = path.resolve(__dirname, '../src/models/studentClassModel.js');
const studentClassServicePath = path.resolve(__dirname, '../src/services/studentClassService.js');
const studentClassSeedsPath = path.resolve(__dirname, '../src/models/studentClassSeeds.js');

test('studentClassModel provides all 3 categories (SAINTEK, SOSHUM, BAHASA)', async () => {
  const StudentClassModel = require(studentClassModelPath);
  const categories = await StudentClassModel.getCategories();

  assert.ok(Array.isArray(categories), 'Categories must be an array');
  assert.equal(categories.length, 3, 'Must have 3 categories');

  const catNames = categories.map((c) => c.category);
  assert.ok(catNames.includes('SAINTEK'), 'Must include SAINTEK');
  assert.ok(catNames.includes('SOSHUM'), 'Must include SOSHUM');
  assert.ok(catNames.includes('BAHASA'), 'Must include BAHASA');
});

test('BAHASA category includes all 8 required languages with detailed curriculum', async () => {
  const StudentClassModel = require(studentClassModelPath);
  const bahasaClasses = await StudentClassModel.getAllClasses('BAHASA');

  assert.ok(Array.isArray(bahasaClasses), 'Bahasa classes must be an array');
  assert.equal(bahasaClasses.length, 8, `Expected exactly 8 language classes, got ${bahasaClasses.length}`);

  const requiredLanguages = [
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'Bahasa Jawa',
    'Bahasa Prancis',
    'Bahasa Jerman',
    'Bahasa Mandarin',
    'Bahasa Spanyol',
    'Bahasa Melayu'
  ];

  const actualTitles = bahasaClasses.map((c) => c.title);
  for (const lang of requiredLanguages) {
    assert.ok(
      actualTitles.includes(lang),
      `Missing required language: ${lang}. Found: ${actualTitles.join(', ')}`
    );
  }

  // Verify structure for each language class
  for (const cls of bahasaClasses) {
    assert.equal(typeof cls.description, 'string', `${cls.title} must have a description`);
    assert.ok(cls.description.length > 20, `${cls.title} description must be detailed`);
    assert.ok(Array.isArray(cls.learningObjectives), `${cls.title} must have learningObjectives`);
    assert.ok(cls.learningObjectives.length >= 3, `${cls.title} must have at least 3 learning objectives`);
    assert.ok(Array.isArray(cls.syllabus), `${cls.title} must have syllabus`);
    assert.ok(cls.syllabus.length >= 1, `${cls.title} syllabus must have at least 1 chapter`);
    assert.ok(Array.isArray(cls.miniQuiz), `${cls.title} must have miniQuiz`);
    assert.ok(cls.miniQuiz.length >= 1, `${cls.title} must have at least 1 mini quiz question`);

    // Verify quiz question schema
    cls.miniQuiz.forEach((q, idx) => {
      assert.ok(q.question, `${cls.title} quiz [${idx}] must have question`);
      assert.ok(Array.isArray(q.options), `${cls.title} quiz [${idx}] must have options array`);
      assert.ok(q.options.length >= 2, `${cls.title} quiz [${idx}] must have at least 2 options`);
      assert.ok(q.options.includes(q.correct), `${cls.title} quiz [${idx}] correct answer must be in options`);
      assert.ok(q.explanation, `${cls.title} quiz [${idx}] must have explanation`);
    });
  }
});

test('SAINTEK and SOSHUM categories retain all core science and social science subjects', async () => {
  const StudentClassModel = require(studentClassModelPath);

  const saintekClasses = await StudentClassModel.getAllClasses('SAINTEK');
  const saintekTitles = saintekClasses.map((c) => c.title);
  assert.ok(saintekTitles.includes('Matematika Saintek') || saintekTitles.includes('Matematika'));
  assert.ok(saintekTitles.includes('Fisika'));
  assert.ok(saintekTitles.includes('Kimia'));
  assert.ok(saintekTitles.includes('Biologi'));

  const soshumClasses = await StudentClassModel.getAllClasses('SOSHUM');
  const soshumTitles = soshumClasses.map((c) => c.title);
  assert.ok(soshumTitles.includes('Sejarah'));
  assert.ok(soshumTitles.includes('Geografi'));
  assert.ok(soshumTitles.includes('Ekonomi'));
  assert.ok(soshumTitles.includes('Sosiologi'));
});

test('studentClassService retrieves class detail and falls back gracefully when Redis is absent', async () => {
  delete require.cache[studentClassServicePath];
  const StudentClassService = require(studentClassServicePath);

  const result = await StudentClassService.getClassDetail('bahasa-jerman');
  assert.ok(result.data, 'Should retrieve class detail');
  assert.equal(result.data.title, 'Bahasa Jerman');
  assert.equal(result.data.category, 'BAHASA');
  assert.equal(result.fromCache, false, 'Should gracefully fallback when Redis client is offline');
});

test('studentClassService manages student learning progress updates and persistence', async () => {
  delete require.cache[studentClassServicePath];
  const StudentClassService = require(studentClassServicePath);

  const studentId = 'test_student_42';
  const classSlug = 'bahasa-mandarin';

  const initialProgress = await StudentClassService.getProgress(studentId, classSlug);
  assert.equal(initialProgress.studentId, studentId);

  const updatedProgress = await StudentClassService.saveProgress(studentId, classSlug, {
    completedLessons: ['man-1-1', 'man-1-2'],
    completedChapters: [1],
    overallPercent: 50
  });

  assert.equal(updatedProgress.overallPercent, 50);
  assert.ok(updatedProgress.completedLessons.includes('man-1-1'));
  assert.ok(updatedProgress.completedLessons.includes('man-1-2'));
  assert.ok(updatedProgress.completedChapters.includes(1));

  const fetchedAgain = await StudentClassService.getProgress(studentId, classSlug);
  assert.equal(fetchedAgain.overallPercent, 50);
});

test('studentClassService provides daily recommendations with reasons', async () => {
  delete require.cache[studentClassServicePath];
  const StudentClassService = require(studentClassServicePath);

  const recs = await StudentClassService.getDailyRecommendations();
  assert.ok(Array.isArray(recs.data), 'Recommendations must be an array');
  assert.ok(recs.data.length >= 3, 'Must have at least 3 daily recommendations');

  recs.data.forEach((r) => {
    assert.ok(r.title, 'Recommendation must have a title');
    assert.ok(r.subject, 'Recommendation must have a subject');
    assert.ok(r.reason, 'Recommendation must have an educational reason');
  });
});

test('StudentClassModel handles MySQL SELECT, INSERT/UPDATE with row destructuring', async () => {
  const connectionPath = path.resolve(__dirname, '../src/config/Database/MySQL/connection.js');
  const queryLog = [];
  const mockTable = new Map();

  const mockPool = {
    async query(sql, params = []) {
      queryLog.push({ sql, params });
      if (sql.includes('CREATE TABLE IF NOT EXISTS student_class_progress')) {
        return [{ affectedRows: 0 }];
      }
      if (sql.startsWith('SELECT student_id, class_slug')) {
        const [studentId, classSlug] = params;
        const key = `${studentId}:${classSlug}`;
        if (mockTable.has(key)) {
          return [[mockTable.get(key)]];
        }
        return [[]];
      }
      if (sql.includes('INSERT INTO student_class_progress')) {
        const [studentId, classSlug, lessonsJson, chaptersJson, percent, streak] = params;
        const key = `${studentId}:${classSlug}`;
        mockTable.set(key, {
          student_id: studentId,
          class_slug: classSlug,
          completed_lessons: lessonsJson,
          completed_chapters: chaptersJson,
          overall_percent: percent,
          streak_days: streak,
          last_accessed: new Date().toISOString()
        });
        return [{ affectedRows: 1 }];
      }
      return [[]];
    }
  };

  require.cache[connectionPath] = {
    id: connectionPath,
    filename: connectionPath,
    loaded: true,
    exports: { pool: mockPool, connectMySQL: async () => {} }
  };

  delete require.cache[studentClassModelPath];
  const StudentClassModel = require(studentClassModelPath);

  // Save progress via MySQL mock
  const saved = await StudentClassModel.saveStudentProgress('student_sql_1', 'bahasa-inggris', {
    completedLessons: ['bing-1', 'bing-2'],
    completedChapters: [1],
    overallPercent: 60
  });

  assert.equal(saved.overallPercent, 60);
  assert.ok(queryLog.some((q) => q.sql.includes('INSERT INTO student_class_progress')));

  // Read progress back from MySQL mock
  const fetched = await StudentClassModel.getStudentProgress('student_sql_1', 'bahasa-inggris');
  assert.equal(fetched.studentId, 'student_sql_1');
  assert.equal(fetched.overallPercent, 60);
  assert.ok(fetched.completedLessons.includes('bing-1'));
  assert.ok(queryLog.some((q) => q.sql.startsWith('SELECT student_id, class_slug')));
});


