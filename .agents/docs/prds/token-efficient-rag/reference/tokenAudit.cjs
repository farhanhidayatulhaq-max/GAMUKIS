// tokenAudit.cjs

'use strict';

'use strict';

/**
 * tokenAudit.cjs
 *
 * Evidence verifier for Gamukis multi-platform agent integration
 * and actual token-savings benchmarks.
 *
 * Node.js 18+, built-in modules only.
 *
 * This script validates supplied evidence. It does not independently
 * execute or prove that external AI platforms load instructions correctly.
 *
 * Usage:
 * node tokenAudit.cjs --root <repo> \
 *   --integration-results evidence/integration-results.json \
 *   --baseline-usage evidence/baseline.jsonl \
 *   --optimized-usage evidence/optimized.jsonl \
 *   --out evidence/audit-report.json
 *
 * Integration results and usage records must come from actual test runs.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const args = process.argv.slice(2);

function arg(name, fallback = null) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
}

function has(name) {
  return args.includes(name);
}

const ROOT = path.resolve(arg('--root', '.'));
const EXPECTED_PLATFORMS = [
  'ChatGPT Codex',
  'GitHub Copilot VS Code',
  'GitHub Copilot Cloud/CLI',
  'Antigravity',
  'Claude Code',
  'Hermes',
  'OpenClaw',
  'Kilo',
  'Kiro',
  'Chat without tools',
  'n8n / services'
];

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  repository: {
    root: ROOT,
    gitCommit: null
  },
  integration: {
    status: 'NOT_VERIFIED',
    expectedPlatforms: EXPECTED_PLATFORMS.length,
    verifiedPlatforms: 0,
    missingPlatforms: [],
    failures: [],
    results: []
  },
  tokenSavings: {
    status: 'NOT_MEASURED',
    baselineInputTokens: null,
    optimizedInputTokens: null,
    absoluteSavings: null,
    savingsPercent: null,
    matchedTasks: 0,
    unmatchedTasks: [],
    failures: []
  },
  limitations: [
    'Evidence validation is not equivalent to independently executing every platform.',
    'Token savings are valid only for comparable tasks and actual usage records.',
    'Results apply only to the tested repository snapshot, platforms, and workload.'
  ]
};

function fail(message) {
  throw new Error(message);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function resolveInput(file) {
  if (!file) return null;
  const resolved = path.resolve(ROOT, file);

  if (!fs.existsSync(resolved)) {
    fail(`Evidence file not found: ${file}`);
  }

  return resolved;
}

function readJsonl(file) {
  return fs.readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter(line => line.trim())
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch {
        fail(`Invalid JSONL at ${file}:${index + 1}`);
      }
    });
}

function sha256(file) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(file))
    .digest('hex');
}

function verifyIntegration(file) {
  if (!file) {
    report.integration.failures.push(
      'No integration-results manifest supplied.'
    );
    return;
  }

  const manifest = readJson(file);
  const platforms = Array.isArray(manifest.platforms)
    ? manifest.platforms
    : [];

  const seen = new Set();

  for (const platform of platforms) {
    const name = platform.name;

    if (!EXPECTED_PLATFORMS.includes(name)) {
      report.integration.failures.push(
        `Unexpected platform entry: ${name}`
      );
      continue;
    }

    if (seen.has(name)) {
      report.integration.failures.push(
        `Duplicate platform entry: ${name}`
      );
      continue;
    }

    seen.add(name);

    const checks = Array.isArray(platform.checks)
      ? platform.checks
      : [];

    const checkFailures = [];

    if (platform.status !== 'passed') {
      checkFailures.push('Platform test status is not passed.');
    }

    if (!platform.runId || !platform.testedAt) {
      checkFailures.push('Missing runId or testedAt.');
    }

    if (!checks.length) {
      checkFailures.push('No individual checks supplied.');
    }

    for (const check of checks) {
      if (check.status !== 'passed') {
        checkFailures.push(
          `Check "${check.name || 'unnamed'}" did not pass.`
        );
      }

      if (!check.evidencePath) {
        checkFailures.push(
          `Check "${check.name || 'unnamed'}" has no evidencePath.`
        );
        continue;
      }

      const evidence = path.resolve(ROOT, check.evidencePath);

      if (!evidence.startsWith(ROOT + path.sep) ||
          !fs.existsSync(evidence) ||
          !fs.statSync(evidence).isFile()) {
        checkFailures.push(
          `Missing or unsafe evidence path: ${check.evidencePath}`
        );
      } else {
        check.evidenceSha256 = sha256(evidence);
      }
    }

    const verified = checkFailures.length === 0;

    report.integration.results.push({
      name,
      status: verified ? 'VERIFIED' : 'FAILED',
      runId: platform.runId || null,
      testedAt: platform.testedAt || null,
      checks: checks.length,
      failures: checkFailures
    });

    if (verified) {
      report.integration.verifiedPlatforms++;
    } else {
      report.integration.failures.push(
        `${name}: ${checkFailures.join(' ')}`
      );
    }
  }

  report.integration.missingPlatforms =
    EXPECTED_PLATFORMS.filter(name => !seen.has(name));

  if (report.integration.missingPlatforms.length) {
    report.integration.failures.push(
      'Missing platform results: ' +
      report.integration.missingPlatforms.join(', ')
    );
  }

  report.integration.status =
    report.integration.verifiedPlatforms === EXPECTED_PLATFORMS.length &&
    report.integration.failures.length === 0
      ? 'VERIFIED'
      : 'INCOMPLETE';
}

function verifyUsage(baselineFile, optimizedFile) {
  if (!baselineFile || !optimizedFile) {
    report.tokenSavings.failures.push(
      'Both baseline and optimized usage records are required.'
    );
    return;
  }

  const baseline = readJsonl(baselineFile);
  const optimized = readJsonl(optimizedFile);

  function indexRecords(records, label) {
    const map = new Map();

    for (const row of records) {
      if (row.measured !== true) {
        report.tokenSavings.failures.push(
          `${label}: record is not marked measured=true.`
        );
        continue;
      }

      if (!row.taskId || !row.platform ||
          !Number.isSafeInteger(row.inputTokens) ||
          row.inputTokens < 0) {
        report.tokenSavings.failures.push(
          `${label}: invalid taskId, platform, or inputTokens.`
        );
        continue;
      }

      const key = `${row.platform}::${row.taskId}`;

      if (map.has(key)) {
        report.tokenSavings.failures.push(
          `${label}: duplicate record ${key}.`
        );
        continue;
      }

      map.set(key, row);
    }

    return map;
  }

  const base = indexRecords(baseline, 'baseline');
  const optimizedMap = indexRecords(optimized, 'optimized');
  const matched = [];

  for (const [key, before] of base) {
    const after = optimizedMap.get(key);

    if (!after) {
      report.tokenSavings.unmatchedTasks.push(key);
      continue;
    }

    if (before.workloadHash &&
        after.workloadHash &&
        before.workloadHash !== after.workloadHash) {
      report.tokenSavings.failures.push(
        `${key}: workload hashes do not match.`
      );
      continue;
    }

    if (before.workloadVersion &&
        after.workloadVersion &&
        before.workloadVersion !== after.workloadVersion) {
      report.tokenSavings.failures.push(
        `${key}: workload versions do not match.`
      );
      continue;
    }

    matched.push({
      before: before.inputTokens,
      after: after.inputTokens
    });
  }

  for (const key of optimizedMap.keys()) {
    if (!base.has(key)) {
      report.tokenSavings.unmatchedTasks.push(key);
    }
  }

  if (!matched.length || report.tokenSavings.failures.length) {
    report.tokenSavings.status = 'INVALID_OR_INCOMPLETE';
    return;
  }

  const baselineTotal = matched.reduce(
    (sum, row) => sum + row.before, 0
  );

  const optimizedTotal = matched.reduce(
    (sum, row) => sum + row.after, 0
  );

  report.tokenSavings.baselineInputTokens = baselineTotal;
  report.tokenSavings.optimizedInputTokens = optimizedTotal;
  report.tokenSavings.absoluteSavings = baselineTotal - optimizedTotal;
  report.tokenSavings.savingsPercent = baselineTotal > 0
    ? Number(
        ((baselineTotal - optimizedTotal) / baselineTotal * 100)
          .toFixed(2)
      )
    : null;
  report.tokenSavings.matchedTasks = matched.length;

  report.tokenSavings.status =
    report.tokenSavings.unmatchedTasks.length === 0 &&
    report.tokenSavings.failures.length === 0 &&
    baselineTotal > 0
      ? 'MEASURED'
      : 'INCOMPLETE';
}

function main() {
  if (!fs.existsSync(ROOT) ||
      !fs.statSync(ROOT).isDirectory()) {
    fail(`Invalid repository root: ${ROOT}`);
  }

  const integrationFile = resolveInput(
    arg('--integration-results')
  );

  const baselineFile = resolveInput(
    arg('--baseline-usage')
  );

  const optimizedFile = resolveInput(
    arg('--optimized-usage')
  );

  const outArg = arg('--out');

  try {
    const gitHead = path.join(ROOT, '.git', 'HEAD');

    if (fs.existsSync(gitHead)) {
      report.repository.gitHeadFileSha256 = sha256(gitHead);
    }
  } catch {
    // Git metadata is optional; do not fabricate a commit SHA.
  }

  verifyIntegration(integrationFile);
  verifyUsage(baselineFile, optimizedFile);

  if (outArg) {
    const out = path.resolve(ROOT, outArg);

    if (!out.startsWith(ROOT + path.sep)) {
      fail('Output path must be inside the repository root.');
    }

    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
  }

  console.log(JSON.stringify(report, null, 2));

  if (has('--require-all') &&
      (report.integration.status !== 'VERIFIED' ||
       report.tokenSavings.status !== 'MEASURED')) {
    process.exitCode = 2;
  }
}

try {
  main();
} catch (error) {
  console.error(`AUDIT ERROR: ${error.message}`);
  process.exitCode = 1;
}
