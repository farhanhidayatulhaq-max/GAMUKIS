const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const modelPath = path.resolve(__dirname, '../src/models/roleModel.js');
const connectionPath = path.resolve(__dirname, '../src/config/Database/MySQL/connection.js');

const loadModelWithConnection = (connection) => {
  const pool = {
    getConnection: async () => connection,
    query: async () => { throw new Error('Unexpected pool query'); }
  };
  require.cache[connectionPath] = {
    id: connectionPath, filename: connectionPath, loaded: true, exports: { pool }
  };
  delete require.cache[modelPath];
  return require(modelPath);
};

test('a Guru selection creates a pending MySQL application without granting the role', async () => {
  const calls = [];
  const connection = {
    async query(sql, params = []) {
      calls.push({ sql, params });
      if (sql.startsWith('SELECT role FROM users')) return [[{ role: null }]];
      if (sql.includes('SELECT id, status, full_name AS fullName')) {
        return [[{ id: 12, status: 'pending', fullName: 'Ayu Guru', subject: 'IPA' }]];
      }
      return [{ affectedRows: 1 }];
    },
    async beginTransaction() {}, async commit() {}, async rollback() {}, release() {}
  };
  const RoleModel = loadModelWithConnection(connection);
  const application = await RoleModel.submitTeacherApplication({
    authType: 'manual', userId: '31', email: 'ayu@example.test', fullName: 'Ayu Guru', subject: 'IPA'
  });

  assert.equal(application.status, 'pending');
  assert.ok(calls.some(({ sql, params }) => sql.includes('INSERT INTO teacher_applications') && params[0] === 'manual'));
  assert.ok(calls.some(({ sql }) => sql.includes('INSERT INTO users_detail') && sql.includes('VALUES (?, NULL, ?, ?)')));
  assert.equal(calls.some(({ sql }) => sql.startsWith('UPDATE users SET role')), false);
});

test('admin approval writes Guru role; rejection leaves the account role unset', async (t) => {
  for (const status of ['approved', 'rejected']) {
    await t.test(status, async () => {
      const calls = [];
      const connection = {
        async query(sql, params = []) {
          calls.push({ sql, params });
          if (sql.startsWith('SELECT auth_type, user_id')) {
            return [[{ auth_type: 'manual', user_id: '31', email: 'ayu@example.test', full_name: 'Ayu Guru', subject: 'IPA' }]];
          }
          return [{ affectedRows: 1 }];
        },
        async beginTransaction() {}, async commit() {}, async rollback() {}, release() {}
      };
      const RoleModel = loadModelWithConnection(connection);
      assert.equal(await RoleModel.reviewTeacherApplication(12, status, 'manual:admin-1'), true);
      const roleUpdate = calls.find(({ sql }) => sql.startsWith('UPDATE users SET role'));
      assert.equal(roleUpdate.params[0], status === 'approved' ? 'guru' : null);
      assert.ok(calls.some(({ sql, params }) => sql.includes('UPDATE teacher_applications SET status') && params[0] === status));
    });
  }
});
