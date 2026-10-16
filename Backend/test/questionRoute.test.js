const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const questionModelPath = path.resolve(__dirname, '../src/models/questionModel.js');
const questionServicePath = path.resolve(__dirname, '../src/services/questionService.js');
const questionRoutePath = path.resolve(__dirname, '../src/routes/questionRoute.js');
const redisConnectionPath = path.resolve(__dirname, '../src/config/Database/Redis/connections.js');

test('questionModel provides seed questions across all 6 subjects with correct schema', async () => {
  delete require.cache[questionModelPath];
  const QuestionModel = require(questionModelPath);

  const subjects = ['indonesia', 'biologi', 'kimia', 'fisika', 'sosiologi', 'matematika'];
  for (const sub of subjects) {
    const list = await QuestionModel.getQuestionsBySubject(sub);
    assert.ok(Array.isArray(list), `Questions for ${sub} should be an array`);
    assert.ok(list.length >= 5, `Questions for ${sub} should have at least 5 items, got ${list.length}`);
    list.forEach((item, idx) => {
      assert.equal(typeof item.question, 'string', `${sub}[${idx}].question must be a string`);
      assert.ok(item.question.length > 0, `${sub}[${idx}].question must not be empty`);
      assert.ok(Array.isArray(item.options), `${sub}[${idx}].options must be an array`);
      assert.ok(item.options.length >= 2, `${sub}[${idx}].options must have at least 2 choices`);
      assert.equal(typeof item.correct, 'string', `${sub}[${idx}].correct must be a string`);
      assert.ok(item.options.includes(item.correct), `${sub}[${idx}].correct must exist in options`);
    });
  }
});

test('questionService caches question pool in Redis and fetches from cache on subsequent calls', async () => {
  const redisStore = new Map();
  let setCallCount = 0;
  let getCallCount = 0;

  const mockRedisClient = {
    status: 'ready',
    async get(key) {
      getCallCount++;
      return redisStore.has(key) ? redisStore.get(key) : null;
    },
    async set(key, val, ex, ttl) {
      setCallCount++;
      redisStore.set(key, val);
      return 'OK';
    },
    async del(key) {
      redisStore.delete(key);
      return 1;
    }
  };

  require.cache[redisConnectionPath] = {
    id: redisConnectionPath,
    filename: redisConnectionPath,
    loaded: true,
    exports: { redisClient: mockRedisClient, connectRedis: async () => {} }
  };

  delete require.cache[questionServicePath];
  const QuestionService = require(questionServicePath);

  // First call: cache miss -> queries model -> stores into Redis
  const res1 = await QuestionService.getRandomQuestions({ subject: 'kimia', count: 5 });
  assert.equal(res1.success, true);
  assert.equal(res1.subject, 'kimia');
  assert.equal(res1.count, 5);
  assert.equal(res1.fromCache, false);
  assert.equal(setCallCount, 1, 'Should write to Redis cache on initial fetch');

  // Second call: cache hit -> reads from Redis
  const res2 = await QuestionService.getRandomQuestions({ subject: 'kimia', count: 3 });
  assert.equal(res2.success, true);
  assert.equal(res2.subject, 'kimia');
  assert.equal(res2.count, 3);
  assert.equal(res2.fromCache, true, 'Second call should return fromCache=true');
  assert.ok(getCallCount >= 2, 'Should have read from Redis on second call');
});

test('questionService handles offline/disconnected Redis gracefully with fallback', async () => {
  const mockRedisClient = {
    status: 'disconnected',
    async get() { throw new Error('Redis down'); },
    async set() { throw new Error('Redis down'); }
  };

  require.cache[redisConnectionPath] = {
    id: redisConnectionPath,
    filename: redisConnectionPath,
    loaded: true,
    exports: { redisClient: mockRedisClient, connectRedis: async () => {} }
  };

  delete require.cache[questionServicePath];
  const QuestionService = require(questionServicePath);

  const res = await QuestionService.getRandomQuestions({ subject: 'fisika', count: 4 });
  assert.equal(res.success, true);
  assert.equal(res.subject, 'fisika');
  assert.equal(res.count, 4);
  assert.equal(res.fromCache, false);
  assert.ok(res.questions.length === 4);
});

