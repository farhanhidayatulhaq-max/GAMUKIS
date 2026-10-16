
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  CLASSES,
  classifyChunk,
  serializeTable,
  projectColumns,
  planChunk,
  needsVisual,
  packContext,
  keyTerms,
  coverage,
  gate,
  runCorrectiveRag,
  estTokens,
} = require('./ragCore.reference.cjs');

const T = {
  headers: ['ID', 'Status', 'Root Cause', 'Evidence'],
  rows: [
    ['BUG-01', 'VERIFIED', 'Illegal mix of collations on JOIN', 'npm test 24 passed'],
    ['BUG-02', 'VERIFIED', "Can't resolve util in build", 'npm run build succeeded'],
    ['BUG-03', 'OPEN', 'Test silently skipped', '108/108 passed'],
  ],
};

// -----------------------------------------------------------------------------
// 1. Router: seven flowchart classes
// -----------------------------------------------------------------------------

test('classifyChunk maps exactly seven flowchart classes', () => {
  const images = [{ id: 'i1' }];

  const cases = [
    [{ text: 'halo dunia' }, 'text'],
    [{ text: 'ringkasan', tables: [T] }, 'text+tables'],
    [{ text: '', tables: [T] }, 'tables'],
    [{ text: '', tables: [T], images }, 'tables+image'],
    [{ text: '', images }, 'image'],
    [{ text: 'keterangan', images }, 'image+text'],
    [{ text: 'keterangan', tables: [T], images }, 'image+text+tables'],
  ];

  for (const [chunk, expected] of cases) {
    assert.equal(classifyChunk(chunk).klass, expected);
  }

  assert.deepEqual(
    [...new Set(cases.map((item) => item[1]))].sort(),
    [...CLASSES].sort(),
  );
});

test('classifyChunk detects Markdown tables within text', () => {
  const markdown = [
    'Intro',
    '| a | b |',
    '|---|---|',
    '| 1 | 2 |',
  ].join('\n');

  assert.equal(
    classifyChunk({ text: markdown }).klass,
    'text+tables',
  );

  assert.equal(
    classifyChunk({
      text: '| a | b |\n|---|---|\n| 1 | 2 |',
    }).klass,
    'tables',
  );
});

// -----------------------------------------------------------------------------
// 2. Serializer tabel
// -----------------------------------------------------------------------------

test('serializeTable compact is more token-efficient than md and json', () => {
  const compact = serializeTable(T, { format: 'compact' }).text;
  const markdown = serializeTable(T, { format: 'md' }).text;
  const json = serializeTable(T, { format: 'json' }).text;

  assert.ok(compact.length > 0);
  assert.ok(markdown.length > 0);
  assert.ok(json.length > 0);

  assert.ok(
    estTokens(compact) < estTokens(markdown),
    'compact must be more efficient than md based on estTokens',
  );

  assert.ok(
    estTokens(markdown) < estTokens(json),
    'md must be more efficient than json based on estTokens',
  );

  assert.ok(compact.startsWith('ID|Status|Root Cause|Evidence'));
});

test('column projection preserves keys and selects relevant columns', () => {
  assert.deepEqual(
    projectColumns(T, 'bukti test'),
    [true, false, false, true],
  );

  assert.deepEqual(
    projectColumns(T, 'apa saja'),
    [true, true, true, true],
  );

  const result = serializeTable(T, { query: 'status' });

  assert.equal(result.droppedColumns, 2);
  assert.ok(result.text.startsWith('ID|Status'));
});

test('row truncation is explicitly reported', () => {
  const result = serializeTable(T, { maxRows: 1 });

  assert.equal(result.truncatedRows, 2);
  assert.match(
    result.text,
    /\[\+2 baris tidak ditampilkan\]$/,
  );
});

test('serialization preserves headers even when row count is limited', () => {
  const result = serializeTable(T, { maxRows: 1 });

  assert.ok(result.text.startsWith('ID|Status|Root Cause|Evidence'));
  assert.ok(result.text.length > 0);
});

// -----------------------------------------------------------------------------
// 3. Modality plan
// -----------------------------------------------------------------------------

test('images with surrogate and non-visual query do not transmit pixels', () => {
  const chunk = {
    id: 'c1',
    text: 'Halaman login',
    images: [
      {
        id: 'img1',
        width: 1000,
        height: 750,
        surrogate: 'Form login dengan 2 kolom input',
      },
    ],
  };

  const plan = planChunk(chunk, 'what are the fields on login form?');

  assert.equal(plan.needsVision, false);
  assert.ok(!plan.parts.some((part) => part.type === 'image'));

  assert.match(
    plan.parts.map((part) => part.text ?? '').join(' '),
    /Form login dengan 2 kolom input/,
  );
});

