const test = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const { makeNotificationSignature } = require('../src/services/midtransNotification');

const routePath = path.resolve(__dirname, '../src/routes/midtransNotificationRoute.js');
const modelPath = path.resolve(__dirname, '../src/models/membershipModel.js');
let router;
let model;

const invoke = async (body) => {
  const handler = router.stack.find((layer) => layer.route?.path === '/' && layer.route.methods.post).route.stack[0].handle;
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
  await handler({ body }, response);
  return response;
};

test.before(() => {
  model = {
    getMembershipByPaymentRef: async () => ({ membershipId: 7, ownerKey: 'manual:1', status: 'pending', price: 99000 }),
    activate: async () => true,
    cancelPendingByPaymentRef: async () => true
  };
  require.cache[modelPath] = { id: modelPath, filename: modelPath, loaded: true, exports: model };
  delete require.cache[routePath];
  router = require(routePath);
});

const signed = (overrides = {}) => {
  const notification = {
    order_id: 'gamukis-membership-7', status_code: '200', gross_amount: '99000.00',
    transaction_status: 'settlement', transaction_id: 'midtrans-transaction-7', ...overrides
  };
  notification.signature_key = makeNotificationSignature(notification, process.env.MIDTRANS_SERVER_KEY);
  return notification;
};

test('valid Midtrans settlement activates the matching pending membership', async () => {
  const previous = process.env.MIDTRANS_SERVER_KEY;
  process.env.MIDTRANS_SERVER_KEY = 'notification-test-key';
  let activated;
  model.activate = async (...args) => { activated = args; return true; };
  try {
    const response = await invoke(signed());
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.body, { received: true });
    assert.deepEqual(activated, [7, { paymentRef: 'midtrans-transaction-7' }]);
  } finally {
    if (previous === undefined) delete process.env.MIDTRANS_SERVER_KEY;
    else process.env.MIDTRANS_SERVER_KEY = previous;
  }
});

test('invalid signatures and amount mismatches never activate membership', async () => {
  const previous = process.env.MIDTRANS_SERVER_KEY;
  process.env.MIDTRANS_SERVER_KEY = 'notification-test-key';
  let activationCount = 0;
  model.activate = async () => { activationCount += 1; return true; };
  try {
    const invalidSignature = await invoke({ ...signed(), signature_key: 'invalid' });
    assert.equal(invalidSignature.statusCode, 401);
    const amountMismatch = await invoke(signed({ gross_amount: '1.00' }));
    assert.equal(amountMismatch.statusCode, 400);
    assert.equal(activationCount, 0);
  } finally {
    if (previous === undefined) delete process.env.MIDTRANS_SERVER_KEY;
    else process.env.MIDTRANS_SERVER_KEY = previous;
  }
});