test('GET /api/questions/random route handler returns questions with proper schema', async () => {
  delete require.cache[questionRoutePath];
  const router = require(questionRoutePath);

  const routeLayer = router.stack.find((l) => l.route?.path === '/random');
  assert.ok(routeLayer, 'Route /random should be registered on question router');
  const handler = routeLayer.route.stack.at(-1).handle;

  const req = {
    query: {
      subject: 'biologi',
      count: '3'
    }
  };
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; }
  };

  await handler(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.subject, 'biologi');
  assert.equal(res.body.count, 3);
  assert.ok(Array.isArray(res.body.questions));
  assert.equal(res.body.questions.length, 3);
  res.body.questions.forEach((q) => {
    assert.ok(q.question);
    assert.ok(Array.isArray(q.options));
    assert.ok(q.correct);
    assert.ok(q.options.includes(q.correct));
  });
});

test('questionModel parseQuestionRow correctly maps varied MySQL Indonesian schemas and formats', async () => {
  delete require.cache[questionModelPath];
  const QuestionModel = require(questionModelPath);

  // 1. Indonesian column names with object options
  const rowObjOptions = {
    id_soal: 101,
    mapel: 'Matematika',
    pertanyaan: 'Berapakah 2 + 2?',
    opsi: { A: '1', B: '2', C: '3', D: '4' },
    jawaban_benar: '4'
  };
  const parsed1 = QuestionModel.getRandomQuestions ? null : null; // check loader
  // Let's test by querying mock pool
  const connectionPath = path.resolve(__dirname, '../src/config/Database/Redis/connections.js');
  const mysqlConnPath = path.resolve(__dirname, '../src/config/Database/MySQL/connection.js');

  const mockPool = {
    async query(sql) {
      if (sql.includes('ORDER BY RAND()')) {
        return [[
          rowObjOptions,
          {
            id: 102,
            subject: 'fisika',
            soal: 'Satuan gaya adalah...',
            pilihan_a: 'Joule',
            pilihan_b: 'Newton',
            pilihan_c: 'Watt',
            pilihan_d: 'Volt',
            kunci: 'Newton'
          },
          {
            id: 103,
            subject: 'biologi',
            question: 'Organ pernapasan ikan?',
            options: 'Insang|Paru-paru|Trakea|Kulit',
            correct: 'Insang'
          }
        ]];
      }
      return [[]];
    }
  };

  require.cache[mysqlConnPath] = {
    id: mysqlConnPath,
    filename: mysqlConnPath,
    loaded: true,
    exports: { pool: mockPool, connectMySQL: async () => {} }
  };

  delete require.cache[questionModelPath];
  const QM = require(questionModelPath);

  const results = await QM.getRandomQuestions({ subject: 'matematika', count: 3 });
  assert.equal(results.length, 3);

  // Row 1: object options converted to array
  assert.equal(results[0].question, 'Berapakah 2 + 2?');
  assert.deepEqual(results[0].options, ['1', '2', '3', '4']);
  assert.equal(results[0].correct, '4');

  // Row 2: pilihan_a..d converted to options
  assert.equal(results[1].question, 'Satuan gaya adalah...');
  assert.deepEqual(results[1].options, ['Joule', 'Newton', 'Watt', 'Volt']);
  assert.equal(results[1].correct, 'Newton');

  // Row 3: pipe delimited string
  assert.equal(results[2].question, 'Organ pernapasan ikan?');
  assert.deepEqual(results[2].options, ['Insang', 'Paru-paru', 'Trakea', 'Kulit']);
  assert.equal(results[2].correct, 'Insang');
});