test('visual intent or unavailable surrogate triggers vision', () => {
  const withSurrogate = {
    id: 'c1',
    text: 'x',
    images: [
      {
        id: 'i',
        width: 750,
        height: 1000,
        surrogate: 's',
      },
    ],
  };

  assert.equal(
    planChunk(withSurrogate, 'warna tombol utama apa?').needsVision,
    true,
  );

  const withoutSurrogate = {
    id: 'c2',
    text: 'x',
    images: [{ id: 'i2' }],
  };

  assert.equal(
    planChunk(withoutSurrogate, 'apa isinya?').needsVision,
    true,
  );

  assert.equal(
    needsVisual('apa', {
      surrogate: 's',
      surrogateConfidence: 0.4,
    }),
    true,
  );
});

test('tables+image memilih tabel kecuali query membutuhkan informasi visual', () => {
  const chunk = {
    id: 'c3',
    text: '',
    tables: [T],
    images: [
      {
        id: 'chart',
        width: 800,
        height: 600,
        surrogate: 'grafik',
      },
    ],
  };

  const tablePlan = planChunk(chunk, 'how many bugs are open?');

  assert.equal(tablePlan.needsVision, false);
  assert.ok(
    tablePlan.notes.some((note) => note.includes('skipped(table-covers)')),
  );

  const visualPlan = planChunk(chunk, 'what is the trend on graph?');

  assert.equal(visualPlan.needsVision, true);
});

test('image cost follows formula width x height / 750', () => {
  const plan = planChunk(
    {
      id: 'c',
      text: '',
      images: [
        {
          id: 'i',
          width: 1500,
          height: 500,
        },
      ],
    },
    'apa ini',
  );

  const imagePart = plan.parts.find((part) => part.type === 'image');

  assert.ok(imagePart, 'image part must be available');
  assert.equal(imagePart.tokens, 1000);
});

// -----------------------------------------------------------------------------
// 4. Context packer
// -----------------------------------------------------------------------------

test('packContext respects budget and deterministically drops near-duplicates', () => {
  const items = [
    {
      id: 'a',
      score: 0.9,
      tokens: 100,
      text: 'mysql connection requires charset utf8mb4 and explicit collation on join',
    },
    {
      id: 'b',
      score: 0.8,
      tokens: 100,
      text: 'mysql connection requires charset utf8mb4 and explicit collation on join',
    },
    {
      id: 'c',
      score: 0.5,
      tokens: 100,
      text: 'admin route uses authenticateAny and requirePermission',
    },
    {
      id: 'd',
      score: 0.4,
      tokens: 500,
      text: 'long document exceeding remaining context budget',
    },
  ];

  const first = packContext(items, 250);
  const second = packContext([...items].reverse(), 250);

  assert.deepEqual(
    first.picked.map((item) => item.id),
    second.picked.map((item) => item.id),
  );

  assert.ok(first.used <= 250);

  assert.ok(
    first.dropped.some(
      (item) => item.id === 'b' && item.reason === 'near-duplicate',
    ),
  );

  assert.ok(
    first.dropped.some(
      (item) => item.id === 'd' && item.reason === 'over-budget',
    ),
  );
});

test('single item over budget is flagged as overBudget', () => {
  const result = packContext(
    [{ id: 'x', score: 1, tokens: 900, text: 'isi penting' }],
    100,
  );

  assert.equal(result.picked.length, 1);
  assert.equal(result.overBudget, true);
});

// -----------------------------------------------------------------------------
// 5. Confidence gate
// -----------------------------------------------------------------------------

test('keyTerms and coverage capture paths, identifiers, and numbers', () => {
  const query =
    'why does jwtConfig.js reject startup and getEffectiveToken fail on 401?';

  const terms = keyTerms(query);

  assert.ok(terms.includes('jwtconfig.js'));
  assert.ok(terms.includes('geteffectivetoken'));
  assert.ok(terms.includes('401'));

  const result = coverage(query, [
    {
      text: 'jwtConfig.js fail-closed; getEffectiveToken memprioritaskan token Firebase',
    },
  ]);

  assert.equal(result.covered, 2);
});

test('gate distinguishes confident, ambiguous, and irrelevant responses', () => {
  const picked = [
    {
      id: 'a',
      score: 0.9,
      text: 'jwtConfig.js fail-closed',
    },
  ];

  assert.equal(gate('jelaskan jwtConfig.js', picked).route, 'answer');

  assert.equal(
    gate('explain jwtConfig.js and roleModel.js', picked).route,
    'evaluate',
  );

  assert.equal(gate('apa saja', []).route, 'incorrect');

  assert.equal(
    gate('jelaskan roleModel.js', [
      {
        id: 'z',
        score: 0.1,
        text: 'tidak terkait',
      },
    ]).route,
    'incorrect',
  );
});

