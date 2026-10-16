const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');

const routePath = path.resolve(__dirname, '../src/routes/membershipRoute.js');
const modelPath = path.resolve(__dirname, '../src/models/membershipModel.js');
const rolePath = path.resolve(__dirname, '../src/models/roleModel.js');
const authPath = path.resolve(__dirname, '../src/middlewares/anyAuthMiddleware.js');
const permissionPath = path.resolve(__dirname, '../src/middlewares/roleMiddleware.js');

let model;
let roleModel;
let router;

async function request(method, url, body) {
  const route = router.stack.find((layer) => layer.route?.methods[method.toLowerCase()] &&
    (layer.route.path === url || (layer.route.path === '/admin/plans/:id' && /^\/admin\/plans\/\d+$/.test(url))));
  assert.ok(route, `${method} ${url} route exists`);
  const handler = route.route.stack.at(-1).handle;
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
  const req = { method, params: { id: url.match(/^\/admin\/plans\/(\d+)$/)?.[1] }, body, account: { role: 'admin', ownerKey: 'admin:test' } };
  await handler(req, response);
  return { status: response.statusCode, body: response.body };
}

test.before(async () => {
  model = {
    findPlanById: async () => ({ id: 2, code: 'guru_pro', name: 'Pro', audience: 'guru', price: 1000, durationDays: 30, isActive: true }),
    updatePlan: async (_id, values) => ({ id: 2, ...values }),
    findPlanByCode: async () => ({ id: 1, code: 'guru_pro', audience: 'guru', price: 1000, durationDays: 30, isActive: false }),
    subscribe: async () => ({ membershipId: 10, status: 'active' })
  };
  roleModel = { getStoredRole: async () => 'guru' };

  const originalLoad = Module._load;
  require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: model };
  require.cache[rolePath] = { id: rolePath, filename: rolePath, loaded: true, exports: roleModel };
  require.cache[authPath] = { id: authPath, filename: authPath, loaded: true, exports: {
    authenticateAny: (req, _res, next) => { req.account = { role: 'admin', ownerKey: 'admin:test' }; next(); }
  } };
  require.cache[permissionPath] = { id: permissionPath, filename: permissionPath, loaded: true, exports: {
    requirePermission: () => (_req, _res, next) => next()
  } };
  delete require.cache[routePath];
  router = require(routePath);
  Module._load = originalLoad;
});

test('admin grant rejects an inactive plan before creating membership', async () => {
  let subscribeCalls = 0;
  model.subscribe = async () => { subscribeCalls += 1; return { membershipId: 1 }; };
  const result = await request('POST', '/admin/grant', { authType: 'manual', userId: 'u1', planCode: 'guru_pro' });
  assert.equal(result.status, 400);
  assert.match(result.body.message, /tidak aktif/);
  assert.equal(subscribeCalls, 0);
});

test('plan PATCH validates resulting price and duration, and permits explicit null for free plans', async () => {
  const invalidPaidPlan = await request('PATCH', '/admin/plans/2', { price: 0 });
  assert.equal(invalidPaidPlan.status, 200); // Existing duration remains valid.

  model.findPlanById = async () => ({ id: 2, price: 1000, durationDays: null });
  const invalidDuration = await request('PATCH', '/admin/plans/2', { name: 'Renamed' });
  assert.equal(invalidDuration.status, 400);

  model.findPlanById = async () => ({ id: 2, price: 0, durationDays: 30 });
  let updateArgs;
  model.updatePlan = async (_id, values) => { updateArgs = values; return { id: 2, ...values }; };
  const freePlan = await request('PATCH', '/admin/plans/2', { durationDays: null });
  assert.equal(freePlan.status, 200);
  assert.equal(updateArgs.durationDays, null);

  const emptyPatch = await request('PATCH', '/admin/plans/2', {});
  assert.equal(emptyPatch.status, 400);
  const invalidName = await request('PATCH', '/admin/plans/2', { name: '   ' });
  assert.equal(invalidName.status, 400);
});
