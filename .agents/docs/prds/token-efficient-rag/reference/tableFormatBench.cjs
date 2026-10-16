
/**
 * tableFormatBench.mjs
 *
 * Measures estimated table format costs on real Markdown tables in the repository.
 * Read-only: this script does not modify source files.
 *
 * Usage:
 *   node tableFormatBench.mjs --root .
 *
 * Requirements:
 *   - Node.js 18+
 *   - ./ragCore.reference.cjs exports serializeTable and estTokens
 *
 * Note:
 *   Token estimation utilizes estTokens from ragCore.reference.cjs.
 *   Results are estimates, not actual token telemetry from an AI provider.
 */

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { serializeTable, estTokens } = require('./ragCore.reference.cjs');

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));

function getArg(name, fallback = null) {
  const index = process.argv.indexOf(name);

  if (index === -1 || index + 1 >= process.argv.length) {
    return fallback;
  }

  return process.argv[index + 1];
}

const rootArg = getArg('--root', '.');
const ROOT = path.resolve(process.cwd(), rootArg);

const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  '_archive',
  'worktrees',
  '9router',
]);

function walk(directory, results = []) {
  if (!fs.existsSync(directory)) {
    throw new Error(`Directory not found: ${directory}`);
  }

  const entries = fs.readdirSync(directory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) {
        walk(fullPath, results);
      }

      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Splits Markdown table cells.
 * Strips leading and trailing pipes when present.
 */
function cells(line) {
  const normalized = line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '');

  return normalized.split('|').map((cell) => cell.trim());
}

/**
 * Checks whether a line is potentially a table row.
 */
function isTableRow(line) {
  const normalized = line.trim();

  return normalized.includes('|') &&
    normalized.split('|').length >= 3;
}

/**
 * Checks Markdown separator rows such as:
 * | --- | :---: | ---: |
 */
function isSeparatorRow(line) {
  if (!isTableRow(line)) {
    return false;
  }

  const separatorCells = cells(line);

  return separatorCells.length > 0 &&
    separatorCells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

/**
 * Scans Markdown tables in a single file.
 */
function extractTables(file) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const found = [];

  for (let i = 0; i < lines.length - 1; i++) {
    if (!isTableRow(lines[i]) || !isSeparatorRow(lines[i + 1])) {
      continue;
    }

    const headerCells = cells(lines[i]);
    const bodyLines = [];
    let j = i + 2;

    while (j < lines.length && isTableRow(lines[j])) {
      bodyLines.push(lines[j]);
      j++;
    }

    const tableRows = bodyLines
      .map(cells)
      .filter((row) => row.length === headerCells.length);

    if (tableRows.length >= 2) {
      found.push({
        file,
        startLine: i + 1,
        raw: lines.slice(i, j).join('\n'),
        table: {
          headers: headerCells,
          rows: tableRows,
        },
      });
    }

    // Continue scanning after the processed table.
    i = j - 1;
  }

  return found;
}

function estimate(tableRecord) {
  const { raw, table } = tableRecord;

  const markdown = serializeTable(table, {
    format: 'md',
  }).text;

  const json = serializeTable(table, {
    format: 'json',
  }).text;

  const compact = serializeTable(table, {
    format: 'compact',
  }).text;

  return {
    file: path.relative(ROOT, tableRecord.file),
    line: tableRecord.startLine,
    rows: table.rows.length,
    rawChars: raw.length,
    rawTokens: estTokens(raw),
    markdownTokens: estTokens(markdown),
    jsonTokens: estTokens(json),
    compactTokens: estTokens(compact),
  };
}

function sum(records, property) {
  return records.reduce((total, record) => {
    return total + record[property];
  }, 0);
}

function percentReduction(newValue, originalValue) {
  if (originalValue === 0) {
    return null;
  }

  return Math.round((1 - newValue / originalValue) * 100);
}

function formatPercent(value) {
  return value === null ? 'N/A' : `${value}%`;
}

function main() {
  if (!fs.existsSync(ROOT) || !fs.statSync(ROOT).isDirectory()) {
    throw new Error(`Invalid repository root: ${ROOT}`);
  }

  if (typeof serializeTable !== 'function') {
    throw new Error(
      'serializeTable is not exported by ragCore.reference.cjs',
    );
  }

  if (typeof estTokens !== 'function') {
    throw new Error(
      'estTokens is not exported by ragCore.reference.cjs',
    );
  }

  const markdownFiles = walk(ROOT);
  const tableRecords = [];

  for (const file of markdownFiles) {
    tableRecords.push(...extractTables(file));
  }

  const results = tableRecords.map(estimate);

  const rawTotal = sum(results, 'rawTokens');
  const markdownTotal = sum(results, 'markdownTokens');
  const jsonTotal = sum(results, 'jsonTokens');
  const compactTotal = sum(results, 'compactTokens');

  console.log('=== Markdown Table Format Benchmark ===');
  console.log(`Repository: ${ROOT}`);
  console.log(`Markdown files scanned: ${markdownFiles.length}`);
  console.log(`Tables measured (>= 2 data rows): ${results.length}`);
  console.log('Token estimate: delegated to estTokens()');
  console.log('');

  const topTables = [...results]
    .sort((a, b) => b.rawTokens - a.rawTokens)
    .slice(0, 6);

  console.log('=== Top 6 Tables by Original Estimated Token Cost ===');

  if (topTables.length === 0) {
    console.log('No qualifying Markdown tables found.');
  }

  for (const record of topTables) {
    console.log(
      `${String(record.rawTokens).padStart(6)} tokens` +
      ` -> compact ${String(record.compactTokens).padStart(6)}` +
      ` | JSON ${String(record.jsonTokens).padStart(6)}` +
      ` | ${record.file}:${record.line}` +
      ` (${record.rows} data rows)`,
    );
  }

  console.log('');
  console.log('=== Aggregate Results ===');
  console.log(`Original Markdown: ${rawTotal}`);
  console.log(`Normalized Markdown: ${markdownTotal}`);
  console.log(`JSON: ${jsonTotal}`);
  console.log(`Compact: ${compactTotal}`);

  console.log('');
  console.log('=== Estimated Reduction ===');
  console.log(
    `Compact vs original: ${formatPercent(
      percentReduction(compactTotal, rawTotal),
    )}`,
  );
  console.log(
    `Compact vs JSON: ${formatPercent(
      percentReduction(compactTotal, jsonTotal),
    )}`,
  );

  console.log('');
  console.log('Limitations:');
  console.log('- These are estimates, not provider-reported token counts.');
  console.log('- Only Markdown tables with at least two valid data rows count.');
  console.log('- Table cells containing literal pipe characters may need special handling.');
  console.log('- The result does not prove end-to-end RAG token savings.');
}

try {
  main();
} catch (error) {
  console.error(`BENCHMARK ERROR: ${error.message}`);
  process.exitCode = 1;
}