// -----------------------------------------------------------------------------
// 6. Corrective RAG loop
// -----------------------------------------------------------------------------

const makeRetrieve = (sequence) => {
  let index = 0;

  return async () => {
    return sequence[Math.min(index++, sequence.length - 1)];
  };
};

const good = [
  {
    id: 'a',
    score: 0.95,
    tokens: 50,
    text: 'jwtConfig.js fail-closed di production',
  },
];

const mid = [
  {
    id: 'm',
    score: 0.5,
    tokens: 50,
    text: 'catatan umum tentang konfigurasi',
  },
];

test('direct path does not invoke evaluator, rewriter, or web search', async () => {
  const result = await runCorrectiveRag({
    query: 'explain jwtConfig.js',
    namespace: 'backend',
    retrieve: makeRetrieve([good]),
    evaluate: async () => {
      throw new Error('evaluator must not be invoked');
    },
    rewrite: async () => 'x',
    webSearch: async () => [],
  });

  assert.equal(result.route, 'direct');
  assert.deepEqual(result.calls, {
    evaluate: 0,
    rewrite: 0,
    web: 0,
  });
});

test('ambiguous query performs rewrite once then retrieves again', async () => {
  let evaluations = 0;

  const result = await runCorrectiveRag({
    query: 'explain jwtConfig.js and roleModel.js',
    namespace: 'backend',
    retrieve: makeRetrieve([mid, good]),
    rewrite: async () => 'jelaskan jwtConfig.js',
    evaluate: async () => {
      evaluations++;
      return evaluations === 1 ? 'ambiguous' : 'correct';
    },
    webSearch: async () => [],
  });

  assert.equal(result.calls.rewrite, 1);
  assert.ok(
    ['direct-after-rewrite', 'correct'].includes(result.route),
  );
  assert.equal(result.calls.web, 0);
});

test('incorrect result uses web fallback at most once', async () => {
  const webResults = [
    {
      id: 'w1',
      score: 0.7,
      tokens: 40,
      text: 'hasil web',
    },
  ];

  const result = await runCorrectiveRag({
    query: 'jelaskan roleModel.js',
    namespace: 'backend',
    retrieve: makeRetrieve([[]]),
    evaluate: async () => 'incorrect',
    rewrite: async () => 'x',
    webSearch: async () => webResults,
  });

  assert.equal(result.route, 'web-fallback');
  assert.equal(result.calls.web, 1);
});

test('call limits are maintained when evaluator is persistently ambiguous', async () => {
  const result = await runCorrectiveRag({
    query: 'explain jwtConfig.js and roleModel.js',
    namespace: 'backend',
    retrieve: makeRetrieve([mid]),
    evaluate: async () => 'ambiguous',
    rewrite: async () => 'q2',
    webSearch: async () => [],
  });

  assert.ok(result.calls.evaluate <= 2);
  assert.ok(result.calls.rewrite <= 1);
  assert.ok(result.calls.web <= 1);

  assert.ok(
    ['uncertain', 'web-fallback'].includes(result.route),
  );
});

test('disabled web returns lowConfidence without web calls', async () => {
  const result = await runCorrectiveRag({
    query: 'explain roleModel.js',
    namespace: 'backend',
    retrieve: makeRetrieve([[]]),
    evaluate: async () => 'incorrect',
    rewrite: async () => 'x',
    webSearch: async () => {
      throw new Error('web search must not be invoked');
    },
    allowWeb: false,
  });

  assert.equal(result.route, 'uncertain');
  assert.equal(result.flags.lowConfidence, true);
  assert.equal(result.calls.web, 0);
});

test('evaluator error preserves original context and flags failure', async () => {
  const result = await runCorrectiveRag({
    query: 'explain jwtConfig.js and roleModel.js',
    namespace: 'backend',
    retrieve: makeRetrieve([mid]),
    evaluate: async () => {
      throw new Error('timeout');
    },
    rewrite: async () => 'x',
    webSearch: async () => [],
  });

  assert.equal(result.route, 'correct');
  assert.equal(result.flags.evaluatorFailed, true);
});

test('evaluator receives only short snippets, not full chunks', async () => {
  let seen;

  const long = [
    {
      id: 'l',
      score: 0.5,
      tokens: 300,
      text: 'x'.repeat(2000),
    },
  ];

  await runCorrectiveRag({
    query: 'explain jwtConfig.js and roleModel.js',
    namespace: 'backend',
    retrieve: makeRetrieve([long]),
    evaluate: async ({ snippets }) => {
      seen = snippets;
      return 'correct';
    },
    rewrite: async () => 'x',
    webSearch: async () => [],
  });

  assert.ok(Array.isArray(seen));
  assert.ok(seen[0].text.length <= 240);
});
