const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const express = require('express');
const request = require('supertest');

const routePath = path.resolve(__dirname, '../src/routes/teacherApplicationRoute.js');
const modelPath = path.resolve(__dirname, '../src/models/roleModel.js');
const authPath = path.resolve(__dirname, '../src/middlewares/anyAuthMiddleware.js');

let app;
let model;
let currentAccount = null;

test.before(() => {
  model = {
    listPendingTeacherApplications: async () => [{ id: 8, authType: 'manual', fullName: 'Ayu Guru', status: 'pending' }],
    reviewTeacherApplication: async () => true
  };
  require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: model };
  
  require.cache[authPath] = { id: authPath, filename: authPath, loaded: true, exports: { 
    authenticateAny: (req, res, next) => {
      if (!currentAccount) return res.status(401).json({ message: 'Token login diperlukan.' });
      req.account = currentAccount;
      next();
    }
  }};

  delete require.cache[routePath];
  const router = require(routePath);
  
  app = express();
  app.use(express.json());
  app.use('/teachers', router);
});

test.afterEach(() => {
  currentAccount = null;
});

test('SQL-mock coverage: non-admin is denied', async () => {
  currentAccount = { ownerKey: 'manual:siswa-1', role: 'siswa' };
  const res = await request(app).get('/teachers');
  assert.equal(res.status, 403);
  assert.equal(res.body.message, 'Role Anda tidak memiliki akses ke endpoint ini.');
});

test('SQL-mock coverage: admin can list pending applications', async () => {
  currentAccount = { ownerKey: 'manual:admin-1', role: 'administrator' };
  const res = await request(app).get('/teachers');
  assert.equal(res.status, 200);
  assert.equal(res.body.teachers[0].status, 'pending');
});

test('SQL-mock coverage: admin can approve/reject and it calls model with correct arguments for manual/google persistence', async () => {
  currentAccount = { ownerKey: 'manual:admin-1', role: 'administrator' };
  
  const calls = [];
  model.reviewTeacherApplication = async (...args) => { calls.push(args); return true; };
  
  const res1 = await request(app).patch('/teachers/8/approval').send({ status: 'approved' });
  assert.equal(res1.status, 200);
  assert.equal(res1.body.status, 'approved');

  const res2 = await request(app).patch('/teachers/9/approval').send({ status: 'rejected' });
  assert.equal(res2.status, 200);
  assert.equal(res2.body.status, 'rejected');

  assert.deepEqual(calls, [
    [8, 'approved', 'manual:admin-1'],
    [9, 'rejected', 'manual:admin-1']
  ]);
});

test('SQL-mock coverage: admin teacher endpoint rejects unknown review decisions', async () => {
  currentAccount = { ownerKey: 'manual:admin-1', role: 'administrator' };
  const res = await request(app).patch('/teachers/8/approval').send({ status: 'guru' });
  assert.equal(res.status, 400);
});
