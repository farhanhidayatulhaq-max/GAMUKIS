const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const modelPath = path.resolve(__dirname, '../src/models/membershipModel.js');
const connectionPath = path.resolve(__dirname, '../src/config/Database/MySQL/connection.js');

test('plan update persists an explicit null duration instead of dropping it', async () => {
  const calls = [];
  const pool = { query: async (sql, params) => {
    calls.push([sql, params]);
    if (sql.startsWith('UPDATE membership_plans')) return [{ affectedRows: 1 }];
    return [[{ id: 7, code: 'guru_free', price: 0, duration_days: null, is_active: 1, features: '{}' }]];
  } };
  require.cache[connectionPath] = { id: connectionPath, filename: connectionPath, loaded: true, exports: { pool } };
  delete require.cache[modelPath];
  const MembershipModel = require(modelPath);
  const plan = await MembershipModel.updatePlan(7, { durationDays: null });
  assert.equal(plan.durationDays, null);
  assert.match(calls[0][0], /duration_days = \?/);
  assert.deepEqual(calls[0][1], [null, 7]);
});

test('subscribe uses a per-owner MySQL lock and releases it after commit', async () => {
  const calls = [];
  const connection = {
    async query(sql, params) {
      calls.push(sql);
      if (sql.includes('GET_LOCK')) return [[{ acquired: 1 }]];
      if (sql.startsWith('INSERT INTO memberships')) return [{ insertId: 42 }];
      return [{ affectedRows: 1 }];
    },
    async beginTransaction() { calls.push('BEGIN'); },
    async commit() { calls.push('COMMIT'); },
    async rollback() { calls.push('ROLLBACK'); },
    release() { calls.push('RELEASE_CONNECTION'); }
  };
  const pool = { getConnection: async () => connection };
  require.cache[connectionPath] = { id: connectionPath, filename: connectionPath, loaded: true, exports: { pool } };
  delete require.cache[modelPath];
  const MembershipModel = require(modelPath);
  const result = await MembershipModel.subscribe(
    { ownerKey: 'manual:user-1', authType: 'manual', userId: 'user-1' },
    { id: 3, price: 5000, durationDays: 30 }
  );
  assert.deepEqual(result, { membershipId: 42, status: 'pending' });
  assert.match(calls[0], /GET_LOCK/);
  assert.ok(calls.indexOf('COMMIT') < calls.findIndex((sql) => sql.includes('RELEASE_LOCK')));
  assert.ok(calls.includes('RELEASE_CONNECTION'));
});
