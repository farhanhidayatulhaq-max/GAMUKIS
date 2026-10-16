const assert = require('node:assert/strict');
const { after, beforeEach, test } = require('node:test');
const jwt = require('jsonwebtoken');
const { pool } = require('../src/config/Database/MySQL/connection');
const RoleModel = require('../src/models/roleModel');
const { authenticateAny } = require('../src/middlewares/anyAuthMiddleware');
const { requirePermission } = require('../src/middlewares/roleMiddleware');

const manualRoles = new Map();
const googleRoles = new Map();
const originalQuery = pool.query;
let googleDefaultInserts = 0;

beforeEach(() => {
  manualRoles.clear();
  googleRoles.clear();
  googleDefaultInserts = 0;

  pool.query = async (sql, params = []) => {
    if (sql.startsWith('SELECT role FROM users WHERE id = ?')) {
      const id = String(params[0]);
      return [manualRoles.has(id) ? [{ role: manualRoles.get(id) }] : []];
    }
    if (sql.startsWith('SELECT role FROM google_user_roles WHERE firebase_uid = ?')) {
      const uid = String(params[0]);
      return [googleRoles.has(uid) ? [{ role: googleRoles.get(uid) }] : []];
    }
    if (sql.startsWith('UPDATE users SET role = ? WHERE id = ?')) {
      const [role, idValue] = params;
      const id = String(idValue);
      if (!manualRoles.has(id)) return [{ affectedRows: 0 }];
      manualRoles.set(id, role);
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('INSERT IGNORE INTO google_user_roles')) {
      googleDefaultInserts += 1;
      googleRoles.set(String(params[0]), params[2]);
      return [{ affectedRows: 1 }];
    }
    if (sql.startsWith('INSERT INTO google_user_roles')) {
      googleRoles.set(String(params[0]), params[2]);
      return [{ affectedRows: 1 }];
    }
    throw new Error(`Unexpected SQL in role-selection test: ${sql}`);
  };
});

after(() => {
  pool.query = originalQuery;
});

const makeManualRequest = async (userId, role) => {
  manualRoles.set(String(userId), role);
  const secret = process.env.JWT_SECRET || 'gamukis-development-secret';
  const token = jwt.sign({ userId, username: 'tester', email: 'tester@example.com' }, secret);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
  let nextCalled = false;
  await authenticateAny(req, res, () => {
    nextCalled = true;
  });
  return { req, res, nextCalled };
};

test('missing and invalid roles remain unset; new Google users are not assigned Siswa', async () => {
  manualRoles.set('11', null);
  manualRoles.set('12', 'unknown-role');

  assert.equal(await RoleModel.getStoredRole('manual', '11'), null);
  assert.equal(await RoleModel.getStoredRole('manual', '12'), null);
  assert.equal(await RoleModel.resolve({
    authType: 'google',
    userId: 'google-new-user',
    email: 'new@example.com',
    emailVerified: false
  }), null);
  assert.equal(googleRoles.has('google-new-user'), false);
  assert.equal(googleDefaultInserts, 0);
});

test('an unset role is identifiable and role-protected API access is denied with guidance', async () => {
  const { req, res, nextCalled } = await makeManualRequest('21', null);

  assert.equal(res.statusCode, null);
  assert.equal(nextCalled, true);
  assert.equal(req.account.role, null);

  let permissionNextCalled = false;
  const permissionRes = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };

  requirePermission('students:read')(req, permissionRes, () => {
    permissionNextCalled = true;
  });

  assert.equal(permissionRes.statusCode, 403);
  assert.equal(permissionRes.body.code, 'ROLE_REQUIRED');
  assert.equal(permissionNextCalled, false);
});

test('self-selecting Guru cannot grant Guru access before admin approval', async () => {
  manualRoles.set('31', null);
  assert.equal(await RoleModel.setSelfRole('manual', '31', 'guru'), false);
  assert.equal(manualRoles.get('31'), null);

  const { req, res, nextCalled } = await makeManualRequest('31', null);
  assert.equal(res.statusCode, null);
  assert.equal(nextCalled, true);
  assert.equal(req.account.role, null);

  let guruRequestAllowed = false;
  requirePermission('students:read')(req, { status() { return this; }, json() {} }, () => {
    guruRequestAllowed = true;
  });
  assert.equal(guruRequestAllowed, false);
});

test('a Guru is still denied administrator-only permissions', async () => {
  const { req } = await makeManualRequest('41', 'guru');
  let nextCalled = false;
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };

  requirePermission('users:manage')(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 403);
  assert.notEqual(res.body.code, 'ROLE_REQUIRED');
  assert.equal(nextCalled, false);
});

test('a verified bootstrap administrator stays separate from self-selected roles', async () => {
  const previousAdminEmails = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = 'root@example.com';
  manualRoles.set('51', null);

  try {
    const role = await RoleModel.resolve({
      authType: 'manual',
      userId: '51',
      email: 'root@example.com',
      emailVerified: true
    });
    assert.equal(role, 'administrator');
    assert.equal(manualRoles.get('51'), 'administrator');
    assert.equal(await RoleModel.setSelfRole('manual', '51', 'guru'), false);
    assert.equal(manualRoles.get('51'), 'administrator');

    const googleRole = await RoleModel.resolve({
      authType: 'google',
      userId: 'google-admin',
      email: 'root@example.com',
      emailVerified: true
    });
    assert.equal(googleRole, 'administrator');
    assert.equal(await RoleModel.setSelfRole('google', 'google-admin', 'guru'), false);
    assert.equal(googleRoles.get('google-admin'), 'administrator');
  } finally {
    if (previousAdminEmails === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = previousAdminEmails;
  }
});

test('only administrator accounts can manage pending teacher applications', async () => {
  const { req: guruRequest } = await makeManualRequest('46', 'guru');
  let guruAllowed = false;
  const guruResponse = { status(code) { this.statusCode = code; return this; }, json() {} };
  requirePermission('teachers:manage')(guruRequest, guruResponse, () => { guruAllowed = true; });
  assert.equal(guruResponse.statusCode, 403);
  assert.equal(guruAllowed, false);

  const { req: adminRequest } = await makeManualRequest('47', 'administrator');
  let adminAllowed = false;
  requirePermission('teachers:manage')(adminRequest, {}, () => { adminAllowed = true; });
  assert.equal(adminAllowed, true);
});
